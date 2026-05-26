import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateLidDto {
  @ApiProperty({ example: 'Aliyev Ali Valiyevich' })
  @IsString({ message: "fio matn bo'lishi kerak" })
  @IsNotEmpty({ message: "fio bo'sh bo'lmasligi kerak" })
  @MaxLength(200)
  fio: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString()
  @IsNotEmpty({ message: "telefon_raqam bo'sh bo'lmasligi kerak" })
  @Matches(/^\+?[0-9]{9,15}$/, {
    message: "telefon_raqam noto'g'ri formatda",
  })
  telefon_raqam: string;
}
