# AutoHub API Documentation

## System Overview

AutoHub is a comprehensive vehicle rental service API that allows customers to browse, book, and manage car rentals across multiple branch locations.

The system provides:
- User authentication and account management
- Vehicle browsing and filtering by specifications
- Booking creation, modification, and cancellation
- Branch location management and availability checks
- Payment processing and invoice generation
- Customer support ticketing system
- Fleet management for administrators
- Email notifications for bookings, payments, and support interactions

This API powers both customer-facing applications and administrative tools for managing the car rental business.

## Swagger/OpenAPI Documentation

The AutoHub API is documented using Swagger (OpenAPI), which provides an interactive interface for exploring and testing the API endpoints.

### Accessing the Documentation

After starting the application, you can access the API documentation at:

```
http://localhost:8000/api/docs
```

Replace `8000` with your actual application port if it's different.

### Features of the API Documentation

- **Interactive UI**: Explore all available endpoints with detailed descriptions
- **Request/Response Examples**: See how to structure your requests and what responses to expect
- **Authentication**: Test secured endpoints by providing JWT tokens
- **Models**: View the structure of all data models used in the API
- **Try It Out**: Execute API calls directly from the documentation

### Authenticated Endpoints

Most endpoints require authentication. To use these endpoints in the Swagger UI:

1. Click the "Authorize" button at the top of the page
2. Enter your JWT token in the format: `Bearer your_jwt_token_here`
3. Click "Authorize"

After authorization, you'll be able to use the protected endpoints.

### API Tags

The API endpoints are organized into the following tags:

- **auth**: Authentication operations (login, signup, refresh token, etc.)
- **users**: User account management
- **bookings**: Vehicle booking operations
- **vehicles**: Vehicle management
- **vehicle-specs**: Vehicle specifications management
- **branches**: Branch location management
- **payments**: Payment processing
- **support**: Customer support tickets
- **fleet-management**: Fleet management operations

## Extending the Documentation

When adding new endpoints or modifying existing ones, be sure to update the Swagger documentation using the appropriate decorators:

### Controller Level Decorators

- `@ApiTags('tag-name')`: Categorize endpoints under a specific tag
- `@ApiBearerAuth()`: Mark endpoints as requiring JWT authentication

### Method Level Decorators

- `@ApiOperation()`: Provide summary and description for an endpoint
- `@ApiResponse()`: Document possible responses
- `@ApiParam()`: Document path parameters
- `@ApiQuery()`: Document query parameters
- `@ApiBody()`: Document request body

### DTO Decorators

- `@ApiProperty()`: Document required properties
- `@ApiPropertyOptional()`: Document optional properties

## Complete API Endpoint Reference

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1-555-0123"
}

Response: 201 Created
{
    "id": "user-123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "SecurePassword123!"
}

