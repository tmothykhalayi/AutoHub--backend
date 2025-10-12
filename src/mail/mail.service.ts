import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Send a welcome email to a new user
   * @param email User's email address
   * @param name User's name
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Welcome to AutoHub!',
        template: 'welcome',
        context: {
          name,
          date: new Date().toLocaleDateString(),
        },
      });
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error.stack);
      throw error;
    }
  }

  /**
   * Send booking confirmation email
   * @param email User's email address
   * @param bookingDetails Booking information
   */
  async sendBookingConfirmation(email: string, bookingDetails: {
    name: string;
    bookingId: string;
    vehicleName: string;
    startDate: Date;
    endDate: Date;
    totalPrice: number;
    pickupLocation: string;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Your AutoHub Booking Confirmation',
        template: 'booking-confirmation',
        context: {
          ...bookingDetails,
          startDate: bookingDetails.startDate.toLocaleDateString(),
          endDate: bookingDetails.endDate.toLocaleDateString(),
          totalPrice: bookingDetails.totalPrice.toFixed(2),
        },
      });
      this.logger.log(`Booking confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send booking confirmation email to ${email}`, error.stack);
      throw error;
    }
  }

  /**
   * Send payment receipt email
   * @param email User's email address
   * @param paymentDetails Payment information
   */
  async sendPaymentReceipt(email: string, paymentDetails: {
    name: string;
    paymentId: string;
    bookingId: string;
    amount: number;
    paymentMethod: string;
    paymentDate: Date;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Payment Receipt - AutoHub',
        template: 'payment-receipt',
        context: {
          ...paymentDetails,
          amount: paymentDetails.amount.toFixed(2),
          paymentDate: paymentDetails.paymentDate.toLocaleDateString(),
        },
      });
      this.logger.log(`Payment receipt email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send payment receipt email to ${email}`, error.stack);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param email User's email address
   * @param resetLink Password reset link
   */
  async sendPasswordReset(email: string, name: string, resetLink: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Reset Your AutoHub Password',
        template: 'password-reset',
        context: {
          name,
          resetLink,
          expiryTime: '24 hours',
        },
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error.stack);
      throw error;
    }
  }

  /**
   * Send a support ticket confirmation email
   * @param email User's email address
   * @param ticketDetails Support ticket details
   */
  async sendSupportTicketConfirmation(email: string, ticketDetails: {
    name: string;
    ticketId: string;
    subject: string;
    message: string;
    priority: string;
  }): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: `Support Ticket Created: ${ticketDetails.subject}`,
        template: 'support-ticket',
        context: ticketDetails,
      });
      this.logger.log(`Support ticket confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send support ticket confirmation email to ${email}`, error.stack);
      throw error;
    }
  }

  /**
   * Send password reset success email
   * @param email User's email address
   * @param name User's name
   */
  async sendPasswordResetSuccessEmail(email: string, name: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset Successful - AutoHub',
        template: 'password-reset-success',
        context: {
          name,
          date: new Date().toLocaleDateString(),
        },
      });
      this.logger.log(`Password reset success email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset success email to ${email}`, error.stack);
      throw error;
    }
  }

  /**
   * Send a generic email
   * @param to Recipient email address
   * @param subject Email subject
   * @param template Template name
   * @param context Template context data
   */
  async sendEmail(to: string, subject: string, template: string, context: any): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
      this.logger.log(`Email with subject "${subject}" sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      throw error;
    }
  }
}
