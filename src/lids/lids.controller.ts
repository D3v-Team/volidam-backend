import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { LidsService } from './lids.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles-auth-decorator';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateLidDto } from './dto/create-lid.dto';
import { UpdateLidDto } from './dto/update-lid.dto';
import {
  ChangeLidChildStatusDto,
  ChangeLidStatusDto,
} from './dto/change-lid-status.dto';
import { AssignLidsDto } from './dto/assign-lids.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Type } from '../lid_child_statuses/models/lid_child_status.model';

@ApiTags('Lids')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lids')
export class LidsController {
  constructor(private readonly lidsService: LidsService) {}

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Post()
  @ApiOperation({
    summary:
      'Yangi lid (fio + telefon_raqam; ota_ona_fio, assigned_id optional)',
  })
  create(@Body() dto: CreateLidDto, @CurrentUser() user: AuthUser) {
    return this.lidsService.create(dto, user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Put('assign')
  @ApiOperation({
    summary: 'Bir nechta lidga hodim biriktirish',
    description: 'lid_ids massivi va assigned_id (User UUID) beriladi',
  })
  assignLids(@Body() dto: AssignLidsDto) {
    return this.lidsService.assignLids(dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('import/excel')
  @ApiOperation({
    summary: 'Excel dan lidlarni import qilish',
    description: 'status_id berilmasa — default status ishlatiladi',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        status_id: {
          type: 'string',
          format: 'uuid',
          description: "Lidlar bog'lanadigan status UUID (optional)",
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({
            fileType:
              /application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application\/vnd.ms-excel/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
    @Query('status_id') status_id?: string,
  ) {
    return this.lidsService.importFromExcel(file.buffer, user, status_id);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Get()
  @ApiOperation({
    summary: "Lidlar ro'yxati",
    description:
      "assigned_id berilsa — paginated list. Bo'sh bo'lsa — kanban (har statusdan limit ta).",
  })
  @ApiQuery({ name: 'assigned_id', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('assigned_id') assigned_id?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
  ) {
    return this.lidsService.findAll(user, {
      assigned_id,
      limit: limit!,
      page: page!,
    });
  }

  @Get('filter')
  @ApiOperation({ summary: 'Lidlarni filterli get qilish' })
  @ApiQuery({ name: 'status_id', required: true, type: String })
  @ApiQuery({ name: 'type', required: true, description: 'Toq yoki Juft' })
  @ApiQuery({ name: 'assigned_id', required: false, type: String })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  getLidFilterGet(
    @Query('status_id') status_id: string,
    @Query('type') type: Type,
    @Query('assigned_id') assigned_id?: string,
    @Query('searchTerm') searchTerm?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.lidsService.getLidFilterGet(
      status_id,
      type,
      assigned_id,
      searchTerm,
      page,
      limit,
    );
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lidsService.findOne(id, user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Put(':id')
  @ApiOperation({ summary: 'Lidni yangilash (asosiy + dinamik qiymatlar)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLidDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lidsService.update(id, dto, user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Put(':id/status')
  @ApiOperation({ summary: "Statusni o'zgartirish (role tekshiriladi)" })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeLidStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lidsService.changeStatus(id, dto, user);
  }

  @ApiOperation({ summary: "Child statusni o'zgartirish (role tekshiriladi)" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Put(':id/child-status')
  changeChildStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeLidChildStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lidsService.changeLidChildStatus(id, dto, user);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.lidsService.remove(id, user);
  }
}
