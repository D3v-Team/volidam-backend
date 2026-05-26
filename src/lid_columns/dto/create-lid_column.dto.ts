import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateLidColumnDto {
  @ApiProperty({
    description: "Ko'rinish nomi",
    example: 'Darsga kelish vaqti',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  label: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class ReorderLidColumnsDto {
  @ApiProperty({ type: [String] })
  @IsString({ each: true })
  @IsNotEmpty()
  ids: string[];
}
