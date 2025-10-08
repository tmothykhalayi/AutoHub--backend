import { 
  PartialType, 
  OmitType 
} from '@nestjs/mapped-types';
import { 
  IsOptional, 
  IsBoolean, 
  IsPhoneNumber,
  IsString,
  MaxLength,
  IsEmail,
  Matches,
  MinLength,
  ValidateIf
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password', 'confirm_password', 'role'] as const)
) {
  @ApiPropertyOptional({
    description: 'User active status',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Email verification status',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  email_verified?: boolean;

  @ApiPropertyOptional({
    description: 'Updated email address',
    example: 'new.email@example.com',
    required: false
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Updated phone number',
    example: '+0987654321',
    required: false
  })
  @IsOptional()
  @IsPhoneNumber()
  contact_phone?: string;

  @ApiPropertyOptional({
    description: 'Updated address',
    example: '456 Oak St, New City, Country',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'Updated full name',
    example: 'John Updated',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Full name must contain only letters and spaces'
  })
  full_name?: string;

  @ApiPropertyOptional({
    description: 'New password (min 6 characters)',
    example: 'NewSecurePassword123!',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'Confirm new password must match new password',
    example: 'NewSecurePassword123!',
    required: false
  })
  @IsOptional()
  @IsString()
  @ValidateIf(o => o.password !== undefined)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Confirm password must match password requirements'
  })
  confirm_password?: string;
}
