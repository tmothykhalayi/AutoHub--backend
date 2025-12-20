import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan } from 'typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    currentUser?: User,
    ipAddress?: string,
  ): Promise<User> {
    // Validate email format
    this.validateEmailFormat(createUserDto.email);

    // Check for existing user by email
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    this.validatePasswordStrength(createUserDto.password);
    if (
      createUserDto.role &&
      ![Role.CUSTOMER, Role.ADMIN].includes(createUserDto.role as Role)
    ) {
      throw new BadRequestException(
        'Invalid role. Allowed roles: customer, admin',
      );
    }

    // Set default role to 'customer'
    const userRole = createUserDto.role || Role.CUSTOMER;
    if (currentUser && currentUser.role !== Role.ADMIN) {
      throw new BadRequestException('Only administrators can create users');
    }
    if (userRole === Role.ADMIN) {
      if (!currentUser || currentUser.role !== Role.ADMIN) {
        throw new BadRequestException(
          'Only administrators can create admin users',
        );
      }
    }

    if (ipAddress) {
      await this.checkRegistrationLimit(ipAddress);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phone: createUserDto.phone,
      password: hashedPassword,
      role: userRole as Role,
      registrationIp: ipAddress,
      emailVerified: false,
    });

    return this.usersRepository.save(user);
  }

  private validateEmailFormat(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }
  }

  private async checkRegistrationLimit(ipAddress: string): Promise<void> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const registrationsCount = await this.usersRepository.count({
      where: {
        registrationIp: ipAddress,
        createdAt: MoreThan(oneHourAgo),
      },
    });

    if (registrationsCount >= 5) {
      throw new BadRequestException(
        'Too many registration attempts from this IP address. Please try again in an hour.',
      );
    }
  }

  async findAll(currentUser?: User): Promise<User[]> {
    if (currentUser && currentUser.role !== Role.ADMIN) {
      return this.usersRepository.find({
        select: ['id', 'firstName', 'lastName', 'role'],
        order: { createdAt: 'DESC' },
      });
    }

    return this.usersRepository.find({
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'phone',
        'role',
        'createdAt',
        'updatedAt',
        'emailVerified',
      ],
      order: { createdAt: 'DESC' },
    });
  }
  async findById(id: number, currentUser?: User): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    if (currentUser && currentUser.role !== Role.ADMIN) {
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      } as User;
    }

    // Admins get full access
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async findByEmail(
    email: string,
    currentUser?: User,
  ): Promise<Partial<User> | null> {
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      return null;
    }

    // Non-admin users can only limited info
    if (currentUser && currentUser.role !== Role.ADMIN) {
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      };
    }

    // Admins get full access (without password)
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  // Update user with email
  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    currentUser?: User,
  ): Promise<User> {
    const user = await this.findById(id);

    if (currentUser) {
      // Non-admin users can only update their own profile
      if (currentUser.role !== Role.ADMIN && currentUser.id !== id) {
        throw new BadRequestException('You can only update your own profile');
      }

      // Prevent non-admin users from updating roles
      if (updateUserDto.role && currentUser.role !== Role.ADMIN) {
        throw new BadRequestException(
          'Only administrators can update user roles',
        );
      }

      // Prevent non-admin users from updating sensitive fields
      if (currentUser.role !== Role.ADMIN) {
        const restrictedFields = ['emailVerified', 'registrationIp'];
        const hasRestrictedFields = Object.keys(updateUserDto).some((field) =>
          restrictedFields.includes(field),
        );

        if (hasRestrictedFields) {
          throw new BadRequestException(
            'You are not allowed to update restricted fields',
          );
        }
      }
      if (
        user.role === Role.ADMIN &&
        currentUser.id !== id &&
        currentUser.role !== Role.ADMIN
      ) {
        throw new BadRequestException(
          'Only administrators can update admin users',
        );
      }
    }
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (emailExists) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Password hashing
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Role validation
    if (
      updateUserDto.role &&
      ![Role.CUSTOMER, Role.ADMIN].includes(updateUserDto.role as Role)
    ) {
      throw new BadRequestException(
        'Invalid role. Allowed roles: customer, admin',
      );
    }

    // Prevent role escalation restrictions
    if (
      updateUserDto.role === Role.ADMIN &&
      currentUser &&
      currentUser.role !== Role.ADMIN
    ) {
      throw new BadRequestException(
        'Only administrators can assign admin role',
      );
    }

    // Create a safe copy of the DTO with proper type casting
    const updateData: Partial<User> = {
      ...updateUserDto,
      role: undefined,
    };

    if (updateUserDto.role) {
      updateData.role = updateUserDto.role as Role;
    }

    await this.usersRepository.update(id, updateData);

    // Return updated user (with role-based data filtering)
    return this.findById(id, currentUser);
  }
  // Delete user with protections
  async remove(
    id: number,
    currentUserId?: number,
  ): Promise<{ message: string }> {
    if (currentUserId && id === currentUserId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.findById(id);

    // Protect admin users deletion
    if (user.role === Role.ADMIN) {
      throw new BadRequestException('Admin users cannot be deleted');
    }
    // Get current user to check if they are admin
    if (currentUserId) {
      const currentUser = await this.findById(currentUserId);
      if (currentUser.role !== Role.ADMIN) {
        throw new BadRequestException('Only administrators can delete users');
      }
    }

    await this.usersRepository.remove(user);

    return { message: `User ${user.email} has been successfully deleted` };
  }

  // Password validation
  async validateUserPassword(
    email: string,
    plainPassword: string,
  ): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user || !user.password) return null;

    const passwordMatches = await bcrypt.compare(plainPassword, user.password);
    if (!passwordMatches) return null;

    return user;
  }

  async createUserWithRole(userData: {
    email: string;
    full_name: string;
    contact_phone?: string;
    password: string;
    role: Role;
    email_verified: boolean;
  }): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email: userData.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    // Split full_name into firstName and lastName
    const nameParts = userData.full_name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user object
    const user = this.usersRepository.create({
      email: userData.email,
      firstName,
      lastName,
      phone: userData.contact_phone,
      password: hashedPassword,
      role: userData.role,
    });

    return this.usersRepository.save(user);
  }
}
