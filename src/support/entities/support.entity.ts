import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('support_tickets')
export class Support {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.support_tickets, { eager: true })
  user: User;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @Column({ default: 'open' })
  status: 'open' | 'pending' | 'closed';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
