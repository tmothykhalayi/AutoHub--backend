import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VehicleInspection,
  InspectionStatus,
} from './entities/vehicle-inspection.entity';
import {
  CreateVehicleInspectionDto,
  UpdateInspectionStatusDto,
  ApproveInspectionDto,
} from './dto/create-vehicle-inspection.dto';

@Injectable()
export class VehicleInspectionService {
  private readonly logger = new Logger(VehicleInspectionService.name);

  constructor(
    @InjectRepository(VehicleInspection)
    private inspectionRepository: Repository<VehicleInspection>,
  ) {}

  /**
   * Create a new vehicle inspection
   */
  async create(
    createDto: CreateVehicleInspectionDto,
    inspectorId: number,
  ): Promise<VehicleInspection> {
    const inspection = this.inspectionRepository.create({
      ...createDto,
      inspectorId,
      inspectionDate: new Date(),
      status: InspectionStatus.IN_PROGRESS,
    });

    const savedInspection = await this.inspectionRepository.save(inspection);

    this.logger.log(
      `Inspection created - ID: ${savedInspection.id}, Vehicle: ${createDto.vehicleId}, Type: ${createDto.inspectionType}`,
    );

    return savedInspection;
  }

  /**
   * Complete an inspection
   */
  async complete(id: number): Promise<VehicleInspection> {
    const inspection = await this.findOne(id);

    inspection.status = InspectionStatus.COMPLETED;
    inspection.completedAt = new Date();

    await this.inspectionRepository.save(inspection);

    this.logger.log(`Inspection completed - ID: ${id}`);

    return inspection;
  }

  /**
   * Approve an inspection (admin/manager)
   */
  async approve(
    id: number,
    approveDto: ApproveInspectionDto,
    approverId: number,
  ): Promise<VehicleInspection> {
    const inspection = await this.findOne(id);

    inspection.status = InspectionStatus.APPROVED;
    inspection.approvedBy = approverId;
    inspection.approvedAt = new Date();
    if (approveDto.approvalNotes) {
      inspection.approvalNotes = approveDto.approvalNotes;
    }

    await this.inspectionRepository.save(inspection);

    this.logger.log(`Inspection approved - ID: ${id}, By: ${approverId}`);

    return inspection;
  }

  /**
   * Update inspection status
   */
  async updateStatus(
    id: number,
    updateDto: UpdateInspectionStatusDto,
  ): Promise<VehicleInspection> {
    const inspection = await this.findOne(id);

    inspection.status = updateDto.status;
    if (updateDto.notes) {
      inspection.notes = updateDto.notes;
    }

    await this.inspectionRepository.save(inspection);

    return inspection;
  }

  /**
   * Get all inspections
   */
  async findAll(): Promise<VehicleInspection[]> {
    return this.inspectionRepository.find({
      relations: ['vehicle', 'booking', 'inspector', 'approver'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get inspection by ID
   */
  async findOne(id: number): Promise<VehicleInspection> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id },
      relations: ['vehicle', 'booking', 'inspector', 'approver'],
    });

    if (!inspection) {
      throw new NotFoundException('Inspection not found');
    }

    return inspection;
  }

  /**
   * Get inspections for a vehicle
   */
  async findByVehicle(vehicleId: number): Promise<VehicleInspection[]> {
    return this.inspectionRepository.find({
      where: { vehicleId },
      relations: ['inspector'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get inspections for a booking
   */
  async findByBooking(bookingId: number): Promise<VehicleInspection[]> {
    return this.inspectionRepository.find({
      where: { bookingId },
      relations: ['vehicle', 'inspector'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get pending inspections
   */
  async findPending(): Promise<VehicleInspection[]> {
    return this.inspectionRepository.find({
      where: [
        { status: InspectionStatus.PENDING },
        { status: InspectionStatus.IN_PROGRESS },
      ],
      relations: ['vehicle', 'booking'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get inspections requiring approval
   */
  async findRequiringApproval(): Promise<VehicleInspection[]> {
    return this.inspectionRepository.find({
      where: { status: InspectionStatus.COMPLETED },
      relations: ['vehicle', 'booking', 'inspector'],
      order: { completedAt: 'ASC' },
    });
  }
}
