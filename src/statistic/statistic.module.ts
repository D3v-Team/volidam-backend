import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StatisticService } from './statistic.service';
import { StatisticController } from './statistic.controller';
import { Lid } from '../lids/models/lid.model';
import { LidStatus } from '../lid_statuses/models/lid_status.model';
import { LidStatusLog } from '../lids/models/lid_status_log.model';

@Module({
  imports: [SequelizeModule.forFeature([Lid, LidStatus, LidStatusLog])],
  controllers: [StatisticController],
  providers: [StatisticService],
})
export class StatisticModule {}
