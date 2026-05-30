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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ota_ona_fio?: string;

  @ApiPropertyOptional({
    example: 'uuid-of-user',
    description: 'Hodim UUID si',
  })
  @IsOptional()
  @IsUUID('4', { message: "assigned_id UUID bo'lishi kerak" })
  assigned_id?: string;

  @ApiPropertyOptional({ type: [LidValueInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LidValueInputDto)
  values?: LidValueInputDto[];
}
