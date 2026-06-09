import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { LidStatus } from './models/lid_status.model';
import { LidStatusRole } from './models/lid_status_role.model';
import { LidStatusService } from './lid_statuses.service';
import { LidStatusController } from './lid_statuses.controller';
import { LidChildStatus } from '../lid_child_statuses/models/lid_child_status.model';

@Module({
  imports: [
    SequelizeModule.forFeature([LidStatus, LidStatusRole, LidChildStatus]),
    JwtModule,
  ],
  controllers: [LidStatusController],
  providers: [LidStatusService],
  exports: [LidStatusService],
})
export class LidStatusModule {}
