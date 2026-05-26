import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { Lid } from './models/lid.model';
import { LidValue } from './models/lid_value.model';
import { LidColumn } from '../lid_columns/models/lid_column.model';
import { LidsService } from './lids.service';
import { LidsController } from './lids.controller';
import { LidStatusModule } from '../lid_statuses/lid_statuses.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Lid, LidValue, LidColumn]),
    JwtModule,
    LidStatusModule,
  ],
  controllers: [LidsController],
  providers: [LidsService],
  exports: [LidsService],
})
export class LidsModule {}
