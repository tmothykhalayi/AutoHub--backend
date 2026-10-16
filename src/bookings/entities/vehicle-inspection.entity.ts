import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { User } from '../../users/entities/user.entity';

export enum InspectionType {
  PRE_RENTAL = 'pre_rental',
  POST_RENTAL = 'post_rental',
  ROUTINE = 'routine',
  DAMAGE_REPORT = 'damage_report',
}

export enum InspectionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  DISPUTED = 'disputed',
}

export enum DamageSeverity {
  NONE = 'none',
  MINOR = 'minor',
  MODERATE = 'moderate',
  MAJOR = 'major',
  SEVERE = 'severe',
}

@Entity('vehicle_inspections')
export class VehicleInspection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  vehicleId: number;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Column({ nullable: true })
  bookingId: number;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'bookingId' })
  booking: Booking;

  @Column({
    type: 'enum',
    enum: InspectionType,
  })
  inspectionType: InspectionType;

  @Column({
    type: 'enum',
    enum: InspectionStatus,
    default: InspectionStatus.PENDING,
  })
  status: InspectionStatus;

  // Inspector details
  @Column({ nullable: true })
  inspectorId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'inspectorId' })
  inspector: User;

  @Column({ nullable: true })
  inspectorName: string;

  // Vehicle condition
  @Column('int', { default: 0 })
  mileageAtInspection: number;

  @Column('int', { default: 100 })
  fuelLevel: number; // Percentage

  @Column({
    type: 'enum',
    enum: DamageSeverity,
    default: DamageSeverity.NONE,
  })
  overallCondition: DamageSeverity;

  // Damage details
  @Column('simple-array', { nullable: true })
  damagePhotos: string[]; // URLs to photos

  @Column('jsonb', { nullable: true })
  damageDetails: {
    location: string;
    type: string;
    severity: DamageSeverity;
    description: string;
    estimatedCost?: number;
  }[];

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  estimatedRepairCost: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  actualRepairCost: number;

  // Checklist
  @Column('jsonb', { nullable: true })
  checklist: {
    item: string;
    status: 'pass' | 'fail' | 'needs_attention';
    notes?: string;
  }[];

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  customerSignature: string; // Base64 or URL

  @Column('text', { nullable: true })
  inspectorSignature: string; // Base64 or URL

  // Approval workflow
  @Column({ nullable: true })
  approvedBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver: User;

  @Column('timestamp', { nullable: true })
  approvedAt: Date;

  @Column('text', { nullable: true })
  approvalNotes: string;

  @Column('timestamp', { nullable: true })
  inspectionDate: Date;

  @Column('timestamp', { nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
