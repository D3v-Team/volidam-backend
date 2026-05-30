import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class AssignLidsDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: "Biriktirilishi kerak bo'lgan lid IDlar",
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  lid_ids: string[];

  @ApiProperty({ example: 'uuid-of-user', description: 'Hodim UUID si' })
  @IsUUID('4', { message: "assigned_id UUID bo'lishi kerak" })
  assigned_id: string;
}
