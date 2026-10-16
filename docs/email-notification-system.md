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

## Email Templates

Templates are stored in the `src/mail/templates` directory and use Handlebars syntax. The available templates are:

- `booking-confirmation.hbs`: Sent when a booking is created
- `booking-update.hbs`: Sent when a booking is updated
- `booking-cancellation.hbs`: Sent when a booking is cancelled
- `payment-receipt.hbs`: Sent when a payment is processed
- `return-reminder.hbs`: Sent as a reminder before vehicle return date
- `support-ticket-created.hbs`: Sent when a support ticket is created
- `support-ticket-response.hbs`: Sent when a support ticket is updated
- `late-return-penalty.hbs`: Sent when a late return penalty is charged
- `refund-processed.hbs`: Sent when a refund is completed
- `inspection-report.hbs`: Sent with vehicle inspection results
- `password-reset.hbs`: Sent when user requests password reset
- `email-verification.hbs`: Sent for email verification

### Email Template Examples

#### Booking Confirmation Template

```handlebars
<!-- booking-confirmation.hbs -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background-color: #0066cc; color: white; padding: 20px; }
        .content { padding: 20px; }
        .footer { background-color: #f5f5f5; padding: 10px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Booking Confirmation</h1>
        </div>
        <div class="content">
            <p>Hello {{name}},</p>
            <p>Thank you for your booking! Here are your reservation details:</p>
            
            <h3>Booking Information</h3>
            <ul>
                <li><strong>Booking ID:</strong> {{bookingId}}</li>
                <li><strong>Vehicle:</strong> {{vehicleInfo}}</li>
                <li><strong>Start Date:</strong> {{startDate}}</li>
                <li><strong>End Date:</strong> {{endDate}}</li>
                <li><strong>Pick-up Location:</strong> {{pickupLocation}}</li>
                <li><strong>Drop-off Location:</strong> {{dropoffLocation}}</li>
            </ul>
            
            <h3>Pricing Details</h3>
            <ul>
                <li><strong>Daily Rate:</strong> ${{dailyRate}}</li>
                <li><strong>Number of Days:</strong> {{numberOfDays}}</li>
                <li><strong>Insurance:</strong> ${{insurance}}</li>
                <li><strong>Total Amount:</strong> ${{totalAmount}}</li>
            </ul>
            
            <p>Your invoice has been attached for your records.</p>
            <p>If you have any questions, please contact us.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 AutoHub. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
```

#### Late Return Penalty Template

```handlebars
<!-- late-return-penalty.hbs -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; }
        .alert { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="alert">
            <h2>Late Return Charge - Booking {{bookingId}}</h2>
            <p>Hello {{customerName}},</p>
            
            <p>Your vehicle <strong>{{vehicleModel}}</strong> was returned late.</p>
            
            <h3>Return Details</h3>
            <ul>
                <li><strong>Expected Return Time:</strong> {{expectedReturnTime}}</li>
                <li><strong>Actual Return Time:</strong> {{actualReturnTime}}</li>
                <li><strong>Late Duration:</strong> {{lateDuration}} hours</li>
                <li><strong>Grace Period:</strong> {{gracePeriod}} hours</li>
                <li><strong>Billable Hours:</strong> {{billableHours}} hours</li>
            </ul>
            
            <h3>Penalty Calculation</h3>
            <ul>
                <li><strong>Hourly Rate:</strong> ${{hourlyRate}}</li>
                <li><strong>Penalty Multiplier:</strong> {{penaltyMultiplier}}x</li>
                <li><strong>Penalty Amount:</strong> ${{penaltyAmount}}</li>
            </ul>
            
            <p><strong>This amount has been charged to your payment method on file.</strong></p>
            
            <p>If you believe this charge is incorrect or would like to dispute it, please contact us immediately.</p>
        </div>
    </div>
</body>
</html>
```

### Email Configuration

Edit your `.env` file with email service credentials:

```env
# Email Configuration
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="autohub@gmail.com"
EMAIL_PASSWORD="your-app-specific-password"
EMAIL_FROM="AutoHub <noreply@autohub.com>"
EMAIL_SECURE="false"

# For Gmail:
# 1. Enable 2-factor authentication
# 2. Generate app-specific password at myaccount.google.com/apppasswords
# 3. Use that password above

# For other providers:
# Outlook: smtp-mail.outlook.com (port 587)
# SendGrid: smtp.sendgrid.net (port 587)
# AWS SES: email-smtp.{region}.amazonaws.com (port 587)
```

