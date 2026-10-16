import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Support } from './entities/support.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { Role } from '../auth/enums/role.enum';
@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    @InjectRepository(Support)
    private supportRepository: Repository<Support>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

    private readonly mailService: MailService,
  ) {}
  private isTicketOverdue(ticket: Support): boolean {
    if (ticket.status !== 'open') return false;

    const overdueTime = new Date();
    switch (ticket.priority) {
      case 'high':
        overdueTime.setHours(overdueTime.getHours() - 24);
        break;
      case 'medium':
        overdueTime.setHours(overdueTime.getHours() - 48);
        break;
      default:
        overdueTime.setHours(overdueTime.getHours() - 72);
    }
    return ticket.createdAt < overdueTime;
  }

  private calculateResponseTime(ticket: Support): string | null {
    if (ticket.status !== 'open' && ticket.updatedAt) {
      const responseTime =
        ticket.updatedAt.getTime() - ticket.createdAt.getTime();
      const hours = Math.floor(responseTime / (1000 * 60 * 60));
      if (hours < 1) {
        const minutes = Math.floor(responseTime / (1000 * 60));
        return `${minutes}m`;
      }
      return `${hours}h`;
    }
    return null;
  }
  private autoDetectPriority(subject: string, message: string): string {
    const content = (subject + ' ' + message).toLowerCase();

    const urgentKeywords = [
      'urgent',
      'critical',
      'emergency',
      'broken',
      'not working',
      'down',
    ];
    const highKeywords = [
      'issue',
      'problem',
      'error',
      'failed',
      'not functioning',
    ];

    if (urgentKeywords.some((keyword) => content.includes(keyword)))
      return 'high';
    if (highKeywords.some((keyword) => content.includes(keyword)))
      return 'medium';
    return 'low';
  }

  private autoDetectCategory(subject: string, message: string): string {
    const content = (subject + ' ' + message).toLowerCase();

    if (
      content.includes('billing') ||
      content.includes('payment') ||
      content.includes('invoice')
    )
      return 'billing';
    if (
      content.includes('technical') ||
      content.includes('bug') ||
      content.includes('error')
    )
      return 'technical';
    if (
      content.includes('feature') ||
      content.includes('request') ||
      content.includes('suggestion')
    )
      return 'feature-request';
    if (
      content.includes('account') ||
      content.includes('login') ||
      content.includes('password')
    )
      return 'account';

    return 'general';
  }

  private async checkForDuplicateTickets(
    userId: number,
    subject: string,
  ): Promise<boolean> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const similarTickets = await this.supportRepository
      .createQueryBuilder('ticket')
      .where('ticket.userId = :userId', { userId })
      .andWhere('ticket.subject LIKE :subject', {
        subject: `%${subject.substring(0, 20)}%`,
      })
      .andWhere('ticket.createdAt > :date', { date: twentyFourHoursAgo })
      .getCount();

    return similarTickets > 0;
  }

  private async checkRateLimit(userId: number): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const recentTickets = await this.supportRepository.count({
      where: {
        user: { id: userId },
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (recentTickets >= 5) {
      throw new BadRequestException(
        'Too many support tickets created recently. Please wait before submitting another.',
      );
    }
  }

  private async autoAssignAgent(
    category: string,
    priority: string,
  ): Promise<string | undefined> {
    if (priority === 'high') return 'senior-support';
    if (category === 'technical') return 'tech-team';
    if (category === 'billing') return 'billing-team';
    return undefined;
  }

  private getEstimatedResponseTime(priority: string): string {
    const responseTimes = {
      high: '1-2 hours',
      medium: '4-6 hours',
      low: '24 hours',
    };
    return responseTimes[priority] || '24 hours';
  }

  private async notifySupportTeam(ticket: Support): Promise<void> {
    this.logger.log(
      `New support ticket #${ticket.id} created - Priority: ${ticket.priority}, Category: ${ticket.category}`,
    );
  }

  private logTicketCreationMetrics(ticket: Support): void {
    this.logger.log(
      `TicketCreated - ID: ${ticket.id}, Priority: ${ticket.priority}, Category: ${ticket.category}, User: ${ticket.user.id}`,
    );
  }

  private async getTicketConversation(ticketId: number): Promise<any[]> {
    this.logger.log(`Fetching conversation history for ticket: ${ticketId}`);
    return [];
  }

  private getPriorityLabel(priority: string): string {
    const priorityLabels = {
      high: 'Urgent',
      medium: 'Normal',
      low: 'Low Priority',
    };
    return priorityLabels[priority] || 'Normal';
  }

  async create(createSupportDto: CreateSupportDto): Promise<Support> {
    const { userId, subject, message, priority, category } = createSupportDto;

    //User Validation Logic
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Priority Detection Logic
    const detectedPriority =
      priority || this.autoDetectPriority(subject, message);
    const detectedCategory =
      category || this.autoDetectCategory(subject, message);

    // Duplicate Ticket
    const recentDuplicate = await this.checkForDuplicateTickets(
      userId,
      subject,
    );
    if (recentDuplicate) {
      this.logger.warn(
        `Possible duplicate ticket detected for user ${userId}: ${subject}`,
      );
    }

    //  Support Ticket Creation
    const supportTicket = this.supportRepository.create({
      user,
      subject: subject.trim(),
      message: message.trim(),
      status: 'open',
      priority: detectedPriority,
      category: detectedCategory,
      assignedTo: await this.autoAssignAgent(
        detectedCategory,
        detectedPriority,
      ),
    });

    const savedTicket = await this.supportRepository.save(supportTicket);

    // Rate Limiting Logic
    await this.checkRateLimit(userId);

    // Email Notification Logic
    try {
      await this.mailService.sendSupportTicketConfirmation(user.email, {
        name: user.firstName || user.full_name || 'Valued Customer',
        ticketId: savedTicket.id.toString(),
        subject: subject,
        message: message,
        priority: detectedPriority,
        category: detectedCategory,
        estimatedResponseTime: this.getEstimatedResponseTime(detectedPriority),
      } as any);
      this.logger.log(
        `Support ticket #${savedTicket.id} confirmation email sent to ${user.email}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send support ticket confirmation email: ${error.message}`,
      );
    }
    try {
      await this.notifySupportTeam(savedTicket);
    } catch (error) {
      this.logger.error(`Failed to notify support team: ${error.message}`);
    }
    this.logTicketCreationMetrics(savedTicket);

    return savedTicket;
  }

  //find all support tickets
  async findAll(
    currentUser?: User,
    filters?: {
      status?: string;
      priority?: string;
      category?: string;
      assignedTo?: string;
    },
  ): Promise<Support[]> {
    const whereConditions: any = {};

    if (
      currentUser &&
      currentUser.role !== Role.ADMIN &&
      currentUser.role !== Role.SUPPORT_AGENT
    ) {
      // users only see their own tickets
      whereConditions.user = { id: currentUser.id };
    }

    if (filters?.status) {
      whereConditions.status = filters.status;
    }

    if (filters?.priority) {
      whereConditions.priority = filters.priority;
    }

    if (filters?.category) {
      whereConditions.category = filters.category;
    }

    if (filters?.assignedTo) {
      whereConditions.assignedTo = filters.assignedTo;
    }

    // data selection
    const tickets = await this.supportRepository.find({
      where: whereConditions,
      relations: ['user'],
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        priority: true,
        category: true,
        assignedTo: true,
        createdAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    return tickets;
  }

  //find one support ticket by id
  async findOne(id: number, currentUser?: User): Promise<Support> {
    const whereConditions: any = { id };

    if (
      currentUser &&
      currentUser.role !== Role.ADMIN &&
      currentUser.role !== Role.SUPPORT_AGENT
    ) {
      // Regular users can only access their own tickets
      whereConditions.user = { id: currentUser.id };
    }

    // 2. Secure Data Selection
    const ticket = await this.supportRepository.findOne({
      where: whereConditions,
      relations: ['user'],
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        priority: true,
        category: true,
        assignedTo: true,
        createdAt: true,
        updatedAt: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    });

    if (!ticket) {
      if (currentUser) {
        this.logger.warn(
          `Ticket access denied or not found - ID: ${id}, User: ${currentUser.id}`,
        );
        throw new NotFoundException(
          `Support ticket with id ${id} not found or access denied`,
        );
      } else {
        throw new UnauthorizedException(
          'Authentication required to view support ticket',
        );
      }
    }

    const conversation = await this.getTicketConversation(id);

    return {
      ...ticket,
      conversation,
      metadata: {
        isOverdue: this.isTicketOverdue(ticket),
        responseTime: this.calculateResponseTime(ticket),
        priorityLabel: this.getPriorityLabel(ticket.priority),
      },
    };
  }

  // update support ticket
  async update(
    id: number,
    updateSupportDto: UpdateSupportDto,
  ): Promise<Support> {
    const ticket = await this.findOne(id);
    const previousStatus = ticket.status;

    // Check if status is changing
    const statusChanged =
      updateSupportDto.status && previousStatus !== updateSupportDto.status;

    Object.assign(ticket, updateSupportDto);
    const updatedTicket = await this.supportRepository.save(ticket);

    // If status changed, send email notification
    if (statusChanged) {
      try {
        await this.mailService.sendSupportTicketResponse(ticket.user.email, {
          name:
            ticket.user.firstName || ticket.user.full_name || 'Valued Customer',
          ticketId: ticket.id.toString(),
          subject: ticket.subject,
          response: `Your ticket status has been updated to: ${ticket.status}`,
          status: ticket.status,
        });
        this.logger.log(
          `Support ticket status update email sent to ${ticket.user.email}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send support ticket update email: ${error.message}`,
        );
      }
    }

    return updatedTicket;
  }

  async remove(id: number, currentUser?: User): Promise<{ message: string }> {
    const ticket = await this.findOne(id, currentUser);

    // only admins
    if (!currentUser || currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Only administrators can delete support tickets',
      );
    }

    if (ticket.status === 'open') {
      throw new BadRequestException('Please close the ticket before deletion');
    }

    // Soft delete
    await this.supportRepository.update(id, {
      deleted: true,
      deletedAt: new Date(),
      deletedBy: currentUser.id,
      deletionReason: 'Admin deletion',
    });

    this.logger.log(`Ticket soft-deleted - ID: ${id}, By: ${currentUser.id}`);

    return { message: `Support ticket #${id} has been archived` };
  }
}
