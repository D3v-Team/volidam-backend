import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ChangeLidStatusDto {
  @ApiProperty()
  @IsUUID('4', { message: "status_id UUID bo'lishi kerak" })
  @IsNotEmpty()
  status_id: string;
}
export class ChangeLidChildStatusDto {
  @ApiProperty()
  @IsUUID('4', { message: "child_status_id UUID bo'lishi kerak" })
  @IsNotEmpty()
  child_status_id: string;
}
