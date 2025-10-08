// src/modules/users/users.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  ForbiddenException,
  Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, Not, IsNull, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { Role } from '../auth/enums/role.enum';
import { PaginationDto } from './dto/pagination.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  public mapToResponseDto(user: User): UserResponseDto {
    const { bookings, support_tickets, ...userData } = user;
    return new UserResponseDto(userData);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(createUserDto.password);

      const user = this.usersRepository.create({
        ...createUserDto,
        password: hashedPassword
      });

      const savedUser = await this.usersRepository.save(user);
      return this.mapToResponseDto(savedUser);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }
  
  async createUserWithRole(userData: {
    email: string;
    full_name: string;
    contact_phone?: string;
    password: string;
    role: Role;
    email_verified: boolean;
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.usersRepository.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      const user = this.usersRepository.create({
        email: userData.email,
        full_name: userData.full_name,
        contact_phone: userData.contact_phone,
        password: hashedPassword,
        role: userData.role,
        email_verified: userData.email_verified
      });

      return await this.usersRepository.save(user);
    } catch (error) {
      this.logger.error(`Failed to create user with role: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create user with role');
    }
  }

  async findAll(paginationDto?: PaginationDto): Promise<{
    data: UserResponseDto[];
    pagination: any;
  }> {
    try {
      const { page = 1, limit = 10 } = paginationDto || {};
      const skip = (page - 1) * limit;

      const [users, total] = await this.usersRepository.findAndCount({
        relations: ['authentication', 'bookings', 'support_tickets'],
        skip,
        take: limit,
        order: { created_at: 'DESC' }
      });

      return {
        data: users.map(user => this.mapToResponseDto(user)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch users');
    }
  }

  async findOne(id: string): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: id },
        relations: ['bookings', 'support_tickets'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return this.mapToResponseDto(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async findByEmail(email: string): Promise<User> {
    try {
      const user = await this.usersRepository.findOne({
        where: { email },
        relations: ['authentication'],
      });

      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch user by email');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser?: User): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: id },
        relations: [],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Check if user is updating themselves or is admin
      if (currentUser && currentUser.id !== id && currentUser.role !== Role.ADMIN) {
        throw new ForbiddenException('You can only update your own profile');
      }

      // Check if email is being changed to an existing one
      if (updateUserDto.email && updateUserDto.email !== user.email) {
        const existingUser = await this.usersRepository.findOne({
          where: { email: updateUserDto.email }
        });

        if (existingUser) {
          throw new ConflictException('Email already exists');
        }
      }

      Object.assign(user, updateUserDto);
      const updatedUser = await this.usersRepository.save(user);
      
      return this.mapToResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof ConflictException ||
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: id },
        relations: ['bookings'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      // Check if user has active bookings
      const activeBookings = user.bookings?.filter(
        booking => booking.booking_status === 'confirmed' || booking.booking_status === 'active'
      );

      if (activeBookings && activeBookings.length > 0) {
        throw new BadRequestException('Cannot delete user with active bookings');
      }

      const result = await this.usersRepository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.usersRepository.update(userId, {
        last_login: new Date()
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update last login');
    }
  }

  async deactivateUser(userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      user.is_active = false;
      const updatedUser = await this.usersRepository.save(user);
      
      return this.mapToResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to deactivate user');
    }
  }

  async activateUser(userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      user.is_active = true;
      const updatedUser = await this.usersRepository.save(user);
      
      return this.mapToResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to activate user');
    }
  }

  async verifyEmail(userId: string): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      user.email_verified = true;
      const updatedUser = await this.usersRepository.save(user);
      
      return this.mapToResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to verify email');
    }
  }

  async searchUsers(searchDto: SearchUsersDto): Promise<{
    data: UserResponseDto[];
    pagination: any;
  }> {
    try {
      const { q, role, is_active, email_verified, created_after, created_before } = searchDto;
      // Since SearchUsersDto extends BasePaginationDto which has page and limit
      const page = (searchDto as any).page || 1;
      const limit = (searchDto as any).limit || 10;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (q) {
        where.full_name = Like(`%${q}%`);
        where.email = Like(`%${q}%`);
      }

      if (role) {
        where.role = role;
      }

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      if (email_verified !== undefined) {
        where.email_verified = email_verified;
      }

      if (created_after || created_before) {
        where.created_at = Between(
          created_after ? new Date(created_after) : new Date(0),
          created_before ? new Date(created_before) : new Date()
        );
      }

      const [users, total] = await this.usersRepository.findAndCount({
        where,
        relations: ['authentication', 'bookings', 'support_tickets'],
        skip,
        take: limit,
        order: { created_at: 'DESC' }
      });

      return {
        data: users.map(user => this.mapToResponseDto(user)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to search users');
    }
  }

  async getUserStats(userId: string): Promise<any> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId },
        relations: ['bookings', 'support_tickets'],
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      const bookings = user.bookings || [];
      const supportTickets = user.support_tickets || [];

      const totalBookings = bookings.length;
      const activeBookings = bookings.filter(b => 
        b.booking_status === 'confirmed' || b.booking_status === 'active'
      ).length;
      const completedBookings = bookings.filter(b => 
        b.booking_status === 'completed'
      ).length;
      const cancelledBookings = bookings.filter(b => 
        b.booking_status === 'cancelled'
      ).length;

      const totalSpent = bookings
        .filter(b => b.booking_status === 'completed')
        .reduce((sum, booking) => sum + parseFloat(booking.total_amount.toString()), 0);

      // Calculate average booking duration
      const completedBookingDurations = bookings
        .filter(b => b.booking_status === 'completed')
        .map(b => {
          const duration = new Date(b.return_date).getTime() - new Date(b.booking_date).getTime();
          return duration / (1000 * 60 * 60 * 24); // Convert to days
        });

      const avgBookingDuration = completedBookingDurations.length > 0 
        ? (completedBookingDurations.reduce((a, b) => a + b, 0) / completedBookingDurations.length).toFixed(1)
        : '0';

      return {
        id: userId,
        stats: {
          total_bookings: totalBookings,
          active_bookings: activeBookings,
          completed_bookings: completedBookings,
          cancelled_bookings: cancelledBookings,
          total_spent: totalSpent,
          support_tickets: supportTickets.length,
          avg_booking_duration: `${avgBookingDuration} days`
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get user statistics');
    }
  }

  async changeUserRole(userId: string, role: Role): Promise<UserResponseDto> {
    try {
      const user = await this.usersRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }

      user.role = role;
      const updatedUser = await this.usersRepository.save(user);
      
      return this.mapToResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to change user role');
    }
  }

  async bulkUpdateUsers(userIds: string[], updateData: Partial<UpdateUserDto>): Promise<{
    success: string[];
    failed: { id: string; reason: string }[];
  }> {
    const results = {
      success: [] as string[],
      failed: [] as { id: string; reason: string }[]
    };

    for (const userId of userIds) {
      try {
        const user = await this.usersRepository.findOne({
          where: { id: userId }
        });

        if (!user) {
          results.failed.push({ id: userId, reason: 'User not found' });
          continue;
        }

        Object.assign(user, updateData);
        await this.usersRepository.save(user);
        results.success.push(userId);
      } catch (error) {
        results.failed.push({ id: userId, reason: error.message });
      }
    }

    return results;
  }
}