import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { LidStatus, LidStatusAttr } from './models/lid_status.model';
import { LidStatusRole } from './models/lid_status_role.model';
import {
  CreateLidStatusDto,
  ReorderLidStatusesDto,
} from './dto/create-lid_status.dto';
import { UpdateLidStatusDto } from './dto/update-lid_status.dto';
import { UserRole } from '../common/enums/user-role.enum';
import {
  LidChildStatus,
  Type,
} from '../lid_child_statuses/models/lid_child_status.model';

@Injectable()
export class LidStatusService {
  constructor(
    @InjectModel(LidStatus) private lidStatusModel: typeof LidStatus,
    @InjectModel(LidStatusRole)
    private lidStatusRoleModel: typeof LidStatusRole,
    private readonly sequelize: Sequelize,
  ) {}

  async create(dto: CreateLidStatusDto): Promise<LidStatus> {
    const normalizedName = this.normalizeName(dto.name);

    const existing = await this.lidStatusModel.findOne({
      where: { name: normalizedName },
    });
    if (existing) {
      throw new BadRequestException(
        `"${normalizedName}" nomli status allaqachon mavjud`,
      );
    }

    const created = await this.sequelize.transaction(async (t) => {
      if (dto.is_default) {
        await this.lidStatusModel.update(
          { is_default: false },
          { where: {}, transaction: t },
        );
      }

      const order =
        dto.order ??
        ((await this.lidStatusModel.max<number, LidStatus>('order', {
          transaction: t,
        })) ?? -1) + 1;

      const status = await this.lidStatusModel.create(
        {
          name: normalizedName,
          color: dto.color,
          order,
          is_default: dto.is_default ?? false,
        },
        { transaction: t },
      );

      const roles = [...new Set([...dto.roles, UserRole.SUPER_ADMIN])];

      await this.lidStatusRoleModel.bulkCreate(
        roles.map((role) => ({ status_id: status.id, role })),
        { transaction: t },
      );

      return status;
    });

    return this.findOne(created.id);
  }

  async findAll(role?: UserRole): Promise<
    (LidStatusAttr & {
      child_statuses_by_type: Record<Type, LidChildStatus[]>;
    })[]
  > {
    const statuses = await this.lidStatusModel.findAll({
      where:
        role && role !== UserRole.SUPER_ADMIN
          ? { id: { [Op.in]: await this.getAccessibleStatusIds(role) } }
          : undefined,
      include: [LidStatusRole, LidChildStatus],
      order: [['order', 'ASC']],
    });

    return statuses.map((status) => {
      const childStatuses = status.child_statuses ?? [];

      const groupedByType = childStatuses.reduce(
        (acc, child) => {
          if (child.type === Type.TOQ || child.type === Type.JUFT) {
            // cspell:disable-line
            if (!acc[child.type]) acc[child.type] = [];
            acc[child.type].push(child);
          }
          return acc;
        },
        { [Type.TOQ]: [], [Type.JUFT]: [] } as Record<Type, LidChildStatus[]>, // cspell:disable-line
      );

      const statusJson = status.toJSON();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { child_statuses: _cs, ...rest } = statusJson;

      return {
        ...rest,
        child_statuses_by_type: groupedByType,
      };
    });
  }

  async findOne(id: string): Promise<LidStatus> {
    const status = await this.lidStatusModel.findByPk(id, {
      include: [LidStatusRole],
    });
    if (!status) throw new NotFoundException('Status topilmadi');
    return status;
  }

  async update(id: string, dto: UpdateLidStatusDto): Promise<LidStatus> {
    const status = await this.findOne(id);

    await this.sequelize.transaction(async (t) => {
      if (dto.name) {
        const normalizedName = this.normalizeName(dto.name);
        if (normalizedName !== status.name) {
          const duplicate = await this.lidStatusModel.findOne({
            where: { name: normalizedName, id: { [Op.ne]: id } },
            transaction: t,
          });
          if (duplicate) {
            throw new BadRequestException(
              `"${normalizedName}" nomli status allaqachon mavjud`,
            );
          }
        }
        dto.name = normalizedName;
      }

      if (dto.is_default === true) {
        await this.lidStatusModel.update(
          { is_default: false },
          { where: { id: { [Op.ne]: id } }, transaction: t },
        );
      }

      const { roles, ...rest } = dto;
      await status.update(rest, { transaction: t });

      if (roles) {
        await this.lidStatusRoleModel.destroy({
          where: { status_id: id },
          transaction: t,
        });

        const rolesWithSuperAdmin = [
          ...new Set([...roles, UserRole.SUPER_ADMIN]),
        ];

        await this.lidStatusRoleModel.bulkCreate(
          rolesWithSuperAdmin.map((role) => ({ status_id: id, role })),
          { transaction: t },
        );
      }
    });

    return this.findOne(id);
  }

  async reorder(dto: ReorderLidStatusesDto): Promise<{ message: string }> {
    await Promise.all(
      dto.ids.map((id, index) =>
        this.lidStatusModel.update({ order: index }, { where: { id } }),
      ),
    );
    return { message: 'Statuslar tartibi yangilandi' };
  }

  async remove(id: string): Promise<{ message: string }> {
    const status = await this.findOne(id);
    const lidsCount = await status.$count('lids');
    if (lidsCount > 0) {
      throw new BadRequestException(
        `Bu statusda ${lidsCount} ta lid mavjud. Avval ularni boshqa statusga o'tkazing`,
      );
    }
    if (status.is_default) {
      throw new BadRequestException(
        "Default statusni o'chirib bo'lmaydi. Avval boshqa statusni default qiling",
      );
    }
    await status.destroy();
    return { message: "Status o'chirildi" };
  }

  async getAccessibleStatusIds(role: UserRole): Promise<string[]> {
    if (role === UserRole.SUPER_ADMIN) {
      const all = await this.lidStatusModel.findAll({ attributes: ['id'] });
      return all.map((s) => s.id);
    }
    const links = await this.lidStatusRoleModel.findAll({
      where: { role },
      attributes: ['status_id'],
    });
    return links.map((l) => l.status_id);
  }

  async canRoleAccess(statusId: string, role: UserRole): Promise<boolean> {
    if (role === UserRole.SUPER_ADMIN) return true;
    const link = await this.lidStatusRoleModel.findOne({
      where: { status_id: statusId, role },
    });
    return !!link;
  }

  async getDefault(): Promise<LidStatus> {
    const status = await this.lidStatusModel.findOne({
      where: { is_default: true },
      order: [['order', 'ASC']],
    });
    if (!status) {
      throw new BadRequestException(
        "Default status topilmadi. Avval is_default=true bo'lgan status yarating",
      );
    }
    return status;
  }

  private normalizeName(name: string): string {
    return name
      .replace(/[‘’`´]/g, "'")
      .replace(/["«»„""]/g, '')
      .trim()
      .toUpperCase();
  }
  async getKeldiKeladi() {
    const allStatuses = await this.lidStatusModel.findAll({
      where: {
        name: {
          [Op.in]: [
            this.normalizeName('KELDI'),
            this.normalizeName('KELADI'),
            this.normalizeName('КЕЛДИ'),
            this.normalizeName('КЕЛАДИ'),
          ],
        },
      },
    });
    return allStatuses;
  }
}

export function normalizeName(name: string): string {
  return name
    .replace(/[‘’`´]/g, "'")
    .replace(/["«»„""]/g, '')
    .trim()
    .toUpperCase();
}
