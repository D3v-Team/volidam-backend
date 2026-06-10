import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LidStatusService } from './lid_statuses.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles-auth-decorator';
import { UserRole } from '../common/enums/user-role.enum';
import {
  CreateLidStatusDto,
  ReorderLidStatusesDto,
} from './dto/create-lid_status.dto';
import { UpdateLidStatusDto } from './dto/update-lid_status.dto';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';

@ApiTags('Lid Statuses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lid-statuses')
export class LidStatusController {
  constructor(private readonly lidStatusService: LidStatusService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Yangi status yaratish' })
  create(@Body() dto: CreateLidStatusDto) {
    return this.lidStatusService.create(dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Get()
  @ApiOperation({ summary: "Foydalanuvchi roliga ko'ra statuslar" })
  findAll(@CurrentUser() user: AuthUser) {
    return this.lidStatusService.findAll(user.role);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('keldi-keladi')
  getKeldiKeladi() {
    return this.lidStatusService.getKeldiKeladi();
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lidStatusService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Put('reorder')
  reorder(@Body() dto: ReorderLidStatusesDto) {
    return this.lidStatusService.reorder(dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLidStatusDto) {
    return this.lidStatusService.update(id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lidStatusService.remove(id);
  }
}
