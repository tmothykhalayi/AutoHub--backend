// src/modules/users/dto/user-response.dto.ts
import { Exclude, Expose, Transform } from 'class-transformer';
import { Role } from '../../auth/enums/role.enum';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class UserResponseDto {
  @ApiProperty({
    description: 'User unique identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  })
  @Expose()
  user_id: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe'
  })
  @Expose()
  full_name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com'
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+1234567890',
    required: false
  })
  @Expose()
  contact_phone?: string;

  @ApiProperty({
    description: 'User physical address',
    example: '123 Main St, City, Country',
    required: false
  })
  @Expose()
  address?: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: Role,
    example: Role.USER
  })
  @Expose()
  role: Role;

  @ApiProperty({
    description: 'User active status',
    example: true
  })
  @Expose()
  is_active: boolean;

  @ApiProperty({
    description: 'Email verification status',
    example: true
  })
  @Expose()
  email_verified: boolean;

  @ApiProperty({
    description: 'Last login timestamp',
    example: '2024-01-15T10:30:00.000Z',
    required: false
  })
  @Expose()
  last_login?: Date;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2024-01-10T08:00:00.000Z'
  })
  @Expose()
  created_at: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2024-01-15T10:30:00.000Z'
  })
  @Expose()
  updated_at: Date;

  @ApiProperty({
    description: 'User statistics',
    example: {
      total_bookings: 5,
      active_bookings: 1,
      support_tickets: 2
    },
    required: false
  })
  @Expose()
  @Transform(({ obj }) => ({
    total_bookings: obj.bookings?.length || 0,
    active_bookings: obj.bookings?.filter(b => 
      b.booking_status === 'confirmed' || b.booking_status === 'active'
    ).length || 0,
    support_tickets: obj.support_tickets?.length || 0
  }))
  stats?: any;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}