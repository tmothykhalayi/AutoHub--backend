import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { VehicleSpec } from './entities/vehicle-spec.entity';
import { CreateVehicleSpecDto } from './dto/create-vehicle-spec.dto';
import { UpdateVehicleSpecDto } from './dto/update-vehicle-spec.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class VehicleSpecService {
  private readonly logger = new Logger(VehicleSpecService.name);

  constructor(
    @InjectRepository(VehicleSpec)
    private vehicleSpecRepository: Repository<VehicleSpec>,
  ) {}

  async create(
    createDto: CreateVehicleSpecDto,
    currentUser?: User,
  ): Promise<VehicleSpec> {
    // 1. Authorization Logic
    if (currentUser && currentUser.role !== 'admin') {
      throw new BadRequestException(
        'Only administrators can create vehicle specifications',
      );
    }

    // 2. Unique Specification Validation - Prevent duplicates
    const existingSpec = await this.vehicleSpecRepository.findOne({
      where: [
        { name: createDto.name },
        {
          make: createDto.make,
          model: createDto.model,
          year: createDto.year,
        },
      ],
    });

    if (existingSpec) {
      throw new ConflictException(
        `Vehicle specification already exists: ${existingSpec.make} ${existingSpec.model} ${existingSpec.year}`,
      );
    }

    // 3. Data Validation Logic
    this.validateVehicleSpecData(createDto);
    if (
      !createDto.name &&
      createDto.make &&
      createDto.model &&
      createDto.year
    ) {
      createDto.name = `${createDto.make} ${createDto.model} ${createDto.year}`;
    }
    const enhancedData = {
      ...createDto,
      fuelEfficiency: this.calculateFuelEfficiency(createDto),
      category: this.determineVehicleCategory(createDto),
    };

    const vehicleSpec = this.vehicleSpecRepository.create(enhancedData);
    const savedSpec = await this.vehicleSpecRepository.save(vehicleSpec);
    this.logger.log(
      `Vehicle spec created - ID: ${savedSpec.id}, Name: "${savedSpec.name}", By: ${currentUser?.id}`,
    );

    return savedSpec;
  }

  async findAll(options?: {
    category?: string;
    fuelType?: string;
    transmission?: string;
    minSeats?: number;
    maxSeats?: number;
    search?: string;
  }): Promise<VehicleSpec[]> {
    const whereConditions: any = {};

    if (options?.category) {
      whereConditions.category = options.category;
    }

    if (options?.fuelType) {
      whereConditions.fuelType = options.fuelType;
    }

    if (options?.transmission) {
      whereConditions.transmission = options.transmission;
    }

    if (options?.minSeats !== undefined || options?.maxSeats !== undefined) {
      whereConditions.seats = {};
      if (options.minSeats !== undefined) {
        whereConditions.seats = {
          ...whereConditions.seats,
          $gte: options.minSeats,
        };
      }
      if (options.maxSeats !== undefined) {
        whereConditions.seats = {
          ...whereConditions.seats,
          $lte: options.maxSeats,
        };
      }
    }

    const specs = await this.vehicleSpecRepository.find({
      where: whereConditions,
      relations: ['vehicles'],
      order: {
        make: 'ASC',
        model: 'ASC',
      },
    });
    if (options?.search) {
      const searchTerm = options.search.toLowerCase();
      return specs.filter(
        (spec) =>
          spec.name.toLowerCase().includes(searchTerm) ||
          spec.make.toLowerCase().includes(searchTerm) ||
          spec.model.toLowerCase().includes(searchTerm),
      );
    }

    return specs;
  }

  async findOne(id: number): Promise<
    VehicleSpec & {
      rentalSuitability?: string;
      maintenanceCost?: number;
      totalVehicles?: number;
    }
  > {
    const spec = await this.vehicleSpecRepository.findOne({
      where: { id },
      relations: ['vehicles'],
    });

    if (!spec) {
      throw new NotFoundException(
        `Vehicle specification with id ${id} not found`,
      );
    }
    return {
      ...spec,
      rentalSuitability: this.calculateRentalSuitability(spec),
      maintenanceCost: this.estimateMaintenanceCost(spec),
      totalVehicles: spec.vehicles ? spec.vehicles.length : 0,
    };
  }

  async update(
    id: number,
    updateDto: UpdateVehicleSpecDto,
    currentUser?: User,
  ): Promise<VehicleSpec> {
    const spec = await this.findOne(id);
    if (currentUser && currentUser.role !== 'admin') {
      throw new BadRequestException(
        'Only administrators can update vehicle specifications',
      );
    }

    // 12. Prevent updates if vehicles are using this spec
    if (spec.vehicles && spec.vehicles.length > 0) {
      const updatableFields = [
        'description',
        'features',
        'dailyRate',
        'weeklyRate',
      ];
      const nonUpdatableFields = Object.keys(updateDto).filter(
        (field) => !updatableFields.includes(field),
      );

      if (nonUpdatableFields.length > 0) {
        throw new BadRequestException(
          `Cannot update ${nonUpdatableFields.join(', ')} while vehicles are using this specification`,
        );
      }
    }

    // 13. Unique validation for critical fields
    if (updateDto.name || updateDto.make || updateDto.model || updateDto.year) {
      const potentialDuplicate = await this.findDuplicateSpec(updateDto, id);
      if (potentialDuplicate) {
        throw new ConflictException(
          `Vehicle specification conflicts with existing: ${potentialDuplicate.name}`,
        );
      }
    }
    const updatedData = { ...updateDto };
    if (updateDto.engineSize || updateDto.fuelType) {
      updatedData['fuelEfficiency'] = this.calculateFuelEfficiency({
        ...spec,
        ...updateDto,
      });
    }

    if (updateDto.make || updateDto.model || updateDto.year) {
      updatedData['category'] = this.determineVehicleCategory({
        ...spec,
        ...updateDto,
      });
    }

    Object.assign(spec, updatedData);
    const updatedSpec = await this.vehicleSpecRepository.save(spec);

    this.logger.log(`Vehicle spec updated - ID: ${id}, By: ${currentUser?.id}`);

    return updatedSpec;
  }

  async remove(id: number, currentUser?: User): Promise<{ message: string }> {
    const spec = await this.findOne(id);
    if (currentUser && currentUser.role !== 'admin') {
      throw new BadRequestException(
        'Only administrators can delete vehicle specifications',
      );
    }
    //  Prevent deletion if vehicles are using this spec
    if (spec.vehicles && spec.vehicles.length > 0) {
      throw new BadRequestException(
        `Cannot delete specification used by ${spec.vehicles.length} vehicles. Reassign vehicles first.`,
      );
    }

    await this.vehicleSpecRepository.remove(spec);
    this.logger.log(
      `Vehicle spec deleted - ID: ${id}, Name: "${spec.name}", By: ${currentUser?.id}`,
    );

    return { message: `Vehicle specification "${spec.name}" has been deleted` };
  }
  async findByCategory(category: string): Promise<VehicleSpec[]> {
    return this.vehicleSpecRepository.find({
      where: { category },
      relations: ['vehicles'],
      order: { dailyRate: 'ASC' },
    });
  }

  async findByFuelType(fuelType: string): Promise<VehicleSpec[]> {
    return this.vehicleSpecRepository.find({
      where: { fuelType },
      relations: ['vehicles'],
      order: { make: 'ASC', model: 'ASC' },
    });
  }

  async getPopularSpecs(limit: number = 10): Promise<VehicleSpec[]> {
    const allSpecs = await this.vehicleSpecRepository.find({
      relations: ['vehicles'],
    });
    return allSpecs
      .sort((a, b) => (b.vehicles?.length || 0) - (a.vehicles?.length || 0))
      .slice(0, limit);
  }

  async getSpecsByMake(make: string): Promise<VehicleSpec[]> {
    return this.vehicleSpecRepository.find({
      where: { make },
      relations: ['vehicles'],
      order: { year: 'DESC' },
    });
  }

  async getAvailableCategories(): Promise<string[]> {
    const specs = await this.vehicleSpecRepository.find({
      select: ['category'],
    });

    const categories = [
      ...new Set(specs.map((spec) => spec.category).filter(Boolean)),
    ];
    return categories.sort();
  }

  private validateVehicleSpecData(
    dto: CreateVehicleSpecDto | UpdateVehicleSpecDto,
  ): void {
    if (dto.engineSize && (dto.engineSize < 0.5 || dto.engineSize > 10)) {
      throw new BadRequestException('Engine size must be between 0.5L and 10L');
    }
    if (dto.seats && (dto.seats < 1 || dto.seats > 20)) {
      throw new BadRequestException(
        'Seating capacity must be between 1 and 20',
      );
    }
    const currentYear = new Date().getFullYear();
    if (dto.year && (dto.year < 1990 || dto.year > currentYear + 1)) {
      throw new BadRequestException(
        `Vehicle year must be between 1990 and ${currentYear + 1}`,
      );
    }
    if (dto.dailyRate && dto.dailyRate < 0) {
      throw new BadRequestException('Daily rate cannot be negative');
    }

    if (dto.weeklyRate && dto.weeklyRate < 0) {
      throw new BadRequestException('Weekly rate cannot be negative');
    }
    if (
      dto.dailyRate &&
      dto.weeklyRate &&
      dto.weeklyRate >= dto.dailyRate * 7
    ) {
      throw new BadRequestException(
        'Weekly rate should be less than 7 times daily rate',
      );
    }
  }

  private calculateFuelEfficiency(spec: any): string {
    if (!spec.engineSize || !spec.fuelType) return 'N/A';

    let efficiency;
    if (spec.fuelType === 'electric') {
      efficiency = 'Excellent';
    } else if (spec.engineSize < 1.5) {
      efficiency = 'Excellent';
    } else if (spec.engineSize < 2.5) {
      efficiency = 'Good';
    } else if (spec.engineSize < 4.0) {
      efficiency = 'Average';
    } else {
      efficiency = 'Poor';
    }

    return efficiency;
  }

  private determineVehicleCategory(spec: CreateVehicleSpecDto | any): string {
    if (spec.seats >= 7) return 'SUV';
    if (spec.engineSize && spec.engineSize > 3.0) return 'Luxury';
    if (spec.seats <= 2) return 'Sports';
    if (spec.fuelType === 'electric') return 'Electric';
    if (
      spec.make?.toLowerCase().includes('mercedes') ||
      spec.make?.toLowerCase().includes('bmw')
    )
      return 'Premium';
    return 'Standard';
  }

  private async findDuplicateSpec(
    dto: UpdateVehicleSpecDto,
    excludeId: number,
  ): Promise<VehicleSpec | null> {
    const whereConditions: any[] = [];

    if (dto.name) {
      whereConditions.push({ name: dto.name, id: Not(excludeId) });
    }

    if (dto.make && dto.model && dto.year) {
      whereConditions.push({
        make: dto.make,
        model: dto.model,
        year: dto.year,
        id: Not(excludeId),
      });
    }

    if (whereConditions.length === 0) return null;

    return this.vehicleSpecRepository.findOne({
      where: whereConditions,
    });
  }

  private calculateRentalSuitability(spec: VehicleSpec): string {
    const factors: string[] = [];

    if (spec.fuelEfficiency === 'Excellent' || spec.fuelEfficiency === 'Good') {
      factors.push('fuel efficient');
    }

    if (spec.seats && spec.seats >= 5) {
      factors.push('family friendly');
    }

    if (spec.dailyRate && spec.dailyRate < 50) {
      factors.push('budget friendly');
    }

    if (
      spec.features &&
      typeof spec.features === 'string' &&
      (spec.features as string).includes('GPS')
    ) {
      factors.push('navigation ready');
    }

    return factors.length > 0 ? factors.join(', ') : 'standard';
  }

  private estimateMaintenanceCost(spec: VehicleSpec): number {
    let baseCost = 100;

    if (spec.engineSize && spec.engineSize > 2.0) baseCost += 50;
    if (spec.fuelType === 'electric') baseCost -= 30;
    if (spec.fuelType === 'diesel') baseCost += 20;
    if (spec.transmission === 'automatic') baseCost += 25;

    return baseCost;
  }

  // 19. Statistics Methods
  async getSpecStatistics(): Promise<any> {
    const allSpecs = await this.vehicleSpecRepository.find({
      relations: ['vehicles'],
    });

    const totalSpecs = allSpecs.length;
    const totalVehicles = allSpecs.reduce(
      (sum, spec) => sum + (spec.vehicles?.length || 0),
      0,
    );

    const categories = {};
    const fuelTypes = {};

    allSpecs.forEach((spec) => {
      categories[spec.category] = (categories[spec.category] || 0) + 1;
      fuelTypes[spec.fuelType] = (fuelTypes[spec.fuelType] || 0) + 1;
    });

    return {
      totalSpecs,
      totalVehicles,
      averageVehiclesPerSpec: totalVehicles / totalSpecs,
      categories,
      fuelTypes,
    };
  }
}
