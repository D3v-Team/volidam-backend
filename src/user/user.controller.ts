import { UserRole } from './../common/enums/user-role.enum';
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles-auth-decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ResetPasswordDto } from './dto/resetPassword.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create user' })
  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @ApiOperation({ summary: 'Get all users' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATOR, UserRole.ADMIN)
  @ApiQuery({ name: 'role', required: false })
  @Get('all')
  getAllUsers(@Query('role') role: string) {
    return this.userService.getAllUsers(role);
  }

  @ApiOperation({ summary: 'Get operators with pagination' })
  @Roles(UserRole.SUPER_ADMIN)
  @ApiQuery({ name: 'page', required: false })
  @Get('page')
  getAllUsersPage(@Query('role') role: string, @Query('page') page: number) {
    return this.userService.getAllUsersPage(role, page);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATOR)
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @ApiOperation({ summary: 'Update user by ID' })
  @Roles(UserRole.SUPER_ADMIN)
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  @ApiOperation({ summary: 'Reset user password' })
  @Roles(UserRole.SUPER_ADMIN)
  @Post('reset-password/:id')
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.userService.resetUserPassword(id, dto);
  }

  @ApiOperation({ summary: "Foydalanuvchini o'chirish" })
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
