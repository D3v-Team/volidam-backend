import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateLidStatusDto {
  @ApiProperty({
    description: 'Status nomi',
    example: 'Darsga boradi',
    maxLength: 100,
  })
  @IsString({ message: "name matn bo'lishi kerak" })
  @IsNotEmpty({ message: "name bo'sh bo'lmasligi kerak" })
  @MaxLength(100, { message: 'name 100 ta belgidan oshmasligi kerak' })
  name: string;

  @ApiProperty({
    description:
      "Qaysi rollar ko'ra oladi. SUPER_ADMIN avtomatik qo'shiladi — bermasa ham bo'ladi",
    enum: UserRole,
    isArray: true,
    example: [UserRole.OPERATOR, UserRole.ADMIN],
  })
  @IsArray({ message: "roles massiv bo'lishi kerak" })
  @ArrayMinSize(1, { message: 'Kamida 1 ta role tanlash kerak' })
  @ArrayUnique({ message: 'Role takrorlanmasligi kerak' })
  @IsEnum(UserRole, { each: true, message: "role noto'g'ri qiymat" })
  roles: UserRole[];

  @ApiPropertyOptional({ description: 'Hex rang', example: '#378ADD' })
  @IsOptional()
  @IsHexColor({ message: "color to'g'ri hex rang bo'lishi kerak" })
  color?: string;

  @ApiPropertyOptional({ description: 'Tartib', example: 1 })
  @IsOptional()
  @IsInt({ message: "order butun son bo'lishi kerak" })
  @Min(0)
  order?: number;

  @ApiPropertyOptional({
    description:
      "Yangi lid yaratilganda shu status berilsinmi (faqat 1 ta bo'la oladi)",
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: "is_default boolean bo'lishi kerak" })
  is_default?: boolean;
}

export class ReorderLidStatusesDto {
  @ApiProperty({ description: 'Yangi tartib', type: [String] })
  @IsString({ each: true })
  @IsNotEmpty()
  ids: string[];
}
