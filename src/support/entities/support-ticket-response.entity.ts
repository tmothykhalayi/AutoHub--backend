// src/modules/support/entities/support-ticket-response.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { User } from '../../users/entities/user.entity';

export enum ResponseType {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

@Entity('support_ticket_responses')
export class SupportTicketResponse {
  @PrimaryGeneratedColumn('uuid')
  response_id: string;

  @Column({ type: 'uuid' })
  ticket_id: string;

  @Column({ type: 'uuid' })
  user_id: string; // User who created the response

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: ResponseType,
    default: ResponseType.USER,
  })
  response_type: ResponseType;

  @Column({ type: 'boolean', default: false })
  is_internal: boolean; // Internal note not visible to user

  @Column({ type: 'text', nullable: true })
  attachments: string; // JSON array of attachment URLs

  @CreateDateColumn()
  created_at: Date;

  // Relationships
  @ManyToOne(() => SupportTicket, (ticket) => ticket.responses)
  @JoinColumn({ name: 'ticket_id' })
  ticket: SupportTicket;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}