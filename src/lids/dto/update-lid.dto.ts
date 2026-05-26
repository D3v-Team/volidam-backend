import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class LidValueInputDto {
  @ApiPropertyOptional()
  @IsUUID('4', { message: "column_id UUID bo'lishi kerak" })
  @IsNotEmpty()
  column_id: string;

  @ApiPropertyOptional({ description: "Qiymat (null bersa o'chadi)" })
  @IsOptional()
  value: string | number | boolean | null;
}

export class UpdateLidDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  fio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{9,15}$/)
  telefon_raqam?: string;

  @ApiPropertyOptional({
    type: [LidValueInputDto],
    description: 'Dinamik columnlar uchun qiymatlar (upsert)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LidValueInputDto)
  values?: LidValueInputDto[];
}
