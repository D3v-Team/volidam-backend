import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { StatisticService } from './statistic.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles-auth-decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@Controller('statistic')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha statistikalar (faqat super_admin)' })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2024 })
  getAllStats(@Query('year') year?: number) {
    return this.statisticService.getAllStats(year);
  }

  @Get('by-status')
  @ApiOperation({ summary: "Har bir status bo'yicha lidlar soni" })
  getLeadsByStatus() {
    return this.statisticService.getLeadsByStatus();
  }

  @Get('monthly')
  @ApiOperation({ summary: "Oylik lidlar dinamikasi (yil bo'yicha)" })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2024 })
  getMonthlyDynamics(@Query('year') year?: number) {
    return this.statisticService.getMonthlyDynamics(year);
  }

  @Get('new-leads')
  @ApiOperation({ summary: 'Bugun / bu hafta / bu oy yangi lidlar' })
  getNewLeadsSummary() {
    return this.statisticService.getNewLeadsSummary();
  }
}
