import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateLidDto {
  @ApiProperty({ example: 'Aliyev Ali Valiyevich' })
  @IsString()
  @IsNotEmpty({ message: "fio bo'sh bo'lmasligi kerak" })
  @MaxLength(200)
  fio: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  // @IsPhoneNumber('UZ', { message: "telefon_raqam noto'g'ri formatda" })
  @IsNotEmpty({ message: "telefon_raqam bo'sh bo'lmasligi kerak" })
  // @Matches(/^\+?[0-9]{9,15}$/, { message: "telefon_raqam noto'g'ri formatda" })
  telefon_raqam: string;

  @ApiPropertyOptional({ example: 'Aliyev Vali Valiyevich' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ota_ona_fio?: string;

  @ApiPropertyOptional({ example: 'uuid-of-user' })
  @IsOptional()
  @IsUUID('4', { message: "assigned_id UUID bo'lishi kerak" })
  assigned_id?: string;
}
