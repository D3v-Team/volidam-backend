import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { LidStatus } from './models/lid_status.model';
import { LidStatusRole } from './models/lid_status_role.model';
import { LidStatusService } from './lid_statuses.service';
import { LidStatusController } from './lid_statuses.controller';

@Module({
  imports: [SequelizeModule.forFeature([LidStatus, LidStatusRole]), JwtModule],
  controllers: [LidStatusController],
  providers: [LidStatusService],
  exports: [LidStatusService],
})
export class LidStatusModule {}
