import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles-auth-decorator';
import { UserRole } from '../common/enums/user-role.enum';

import { CreateLidChildStatusDto } from './dto/create_lid_child_status.dto';
import { LidChildStatusService } from './lid_child_status.service';
import { UpdateLidChildStatusDto } from './dto/update_lid_child_status.dto';
import { ReorderLidChildStatusesDto } from '../lid_statuses/dto/create-lid_status.dto';
import { Type } from './models/lid_child_status.model';

@ApiTags('Lid Child Statuses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lid-child-statuses')
export class LidChildStatusController {
  constructor(private readonly lidChildStatusService: LidChildStatusService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Yangi child status yaratish' })
  create(@Body() dto: CreateLidChildStatusDto) {
    return this.lidChildStatusService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha child statuslarni filterlab olish' })
  @ApiQuery({
    name: 'searchTerm',
    required: false,
    type: String,
    example: 'all',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['toq', 'juft'],
    example: 'toq',
  })
  @ApiQuery({ name: 'status_id', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  findAll(
    @Query('searchTerm') searchTerm?: string,
    @Query('type') type?: 'toq' | 'juft',
    @Query('status_id') status_id?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.lidChildStatusService.findAllChildStatuses(
      searchTerm,
      type,
      status_id,
      page,
      limit,
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lidChildStatusService.findOne(id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Put('reorder')
  reorder(@Body() dto: ReorderLidChildStatusesDto) {
    return this.lidChildStatusService.reorder(dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLidChildStatusDto) {
    return this.lidChildStatusService.update(id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lidChildStatusService.remove(id);
  }
}
