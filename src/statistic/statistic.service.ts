import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fn, col, literal } from 'sequelize';
import { Lid } from '../lids/models/lid.model';
import { LidStatus } from '../lid_statuses/models/lid_status.model';

interface StatusRaw {
  name: string;
  color: string;
  count: string;
}

interface MonthRaw {
  month_num: string;
  count: string;
}

@Injectable()
export class StatisticService {
  constructor(
    @InjectModel(Lid) private lidModel: typeof Lid,
    @InjectModel(LidStatus) private lidStatusModel: typeof LidStatus,
  ) {}

  async getLeadsByStatus() {
    const result = await this.lidStatusModel.findAll({
      attributes: ['name', 'color', [fn('COUNT', col('lids.id')), 'count']],
      include: [
        {
          model: Lid,
          attributes: [],
          required: false,
        },
      ],
      group: ['LidStatus.id', 'LidStatus.name', 'LidStatus.color'],
      raw: true,
    });

    return (result as unknown as StatusRaw[]).map((item) => ({
      status_name: item.name,
      color: item.color,
      count: Number(item.count),
    }));
  }

  async getMonthlyDynamics(year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const result = await this.lidModel.findAll({
      attributes: [
        [fn('MONTH', col('created_at')), 'month_num'],
        [fn('COUNT', col('id')), 'count'],
      ],

      where: literal(`YEAR(created_at) = ${targetYear}`),
      group: [fn('MONTH', col('created_at'))],
      order: [[fn('MONTH', col('created_at')), 'ASC']],
      raw: true,
    });

    const monthNames = [
      'Yanvar',
      'Fevral',
      'Mart',
      'Aprel',
      'May',
      'Iyun',
      'Iyul',
      'Avgust',
      'Sentabr',
      'Oktabr',
      'Noyabr',
      'Dekabr',
    ];

    const dataMap = new Map<number, number>();
    (result as unknown as MonthRaw[]).forEach((item) => {
      dataMap.set(Number(item.month_num), Number(item.count));
    });

    return {
      year: targetYear,
      data: monthNames.map((name, i) => ({
        month: name,
        month_num: i + 1,
        count: dataMap.get(i + 1) ?? 0,
      })),
    };
  }

  async getNewLeadsSummary() {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, this_week, this_month] = await Promise.all([
      this.lidModel.count({
        where: literal(`created_at >= '${startOfDay.toISOString()}'`),
      }),
      this.lidModel.count({
        where: literal(`created_at >= '${startOfWeek.toISOString()}'`),
      }),
      this.lidModel.count({
        where: literal(`created_at >= '${startOfMonth.toISOString()}'`),
      }),
    ]);

    return { today, this_week, this_month };
  }

  async getAllStats(year?: number) {
    const [by_status, monthly_dynamics, new_leads] = await Promise.all([
      this.getLeadsByStatus(),
      this.getMonthlyDynamics(year),
      this.getNewLeadsSummary(),
    ]);

    return { by_status, monthly_dynamics, new_leads };
  }
}
