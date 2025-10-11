import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Support {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.supportTickets)
  user: User;

  @Column()
  subject: string;

  @Column('text')
  message: string;

  @Column({ default: 'open' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity()
export class Support {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.supportTickets)
  user: User;

  @Column()
  subject: string;

  @Column()
  message: string;

  @Column({ default: 'open' })
  status: string; // "open", "closed", etc.
}