## Scheduled Tasks

The `BookingReminderService` uses `@nestjs/schedule` to send automated email reminders to customers before their vehicle return date. The cron job runs daily at 10:00 AM to check for bookings ending the next day.

### Return Reminder Service

```typescript
// Example: Send reminders 24 hours before vehicle return
@Injectable()
export class BookingReminderService implements OnModuleInit {
    private readonly logger = new Logger(BookingReminderService.name);

    constructor(
        private readonly bookingsService: BookingsService,
        private readonly mailService: MailService
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_10AM)
    async sendReturnReminders() {
        this.logger.log('Starting return reminder job...');
        
        try {
            // Find all bookings ending tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const bookings = await this.bookingsService.findByReturnDate(tomorrow);
            
            for (const booking of bookings) {
                try {
                    await this.mailService.sendReturnReminder(
                        booking.user.email,
                        {
                            customerName: `${booking.user.firstName} ${booking.user.lastName}`,
                            vehicleInfo: `${booking.vehicle.spec.make} ${booking.vehicle.spec.model}`,
                            returnDate: booking.endDate,
                            returnLocation: booking.dropoffLocation,
                            bookingId: booking.id
                        }
                    );
                    
                    this.logger.log(`Reminder sent for booking ${booking.id}`);
                } catch (error) {
                    this.logger.error(`Failed to send reminder for booking ${booking.id}: ${error}`);
                }
            }
        } catch (error) {
            this.logger.error(`Return reminder job failed: ${error}`);
        }
    }
}
```

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
    totalAmount: booking.totalPrice,
    numberOfDays: booking.numberOfDays,
    dailyRate: booking.dailyRate,
    insurance: booking.insurance,
    pickupLocation: booking.pickupLocation,
    dropoffLocation: booking.dropoffLocation
});
```

### Sending Payment Receipt

```typescript
await this.mailService.sendPaymentReceipt(user.email, {
    name: user.firstName,
    bookingId: booking.id,
    amount: payment.amount,
    paymentMethod: payment.method,
    transactionId: payment.gatewayId,
    timestamp: new Date()
});
```

### Sending Late Return Notification

```typescript
await this.mailService.sendLateReturnNotification(user.email, {
    customerName: user.firstName,
    vehicleModel: `${booking.vehicle.spec.make} ${booking.vehicle.spec.model}`,
    bookingId: booking.id,
    expectedReturnTime: booking.endDate,
    actualReturnTime: new Date(),
    lateDuration: 2.5,
    gracePeriod: 2,
    billableHours: 0.5,
    hourlyRate: 3.13,
    penaltyMultiplier: 1.5,
    penaltyAmount: 2.35
});
```

## How to Extend

### Adding a New Email Template

#### Step 1: Create Template File

Create a new Handlebars template in `src/mail/templates/`:

```handlebars
<!-- src/mail/templates/your-new-template.hbs -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        /* Your styles here */
    </style>
