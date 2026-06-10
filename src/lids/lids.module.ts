import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { Lid } from './models/lid.model';
import { LidValue } from './models/lid_value.model';
import { LidColumn } from '../lid_columns/models/lid_column.model';
import { LidsService } from './lids.service';
import { LidsController } from './lids.controller';
import { LidStatusModule } from '../lid_statuses/lid_statuses.module';
import { LidStatusLog } from './models/lid_status_log.model';
import { LidChildStatus } from '../lid_child_statuses/models/lid_child_status.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Lid,
      LidValue,
      LidColumn,
      LidStatusLog,
      LidChildStatus,
    ]),
    JwtModule,
    LidStatusModule,
  ],
  controllers: [LidsController],
  providers: [LidsService],
  exports: [LidsService],
})
export class LidsModule {}
