import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/models/user.model';

import { LidsModule } from './lids/lids.module';
import { Lid } from './lids/models/lid.model';
import { LidValue } from './lids/models/lid_value.model';

import { LidStatusModule } from './lid_statuses/lid_statuses.module';
import { LidStatus } from './lid_statuses/models/lid_status.model';
import { LidStatusRole } from './lid_statuses/models/lid_status_role.model';

import { LidColumnModule } from './lid_columns/lid_columns.module';
import { LidColumn } from './lid_columns/models/lid_column.model';

import { WebsocketModule } from './websocket/websocket.module';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { StatisticModule } from './statistic/statistic.module';
import { LidChildStatus } from './lid_child_statuses/models/lid_child_status.model';
import { LidChildStatusModule } from './lid_child_statuses/lid_child_status.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres' as const,
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        models: [
          User,
          Lid,
          LidValue,
          LidColumn,
          LidStatus,
          LidStatusRole,
          LidChildStatus,
        ],
        autoLoadModels: true,
        synchronize: true,
        logging: false,
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000,
        },
      }),
    }),

    AuthModule,
    UserModule,
    WebsocketModule,
    LidsModule,
    LidStatusModule,
    LidColumnModule,
    LidChildStatusModule,
    StatisticModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
