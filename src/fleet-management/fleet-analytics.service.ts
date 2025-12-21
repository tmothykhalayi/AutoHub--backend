import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { FleetManagement } from './entities/fleet-management.entity';
import  {Vehicle} from '../vehicle/entities/vehicle.entity';
export interface UtilizationMetrics {
  vehicleId: number;
  vehicleName: string;
  totalDays: number;
  bookedDays: number;
  idleDays: number;
  utilizationRate: number; // percentage
  revenue: number;
  averageDailyRevenue: number;
}

export interface FleetHealthMetrics {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceVehicles: number;
  retiredVehicles: number;
  averageUtilization: number;
  totalRevenue: number;
  averageVehicleRevenue: number;
}

export interface VehiclePerformance {
  vehicleId: number;
  vehicleName: string;
  totalBookings: number;
  totalRevenue: number;
  averageBookingDuration: number;
  utilizationRate: number;
  maintenanceCost: number;
  profitMargin: number;
  revenuePerDay: number;
}

@Injectable()
export class FleetAnalyticsService {
  private readonly logger = new Logger(FleetAnalyticsService.name);

  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(FleetManagement)
    private fleetRepository: Repository<FleetManagement>,
  ) {}

  /**
   * Calculate utilization rate for a specific vehicle
   */
  async getVehicleUtilization(
    vehicleId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<UtilizationMetrics> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
      relations: ['spec'],
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Get all bookings for this vehicle in date range
    const bookings = await this.bookingRepository.find({
      where: {
        vehicleId,
        startDate: Between(startDate, endDate),
      },
    });

    // Calculate metrics
    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    let bookedDays = 0;
    let revenue = 0;

    for (const booking of bookings) {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      const days = Math.ceil(
        (bookingEnd.getTime() - bookingStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      bookedDays += days;
      revenue += Number(booking.totalPrice);
    }

    const idleDays = totalDays - bookedDays;
    const utilizationRate = (bookedDays / totalDays) * 100;
    const averageDailyRevenue = bookedDays > 0 ? revenue / bookedDays : 0;

    return {
      vehicleId,
      vehicleName: `${vehicle.spec?.make} ${vehicle.spec?.model} - ${vehicle.licensePlate}`,
      totalDays,
      bookedDays,
      idleDays,
      utilizationRate: Number(utilizationRate.toFixed(2)),
      revenue: Number(revenue.toFixed(2)),
      averageDailyRevenue: Number(averageDailyRevenue.toFixed(2)),
    };
  }

  /**
   * Get utilization for all vehicles
   */
  async getFleetUtilization(
    startDate: Date,
    endDate: Date,
  ): Promise<UtilizationMetrics[]> {
    const vehicles = await this.vehicleRepository.find({
      where: { isAvailable: true },
    });

    const metrics: UtilizationMetrics[] = [];

    for (const vehicle of vehicles) {
      const utilization = await this.getVehicleUtilization(
        vehicle.id,
        startDate,
        endDate,
      );
      metrics.push(utilization);
    }

    return metrics.sort((a, b) => b.utilizationRate - a.utilizationRate);
  }

  /**
   * Get overall fleet health metrics
   */
  async getFleetHealthMetrics(): Promise<FleetHealthMetrics> {
    const vehicles = await this.vehicleRepository.find();

    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(
      (v) => v.status === 'available' || v.status === 'active',
    ).length;
    const maintenanceVehicles = vehicles.filter(
      (v) => v.status === 'maintenance',
    ).length;
    const retiredVehicles = vehicles.filter(
      (v) => v.status === 'retired',
    ).length;

    // Calculate utilization for last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const utilizationMetrics = await this.getFleetUtilization(
      startDate,
      endDate,
    );

    const totalRevenue = utilizationMetrics.reduce(
      (sum, m) => sum + m.revenue,
      0,
    );
    const averageUtilization =
      utilizationMetrics.reduce((sum, m) => sum + m.utilizationRate, 0) /
      utilizationMetrics.length;
    const averageVehicleRevenue = totalRevenue / vehicles.length;

    return {
      totalVehicles,
      activeVehicles,
      maintenanceVehicles,
      retiredVehicles,
      averageUtilization: Number(averageUtilization.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageVehicleRevenue: Number(averageVehicleRevenue.toFixed(2)),
    };
  }

  /**
   * Get vehicle performance including revenue vs maintenance cost
   */
  async getVehiclePerformance(
    vehicleId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<VehiclePerformance> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id: vehicleId },
      relations: ['spec', 'bookings'],
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Get bookings in date range
    const bookings = await this.bookingRepository.find({
      where: {
        vehicleId,
        startDate: Between(startDate, endDate),
      },
    });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + Number(b.totalPrice),
      0,
    );

    let totalDuration = 0;
    for (const booking of bookings) {
      const days = Math.ceil(
        (new Date(booking.endDate).getTime() -
          new Date(booking.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      totalDuration += days;
    }

    const averageBookingDuration =
      totalBookings > 0 ? totalDuration / totalBookings : 0;

    // Calculate utilization
    const utilization = await this.getVehicleUtilization(
      vehicleId,
      startDate,
      endDate,
    );

    // Estimate maintenance cost (example: 10% of revenue)
    const maintenanceCost = totalRevenue * 0.1;
    const profitMargin =
      ((totalRevenue - maintenanceCost) / totalRevenue) * 100;

    const totalDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const revenuePerDay = totalRevenue / totalDays;

    return {
      vehicleId,
      vehicleName: `${vehicle.spec?.make} ${vehicle.spec?.model}`,
      totalBookings,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageBookingDuration: Number(averageBookingDuration.toFixed(2)),
      utilizationRate: utilization.utilizationRate,
      maintenanceCost: Number(maintenanceCost.toFixed(2)),
      profitMargin: Number(profitMargin.toFixed(2)),
      revenuePerDay: Number(revenuePerDay.toFixed(2)),
    };
  }

  /**
   * Get top performing vehicles
   */
  async getTopPerformers(
    limit: number = 10,
    startDate?: Date,
    endDate?: Date,
  ): Promise<VehiclePerformance[]> {
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    if (!endDate) {
      endDate = new Date();
    }

    const vehicles = await this.vehicleRepository.find({
      take: 100, // Limit initial fetch
    });

    const performances: VehiclePerformance[] = [];

    for (const vehicle of vehicles) {
      try {
        const performance = await this.getVehiclePerformance(
          vehicle.id,
          startDate,
          endDate,
        );
        performances.push(performance);
      } catch (error) {
        this.logger.error(
          `Failed to get performance for vehicle ${vehicle.id}`,
          error,
        );
      }
    }

    // Sort by revenue and return top performers
    return performances
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  /**
   * Get underutilized vehicles (< 30% utilization)
   */
  async getUnderutilizedVehicles(
    startDate: Date,
    endDate: Date,
    threshold: number = 30,
  ): Promise<UtilizationMetrics[]> {
    const utilization = await this.getFleetUtilization(startDate, endDate);
    return utilization.filter((u) => u.utilizationRate < threshold);
  }

  /**
   * Generate fleet KPI report
   */
  async generateKPIReport(startDate: Date, endDate: Date) {
    const fleetHealth = await this.getFleetHealthMetrics();
    const utilization = await this.getFleetUtilization(startDate, endDate);
    const topPerformers = await this.getTopPerformers(5, startDate, endDate);
    const underutilized = await this.getUnderutilizedVehicles(
      startDate,
      endDate,
    );

    return {
      reportDate: new Date(),
      period: { startDate, endDate },
      fleetHealth,
      utilizationSummary: {
        averageUtilization: fleetHealth.averageUtilization,
        totalRevenue: fleetHealth.totalRevenue,
        vehicleCount: utilization.length,
      },
      topPerformers,
      underutilizedVehicles: underutilized,
      recommendations: this.generateRecommendations(
        fleetHealth,
        underutilized,
      ),
    };
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(
    health: FleetHealthMetrics,
    underutilized: UtilizationMetrics[],
  ): string[] {
    const recommendations: string[] = [];

    if (health.averageUtilization < 50) {
      recommendations.push(
        'Fleet utilization is below 50%. Consider marketing campaigns or pricing adjustments.',
      );
    }

    if (underutilized.length > health.totalVehicles * 0.3) {
      recommendations.push(
        `${underutilized.length} vehicles are underutilized. Consider relocating them to higher-demand branches.`,
      );
    }

    if (health.maintenanceVehicles > health.activeVehicles * 0.2) {
      recommendations.push(
        'High proportion of vehicles in maintenance. Review maintenance schedules and vehicle quality.',
      );
    }

    return recommendations;
  }
}
