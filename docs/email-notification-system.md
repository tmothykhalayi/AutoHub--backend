# AutoHub Email Notification System

This document explains how the email notification system works in the AutoHub backend application and how to extend it.

## Overview

The email notification system is built around the `MailService` class, which uses Handlebars templates to render email content. The system is designed to send notifications for various events such as:

- Booking creation, updates, and cancellations
- Support ticket creation and updates
- Payment receipts
- Vehicle return reminders

## Architecture

### Components

1. **MailService**: Core service responsible for sending emails
2. **Email Templates**: Handlebars templates for rendering email content
3. **Scheduled Tasks**: For sending automated reminders
4. **Integration in Services**: Email sending logic in BookingService, SupportService, etc.

## Email Templates

Templates are stored in the `src/mail/templates` directory and use Handlebars syntax. The available templates are:

- `booking-confirmation.hbs`: Sent when a booking is created
- `booking-update.hbs`: Sent when a booking is updated
- `booking-cancellation.hbs`: Sent when a booking is cancelled
- `payment-receipt.hbs`: Sent when a payment is processed
- `return-reminder.hbs`: Sent as a reminder before vehicle return date
- `support-ticket-created.hbs`: Sent when a support ticket is created
- `support-ticket-response.hbs`: Sent when a support ticket is updated

## Scheduled Tasks

The `BookingReminderService` uses `@nestjs/schedule` to send automated email reminders to customers before their vehicle return date. The cron job runs daily at 10:00 AM to check for bookings ending the next day.

## How to Use

### Sending a Simple Email

```typescript
// Inject MailService in your service constructor
constructor(private readonly mailService: MailService) {}

// Send a simple email
await this.mailService.sendMail({
  to: 'user@example.com',
  subject: 'Important Information',
  template: 'general', // uses general.hbs template
  context: {
    name: 'John Doe',
    message: 'This is a test message'
  }
});
```

### Sending a Booking Confirmation

```typescript
await this.mailService.sendBookingConfirmation(booking.user.email, {
  name: `${booking.user.firstName} ${booking.user.lastName}`,
  bookingId: booking.id.toString(),
  startDate: booking.startDate,
  endDate: booking.endDate,
  vehicleInfo: `${booking.vehicle.spec.make} ${booking.vehicle.spec.model}`,
  totalAmount: booking.totalPrice
});
```

## How to Extend

### Adding a New Template

1. Create a new Handlebars template file in `src/mail/templates/`
2. Add a new method in the `MailService` class:

```typescript
async sendNewNotification(email: string, context: any): Promise<void> {
  await this.sendMail({
    to: email,
    subject: 'Your Subject Line',
    template: 'your-new-template', // filename without extension
    context: context
  });
}
```

### Adding Scheduled Email Notifications

1. Create a new service that implements `OnModuleInit`
2. Use the `@Cron()` decorator from `@nestjs/schedule`
3. Inject the `MailService`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';

@Injectable()
export class YourReminderService {
  private readonly logger = new Logger(YourReminderService.name);

  constructor(private readonly mailService: MailService) {}

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async sendReminders() {
    this.logger.log('Sending reminders...');
    
    // Your logic to fetch data and determine who needs reminders
    
    // Send emails
    await this.mailService.sendYourReminder('user@example.com', {
      // your context data
    });
  }
}
```

## Best Practices

1. **Use Templates**: Always use templates for consistent email styling and content
2. **Include Personalization**: Address the recipient by name when possible
3. **Context Validation**: Validate context data before sending to prevent template errors
4. **Email Queue**: Consider implementing an email queue for high-volume scenarios
5. **Error Handling**: Implement proper error handling for email sending failures

## Testing

To test email notifications:

1. Configure a test email service in your development environment
2. Use a service like Mailtrap to catch emails in development
3. Write unit tests for email content generation
4. Write integration tests for the full email sending workflow