import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CancellationPolicy } from './entities/cancellation-policy.entity';
import {CreateCancellationPolicyDto} from './dto/create-cancellation-policy.dto';
import { UpdateCancellationPolicyDto} from './dto/update-cancellation-policy.dto';
@Injectable()
export class CancellationPolicyService {
  private readonly logger = new Logger(CancellationPolicyService.name);

  constructor(
    @InjectRepository(CancellationPolicy)
    private policyRepository: Repository<CancellationPolicy>,
  ) {}

  /**
   * Create a new cancellation policy
   */
  async create(
    createDto: CreateCancellationPolicyDto,
  ): Promise<CancellationPolicy> {
    const policy = this.policyRepository.create(createDto);
    const savedPolicy = await this.policyRepository.save(policy);

    this.logger.log(
      `Cancellation policy created - ID: ${savedPolicy.id}, Name: "${savedPolicy.name}"`,
    );

    return savedPolicy;
  }

  /**
   * Get all cancellation policies
   */
  async findAll(): Promise<CancellationPolicy[]> {
    return this.policyRepository.find({
      order: { priority: 'DESC', hoursBeforeStart: 'DESC' },
    });
  }

  /**
   * Get active policies
   */
  async findActive(): Promise<CancellationPolicy[]> {
    return this.policyRepository.find({
      where: { isActive: true },
      order: { priority: 'DESC', hoursBeforeStart: 'DESC' },
    });
  }

  /**
   * Get policy by ID
   */
  async findOne(id: number): Promise<CancellationPolicy> {
    const policy = await this.policyRepository.findOne({
      where: { id },
    });

    if (!policy) {
      throw new NotFoundException('Cancellation policy not found');
    }

    return policy;
  }

  /**
   * Update a policy
   */
  async update(
    id: number,
    updateDto: UpdateCancellationPolicyDto,
  ): Promise<CancellationPolicy> {
    const policy = await this.findOne(id);

    Object.assign(policy, updateDto);
    const updatedPolicy = await this.policyRepository.save(policy);

    this.logger.log(`Cancellation policy updated - ID: ${id}`);

    return updatedPolicy;
  }

  /**
   * Delete a policy
   */
  async remove(id: number): Promise<void> {
    const policy = await this.findOne(id);
    await this.policyRepository.remove(policy);

    this.logger.log(`Cancellation policy deleted - ID: ${id}`);
  }

  /**
   * Deactivate a policy
   */
  async deactivate(id: number): Promise<CancellationPolicy> {
    const policy = await this.findOne(id);
    policy.isActive = false;
    return this.policyRepository.save(policy);
  }
}
