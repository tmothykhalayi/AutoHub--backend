// src/modules/support/support.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportTicketResponse } from './entities/support-ticket.entity';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, SupportTicketResponse]),
    forwardRef(() => UsersModule),
    MailModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService, TypeOrmModule],
})
export class SupportModule {}