</head>
<body>
    <h1>{{title}}</h1>
    <p>Hello {{recipientName}},</p>
    {{#if includeDetails}}
        <h2>Details:</h2>
        <ul>
            {{#each details}}
                <li>{{this}}</li>
            {{/each}}
        </ul>
    {{/if}}
    <p>Best regards,<br>AutoHub Team</p>
</body>
</html>
```

#### Step 2: Add Method to MailService

Edit `src/mail/mail.service.ts`:

```typescript
async sendYourNotification(email: string, context: any): Promise<void> {
    await this.sendMail({
        to: email,
        subject: 'Your Subject Line',
        template: 'your-new-template',  // filename without extension
        context: {
            recipientName: context.name,
            title: context.title,
            includeDetails: context.details && context.details.length > 0,
            details: context.details || []
        }
    });
}
```

#### Step 3: Use in Your Service

```typescript
// In your service where you need to send emails
await this.mailService.sendYourNotification(userEmail, {
    name: 'John Doe',
    title: 'Important Update',
    details: ['Detail 1', 'Detail 2', 'Detail 3']
});
```

### Adding Scheduled Email Notifications

#### Step 1: Create Notification Service

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';
import { YourService } from './your.service';

@Injectable()
export class YourReminderService {
    private readonly logger = new Logger(YourReminderService.name);

    constructor(
        private readonly mailService: MailService,
        private readonly yourService: YourService
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_NOON)
    async sendReminders() {
        this.logger.log('Starting reminder job...');
        
        try {
            // Fetch data that needs reminders
            const itemsNeedingReminder = await this.yourService.findPending();
            
            for (const item of itemsNeedingReminder) {
                try {
                    await this.mailService.sendYourReminder(item.email, {
                        // your context data
                    });
                    
                    this.logger.log(`Reminder sent for item ${item.id}`);
                } catch (error) {
                    this.logger.error(`Failed to send reminder: ${error}`);
                }
            }
        } catch (error) {
            this.logger.error(`Reminder job failed: ${error}`);
        }
    }
}
```

#### Step 2: Register Service in Module

```typescript
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { YourReminderService } from './your-reminder.service';
import { YourService } from './your.service';

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [YourReminderService, YourService]
})
export class YourModule {}
```

### Email Queue for High-Volume Scenarios

For better performance with many emails, implement a queue:

```typescript
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class MailQueueService {
    constructor(
        @InjectQueue('email') private emailQueue: Queue
    ) {}

    async sendEmailAsync(email: string, template: string, context: any) {
        await this.emailQueue.add(
            { email, template, context },
            { delay: 5000, attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
        );
    }
}

// Consumer
@Processor('email')
export class EmailConsumer {
    constructor(private mailService: MailService) {}

    @Process()
    async handleEmail(job: Job<{ email: string; template: string; context: any }>) {
        const { email, template, context } = job.data;
        await this.mailService.sendMail({
            to: email,
            template,
            context
        });
    }
}
```

## Best Practices

1. **Use Templates**: Always use templates for consistent email styling and content
2. **Include Personalization**: Address the recipient by name when possible
3. **Context Validation**: Validate context data before sending to prevent template errors
4. **Error Handling**: Implement proper error handling for email sending failures
5. **Retry Logic**: Automatically retry failed sends with exponential backoff
6. **Email Queue**: Consider implementing an email queue for high-volume scenarios
7. **Test Emails**: Use services like Mailtrap for testing in development
8. **Email Preview**: Test templates in multiple email clients
9. **Unsubscribe Link**: Always include unsubscribe options for marketing emails
10. **Rate Limiting**: Implement rate limiting to avoid spam flags

## Testing

To test email notifications:

#### 1. Configure Test Email Service

Use Mailtrap for development:

```env
EMAIL_HOST="smtp.mailtrap.io"
EMAIL_PORT="465"
EMAIL_USER="your-mailtrap-username"
EMAIL_PASSWORD="your-mailtrap-password"
EMAIL_SECURE="true"
```

#### 2. Write Unit Tests

```typescript
describe('MailService', () => {
    let service: MailService;
    let mockTransporter: any;

    beforeEach(async () => {
        mockTransporter = {
            sendMail: jest.fn().mockResolvedValue({ response: 'success' })
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: 'MAIL_TRANSPORTER',
                    useValue: mockTransporter
                }
            ]
        }).compile();

        service = module.get<MailService>(MailService);
    });

    it('should send booking confirmation email', async () => {
        await service.sendBookingConfirmation('test@example.com', {
            name: 'John',
            bookingId: '123',
            startDate: new Date(),
            endDate: new Date(),
            vehicleInfo: 'Tesla Model 3',
            totalAmount: 500
        });

        expect(mockTransporter.sendMail).toHaveBeenCalled();
    });
});
```

#### 3. Write Integration Tests

```typescript
describe('Email Notification Flow', () => {
    it('should send email when booking is created', async () => {
        // Create booking
        const booking = await bookingService.create({...});
        
        // Verify email was sent
        const emailsSent = await getEmailsFromMailtrap();
        expect(emailsSent.length).toBeGreaterThan(0);
        expect(emailsSent[0].subject).toContain('Booking Confirmation');
    });
});
```

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check SMTP credentials in .env
   - Verify email provider allows SMTP
   - Check server firewall/ports

2. **Template Errors**
   - Validate context matches template variables
   - Check Handlebars syntax in template
   - Use template preview before sending

3. **Delivery Issues**
   - Check recipient email validity
   - Review spam filters
   - Monitor email provider logs

## Summary

The email notification system in AutoHub provides a robust, scalable solution for sending transactional and reminder emails. By leveraging templates, scheduled tasks, and proper error handling, the system ensures reliable communication with customers throughout their rental journey.