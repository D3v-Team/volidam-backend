import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { JwtModule } from '@nestjs/jwt';
import { LidColumn } from './models/lid_column.model';
import { LidColumnService } from './lid_columns.service';
import { LidColumnController } from './lid_columns.controller';

@Module({
  imports: [SequelizeModule.forFeature([LidColumn]), JwtModule],
  controllers: [LidColumnController],
  providers: [LidColumnService],
  exports: [LidColumnService],
})
export class LidColumnModule {}
