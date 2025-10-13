
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Support } from './entities/support.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);
  
  constructor(
    @InjectRepository(Support)
    private supportRepository: Repository<Support>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
    
    private readonly mailService: MailService
  ) {}

  async create(createSupportDto: CreateSupportDto): Promise<Support> {
    const { userId, subject, message } = createSupportDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const supportTicket = this.supportRepository.create({
      user,
      subject,
      message,
      status: 'open',
    });

    const savedTicket = await this.supportRepository.save(supportTicket);
    
    // Send support ticket confirmation email
    try {
      await this.mailService.sendSupportTicketConfirmation(user.email, {
        name: user.firstName || user.full_name || 'Valued Customer',
        ticketId: savedTicket.id.toString(),
        subject: subject,
        message: message,
        priority: 'Normal'
      });
      this.logger.log(`Support ticket confirmation email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send support ticket confirmation email: ${error.message}`);
    }

    return savedTicket;
  }

  async findAll(): Promise<Support[]> {
    return this.supportRepository.find({ relations: ['user'] });
  }

  async findOne(id: number): Promise<Support> {
    const ticket = await this.supportRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!ticket) throw new NotFoundException(`Support ticket with id ${id} not found`);
    return ticket;
  }

  async update(id: number, updateSupportDto: UpdateSupportDto): Promise<Support> {
    const ticket = await this.findOne(id);
    const previousStatus = ticket.status;
    
    // Check if status is changing
    const statusChanged = updateSupportDto.status && previousStatus !== updateSupportDto.status;
      
    Object.assign(ticket, updateSupportDto);
    const updatedTicket = await this.supportRepository.save(ticket);
    
    // If status changed, send email notification
    if (statusChanged) {
      try {
        await this.mailService.sendSupportTicketResponse(ticket.user.email, {
          name: ticket.user.firstName || ticket.user.full_name || 'Valued Customer',
          ticketId: ticket.id.toString(),
          subject: ticket.subject,
          response: `Your ticket status has been updated to: ${ticket.status}`,
          status: ticket.status
        });
        this.logger.log(`Support ticket status update email sent to ${ticket.user.email}`);
      } catch (error) {
        this.logger.error(`Failed to send support ticket update email: ${error.message}`);
      }
    }
    
    return updatedTicket;
  }

  async remove(id: number): Promise<void> {
    const ticket = await this.findOne(id);
    await this.supportRepository.remove(ticket);
  }
}
