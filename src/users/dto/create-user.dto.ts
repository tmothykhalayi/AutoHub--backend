
import { 
  IsString, 
  IsEmail, 
  IsOptional, 
  IsEnum, 
  IsPhoneNumber, 
  MinLength, 
  MaxLength,
  Matches,
  IsNotEmpty,
  ValidateIf
} from 'class-validator';
import { Role } from '../../auth/enums/role.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 255
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  @Matches(/^[a-zA-Z\s]+$/, {
    message: 'Full name must contain only letters and spaces'
  })
  full_name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'User phone number with country code',
    example: '+1234567890',
    required: false
  })
  @IsOptional()
  @IsPhoneNumber()
  contact_phone?: string;

  @ApiPropertyOptional({
    description: 'User physical address',
    example: '123 Main St, City, Country',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'User role in the system',
    enum: Role,
    default: Role.USER,
    required: false
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({
    description: 'User password (min 6 characters)',
    example: 'SecurePassword123!',
    minLength: 6
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Confirm password must match password',
    example: 'SecurePassword123!',
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