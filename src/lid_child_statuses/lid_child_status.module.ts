import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { LidChildStatus } from './models/lid_child_status.model';
import { JwtModule } from '@nestjs/jwt';
import { LidChildStatusController } from './lid_child_status.controller';
import { LidChildStatusService } from './lid_child_status.service';
import { LidStatus } from '../lid_statuses/models/lid_status.model';

@Module({
  imports: [SequelizeModule.forFeature([LidChildStatus, LidStatus]), JwtModule],
  controllers: [LidChildStatusController],
  providers: [LidChildStatusService],
  exports: [LidChildStatusService],
})
export class LidChildStatusModule {}
