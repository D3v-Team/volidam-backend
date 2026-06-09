import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsHexColor,
  IsInt,
  Min,
  IsUUID,
} from 'class-validator';

export class CreateLidChildStatusDto {
  @ApiProperty({
    example: 'a3b0c442-98fc-1c14-9afb-f4c898fc1111',
    description: 'Status unikal ID raqami (UUID)',
  })
  @IsNotEmpty({ message: "status_id bo'sh bo'lishi mumkin emas!" })
  @IsUUID('4', { message: "status_id noto'g'ri UUID formatida!" })
  status_id: string;

  @ApiProperty({
    description: 'Status nomi',
    example: 'Darsga boradi',
    maxLength: 100,
  })
  @IsString({ message: "name matn bo'lishi kerak" })
  @IsNotEmpty({ message: "name bo'sh bo'lmasligi kerak" })
  @MaxLength(100, { message: 'name 100 ta belgidan oshmasligi kerak' })
  name: string;

  @ApiPropertyOptional({ description: 'Hex rang', example: '#378ADD' })
  @IsOptional()
  @IsHexColor({ message: "color to'g'ri hex rang bo'lishi kerak" })
  color?: string;

  @ApiPropertyOptional({ description: 'Tartib', example: 1 })
  @IsOptional()
  @IsInt({ message: "order butun son bo'lishi kerak" })
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Type',
    example: 'toq',
    enum: ['toq', 'juft'],
  })
  @IsString({ message: "type matn bo'lishi kerak" })
  @IsNotEmpty({ message: "type bo'sh bo'lmasligi kerak" })
  type: string;
}
