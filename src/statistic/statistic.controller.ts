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
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
@Controller('statistic')
export class StatisticController {
  constructor(private readonly statisticService: StatisticService) {}

  @Get()
  @ApiOperation({ summary: 'Barcha statistikalar (faqat super_admin)' })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-05-30',
    description: 'YYYY-MM-DD. Berilmasa — bugun',
  })
  getAllStats(@Query('year') year?: number, @Query('date') date?: string) {
    return this.statisticService.getAllStats(year, date);
  }

  @Get('by-date')
  @ApiOperation({
    summary: 'Berilgan sanada yaratilgan lidlarning hozirgi statusi',
    description: 'date berilmasa — bugungi kun',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    example: '2026-05-30',
    description: 'YYYY-MM-DD',
  })
  getLeadsByDate(@Query('date') date?: string) {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    return this.statisticService.getLeadsByDate(targetDate);
  }

  @Get('by-range')
  @ApiOperation({
    summary: "Sana oralig'ida harakatlangan lidlarning oxirgi statusi",
    description:
      "startDate va endDate oralig'ida log yozilgan lidlarning " +
      "o'sha range ichidagi eng oxirgi statusini guruhlaydi",
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    example: '2026-05-01',
    description: 'YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    example: '2026-05-30',
    description: 'YYYY-MM-DD',
  })
  @ApiQuery({
    name: 'assigneeId',
    required: false,
    type: String,
  })
  getLeadsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.statisticService.getLeadsByDateRange(
      startDate,
      endDate,
      assigneeId,
    );
  }

  @Get('monthly')
  @ApiOperation({ summary: "Oylik lidlar dinamikasi (yil bo'yicha)" })
  @ApiQuery({ name: 'year', required: false, type: Number, example: 2026 })
  getMonthlyDynamics(@Query('year') year?: number) {
    return this.statisticService.getMonthlyDynamics(year);
  }

  @Get('new-leads')
  @ApiOperation({ summary: 'Bugun / bu hafta / bu oy yangi lidlar' })
  getNewLeadsSummary() {
    return this.statisticService.getNewLeadsSummary();
  }
}
