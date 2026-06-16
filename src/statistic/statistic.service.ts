import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fn, col, literal, Op, IncludeOptions } from 'sequelize';
import { Lid } from '../lids/models/lid.model';
import { LidStatus } from '../lid_statuses/models/lid_status.model';
import { LidStatusLog } from '../lids/models/lid_status_log.model';

interface StatusRaw {
  name: string;
  color: string;
  order: number;
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
    @InjectModel(LidStatusLog) private lidStatusLogModel: typeof LidStatusLog,
  ) {}

  async getLeadsByDate(date: string) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const result = await this.lidStatusModel.findAll({
      attributes: [
        'name',
        'color',
        'order',
        [fn('COUNT', col('lids.id')), 'count'],
      ],
      include: [
        {
          model: Lid,
          attributes: [],
          required: false,
          where: { createdAt: { [Op.between]: [start, end] } },
        },
      ],
      group: [
        'LidStatus.id',
        'LidStatus.name',
        'LidStatus.color',
        'LidStatus.order',
      ],
      order: [['order', 'ASC']],
      raw: true,
    });

    const mapped = (result as unknown as StatusRaw[]).map((item) => ({
      status_name: item.name,
      color: item.color,
      order: item.order,
      count: Number(item.count),
    }));

    return {
      date,
      total: mapped.reduce((sum, i) => sum + i.count, 0),
      by_status: mapped,
    };
  }

  async getLeadsByDateRange(
    startDate: string,
    endDate: string,
    assigneeId?: string,
  ) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let include: IncludeOptions[] = [];
    if (assigneeId) {
      include = [
        {
          model: Lid,
          attributes: [],
          required: true,
          where: { assigned_id: assigneeId },
        },
      ];
    }

    const logs = (await this.lidStatusLogModel.findAll({
      attributes: [
        'lid_id',

        [fn('MAX', col('LidStatusLog.createdAt')), 'last_changed_at'],
      ],
      where: {
        createdAt: { [Op.between]: [start, end] },
      },
      include,
      group: ['lid_id'],
      raw: true,
    })) as unknown as { lid_id: string; last_changed_at: string }[];

    if (!logs.length) {
      const statuses = await this.lidStatusModel.findAll({
        order: [['order', 'ASC']],
      });
      return {
        start_date: startDate,
        end_date: endDate,
        total: 0,
        by_status: statuses.map((s) => ({
          status_name: s.name,
          color: s.color,
          order: s.order,
          count: 0,
        })),
      };
    }

    const lidIds = logs.map((l) => l.lid_id);
    const lastChangedMap = new Map(
      logs.map((l) => [l.lid_id, l.last_changed_at]),
    );

    const lastLogs = await Promise.all(
      lidIds.map((lid_id) =>
        this.lidStatusLogModel.findOne({
          where: {
            lid_id,
            createdAt: lastChangedMap.get(lid_id)!,
          },
          include: [
            {
              model: LidStatus,
              as: 'to_status',
              attributes: ['id', 'name', 'color', 'order'],
            },
          ],
        }),
      ),
    );

    type StatusCount = {
      name: string;
      color: string;
      order: number;
      count: number;
    };
    const statusCountMap = new Map<string, StatusCount>();

    for (const log of lastLogs) {
      if (!log || !log.to_status) continue;
      const s = log.to_status;
      const existing = statusCountMap.get(s.id);
      if (existing) {
        existing.count++;
      } else {
        statusCountMap.set(s.id, {
          name: s.name,
          color: s.color,
          order: s.order,
          count: 1,
        });
      }
    }

    const allStatuses = await this.lidStatusModel.findAll({
      order: [['order', 'ASC']],
    });

    const by_status = allStatuses.map((s) => {
      const found = statusCountMap.get(s.id);
      return {
        status_name: s.name,
        color: s.color,
        order: s.order,
        count: found?.count ?? 0,
      };
    });

    return {
      start_date: startDate,
      end_date: endDate,
      total: lastLogs.filter(Boolean).length,
      by_status,
    };
  }

  async getMonthlyDynamics(year?: number) {
    const targetYear = year ?? new Date().getFullYear();

    const result = await this.lidModel.findAll({
      attributes: [
        [fn('EXTRACT', literal('MONTH FROM "createdAt"')), 'month_num'],
        [fn('COUNT', col('id')), 'count'],
      ],
      where: literal(`EXTRACT(YEAR FROM "createdAt") = ${targetYear}`),
      group: [fn('EXTRACT', literal('MONTH FROM "createdAt"'))],
      order: [[fn('EXTRACT', literal('MONTH FROM "createdAt"')), 'ASC']],
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
      this.lidModel.count({ where: { createdAt: { [Op.gte]: startOfDay } } }),
      this.lidModel.count({ where: { createdAt: { [Op.gte]: startOfWeek } } }),
      this.lidModel.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
    ]);

    return { today, this_week, this_month };
  }

  async getAllStats(year?: number, date?: string) {
    const targetDate = date ?? new Date().toISOString().split('T')[0];

    const [by_date, monthly_dynamics, new_leads] = await Promise.all([
      this.getLeadsByDate(targetDate),
      this.getMonthlyDynamics(year),
      this.getNewLeadsSummary(),
    ]);

    return { by_date, monthly_dynamics, new_leads };
  }
}
