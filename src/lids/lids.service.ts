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
import { AssignLidsDto } from './dto/assign-lids.dto';
import { UserRole } from '../common/enums/user-role.enum';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { User } from '../user/models/user.model';
import * as XLSX from 'xlsx';
import { ImportResultDto } from './dto/import-lids.dto';
import { LidStatusLog } from './models/lid_status_log.model';

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

interface ExcelRow {
  [key: string]: string | number | boolean | null | undefined;
}

@Injectable()
export class LidsService {
  constructor(
    @InjectModel(Lid) private lidModel: typeof Lid,
    @InjectModel(LidValue) private lidValueModel: typeof LidValue,
    @InjectModel(LidColumn) private lidColumnModel: typeof LidColumn,
    @InjectModel(LidStatusLog) private lidStatusLogModel: typeof LidStatusLog,
    private readonly lidStatusService: LidStatusService,
    private readonly sequelize: Sequelize,
  ) {}

  private readonly defaultInclude = [
    { model: LidStatus },
    { model: LidValue, include: [LidColumn] },
    { model: User, as: 'creator', attributes: ['id', 'full_name'] },
    { model: User, as: 'assignee', attributes: ['id', 'full_name'] },
  ];

  private async writeLog(
    lid_id: string,
    from_status_id: string | null,
    to_status_id: string,
    changed_by: string,
    transaction?: Transaction,
  ): Promise<void> {
    await this.lidStatusLogModel.create(
      { lid_id, from_status_id, to_status_id, changed_by },
      { transaction },
    );
  }

  async create(dto: CreateLidDto, user: AuthUser): Promise<Lid> {
    const defaultStatus = await this.lidStatusService.getDefault();

    return this.sequelize.transaction(async (t) => {
      const lid = await this.lidModel.create(
        {
          fio: dto.fio.trim(),
          telefon_raqam: dto.telefon_raqam.trim(),
          ...(dto.ota_ona_fio && { ota_ona_fio: dto.ota_ona_fio.trim() }),
          ...(dto.assigned_id && { assigned_id: dto.assigned_id }),
          status_id: defaultStatus.id,
          created_by: user.id,
        },
        { transaction: t },
      );

      await this.writeLog(lid.id, null, defaultStatus.id, user.id, t);

      return lid;
    });
  }

  async assignLids(
    dto: AssignLidsDto,
    // user: AuthUser,
  ): Promise<{ updated: number }> {
    const [updated] = await this.lidModel.update(
      { assigned_id: dto.assigned_id },
      { where: { id: { [Op.in]: dto.lid_ids } } },
    );
    return { updated };
  }

  async findAll(
    user: AuthUser,
    options: { assigned_id?: string; limit: number; page: number },
  ): Promise<{ columns: KanbanColumn[] } | PaginatedLids> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const page = Math.max(options.page ?? 1, 1);

    if (options.assigned_id) {
      return this.findByAssignee(user, options.assigned_id, page, limit);
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

  async findByAssignee(
    user: AuthUser,
    assignedId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedLids> {
    const offset = (page - 1) * limit;
    const { rows, count } = await this.lidModel.findAndCountAll({
      where: { assigned_id: assignedId },
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
      const coreUpdate: Record<string, any> = {};
      if (dto.fio) coreUpdate.fio = dto.fio.trim();
      if (dto.telefon_raqam)
        coreUpdate.telefon_raqam = dto.telefon_raqam.trim();
      if (dto.ota_ona_fio !== undefined)
        coreUpdate.ota_ona_fio = dto.ota_ona_fio?.trim() ?? null;
      if (dto.assigned_id !== undefined)
        coreUpdate.assigned_id = dto.assigned_id ?? null;

      if (Object.keys(coreUpdate).length > 0) {
        await lid.update(coreUpdate, { transaction: t });
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

    return this.sequelize.transaction(async (t) => {
      const oldStatusId = lid.status_id ?? null;
      await lid.update({ status_id: dto.status_id }, { transaction: t });
      await this.writeLog(id, oldStatusId, dto.status_id, user.id, t);
      return this.findOne(id, user);
    });
  }

  async remove(id: string, user: AuthUser): Promise<{ message: string }> {
    const lid = await this.findOne(id, user);
    if (user.role !== UserRole.SUPER_ADMIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("O'chirishga ruxsatingiz yo'q");
    }
    await lid.destroy();
    return { message: "Lid o'chirildi" };
  }

  async importFromExcel(
    buffer: Buffer,
    user: AuthUser,
    statusId?: string,
  ): Promise<ImportResultDto> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

    if (!rows.length) {
      throw new BadRequestException("Excel fayl bo'sh yoki noto'g'ri format");
    }

    let resolvedStatusId: string;
    if (statusId) {
      const canAccess = await this.lidStatusService.canRoleAccess(
        statusId,
        user.role,
      );
      if (!canAccess) {
        throw new ForbiddenException(
          "Siz bu statusga lid yarata olmaysiz (ruxsat yo'q)",
        );
      }
      resolvedStatusId = statusId;
    } else {
      const defaultStatus = await this.lidStatusService.getDefault();
      resolvedStatusId = defaultStatus.id;
    }

    const result: ImportResultDto = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const fio = this.extractField(row, ['fio', 'ism', 'name', 'full_name']);
      const telefon = this.extractField(row, [
        'telefon_raqam',
        'telefon',
        'phone',
        'tel',
        'number',
      ]);

      if (!fio) {
        result.failed++;
        result.errors.push({ row: rowNum, fio: '-', reason: 'fio topilmadi' });
        continue;
      }

      if (!telefon) {
        result.failed++;
        result.errors.push({
          row: rowNum,
          fio,
          reason: 'telefon_raqam topilmadi',
        });
        continue;
      }

      try {
        await this.sequelize.transaction(async (t) => {
          const lid = await this.lidModel.create(
            {
              fio: fio.trim(),
              telefon_raqam: telefon.trim(),
              status_id: resolvedStatusId,
              created_by: user.id,
            },
            { transaction: t },
          );
          await this.writeLog(lid.id, null, resolvedStatusId, user.id, t);
        });
        result.success++;
      } catch (e) {
        result.failed++;
        const reason = e instanceof Error ? e.message : 'Xatolik';
        result.errors.push({ row: rowNum, fio, reason });
      }
    }

    return result;
  }

  private extractField(row: ExcelRow, keys: string[]): string | null {
    const rowKeys = Object.keys(row);
    for (const key of keys) {
      const found = rowKeys.find((k) => k.toLowerCase().trim() === key);
      if (found !== undefined) {
        const val = row[found];
        if (val !== undefined && val !== null && val !== '') {
          return String(val);
        }
      }
    }
    return null;
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
