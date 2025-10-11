// create-branch.dto.ts
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional() 
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
