
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Support } from './entities/support.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Support)
    private supportRepository: Repository<Support>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createSupportDto: CreateSupportDto): Promise<Support> {
    const { userId, subject, message } = createSupportDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const supportTicket = this.supportRepository.create({
      user,
      subject,
      message,
      status: 'open',
    });

    return this.supportRepository.save(supportTicket);
  }

  async findAll(): Promise<Support[]> {
    return this.supportRepository.find({ relations: ['user'] });
  }

  async findOne(id: number): Promise<Support> {
    const ticket = await this.supportRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!ticket) throw new NotFoundException(`Support ticket with id ${id} not found`);
    return ticket;
  }

  async update(id: number, updateSupportDto: UpdateSupportDto): Promise<Support> {
    const ticket = await this.findOne(id);
    Object.assign(ticket, updateSupportDto);
    return this.supportRepository.save(ticket);
  }

  async remove(id: number): Promise<void> {
    const ticket = await this.findOne(id);
    await this.supportRepository.remove(ticket);
  }
}
