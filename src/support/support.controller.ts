
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support.dto';
import { UpdateSupportTicketDto } from './dto/update-support.dto';
import { CreateTicketResponseDto } from './dto/create-ticket-response.dto';
import { SupportTicketDto } from './dto/support-ticket.dto';
import { SupportTicketResponseDto } from './dto/support-ticket-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PaginationDto } from '../users/dto/pagination.dto';
import { SearchSupportTicketsDto } from './dto/search-support-tickets.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthenticatedRequest } from '../common/interfaces/request.interface';
@ApiTags('support')
@ApiBearerAuth()
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Support ticket created successfully',
    type: SupportTicketDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createTicket(
    @Body() createSupportTicketDto: CreateSupportTicketDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SupportTicketDto> {
    return this.supportService.createTicket(createSupportTicketDto, req.user.userId);
  }

  @Get('tickets')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all support tickets (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Support tickets retrieved successfully',
    type: [SupportTicketDto],
  })
  async findAllTickets(
    @Query() paginationDto?: PaginationDto,
  ): Promise<{ data: SupportTicketDto[]; pagination: any }> {
    return this.supportService.findAllTickets(paginationDto);
  }
  @Get('tickets/my-tickets')
  @ApiOperation({ summary: 'Get current user support tickets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User tickets retrieved successfully',
    type: [SupportTicketDto],
  })
  async getMyTickets(
    @Req() req: AuthenticatedRequest,
    @Query() paginationDto?: PaginationDto,
  ): Promise<{ data: SupportTicketDto[]; pagination: any }> {
    return this.supportService.findUserTickets(req.user.userId, paginationDto);
  }

  @Get('tickets/search')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Search support tickets (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tickets retrieved successfully',
    type: [SupportTicketDto],
  })
  async searchTickets(
    @Query() searchDto: SearchSupportTicketsDto,
  ): Promise<{ data: SupportTicketDto[]; pagination: any }> {
    return this.supportService.searchTickets(searchDto);
  }

  @Get('tickets/stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get support ticket statistics (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  async getTicketStats(): Promise<any> {
    return this.supportService.getTicketStats();
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get support ticket by ID' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket retrieved successfully',
    type: SupportTicketDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SupportTicketDto> {
    const ticket = await this.supportService.findOne(id);
    
    // Users can only access their own tickets unless they are admins
    if (req.user.role !== UserRole.ADMIN && ticket.user.user_id !== req.user.userId) {
      throw new ForbiddenException('You can only access your own support tickets');
    }
    
    return ticket;
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Update support ticket' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket updated successfully',
    type: SupportTicketDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async updateTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSupportTicketDto: UpdateSupportTicketDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SupportTicketDto> {
    return this.supportService.updateTicket(id, updateSupportTicketDto, req.user);
  }

  @Post('tickets/:id/responses')
  @ApiOperation({ summary: 'Add response to support ticket' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Response added successfully',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  async addResponse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createResponseDto: CreateTicketResponseDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SupportTicketResponseDto> {
    const ticket = await this.supportService.findOne(id);
    
    // Users can only respond to their own tickets unless they are admins
    if (req.user.role !== UserRole.ADMIN && ticket.user.user_id !== req.user.userId) {
      throw new ForbiddenException('You can only respond to your own support tickets');
    }
    
    return this.supportService.addResponse(id, createResponseDto, req.user.userId);
  }

  @Patch('tickets/:id/assign-to-me')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign ticket to current admin (Admin only)' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket assigned successfully',
    type: SupportTicketDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  async assignTicketToMe(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SupportTicketDto> {
    return this.supportService.assignTicketToMe(id, req.user.userId);
  }

  @Patch('tickets/:id/close')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Close support ticket (Admin only)' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ticket closed successfully',
    type: SupportTicketDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  async closeTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { resolution_notes?: string },
  ): Promise<SupportTicketDto> {
    return this.supportService.closeTicket(id, body?.resolution_notes);
  }

  @Delete('tickets/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete support ticket (Admin only)' })
  @ApiParam({ name: 'id', description: 'Ticket UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Ticket deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ticket not found',
  })
  async removeTicket(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.supportService.removeTicket(id);
  }

  @Get('dashboard/overview')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get support dashboard overview (Admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard data retrieved successfully',
  })
  async getDashboardOverview(): Promise<any> {
    return this.supportService.getDashboardOverview();
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get available ticket categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
  })
  async getCategories(): Promise<{ value: string; label: string }[]> {
    return [
      { value: 'booking', label: 'Booking Issues' },
      { value: 'payment', label: 'Payment Problems' },
      { value: 'vehicle', label: 'Vehicle Concerns' },
      { value: 'account', label: 'Account Issues' },
      { value: 'technical', label: 'Technical Problems' },
      { value: 'general', label: 'General Inquiry' },
      { value: 'complaint', label: 'Complaint' },
      { value: 'feedback', label: 'Feedback' },
    ];
  }

  @Get('priorities')
  @ApiOperation({ summary: 'Get available ticket priorities' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Priorities retrieved successfully',
  })
  async getPriorities(): Promise<{ value: string; label: string }[]> {
    return [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ];
  }
}