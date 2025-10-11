<p align="center">
  <h1>AutoHub Backend - Vehicle Rental Management System</h1>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-10.0-e0234e?logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-15.0-336791?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/TypeORM-0.3-orange?logo=typeorm&logoColor=white" alt="TypeORM" />
  <img src="https://img.shields.io/badge/Stripe-8.0-635bff?logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/JWT-Authentication-black?logo=jsonwebtokens" alt="JWT" />
</p>

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Backend Features](#backend-features)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Payment Processing](#payment-processing)
- [Email Notifications](#email-notifications)
- [Testing](#testing)
- [Deployment](#deployment)

## 🏢 System Overview
AutoHub Backend is a comprehensive NestJS-based API that powers a modern vehicle rental management system. It provides robust, scalable, and secure backend services for managing vehicle rentals, user accounts, payments, and administrative functions.

### Key Technologies:
- **Framework**: NestJS 10.x with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with secure password hashing
- **Payments**: Stripe integration
- **Notifications**: NodeMailer for email services
- **Validation**: Class validator and Zod
- **API Documentation**: Swagger/OpenAPI

## 🏗️ Architecture
### Module Structure
```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root application module
├── common/                      # Shared utilities and decorators
│   ├── decorators/              # Custom decorators
│   ├── filters/                 # Exception filters
│   ├── interceptors/            # Response interceptors
│   └── middleware/              # Custom middleware
├── config/                      # Configuration management
├── modules/                     # Feature modules
│   ├── auth/                    # Authentication & authorization
│   ├── users/                   # User management
│   ├── vehicles/                # Vehicle inventory management
│   ├── bookings/                # Booking reservations
│   ├── payments/                # Payment processing
│   ├── locations/               # Branch locations
│   ├── support/                 # Customer support tickets
│   └── fleet/                   # Fleet management
├── database/                    # Database configuration
│   ├── typeorm.config.ts        # TypeORM configuration
│   ├── entities/                # Entity definitions
│   └── migrations/              # Database migrations
└── shared/                      # Shared resources
    ├── dto/                     # Data transfer objects
    ├── interfaces/              # TypeScript interfaces
    └── types/                   # Common types
```

## ✨ Backend Features

### 🔐 Authentication Module
- JWT-based authentication system
- Role-based access control (User/Admin)
- Secure password hashing with bcrypt
- Refresh token mechanism
- Guard protected routes

### 👥 Users Module
- User registration and profile management
- CRUD operations for user accounts
- Admin user management capabilities
- Profile update functionality

### 🚗 Vehicles Module
- Complete vehicle inventory management
- Advanced filtering and search capabilities
- Availability checking based on bookings
- Vehicle specifications management
- Rental rate configuration

### 📅 Bookings Module
- Booking creation with date validation
- Rental duration calculation
- Automatic total amount computation
- Booking status management (Pending, Confirmed, Completed, Cancelled)
- Conflict detection for overlapping bookings

### 💳 Payments Module
- Stripe integration for payment processing
- Payment intent creation
- Webhook handling for payment confirmation
- Payment status management
- Transaction history

### 🏢 Locations Module
- Rental branch management
- Location-based vehicle availability
- Contact information management

### 🛠️ Support Module
- Customer support ticket system
- Ticket status tracking
- Admin response management

### 🚛 Fleet Management Module
- Vehicle acquisition tracking
- Maintenance scheduling
- Depreciation calculation
- Fleet status monitoring

### 📧 Email Services Module
- Transactional emails for account verification
- Booking confirmation notifications
- Payment receipt delivery
- Password reset instructions
- Customized email templates
- Email scheduling and queuing

## 🚀 Installation

### Prerequisites
- Node.js 18.0 or higher
- PostgreSQL 12.0 or higher
- pnpm package manager

### Step-by-Step Setup
1. Clone the repository
```bash
git clone https://github.com/tmothykhalayi/AutoHub.git
cd AutoHub/Server
```

2. Install dependencies
```bash
pnpm install
```

3. Environment configuration
```bash
cp .env.example .env
```

Edit the .env file with your configuration:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/autohub"

# JWT
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"
REFRESH_TOKEN_EXPIRES_IN="30d"

# Stripe
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Email Configuration
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_FROM="AutoHub <noreply@autohub.com>"
EMAIL_SECURE=false

# Application
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
```

4. Database setup
```bash
# Create database (ensure PostgreSQL is running)
createdb autohub

# Run TypeORM migrations
pnpm run typeorm:migration:run

# Seed with sample data (optional)
pnpm run seed
```

5. Start the development server
```bash
# development
pnpm run start

# watch mode
pnpm run start:dev

# production mode
pnpm run start:prod
```

The API will be available at http://localhost:3001

## 📖 API Documentation

### Interactive API Docs
Once the server is running, access the auto-generated Swagger documentation at:
```
http://localhost:3001/api
```

### API Endpoints Overview

#### Authentication Endpoints
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get current user profile
- `POST /auth/refresh` - Refresh access token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

#### Users Endpoints
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user (Admin only)

#### Vehicles Endpoints
- `GET /vehicles` - Get all vehicles with filtering
- `GET /vehicles/:id` - Get vehicle by ID
- `POST /vehicles` - Create new vehicle (Admin only)
- `PUT /vehicles/:id` - Update vehicle (Admin only)
- `DELETE /vehicles/:id` - Delete vehicle (Admin only)
- `GET /vehicles/:id/availability` - Check vehicle availability

#### Bookings Endpoints
- `GET /bookings` - Get user's bookings
- `POST /bookings` - Create new booking
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id` - Update booking
- `DELETE /bookings/:id` - Cancel booking
- `GET /bookings/user/:userId` - Get bookings by user (Admin only)

#### Payments Endpoints
- `POST /payments/create-intent` - Create payment intent
- `POST /payments/confirm` - Confirm payment
- `GET /payments/:id` - Get payment details
- `POST /payments/webhook` - Stripe webhook handler

#### Admin Endpoints
- `GET /admin/dashboard` - Admin dashboard statistics
- `GET /admin/reports/bookings` - Booking reports
- `GET /admin/reports/revenue` - Revenue reports
- `GET /admin/support/tickets` - Support tickets management

## 📊 Database Schema

### Entity Relationships
The database uses TypeORM to manage the following entities:

```
User Entity
  ├── one-to-many → Bookings
  └── one-to-many → Payments

Vehicle Entity
  ├── many-to-one → VehicleCategory
  ├── one-to-many → Bookings
  └── many-to-one → Location

Booking Entity
  ├── many-to-one → User
  ├── many-to-one → Vehicle
  └── one-to-one → Payment

Payment Entity
  ├── many-to-one → User
  └── one-to-one → Booking

Location Entity
  └── one-to-many → Vehicles

VehicleCategory Entity
  └── one-to-many → Vehicles

SupportTicket Entity
  └── many-to-one → User
```

### Key TypeORM Entities

```typescript
// User Entity Example
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @Column({ nullable: true })
  refreshToken: string;

  @OneToMany(() => Booking, booking => booking.user)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

## 🔐 Authentication System

### JWT Implementation
The authentication system uses JSON Web Tokens for secure stateless authentication:

```typescript
// Token payload structure
interface JwtPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}
```

### Password Security
- Passwords are hashed using bcrypt with salt rounds = 12
- No plain text passwords are stored in the database
- Password reset tokens are securely generated and hashed

### Role-Based Access Control
- User role: Can access personal bookings, profile management
- Admin role: Full system access including user management, reports, and vehicle management

## 💳 Payment Processing

### Stripe Integration
The system integrates with Stripe for secure payment processing:

- Payment Intent Creation: When a booking is created
- Client-Side Confirmation: Frontend confirms payment with Stripe Elements
- Webhook Handling: Server listens for payment confirmation events
- Booking Confirmation: Upon successful payment, booking status is updated

## 📧 Email Notifications

### NodeMailer Integration
The system uses NodeMailer for sending transactional emails:

```typescript
// Email service implementation
@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: this.configService.get('EMAIL_SECURE') === 'true',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
  }): Promise<void> {
    // Email sending implementation
  }
}
```

### Email Templates
The system includes pre-built templates for common notifications:

- Welcome emails for new users
- Booking confirmations with details
- Payment receipts
- Rental reminders
- Return confirmations
- Password reset instructions
- Account verification links

### Email Queue System
To ensure reliable email delivery, the system implements a queue:

- Failed email retry mechanism
- Rate limiting to prevent spam detection
- Email analytics and tracking
- Scheduled emails for reminders

## 🧪 Testing

### Test Structure
```
test/
├── e2e/                 # End-to-end tests
├── integration/         # Integration tests
├── unit/                # Unit tests
└── jest.config.js       # Jest configuration
```
```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:cov

