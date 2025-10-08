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
  Logger,
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
  private readonly logger = new Logger(SupportService.name);
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

  private async mapToTicketDto(ticket: SupportTicket): Promise<SupportTicketDto> {
    const { user, assigned_to, responses, ...ticketData } = ticket;
    
    // Handle assigned_to as a string ID and fetch the user if needed
    let assignedToUser;
    if (assigned_to) {
      try {
        // Try to get the assigned admin user
        assignedToUser = await this.usersService.findOne(assigned_to);
      } catch (error) {
        this.logger.warn(`Could not find assigned admin with ID: ${assigned_to}`);
        assignedToUser = undefined;
      }
    }

    return new SupportTicketDto({
      ...ticketData,
      user: user ? this.usersService.mapToResponseDto(user) : undefined,
      assigned_to: assignedToUser ? this.usersService.mapToResponseDto(assignedToUser) : undefined,
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

      return await this.mapToTicketDto(savedTicket);
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

      // Process tickets asynchronously with Promise.all
      const ticketDtos = await Promise.all(tickets.map(ticket => this.mapToTicketDto(ticket)));

      return {
        data: ticketDtos,
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

      // Process tickets asynchronously with Promise.all
      const ticketDtos = await Promise.all(tickets.map(ticket => this.mapToTicketDto(ticket)));

      return {
        data: ticketDtos,
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

      return await this.mapToTicketDto(ticket);
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

      return await this.mapToTicketDto(updatedTicket);
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

      // Fix response create method
      let attachmentsArray: string[] | undefined;
      if (createResponseDto.attachments) {
        attachmentsArray = typeof createResponseDto.attachments === 'string'
          ? [createResponseDto.attachments]
          : createResponseDto.attachments;
      }

      const response = queryRunner.manager.create(SupportTicketResponse, {
        message: createResponseDto.message,
        is_internal: createResponseDto.is_internal,
        attachments: attachmentsArray,
        response_type: isAdmin ? ResponseType.ADMIN : ResponseType.USER,
        ticket: ticket,
        user: user,
        response_id: `RESP-${Date.now()}`, // Generate a response ID
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

      // Process tickets asynchronously with Promise.all
      const ticketDtos = await Promise.all(tickets.map(ticket => this.mapToTicketDto(ticket)));

      return {
        data: ticketDtos,
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
      return await this.mapToTicketDto(updatedTicket);
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
      return await this.mapToTicketDto(updatedTicket);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to close support ticket');
    }
  }
  
  /**
   * Delete a support ticket (Admin only)
   * @param ticketId Ticket ID
   */
  async removeTicket(ticketId: string): Promise<void> {
    try {
      const ticket = await this.supportTicketsRepository.findOne({
        where: { ticket_id: ticketId },
        relations: ['responses'],
      });

      if (!ticket) {
        throw new NotFoundException(`Support ticket with ID ${ticketId} not found`);
      }

      // Delete ticket responses first
      if (ticket.responses && ticket.responses.length > 0) {
        await this.ticketResponsesRepository.remove(ticket.responses);
      }

      // Delete the ticket
      await this.supportTicketsRepository.remove(ticket);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete support ticket');
    }
  }

  /**
   * Get dashboard overview data
   * @returns Dashboard overview data
   */
  async getDashboardOverview(): Promise<any> {
    try {
      // Get ticket statistics
      const stats = await this.getTicketStats();

      // Get recent tickets
      const recentTickets = await this.supportTicketsRepository.find({
        relations: ['user'],
        order: { created_at: 'DESC' },
        take: 5,
      });

      // Get open high priority tickets
      const highPriorityTickets = await this.supportTicketsRepository.find({
        where: {
          priority: In([TicketPriority.HIGH, TicketPriority.URGENT]),
          status: Not(In([TicketStatus.RESOLVED, TicketStatus.CLOSED])),
        },
        relations: ['user'],
        order: { created_at: 'DESC' },
        take: 5,
      });

      // Calculate average resolution time
      const resolvedTickets = await this.supportTicketsRepository.find({
        where: {
          status: In([TicketStatus.RESOLVED, TicketStatus.CLOSED]),
          resolved_at: Not(IsNull()),
        },
      });

      let avgResolutionTime = 0;
      if (resolvedTickets.length > 0) {
        const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
          const createdAt = new Date(ticket.created_at).getTime();
          const resolvedAt = new Date(ticket.resolved_at).getTime();
          return sum + (resolvedAt - createdAt);
        }, 0);
        
        // Average time in hours
        avgResolutionTime = totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60);
      }

      return {
        stats,
        recent_tickets: recentTickets.map(ticket => this.mapToTicketDto(ticket)),
        high_priority_tickets: highPriorityTickets.map(ticket => this.mapToTicketDto(ticket)),
        avg_resolution_time: `${avgResolutionTime.toFixed(2)} hours`,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to get dashboard overview');
    }
  }

  /**
   * Notify administrators about a new ticket response
   * @param ticket The support ticket
   * @param response The ticket response
   */
  async notifyAdminsAboutResponse(ticket: SupportTicket, response: SupportTicketResponse): Promise<void> {
    try {
      // If ticket is assigned to an admin, notify only that admin
      if (ticket.assigned_to) {
        const admin = await this.usersService.findOne(ticket.assigned_to);
        if (admin) {
          // TODO: Implement email notification to the assigned admin
          // await this.emailService.sendAdminResponseNotification(admin.email, ticket, response);
        }
      } else {
        // Notify all admins
        // TODO: Implement notifying all admins (e.g., through a notification system)
        // const admins = await this.usersService.findAllByRole(Role.ADMIN);
        // admins.forEach(async (admin) => {
        //   await this.emailService.sendAdminResponseNotification(admin.email, ticket, response);
        // });
      }
    } catch (error) {
      this.logger.error(`Failed to notify admins about response: ${error.message}`, error.stack);
    }
  }
}