Response: 200 OK
{
    "id": "user-123",
    "email": "user@example.com",
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer {refreshToken}

Response: 200 OK
{
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
}
```

### Vehicles Endpoints

#### List All Vehicles
```http
GET /api/vehicles?page=1&limit=10&status=available&make=Tesla
Authorization: Bearer {token}

Response: 200 OK
{
    "data": [
        {
            "id": "v1",
            "licensePlate": "TESLA3",
            "make": "Tesla",
            "model": "Model 3",
            "year": 2024,
            "fuelType": "electric",
            "status": "available",
            "dailyRate": 75,
            "weeklyRate": 450,
            "monthlyRate": 1500,
            "mileage": 45230,
            "fuelLevel": 100,
            "images": ["image1.jpg", "image2.jpg"]
        }
    ],
    "total": 50,
    "page": 1,
    "limit": 10
}
```

#### Get Vehicle Details
```http
GET /api/vehicles/{vehicleId}
Authorization: Bearer {token}

Response: 200 OK
{
    "id": "v1",
    "licensePlate": "TESLA3",
    "make": "Tesla",
    "model": "Model 3",
    "year": 2024,
    "fuelType": "electric",
    "status": "available",
    "dailyRate": 75,
    "weeklyRate": 450,
    "monthlyRate": 1500,
    "specifications": {
        "transmission": "Automatic",
        "seats": 5,
        "doors": 4,
        "color": "Pearl White",
        "features": ["GPS", "Backup Camera", "Bluetooth", "Sunroof"]
    },
    "currentLocation": {
        "branch": "LA Downtown",
        "coordinates": "34.0522, -118.2437"
    }
}
```

#### Check Availability
```http
GET /api/vehicles/{vehicleId}/availability?startDate=2025-05-01&endDate=2025-05-05
Authorization: Bearer {token}

Response: 200 OK
{
    "vehicle": "v1",
    "startDate": "2025-05-01",
    "endDate": "2025-05-05",
    "isAvailable": true,
    "conflicts": []
}
```

### Bookings Endpoints

#### Create Booking
```http
POST /api/bookings
Content-Type: application/json
Authorization: Bearer {token}

{
    "vehicleId": "v1",
    "pickupBranchId": "branch-la",
    "dropoffBranchId": "branch-la",
    "startDate": "2025-05-01T09:00:00Z",
    "endDate": "2025-05-05T17:00:00Z",
    "insuranceType": "comprehensive"
}

Response: 201 Created
{
    "id": "booking-123",
    "vehicle": {
        "id": "v1",
        "make": "Tesla",
        "model": "Model 3"
    },
    "user": {
        "id": "user-456",
        "name": "John Doe"
    },
    "status": "pending",
    "startDate": "2025-05-01T09:00:00Z",
    "endDate": "2025-05-05T17:00:00Z",
    "totalPrice": 375,
    "invoiceId": "inv-789",
    "createdAt": "2025-04-28T10:30:00Z"
}
```

#### Get Booking Details
```http
GET /api/bookings/{bookingId}
Authorization: Bearer {token}

Response: 200 OK
{
    "id": "booking-123",
    "status": "confirmed",
    "vehicle": { ... },
    "customer": { ... },
    "dates": {
        "startDate": "2025-05-01T09:00:00Z",
        "endDate": "2025-05-05T17:00:00Z",
        "duration": "4 days 8 hours"
    },
    "pricing": {
        "dailyRate": 75,
        "daysBooked": 4,
        "baseAmount": 300,
        "insurance": 65,
        "fees": 50,
        "tax": 31.88,
        "totalAmount": 446.88
    },
    "invoice": { ... }
}
```

#### Cancel Booking
```http
POST /api/bookings/{bookingId}/cancel
Content-Type: application/json
Authorization: Bearer {token}

{
    "reason": "Change of plans"
}

Response: 200 OK
{
    "booking": {
        "id": "booking-123",
        "status": "cancelled"
    },
    "refund": {
        "originalAmount": 446.88,
        "refundAmount": 335.16,
        "cancellationFee": 25,
        "status": "processing"
    }
}
```

### Payments Endpoints

#### List Transactions
```http
GET /api/payments/transactions?page=1&limit=10&status=completed
Authorization: Bearer {token}

Response: 200 OK
{
    "data": [
        {
            "id": "txn-001",
            "booking": "booking-123",
            "amount": 446.88,
            "status": "completed",
            "method": "card",
            "gatewayId": "ch_stripe_123",
            "createdAt": "2025-04-28T10:30:00Z"
        }
    ],
    "total": 150,
    "page": 1
}
```

#### Create Payment Intent
```http
POST /api/payments/intent
Content-Type: application/json
Authorization: Bearer {token}

{
    "bookingId": "booking-123",
    "amount": 446.88,
    "currency": "USD"
}

Response: 201 Created
{
    "intentId": "pi_stripe_123",
    "clientSecret": "pi_stripe_123_secret_...",
    "status": "requires_payment_method",
    "amount": 446.88
}
```

### Invoices Endpoints

#### Generate Invoice
```http
POST /api/invoices/{bookingId}/generate
Authorization: Bearer {token}

Response: 201 Created
{
    "id": "inv-789",
    "invoiceNumber": "INV-2025-000123",
    "status": "generated",
    "totalAmount": 446.88,
    "createdAt": "2025-04-28T10:30:00Z"
}
```

#### Get Invoice
```http
GET /api/invoices/{invoiceId}
Authorization: Bearer {token}

Response: 200 OK (Full invoice details)
```

#### Download Invoice PDF
```http
GET /api/invoices/{invoiceId}/pdf
Authorization: Bearer {token}

Response: 200 OK (PDF file download)
```

### Support Endpoints

#### Create Support Ticket
```http
POST /api/support/tickets
Content-Type: application/json
Authorization: Bearer {token}

{
    "subject": "Issue with booking",
    "category": "technical",
    "priority": "high",
    "description": "I'm unable to complete my booking",
    "attachments": ["image-url"]
}

Response: 201 Created
{
    "id": "ticket-456",
    "ticketNumber": "TKT-2025-001234",
    "status": "open",
    "createdAt": "2025-04-28T10:30:00Z"
}
```

#### List Support Tickets
```http
GET /api/support/tickets?status=open&priority=high
Authorization: Bearer {token}

Response: 200 OK
{
    "data": [
        {
            "id": "ticket-456",
            "ticketNumber": "TKT-2025-001234",
            "subject": "Issue with booking",
            "status": "open",
            "priority": "high",
            "createdAt": "2025-04-28T10:30:00Z"
        }
    ],
    "total": 5,
    "page": 1
}
```

### Fleet Management Endpoints

#### Fleet Overview
```http
GET /api/fleet-management/analytics/overview
Authorization: Bearer {adminToken}

Response: 200 OK
{
    "summary": {
        "totalVehicles": 50,
        "activeVehicles": 42,
        "maintenanceVehicles": 6,
        "averageUtilization": 58.5,
        "totalRevenue": 125450
    },
    "topPerformers": [...],
    "underutilized": [...]
}
```

#### Vehicle Analytics
```http
GET /api/fleet-management/analytics/vehicles/{vehicleId}
Authorization: Bearer {adminToken}

Response: 200 OK
{
    "vehicle": { ... },
    "monthlyMetrics": {
        "bookings": 25,
        "revenue": 8920,
        "maintenanceCost": 1200,
        "profit": 7720,
        "utilization": 83.3
    }
}
```

## Best Practices for API Usage

1. **Always Authenticate**: Use valid JWT tokens for all protected endpoints
2. **Handle Rate Limiting**: Implement exponential backoff for retries
3. **Validate Input**: Check all required fields before sending requests
4. **Error Handling**: Always check response status and error messages
5. **Pagination**: Use page and limit parameters for large datasets
6. **Timestamps**: All dates are in ISO 8601 format (UTC)
7. **Webhooks**: Subscribe to webhooks for real-time updates

## Example API Integration

```typescript
// Initialize API Client
const client = new AutoHubClient({
    baseURL: 'https://api.autohub.com',
    apiKey: 'your-api-key'
});

// Make authenticated request
try {
    const bookings = await client.get('/bookings', {
        params: {
            page: 1,
            limit: 10,
            status: 'confirmed'
        }
    });
    
    console.log('Active bookings:', bookings.data);
} catch (error) {
    console.error('API Error:', error.response.data);
}
```

## Error Responses

All error responses follow this format:

```json
{
    "statusCode": 400,
    "message": "Validation failed",
    "errors": [
        {
            "field": "email",
            "constraint": "isEmail",
            "message": "email must be an email"
        }
    ],
    "timestamp": "2025-04-28T10:30:00Z",
    "path": "/api/auth/register"
}
```

### Common Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Server Error - Internal server error |

## Example

```typescript
@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingController {
  
  @Post()
  @ApiOperation({ summary: 'Create booking', description: 'Create a new vehicle booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking data' })
  create(@Body() createBookingDto: CreateBookingDto) {
    // Implementation
  }
}
```

## Best Practices

1. Always document all endpoints with meaningful descriptions
2. Include all possible response status codes and their meanings
3. Document all DTO properties with examples when helpful
4. Keep documentation updated when the API changes
5. Use enums for values with a fixed set of options
6. Include examples for complex data structures