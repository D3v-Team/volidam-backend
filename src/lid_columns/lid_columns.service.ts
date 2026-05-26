import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { LidColumn } from './models/lid_column.model';
import {
  CreateLidColumnDto,
  ReorderLidColumnsDto,
} from './dto/create-lid_column.dto';
import { UpdateLidColumnDto } from './dto/update-lid_column.dto';

@Injectable()
export class LidColumnService {
  constructor(
    @InjectModel(LidColumn) private lidColumnModel: typeof LidColumn,
  ) {}

  async create(dto: CreateLidColumnDto): Promise<LidColumn> {
    const exists = await this.lidColumnModel.findOne({
      where: { label: dto.label.trim() },
    });
    if (exists) {
      throw new BadRequestException(`"${dto.label}" nomli column mavjud`);
    }

    const order =
      dto.order ??
      ((await this.lidColumnModel.max<number, LidColumn>('order')) ?? -1) + 1;

    return this.lidColumnModel.create({
      ...dto,
      label: dto.label.trim(),
      order,
    });
  }

  async findAll(): Promise<LidColumn[]> {
    return this.lidColumnModel.findAll({ order: [['order', 'ASC']] });
  }

  async findOne(id: string): Promise<LidColumn> {
    const col = await this.lidColumnModel.findByPk(id);
    if (!col) throw new NotFoundException('Column topilmadi');
    return col;
  }

  async update(id: string, dto: UpdateLidColumnDto): Promise<LidColumn> {
    const col = await this.findOne(id);

    if (dto.label && dto.label.trim() !== col.label) {
      const dup = await this.lidColumnModel.findOne({
        where: { label: dto.label.trim(), id: { [Op.ne]: id } },
      });
      if (dup)
        throw new BadRequestException(`"${dto.label}" nomli column mavjud`);
      dto.label = dto.label.trim();
    }

    await col.update(dto);
    return col;
  }

  async reorder(dto: ReorderLidColumnsDto): Promise<{ message: string }> {
    await Promise.all(
      dto.ids.map((id, index) =>
        this.lidColumnModel.update({ order: index }, { where: { id } }),
      ),
    );
    return { message: 'Columnlar tartibi yangilandi' };
  }

  async remove(id: string): Promise<{ message: string }> {
    const col = await this.findOne(id);
    await col.destroy();
    return { message: "Column va u bilan bog'liq qiymatlar o'chirildi" };
  }
}
