// create-support.dto.ts
import { IsNotEmpty, IsString, MaxLength, IsOptional, IsEnum, IsNumber, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupportDto {
  @ApiProperty({ description: 'ID of the user creating the support ticket', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({ description: 'Support message content', example: 'I am having trouble booking a vehicle for the weekend.' })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  message: string;

  @ApiPropertyOptional({ description: 'Priority level of the support ticket', enum: ['low', 'medium', 'high'], example: 'medium' })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @ApiPropertyOptional({ description: 'Category of the support ticket', enum: ['general', 'technical', 'billing', 'account', 'feature-request'], example: 'technical' })
  @IsOptional()
  @IsEnum(['general', 'technical', 'billing', 'account', 'feature-request'])
  category?: string;
  
  @ApiProperty({ description: 'Subject of the support ticket', example: 'Issue with booking confirmation' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiPropertyOptional({ description: 'Status of the support ticket', example: 'open', enum: ['open', 'pending', 'resolved', 'closed'] })
  @IsString()
  status?: string;
}
