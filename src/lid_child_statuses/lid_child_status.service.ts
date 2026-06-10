import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { LidStatus } from '../lid_statuses/models/lid_status.model';
import { CreateLidChildStatusDto } from './dto/create_lid_child_status.dto';
import { LidChildStatus, Type } from './models/lid_child_status.model';
import { UpdateLidChildStatusDto } from './dto/update_lid_child_status.dto';
import { ReorderLidChildStatusesDto } from '../lid_statuses/dto/create-lid_status.dto';
import { Op, WhereOptions } from 'sequelize';
import { Lid } from '../lids/models/lid.model';

export interface PaginationResult {
  offset: number;
  currentPage: number;
  safeLimit: number;
}

export interface PageResponse<T> {
  status: number;
  data: {
    records: T[];
    pagination: {
      currentPage: number;
      total_pages: number;
      total_count: number;
    };
  };
}

export function paginate(
  page: number = 1,
  limit: number = 20,
): PaginationResult {
  const safeLimit = Math.max(Number(limit) || 20, 1);
  const currentPage = Math.max(Number(page) || 1, 1);
  const offset = (currentPage - 1) * safeLimit;

  return { offset, currentPage, safeLimit };
}

export function pageResponse<T>(
  rows: T[],
  count: number,
  currentPage: number,
  limit: number,
): PageResponse<T> {
  return {
    status: 200,
    data: {
      records: rows,
      pagination: {
        currentPage,
        total_pages: Math.ceil(count / limit),
        total_count: count,
      },
    },
  };
}

@Injectable()
export class LidChildStatusService {
  constructor(
    @InjectModel(LidChildStatus) private repo: typeof LidChildStatus,
    @InjectModel(LidStatus) private lidStatusModel: typeof LidStatus,
    @InjectModel(Lid) private lid: typeof Lid,
    private readonly sequelize: Sequelize,
  ) {}

  async create(dto: CreateLidChildStatusDto) {
    const { status_id, name, type, order } = dto;
    const existingStatus = await this.lidStatusModel.findByPk(status_id);
    if (!existingStatus) {
      throw new NotFoundException('Status not found');
    }
    dto.name = this.normalizeName(name);
    const exists = await this.repo.findOne({
      where: {
        status_id,
        name: dto.name,
      },
    });
    if (exists) {
      throw new BadRequestException('Bu nomli status mavjud');
    }
    return await this.repo.create({
      status_id,
      name: dto.name,
      type: type as Type,
      order: order || 0,
    });
  }

  async findAll(statusId: string): Promise<LidChildStatus[]> {
    return await this.repo.findAll({
      where: {
        status_id: statusId,
      },
      order: [['order', 'ASC']],
    });
  }

  async findOne(id: string): Promise<LidChildStatus> {
    const status = await this.repo.findByPk(id);
    if (!status) throw new NotFoundException('Status topilmadi');
    return status;
  }

  async update(id: string, dto: UpdateLidChildStatusDto) {
    const existing = await this.repo.findByPk(id);
    if (!existing) {
      throw new NotFoundException('Status topilmadi');
    }

    if (dto.name) {
      dto.name = this.normalizeName(dto.name);

      const duplicate = await this.repo.findOne({
        where: {
          status_id: existing.status_id,
          name: dto.name,
        },
      });
      if (duplicate) {
        throw new BadRequestException('Bu nomli status mavjud');
      }
    }

    return existing.update({
      ...(dto.name && { name: dto.name }),
      ...(dto.type && { type: dto.type as Type }),
      ...(dto.order !== undefined && { order: dto.order }),
      ...(dto.color !== undefined && { color: dto.color }),
    });
  }

  async reorder(dto: ReorderLidChildStatusesDto): Promise<{ message: string }> {
    await Promise.all(
      dto.ids.map((id, index) =>
        this.repo.update({ order: index }, { where: { id } }),
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
    await status.destroy();
    return { message: "Status o'chirildi" };
  }

  async findAllChildStatuses(
    searchTerm?: string,
    type?: string,
    status_id?: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const { offset, currentPage } = paginate(page, limit);

    const where: WhereOptions<LidChildStatus> = {};

    if (searchTerm && searchTerm !== 'all') {
      where.name = { [Op.iLike]: `%${searchTerm.trim()}%` };
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (status_id && status_id !== 'all') {
      where.status_id = status_id;
    }

    const { rows, count } = await this.repo.findAndCountAll({
      where,
      order: [['order', 'ASC']],
      limit,
      offset,
      distinct: true,
      col: 'id',
    });

    return pageResponse(rows, count, currentPage, limit);
  }

  private normalizeName(name: string): string {
    return name
      .replace(/[‘’`´]/g, "'")
      .replace(/["«»„""]/g, '')
      .trim()
      .toUpperCase();
  }
}
