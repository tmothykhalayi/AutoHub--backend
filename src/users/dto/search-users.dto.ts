// src/modules/users/dto/search-users.dto.ts
import { 
  IsOptional, 
  IsString, 
  IsEnum, 
  IsBoolean, 
  IsDateString,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { Role } from '../../auth/enums/role.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';


export class SearchUsersDto  {
  @ApiPropertyOptional({
    description: 'Search query (name, email, phone)',
    example: 'john',
    required: false
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: Role,
    example: Role.CUSTOMER,
    required: false
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by email verification status',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  email_verified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by creation date (after)',
    example: '2024-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date (before)',
    example: '2024-01-31',
    required: false
  })
  @IsOptional()
  @IsDateString()
  created_before?: string;

  @ApiPropertyOptional({
    description: 'Filter by last login date (after)',
    example: '2024-01-15',
    required: false
  })
  @IsOptional()
  @IsDateString()
  last_login_after?: string;

  @ApiPropertyOptional({
    description: 'Filter by last login date (before)',
    example: '2024-01-20',
    required: false
  })
  @IsOptional()
  @IsDateString()
  last_login_before?: string;
}

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Search query (name, email, phone)',
    example: 'john',
    required: false
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: Role,
    example: Role.USER,
    required: false
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by email verification status',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  email_verified?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by creation date (after)',
    example: '2024-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Filter by creation date (before)',
    example: '2024-01-31',
    required: false
  })
  @IsOptional()
  @IsDateString()
  created_before?: string;

  @ApiPropertyOptional({
    description: 'Filter by last login date (after)',
    example: '2024-01-15',
    required: false
  })
  @IsOptional()
  @IsDateString()
  last_login_after?: string;

  @ApiPropertyOptional({
    description: 'Filter by last login date (before)',
    example: '2024-01-20',
    required: false
  })
  @IsOptional()
  @IsDateString()
  last_login_before?: string;
}