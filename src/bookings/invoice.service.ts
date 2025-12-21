import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Booking } from './entities/booking.entity';
import { Branch } from './../branches/entities/branch.entity';

interface TaxRate {
  name: string;
  rate: number;
  applicableOn: 'subtotal' | 'item';
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxable: boolean;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  // Tax rates by state/country
  private readonly TAX_RATES: Record<string, TaxRate[]> = {
    CA: [{ name: 'Sales Tax', rate: 7.25, applicableOn: 'subtotal' }],
    NY: [{ name: 'Sales Tax', rate: 8.875, applicableOn: 'subtotal' }],
    TX: [{ name: 'Sales Tax', rate: 6.25, applicableOn: 'subtotal' }],
    FL: [{ name: 'Sales Tax', rate: 6.0, applicableOn: 'subtotal' }],
    DEFAULT: [{ name: 'Tax', rate: 7.0, applicableOn: 'subtotal' }],
  };

  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
  ) {}

  /**
   * Generate invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.invoiceRepository.count();
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Calculate taxes based on location
   */
  private calculateTaxes(
    subtotal: number,
    state: string,
    lineItems: LineItem[],
  ): {
    taxes: { name: string; rate: number; amount: number }[];
    totalTax: number;
  } {
    const taxRates = this.TAX_RATES[state] || this.TAX_RATES.DEFAULT;
    const taxes: { name: string; rate: number; amount: number }[] = [];
    let totalTax = 0;

    for (const taxRate of taxRates) {
      let taxableAmount = 0;

      if (taxRate.applicableOn === 'subtotal') {
        taxableAmount = subtotal;
      } else {
        // Calculate tax on individual taxable items
        taxableAmount = lineItems
          .filter((item) => item.taxable)
          .reduce((sum, item) => sum + item.amount, 0);
      }

      const taxAmount = (taxableAmount * taxRate.rate) / 100;
      taxes.push({
        name: taxRate.name,
        rate: taxRate.rate,
        amount: Number(taxAmount.toFixed(2)),
      });
      totalTax += taxAmount;
    }

    return {
      taxes,
      totalTax: Number(totalTax.toFixed(2)),
    };
  }

  /**
   * Create invoice for a booking
   */
  async createInvoiceForBooking(bookingId: number): Promise<Invoice> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'vehicle', 'vehicle.spec', 'vehicle.branch'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const branch = booking.vehicle?.branch;
    const spec = booking.vehicle?.spec;

    // Build line items
    const lineItems: LineItem[] = [
      {
        description: `Vehicle Rental - ${spec?.make} ${spec?.model}`,
        quantity: booking.rentalDays || 1,
        unitPrice: Number(spec?.dailyRate) || 0,
        amount: booking.totalPrice,
        taxable: true,
      },
    ];

    // Add insurance if applicable
    const insuranceFee = 15 * (booking.rentalDays || 1); // $15 per day
    lineItems.push({
      description: 'Insurance Coverage',
      quantity: booking.rentalDays || 1,
      unitPrice: 15,
      amount: insuranceFee,
      taxable: true,
    });

    // Add location fee if different pickup/dropoff
    if (booking.pickupLocation !== booking.dropoffLocation) {
      lineItems.push({
        description: 'Different Location Fee',
        quantity: 1,
        unitPrice: 50,
        amount: 50,
        taxable: false,
      });
    }

    // Calculate subtotal
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

    // Calculate taxes
    const { taxes, totalTax } = this.calculateTaxes(
      subtotal,
      branch?.state || 'DEFAULT',
      lineItems,
    );

    // Calculate total
    const total = subtotal + totalTax;

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = this.invoiceRepository.create({
      invoiceNumber,
      bookingId,
      userId: booking.userId,
      status: InvoiceStatus.ISSUED,
      issueDate: new Date(),
      dueDate: new Date(booking.startDate),
      lineItems,
      subtotal,
      taxes,
      taxAmount: totalTax,
      total,
      amountDue: total,
      amountPaid: 0,
      billingCity: branch?.city,
      billingState: branch?.state,
      billingCountry: branch?.country || 'USA',
      notes: 'Thank you for your business!',
      terms: 'Payment due on or before rental start date.',
    });

    const savedInvoice = await this.invoiceRepository.save(invoice);

    this.logger.log(
      `Invoice created - ${invoiceNumber}, Booking: ${bookingId}, Total: ${total}`,
    );

    return savedInvoice;
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string, amountPaid: number): Promise<Invoice> {
    const invoice = await this.findOne(invoiceId);

    invoice.status = InvoiceStatus.PAID;
    invoice.amountPaid = amountPaid;
    invoice.amountDue = invoice.total - amountPaid;
    invoice.paidDate = new Date();

    await this.invoiceRepository.save(invoice);

    this.logger.log(`Invoice marked as paid - ${invoice.invoiceNumber}`);

    return invoice;
  }

  /**
   * Get all invoices
   */
  async findAll(): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      relations: ['booking', 'user'],
      order: { issueDate: 'DESC' },
    });
  }

  /**
   * Get invoice by ID
   */
  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['booking', 'user'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  /**
   * Get invoices for a user
   */
  async findByUser(userId: number): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { userId },
      relations: ['booking'],
      order: { issueDate: 'DESC' },
    });
  }

  /**
   * Get overdue invoices
   */
  async findOverdue(): Promise<Invoice[]> {
    const now = new Date();
    return this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.status = :status', { status: InvoiceStatus.ISSUED })
      .andWhere('invoice.dueDate < :now', { now })
      .andWhere('invoice.amountDue > 0')
      .getMany();
  }
}
