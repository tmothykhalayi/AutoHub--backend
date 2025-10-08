import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TicketCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCOUNT = 'account',
  BOOKING = 'booking',
  VEHICLE = 'vehicle',
  PAYMENT = 'payment',
  OTHER = 'other'
}

export enum ResponseType {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system'
}

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ticket_id: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM
  })
  priority: TicketPriority;

  @Column({
    type: 'enum',
    enum: TicketCategory,
    default: TicketCategory.GENERAL
  })
  category: TicketCategory;

  @ManyToOne(() => User, user => user.support_tickets)
  user: User;

  @Column()
  user_id: string;

  @Column('simple-array', { nullable: true })
  attachments: string[];

  @Column('text', { nullable: true })
  admin_notes: string;

  @Column({ nullable: true })
  assigned_to: string;

  @Column({ nullable: true })
  resolved_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('support_ticket_responses')
export class SupportTicketResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  response_id: string;

  @ManyToOne(() => SupportTicket, ticket => ticket.id)
  ticket: SupportTicket;

  @Column()
  ticket_id: string;

  @ManyToOne(() => User, user => user.id, { nullable: true })
  user: User;

  @Column({ nullable: true })
  user_id: string;

  @Column('text')
  message: string;

  @Column({
    type: 'enum',
    enum: ResponseType,
    default: ResponseType.USER
  })
  response_type: ResponseType;

  @Column({ default: false })
  is_internal: boolean;

  @Column('simple-array', { nullable: true })
  attachments: string[];

  @CreateDateColumn()
  created_at: Date;
}