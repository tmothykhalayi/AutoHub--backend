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