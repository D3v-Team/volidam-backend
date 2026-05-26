import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import { Lid } from './models/lid.model';
import { LidValue } from './models/lid_value.model';
import { LidColumn } from '../lid_columns/models/lid_column.model';
import { LidStatus } from '../lid_statuses/models/lid_status.model';
import { LidStatusService } from '../lid_statuses/lid_statuses.service';
import { CreateLidDto } from './dto/create-lid.dto';
import { UpdateLidDto, LidValueInputDto } from './dto/update-lid.dto';
import { ChangeLidStatusDto } from './dto/change-lid-status.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/models/user.model';

export interface KanbanColumn {
  status: { id: string; name: string; color: string; order: number };
  total: number;
  items: Lid[];
}

export interface PaginatedLids {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  items: Lid[];
}

@Injectable()
export class LidsService {
  constructor(
    @InjectModel(Lid) private lidModel: typeof Lid,
    @InjectModel(LidValue) private lidValueModel: typeof LidValue,
    @InjectModel(LidColumn) private lidColumnModel: typeof LidColumn,
    private readonly lidStatusService: LidStatusService,
    private readonly sequelize: Sequelize,
  ) {}

  private readonly defaultInclude = [
    { model: LidStatus },
    { model: LidValue, include: [LidColumn] },
    { model: User, as: 'creator', attributes: ['id', 'full_name'] },
  ];

  async create(dto: CreateLidDto, user: AuthUser): Promise<Lid> {
    const defaultStatus = await this.lidStatusService.getDefault();

    const lid = await this.lidModel.create({
      fio: dto.fio.trim(),
      telefon_raqam: dto.telefon_raqam.trim(),
      status_id: defaultStatus.id,
      created_by: user.id,
    });

    return this.findOne(lid.id, user);
  }

  async findAll(
    user: AuthUser,
    options: { status_id?: string; limit: number; page: number },
  ): Promise<{ columns: KanbanColumn[] } | PaginatedLids> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const page = Math.max(options.page ?? 1, 1);

    if (options.status_id) {
      return this.findByStatus(user, options.status_id, page, limit);
    }
    return this.findKanban(user, limit);
  }

  async findKanban(
    user: AuthUser,
    limit: number,
  ): Promise<{ columns: KanbanColumn[] }> {
    const accessibleStatuses = await this.lidStatusService.findAll(user.role);

    const columns = await Promise.all(
      accessibleStatuses.map(async (status): Promise<KanbanColumn> => {
        const { rows, count } = await this.lidModel.findAndCountAll({
          where: { status_id: status.id },
          include: this.defaultInclude,
          limit,
          order: [['createdAt', 'DESC']],
          distinct: true,
        });

        return {
          status: {
            id: status.id,
            name: status.name,
            color: status.color,
            order: status.order,
          },
          total: count,
          items: rows,
        };
      }),
    );

    return { columns };
  }

  async findByStatus(
    user: AuthUser,
    statusId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedLids> {
    const canAccess = await this.lidStatusService.canRoleAccess(
      statusId,
      user.role,
    );
    if (!canAccess) {
      throw new ForbiddenException("Bu statusni ko'rishga ruxsatingiz yo'q");
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await this.lidModel.findAndCountAll({
      where: { status_id: statusId },
      include: this.defaultInclude,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    return {
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
      items: rows,
    };
  }

  async findOne(id: string, user: AuthUser): Promise<Lid> {
    const lid = await this.lidModel.findByPk(id, {
      include: this.defaultInclude,
    });
    if (!lid) throw new NotFoundException('Lid topilmadi');

    if (
      lid.status_id &&
      !(await this.lidStatusService.canRoleAccess(lid.status_id, user.role))
    ) {
      throw new ForbiddenException("Bu lidni ko'rishga ruxsatingiz yo'q");
    }

    return lid;
  }

  async update(id: string, dto: UpdateLidDto, user: AuthUser): Promise<Lid> {
    const lid = await this.findOne(id, user);

    return this.sequelize.transaction(async (t) => {
      if (dto.fio || dto.telefon_raqam) {
        await lid.update(
          {
            ...(dto.fio && { fio: dto.fio.trim() }),
            ...(dto.telefon_raqam && {
              telefon_raqam: dto.telefon_raqam.trim(),
            }),
          },
          { transaction: t },
        );
      }

      if (dto.values && dto.values.length > 0) {
        await this.upsertValues(id, dto.values, t);
      }

      return this.findOne(id, user);
    });
  }

  async changeStatus(
    id: string,
    dto: ChangeLidStatusDto,
    user: AuthUser,
  ): Promise<Lid> {
    const lid = await this.findOne(id, user);

    const canAccessNew = await this.lidStatusService.canRoleAccess(
      dto.status_id,
      user.role,
    );
    if (!canAccessNew) {
      throw new ForbiddenException(
        "Siz bu statusga o'tkaza olmaysiz (ruxsat yo'q)",
      );
    }

    await lid.update({ status_id: dto.status_id });
    return this.findOne(id, user);
  }

  async remove(id: string, user: AuthUser): Promise<{ message: string }> {
    const lid = await this.findOne(id, user);
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("O'chirishga ruxsatingiz yo'q");
    }
    await lid.destroy();
    return { message: "Lid o'chirildi" };
  }

  private async upsertValues(
    lidId: string,
    inputs: LidValueInputDto[],
    transaction: Transaction,
  ): Promise<void> {
    const columnIds = [...new Set(inputs.map((i) => i.column_id))];
    const existingCount = await this.lidColumnModel.count({
      where: { id: { [Op.in]: columnIds } },
      transaction,
    });

    if (existingCount !== columnIds.length) {
      throw new BadRequestException("Ba'zi column_id lar topilmadi");
    }

    for (const input of inputs) {
      const serialized = this.serializeValue(input.value);

      if (serialized === null) {
        await this.lidValueModel.destroy({
          where: { lid_id: lidId, column_id: input.column_id },
          transaction,
        });
        continue;
      }

      const [row, created] = await this.lidValueModel.findOrCreate({
        where: { lid_id: lidId, column_id: input.column_id },
        defaults: {
          lid_id: lidId,
          column_id: input.column_id,
          value: serialized,
        },
        transaction,
      });
      if (!created) {
        await row.update({ value: serialized }, { transaction });
      }
    }
  }

  private serializeValue(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;
    return String(value);
  }
}