# Run e2e tests
pnpm run test:e2e

# Run specific test file
pnpm run test -- vehicles.service.spec.ts
```

### Test Coverage
The project aims for 80%+ test coverage including:
- Service layer unit tests
- Controller endpoint tests
- Database operation tests
- Authentication flow tests
- Payment processing tests

## 🚀 Deployment

### Production Environment Setup
Environment Variables for production:

```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@production-db:5432/autohub"
JWT_SECRET="strong-production-secret-minimum-32-chars"
STRIPE_SECRET_KEY="sk_live_..."
EMAIL_HOST="smtp.example.com"
EMAIL_PORT=587
EMAIL_USER="your-email@example.com"
EMAIL_PASSWORD="your-email-password"
EMAIL_FROM="AutoHub <noreply@autohub.com>"
```

Build the application:
```bash
pnpm run build
```

Start production server:
```bash
pnpm run start:prod
```

### Deployment to Render

1. Create a new Web Service in your Render dashboard

2. Connect your GitHub repository

3. Configure the service:
   - **Name**: autohub-api
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm run start:prod`
   - **Environment Variables**: Add all required environment variables as listed above

4. Add a PostgreSQL database:
   - Create a new PostgreSQL instance in Render
   - Connect it to your web service
   - Render will automatically add the `DATABASE_URL` environment variable

5. Configure CORS:
   - Add the `CORS_ORIGIN` environment variable with your frontend URL

6. Deploy the service:
   - Click "Create Web Service"
   - The deployment will begin automatically

7. Set up a custom domain (optional):
   - Go to your service settings
   - Click on "Custom Domain"
   - Follow the instructions to connect your domain

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm install --frozen-lockfile --prod

COPY dist/ ./dist/
COPY .env ./

EXPOSE 3001

USER node

CMD ["node", "dist/src/main.js"]
```

### Deployment to Azure

For Azure deployment options:

```bash
# Install Azure CLI if not already installed
pnpm install -g azure-cli

# Login to Azure
az login

# Create a resource group
az group create --name AutoHubResourceGroup --location eastus

# Create an App Service plan
az appservice plan create --name AutoHubPlan --resource-group AutoHubResourceGroup --sku B1

# Create a web app
az webapp create --name autohub-api --resource-group AutoHubResourceGroup --plan AutoHubPlan
```

## License

This project is licensed under the MIT License.


