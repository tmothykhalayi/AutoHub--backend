import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Support {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.supportTickets)
  user: User;



  @Column({ default: 'open' })
  status: string; // "open", "closed", etc.

  @Column()
  subject: string;

  @Column('text')
  message: string;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}