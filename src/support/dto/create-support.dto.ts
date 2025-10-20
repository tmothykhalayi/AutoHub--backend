// create-support.dto.ts
import { IsNotEmpty, IsString ,MaxLength, IsOptional ,IsEnum,IsNumber ,MinLength} from 'class-validator';

export class CreateSupportDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsEnum(['general', 'technical', 'billing', 'account', 'feature-request'])
  category?: string;
  @IsNotEmpty()
  @IsString()
  subject: string;


  @IsString()
  status?: string;
}
