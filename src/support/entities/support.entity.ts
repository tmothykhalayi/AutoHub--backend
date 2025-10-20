import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Support {
  @PrimaryGeneratedColumn()
  id: number;

  conversation?: any[];
  metadata?: {
    isOverdue?: boolean;
    responseTime?: string | null;
    priorityLabel?: string;
  };

  @ManyToOne(() => User)
  user: User;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @Column({ default: 'open' })
  status: string;

  @Column({ default: 'low' })
  priority: string;

  @Column({ default: 'general' })
  category: string;

  @Column({ nullable: true })
  assignedTo: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  deleted: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  deletedBy: number;

  @Column({ nullable: true })
  deletionReason: string;

  @UpdateDateColumn()
updatedAt: Date;

}