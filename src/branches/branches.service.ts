
import { Injectable, NotFoundException, Logger, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from './entities/branch.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BranchService {
  private readonly logger = new Logger(BranchService.name);

  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async create(createBranchDto: CreateBranchDto, currentUser?: User): Promise<Branch> {
    //  Only admins can create branches
    if (currentUser && currentUser.role !== 'admin') {
      throw new BadRequestException('Only administrators can create branches');
    }

    //  branch validation in the db
    const existingBranchByName = await this.branchRepository.findOne({
      where: { name: createBranchDto.name }
    });
    if (existingBranchByName) {
      throw new ConflictException(`Branch with name "${createBranchDto.name}" already exists`);
    }

    // Unique Branch Code Validation
    if (createBranchDto.branchCode) {
      const existingBranchByCode = await this.branchRepository.findOne({
        where: { branchCode: createBranchDto.branchCode }
      });
      if (existingBranchByCode) {
        throw new ConflictException(`Branch with code "${createBranchDto.branchCode}" already exists`);
      }
    }

    //  generate code automatically if not provided
    if (!createBranchDto.branchCode) {
      createBranchDto.branchCode = await this.generateUniqueBranchCode(createBranchDto.city);
    }

    //Prevent nearby branches
    if (createBranchDto.latitude && createBranchDto.longitude) {
      const nearbyBranch = await this.checkNearbyBranches(createBranchDto.latitude, createBranchDto.longitude, 2); // 2km radius
      if (nearbyBranch) {
        throw new ConflictException(`Another branch exists within 2km of this location: ${nearbyBranch.name}`);
      }
    }

    // 6. Validate Contact Information
    if (createBranchDto.email) {
      await this.validateBranchEmail(createBranchDto.email);
    }

    if (createBranchDto.phone) {
      await this.validateBranchPhone(createBranchDto.phone);
    }

    // Validate Operating Hours Format
    if (createBranchDto.operatingHours) {
      this.validateOperatingHours(createBranchDto.operatingHours);
    }

    // Create branch with enhanced data
    const branch = this.branchRepository.create({
      ...createBranchDto,
      isActive: createBranchDto.isActive !== undefined ? createBranchDto.isActive : true, // Default to active
    });

    const savedBranch = await this.branchRepository.save(branch);

    this.logger.log(`Branch created - ID: ${savedBranch.id}, Name: "${savedBranch.name}", Code: ${savedBranch.branchCode}, By: ${currentUser?.id}`);
// Send notifications 
    await this.notifyBranchCreation(savedBranch, currentUser);

    return savedBranch;
  }

  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({ relations: ['vehicles'] });
  }

  async findOne(id: number): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['vehicles'],
    });
    if (!branch) throw new NotFoundException(`Branch with id ${id} not found`);
    return branch;
  }

  async update(id: number, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);
    Object.assign(branch, updateBranchDto);
    return this.branchRepository.save(branch);
  }

  async remove(id: number): Promise<void> {
    const branch = await this.findOne(id);
    await this.branchRepository.remove(branch);
  }

  // ========== SUPPORTING PRIVATE METHODS ==========

  private async generateUniqueBranchCode(city: string): Promise<string> {
    const cityCode = city.substring(0, 3).toUpperCase();
    let attempt = 1;
    let branchCode = `${cityCode}01`; 
    let isUnique = false;

    while (!isUnique && attempt <= 10) {
      branchCode = `${cityCode}${attempt.toString().padStart(2, '0')}`;
      
      const existingBranch = await this.branchRepository.findOne({
        where: { branchCode }
      });

      if (!existingBranch) {
        isUnique = true;
      } else {
        attempt++;
      }
    }

    if (!isUnique) {
      branchCode = `${cityCode}${Date.now().toString().slice(-4)}`;
    }

    return branchCode;
  }

  private async checkNearbyBranches(latitude: number, longitude: number, maxDistanceKm: number = 2): Promise<Branch | null> {
    const nearbyBranch = await this.branchRepository
      .createQueryBuilder('branch')
      .where(`(6371 * acos(cos(radians(${latitude})) * cos(radians(branch.latitude)) * cos(radians(branch.longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(branch.latitude)))) < :maxDistance`, 
      { maxDistance: maxDistanceKm })
      .andWhere('branch.isActive = :isActive', { isActive: true })
      .getOne();

    return nearbyBranch;
  }

  private async validateBranchEmail(email: string): Promise<void> {
    const existingBranch = await this.branchRepository.findOne({
      where: { email }
    });

    if (existingBranch) {
      throw new ConflictException(`Email ${email} is already registered to branch "${existingBranch.name}"`);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  private async validateBranchPhone(phone: string): Promise<void> {
    const existingBranch = await this.branchRepository.findOne({
      where: { phone }
    });

    if (existingBranch) {
      throw new ConflictException(`Phone ${phone} is already registered to branch "${existingBranch.name}"`);
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      throw new BadRequestException('Invalid phone number format');
    }
  }

  private validateOperatingHours(hours: string): void {
    const timeRangeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9](,([0-1]?[0-9]|2[0-3]):[0-5][0-9]-([0-1]?[0-9]|2[0-3]):[0-5][0-9])*$/;
    
    if (!timeRangeRegex.test(hours)) {
      throw new BadRequestException('Operating hours must be in format "HH:MM-HH:MM" or "HH:MM-HH:MM,HH:MM-HH:MM" for multiple ranges');
    }

    const ranges = hours.split(',');
    for (const range of ranges) {
      const [start, end] = range.split('-');
      const startTime = this.timeToMinutes(start);
      const endTime = this.timeToMinutes(end);
      
      if (endTime <= startTime) {
        throw new BadRequestException(`End time ${end} must be after start time ${start}`);
      }
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private async notifyBranchCreation(branch: Branch, currentUser?: User): Promise<void> {
    try {
      this.logger.log(`New branch created: ${branch.name} (${branch.branchCode})`);
    } catch (error) {
      this.logger.error(`Failed to send branch creation notification: ${error.message}`);
    }
  }
}