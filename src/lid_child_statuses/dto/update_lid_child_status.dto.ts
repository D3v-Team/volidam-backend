import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsHexColor,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateLidChildStatusDto {
  @ApiPropertyOptional({
    description: 'Status nomi',
    example: 'Darsga boradi',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: "name matn bo'lishi kerak" })
  @IsNotEmpty({ message: "name bo'sh bo'lmasligi kerak" })
  @MaxLength(100, { message: 'name 100 ta belgidan oshmasligi kerak' })
  name?: string;

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
    description: 'Type',
    example: 'toq',
    enum: ['toq', 'juft'],
  })
  @IsOptional()
  @IsString({ message: "type matn bo'lishi kerak" })
  @IsNotEmpty({ message: "type bo'sh bo'lmasligi kerak" })
  type?: string;
}
