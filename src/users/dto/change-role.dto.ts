// src/modules/users/dto/change-role.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeRoleDto {
  @ApiProperty({
    description: 'New user role',
    enum: Role,
    example: Role.ADMIN
  })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}