import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateBookingDto } from './create-booking.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
  @ApiPropertyOptional({ description: 'Reason for cancellation if cancelling the booking', example: 'Change of plans' })
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
