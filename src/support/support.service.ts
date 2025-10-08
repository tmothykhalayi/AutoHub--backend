// src/modules/support/support.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual, In, Not, IsNull } from 'typeorm';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory, SupportTicketResponse, ResponseType } from './entities/support-ticket.entity';
import { CreateSupportTicketDto} from './dto/create-support.dto';
import { UpdateSupportTicketDto } from './dto/update-support.dto';
import { CreateTicketResponseDto } from './dto/create-ticket-response.dto';
import { SupportTicketDto } from './dto/support-ticket.dto';
import { SupportTicketResponseDto } from './dto/support-ticket-response.dto';
import { SearchSupportTicketsDto } from './dto/search-support-tickets.dto';
import { PaginationDto } from '../users/dto/pagination.dto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SupportService {
  private ticketCounter = 1;

  constructor(
    @InjectRepository(SupportTicket)
    private supportTicketsRepository: Repository<SupportTicket>,
    @InjectRepository(SupportTicketResponse)
    private ticketResponsesRepository: Repository<SupportTicketResponse>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private emailService: MailService,
  ) {}

  private generateTicketNumber(): string {
    const year = new Date().getFullYear();
    const number = this.ticketCounter.toString().padStart(3, '0');
    this.ticketCounter++;
    return `TKT-${year}-${number}`;
  }

  private mapToTicketDto(ticket: SupportTicket): SupportTicketDto {
    const { user, assigned_to, responses, ...ticketData } = ticket;
    return new SupportTicketDto({
      ...ticketData,
      user: user ? this.usersService.mapToResponseDto(user) : undefined,
      assigned_to: assigned_to ? this.usersService.mapToResponseDto(assigned_to) : undefined,
      responses: responses ? responses.map(response => this.mapToResponseDto(response)) : [],
    });
  }

  private mapToResponseDto(response: SupportTicketResponse): SupportTicketResponseDto {
    const { user, ...responseData } = response;
    return new SupportTicketResponseDto({
      ...responseData,
      user: user ? this.usersService.mapToResponseDto(user) : undefined,
    });
  }

  async createTicket(createSupportTicketDto: CreateSupportTicketDto, userId: string): Promise<SupportTicketDto> {
    const queryRunner = this.supportTicketsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validate user exists and is active
      const user = await this.usersService.findOne(userId);
      if (!user.is_active) {
        throw new BadRequestException('User account is not active');
      }

      const ticket = queryRunner.manager.create(SupportTicket, {
        ...createSupportTicketDto,
        user_id: userId,
        ticket_number: this.generateTicketNumber(),
      });

      const savedTicket = await queryRunner.manager.save(ticket);
      await queryRunner.commitTransaction();

      // Send confirmation email to user
      // TODO: Implement proper email notification
      // await this.emailService.sendSupportTicketConfirmation(user.email, savedTicket);

      // Notify admins about new ticket
      // TODO: Implement admin notification
      // await this.notifyAdminsAboutNewTicket(savedTicket);

      return this.mapToTicketDto(savedTicket);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create support ticket');
    } finally {
      await queryRunner.release();
    }
  }

  async findAllTickets(paginationDto?: PaginationDto): Promise<{
    data: SupportTicketDto[];
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      const [tickets, total] = await this.supportTicketsRepository.findAndCount({
        relations: ['user', 'assigned_to', 'responses', 'responses.user'],
        skip,
        take: limit,
        order: { created_at: 'DESC' },
      });

      return {
        data: tickets.map(ticket => this.mapToTicketDto(ticket)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch support tickets');
    }
  }

  async findUserTickets(userId: string, paginationDto?: PaginationDto): Promise<{
    data: SupportTicketDto[];
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      const [tickets, total] = await this.supportTicketsRepository.findAndCount({
        where: { user_id: userId },
        relations: ['user', 'assigned_to', 'responses', 'responses.user'],
        skip,
        take: limit,
        order: { created_at: 'DESC' },
      });

      return {
        data: tickets.map(ticket => this.mapToTicketDto(ticket)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user tickets');
    }
  }

  async findOne(ticketId: string): Promise<SupportTicketDto> {
    try {
      const ticket = await this.supportTicketsRepository.findOne({
        where: { ticket_id: ticketId },
        relations: ['user', 'assigned_to', 'responses', 'responses.user'],
      });

      if (!ticket) {
        throw new NotFoundException(`Support ticket with ID ${ticketId} not found`);
      }

      return this.mapToTicketDto(ticket);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch support ticket');
    }
  }

  async updateTicket(ticketId: string, updateSupportTicketDto: UpdateSupportTicketDto, currentUser?: any): Promise<SupportTicketDto> {
    const queryRunner = this.supportTicketsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ticket = await queryRunner.manager.findOne(SupportTicket, {
        where: { ticket_id: ticketId },
        relations: ['user'],
      });

      if (!ticket) {
        throw new NotFoundException(`Support ticket with ID ${ticketId} not found`);
      }

      // Check permissions - only admins or ticket owners can update
      if (currentUser && currentUser.role !== 'admin' && ticket.user_id !== currentUser.userId) {
        throw new ForbiddenException('You can only update your own tickets');
      }

      // If status is being changed to resolved/closed, set resolved_at
      if (updateSupportTicketDto.status && 
          [TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(updateSupportTicketDto.status) &&
          ticket.status !== updateSupportTicketDto.status) {
        updateSupportTicketDto['resolved_at'] = new Date();
      }

      Object.assign(ticket, updateSupportTicketDto);
      const updatedTicket = await queryRunner.manager.save(ticket);
      await queryRunner.commitTransaction();

      // Notify user about ticket update
      if (ticket.user) {
        // TODO: Implement sendTicketUpdate email notification
        // await this.emailService.sendTicketUpdate(ticket.user.email, updatedTicket);
      }

      return this.mapToTicketDto(updatedTicket);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update support ticket');
    } finally {
      await queryRunner.release();
    }
  }

  async addResponse(ticketId: string, createResponseDto: CreateTicketResponseDto, userId: string): Promise<SupportTicketResponseDto> {
    const queryRunner = this.supportTicketsRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ticket = await queryRunner.manager.findOne(SupportTicket, {
        where: { ticket_id: ticketId },
        relations: ['user', 'responses'],
      });

      if (!ticket) {
        throw new NotFoundException(`Support ticket with ID ${ticketId} not found`);
      }

      const user = await this.usersService.findByUserId(userId);
      const isAdmin = user.role === 'admin';

      // Update ticket status if admin is responding
      if (isAdmin && ticket.status === TicketStatus.OPEN) {
        ticket.status = TicketStatus.IN_PROGRESS;
        await queryRunner.manager.save(ticket);
      }

      const response = queryRunner.manager.create(SupportTicketResponse, {
        ...createResponseDto,
        ticket_id: ticketId,
        user_id: userId,
        response_type: isAdmin ? ResponseType.ADMIN : ResponseType.USER,
      });

      const savedResponse = await queryRunner.manager.save(response);
      await queryRunner.commitTransaction();

      // Notify the other party about new response
      if (isAdmin) {
        // Admin responded, notify user
        await this.emailService.sendTicketResponse(ticket.user.email, ticket, savedResponse);
      } else {
        // User responded, notify assigned admin or all admins
        await this.notifyAdminsAboutResponse(ticket, savedResponse);
      }

      return this.mapToResponseDto(savedResponse);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add ticket response');
    } finally {
      await queryRunner.release();
    }
  }

  async searchTickets(searchDto: SearchSupportTicketsDto): Promise<{
    data: SupportTicketDto[];
    pagination: any;
  }> {
    try {
      const {
        query,
        status,
        priority,
        category,
        user_id,
        assigned_to,
        related_booking_id,
        created_after,
        created_before,
        overdue,
        unassigned,
        page = 1,
        limit = 10,
      } = searchDto;
      
      const skip = (page - 1) * limit;

      const where: any = {};

      if (query) {
        where.subject = Like(`%${query}%`);
      }

      if (status) {
        where.status = status;
      }

      if (priority) {
        where.priority = priority;
      }

      if (category) {
        where.category = category;
      }

      if (user_id) {
        where.user_id = user_id;
      }

      if (assigned_to) {
        where.assigned_to = assigned_to;
      }

      if (related_booking_id) {
        where.related_booking_id = related_booking_id;
      }

      if (created_after || created_before) {
        where.created_at = Between(
          created_after ? new Date(created_after) : new Date(0),
          created_before ? new Date(created_before) : new Date()
        );
      }

      if (overdue) {
        where.due_date = LessThanOrEqual(new Date());
        where.status = Not(In([TicketStatus.RESOLVED, TicketStatus.CLOSED]));
      }

      if (unassigned) {
        where.assigned_to = IsNull();
      }

      const [tickets, total] = await this.supportTicketsRepository.findAndCount({
        where,
        relations: ['user', 'assigned_to', 'responses', 'responses.user'],
        skip,
        take: limit,
        order: { created_at: 'DESC' },
      });

      return {
        data: tickets.map(ticket => this.mapToTicketDto(ticket)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to search support tickets');
    }
  }

  async getTicketStats(): Promise<any> {
    try {
      const stats = await this.supportTicketsRepository
        .createQueryBuilder('ticket')
        .select('ticket.status', 'status')
        .addSelect('COUNT(ticket.ticket_id)', 'count')
        .groupBy('ticket.status')
        .getRawMany();

      const priorityStats = await this.supportTicketsRepository
        .createQueryBuilder('ticket')
        .select('ticket.priority', 'priority')
        .addSelect('COUNT(ticket.ticket_id)', 'count')
        .groupBy('ticket.priority')
        .getRawMany();

      const categoryStats = await this.supportTicketsRepository
        .createQueryBuilder('ticket')
        .select('ticket.category', 'category')
        .addSelect('COUNT(ticket.ticket_id)', 'count')
        .groupBy('ticket.category')
        .getRawMany();

      const totalTickets = await this.supportTicketsRepository.count();
      const openTickets = await this.supportTicketsRepository.count({
        where: { status: TicketStatus.OPEN },
      });
      const overdueTickets = await this.supportTicketsRepository.count({
        where: {
          due_date: LessThanOrEqual(new Date()),
          status: Not(In([TicketStatus.RESOLVED, TicketStatus.CLOSED])),
        },
      });

      return {
        total_tickets: totalTickets,
        open_tickets: openTickets,
        overdue_tickets: overdueTickets,
        by_status: stats.reduce((acc, stat) => {
          acc[stat.status] = parseInt(stat.count);
          return acc;
        }, {}),
        by_priority: priorityStats.reduce((acc, stat) => {
          acc[stat.priority] = parseInt(stat.count);
          return acc;
        }, {}),
        by_category: categoryStats.reduce((acc, stat) => {
          acc[stat.category] = parseInt(stat.count);
          return acc;
        }, {}),
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to get ticket statistics');
    }
  }

  async assignTicketToMe(ticketId: string, adminId: string): Promise<SupportTicketDto> {
    try {
      const ticket = await this.supportTicketsRepository.findOne({
        where: { ticket_id: ticketId },
      });

      if (!ticket) {
        throw new NotFoundException(`Support ticket with ID ${ticketId} not found`);
      }

      ticket.assigned_to = adminId;
      ticket.status = TicketStatus.IN_PROGRESS;
      
      const updatedTicket = await this.supportTicketsRepository.save(ticket);
      return this.mapToTicketDto(updatedTicket);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to assign ticket');
    }
  }

  async closeTicket(ticketId: string, resolutionNotes?: string): Promise<SupportTicketDto> {
    try {
      const ticket = await this.supportTicketsRepository.findOne({
        where: { ticket_id: ticketId },
      });

      if (!ticket) {
        throw new NotFoundException(`Support ticket with ID ${ticketId} not found`);
      }

      ticket.status = TicketStatus.CLOSED;
      ticket.resolved_at = new Date();
      if (resolutionNotes) {
        ticket.admin_notes = resolutionNotes;
      }

      const updatedTicket = await this.supportTicketsRepository.save(ticket);
      return this.mapToTicketDto(updatedTicket);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to close support ticket');
    }
  }
}