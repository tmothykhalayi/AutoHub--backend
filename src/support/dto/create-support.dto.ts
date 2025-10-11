// create-support.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSupportDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsString()
  status?: string;
}
