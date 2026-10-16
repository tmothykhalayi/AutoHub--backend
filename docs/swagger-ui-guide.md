# Swagger UI Guide for AutoHub API

## Introduction

This guide will help you use the Swagger UI documentation for the AutoHub API. Swagger UI provides an interactive documentation that allows you to explore and test API endpoints directly from your browser.

## Accessing Swagger UI

The Swagger UI documentation is available at the following URL when your server is running:

```
http://localhost:3000/api/docs
```

Replace `3000` with the actual port your server is running on if different.

## Using Swagger UI

### 1. Authentication

Most endpoints in the AutoHub API require authentication. To authenticate:

1. Click on the "Authorize" button at the top right corner of the page
2. In the "Value" field, enter your bearer token in the format `Bearer YOUR_TOKEN_HERE`
3. Click "Authorize" and then "Close"

You can obtain a token by using the `/auth/login` endpoint.

### 2. Exploring Endpoints

Endpoints are grouped by tags/categories:

- **auth**: Authentication endpoints for login, registration, etc.
- **users**: User management endpoints
- **bookings**: Booking management endpoints
- **vehicles**: Vehicle management endpoints
- **vehicle-specs**: Vehicle specification endpoints
- **branches**: Branch management endpoints
- **payments**: Payment processing endpoints
- **support**: Customer support endpoints
- **fleet-management**: Fleet management endpoints

Click on any category to expand and see the available endpoints.

### 3. Testing Endpoints

To test an endpoint:

1. Click on the endpoint you want to test
2. Click the "Try it out" button
3. Fill in the required parameters (path parameters, query parameters, and request body)
4. Click "Execute"
5. The response will be displayed below the request

### 4. Understanding Response Codes

Each endpoint has documented response codes:

- **200/201**: Successful operation
- **400**: Bad request - usually indicates validation errors
- **401**: Unauthorized - authentication required
- **403**: Forbidden - insufficient permissions
- **404**: Not found - resource doesn't exist
- **500**: Server error

### 5. Models

At the bottom of the page, you'll find the "Schemas" section that describes all data models used by the API.

## Common Tasks

### Registering a New User

1. Expand the "auth" section
2. Find the "POST /auth/register" endpoint
3. Click "Try it out"
4. Provide the required user information in the request body
5. Click "Execute"

### Making a Booking

1. First, authenticate as described above
2. Expand the "bookings" section
3. Find the "POST /bookings" endpoint
4. Click "Try it out"
5. Fill in the booking details in the request body
6. Click "Execute"

## Using Swagger UI

### 1. Authentication

Most endpoints in the AutoHub API require authentication. To use these endpoints in the Swagger UI:

#### Method 1: Using Bearer Token

1. Click the "Authorize" button at the top right corner of the page
2. In the dialog that opens, enter your JWT token in the format: `Bearer YOUR_TOKEN_HERE`
3. Click "Authorize" and then "Close"

After authorization, you'll be able to use the protected endpoints.

#### Method 2: Getting a Token

Before you can authorize, you need a token:

1. Expand the "auth" section
2. Find the "POST /auth/login" endpoint
3. Click "Try it out"
4. Enter your email and password:
   ```json
   {
       "email": "user@example.com",
       "password": "YourPassword123!"
   }
   ```
5. Click "Execute"
6. Copy the `accessToken` from the response
7. Go back to "Authorize" and use this token

### 2. Exploring Endpoints

Endpoints are grouped by tags/categories for easy navigation:

- **auth**: Authentication operations (login, signup, refresh token, etc.)
- **users**: User account management
- **bookings**: Vehicle booking operations
- **vehicles**: Vehicle management and listing
- **vehicle-specs**: Vehicle specification management
- **branches**: Branch location management
- **payments**: Payment processing operations
- **support**: Customer support ticket management
- **fleet-management**: Fleet analytics and management
- **invoices**: Invoice generation and retrieval

Click on any category to expand and see the available endpoints.

### 3. Understanding Endpoint Details

Each endpoint shows:

- **Method**: GET, POST, PUT, DELETE, PATCH
- **URL**: The endpoint path
- **Summary**: Brief description of what it does
- **Description**: Detailed explanation
- **Parameters**: Required/optional path, query, and body parameters
- **Responses**: Possible response codes with examples

### 4. Testing Endpoints

To test an endpoint:

1. Click on the endpoint you want to test
2. Read the description to understand what it does
3. Look for the "Try it out" button
4. Fill in the required parameters:
   - **Path Parameters**: Replace {paramName} in the URL
   - **Query Parameters**: Fill in search, filter, pagination values
   - **Request Body**: Enter JSON data as shown in examples
5. Click "Execute"
6. The response will be displayed below the request

### 5. Understanding Response Codes

Each endpoint has documented response codes:

| Code | Meaning |
|------|---------|
| **200** | OK - Successful GET/PUT request |
| **201** | Created - Successful POST request |
| **204** | No Content - Successful DELETE request |
| **400** | Bad Request - Usually validation errors |
| **401** | Unauthorized - Missing/invalid authentication |
| **403** | Forbidden - Insufficient permissions for resource |
| **404** | Not Found - Resource doesn't exist |
| **409** | Conflict - Resource already exists |
| **422** | Unprocessable Entity - Semantic validation error |
| **429** | Too Many Requests - Rate limit exceeded |
| **500** | Server Error - Internal server error |

### 6. Viewing Data Models

At the bottom of the page, you'll find the "Schemas" section that describes all data models used by the API.

Click on any model to see its structure, including:
- Required fields
- Data types
- Field descriptions
- Example values

## Common Tasks

### Registering a New User

1. Expand the "auth" section
2. Find the "POST /auth/register" endpoint
3. Click "Try it out"
4. Enter the required information:
   ```json
   {
       "email": "newuser@example.com",
       "password": "SecurePassword123!",
       "firstName": "John",
       "lastName": "Doe",
       "phoneNumber": "+1-555-0123"
   }
   ```
5. Click "Execute"
6. You'll receive an `accessToken` to use for authenticated requests

### Logging In

1. Expand the "auth" section
2. Find the "POST /auth/login" endpoint
3. Click "Try it out"
4. Enter your credentials:
   ```json
   {
       "email": "user@example.com",
       "password": "YourPassword123!"
   }
   ```
5. Click "Execute"
6. Save the returned `accessToken` for future requests
7. Use this token in the "Authorize" button

### Browsing Available Vehicles

1. Authenticate first (see above)
2. Expand the "vehicles" section
3. Find the "GET /vehicles" endpoint
4. Click "Try it out"
5. (Optional) Filter by status, make, etc. using query parameters
6. Click "Execute"
7. Browse the list of available vehicles

### Checking Vehicle Availability

1. Expand the "vehicles" section
2. Find the "GET /vehicles/{vehicleId}/availability" endpoint
3. Click "Try it out"
4. Enter the vehicle ID (e.g., from the vehicles list)
5. Enter your desired dates:
   - `startDate`: 2025-05-01
   - `endDate`: 2025-05-05
6. Click "Execute"
7. See if the vehicle is available for your dates

### Making a Booking

1. First, authenticate and note a vehicle ID
2. Expand the "bookings" section
3. Find the "POST /bookings" endpoint
4. Click "Try it out"
5. Enter the booking details:
   ```json
   {
       "vehicleId": "vehicle-id-here",
       "pickupBranchId": "branch-la",
       "dropoffBranchId": "branch-la",
       "startDate": "2025-05-01T09:00:00Z",
       "endDate": "2025-05-05T17:00:00Z",
       "insuranceType": "comprehensive"
   }
   ```
6. Click "Execute"
7. You'll receive booking confirmation with an invoice

### Canceling a Booking

1. Expand the "bookings" section
2. Find the "POST /bookings/{bookingId}/cancel" endpoint
3. Click "Try it out"
4. Enter the booking ID you want to cancel
5. Enter a cancellation reason (optional):
   ```json
   {
       "reason": "Change of plans"
   }
   ```
6. Click "Execute"
7. Review the refund amount and status

### Getting Payment History

1. Expand the "payments" section
2. Find the "GET /payments/transactions" endpoint
3. Click "Try it out"
4. (Optional) Filter by status using query parameters
5. Click "Execute"
6. Review your transaction history

### Creating a Support Ticket

1. Expand the "support" section
2. Find the "POST /support/tickets" endpoint
3. Click "Try it out"
4. Enter your support request:
   ```json
   {
       "subject": "My issue here",
       "category": "technical",
       "priority": "high",
       "description": "Detailed description of the issue"
   }
   ```
5. Click "Execute"
6. You'll receive a ticket number for tracking

### Viewing Fleet Analytics (Admin Only)

1. Authenticate with an admin account
2. Expand the "fleet-management" section
3. Find the "GET /fleet-management/analytics/overview" endpoint
4. Click "Try it out"
5. Click "Execute"
6. Review fleet statistics, top performers, and underutilized vehicles

## Tips and Tricks

### 1. Copy Response as cURL

Many API testing tools (including Swagger) allow you to copy the request as cURL:
- Right-click the request area
- Select "Copy as cURL"
- Paste in your terminal for the same result

### 2. Use Sample Data

Click the "Example" button under the request body to see sample data for the endpoint.

### 3. Save Your Session

Some Swagger UI versions allow you to save your authentication token across sessions by storing it locally.

### 4. Export OpenAPI Specification

Download the OpenAPI spec for use in other tools:
- Look for a download button near the title
- Import into tools like Postman or Insomnia

### 5. Check Rate Limits

Most endpoints include rate limit information:
- Check response headers for `X-RateLimit-Limit`
- Check `X-RateLimit-Remaining` to see how many requests you have left
- Check `X-RateLimit-Reset` for when the limit resets

## Advanced Features

### Pagination

When retrieving lists, use pagination parameters:
- `page`: Page number (starting at 1)
- `limit`: Number of items per page (default 10, max 100)

Example:
```
GET /api/bookings?page=2&limit=25
```

### Filtering

Most list endpoints support filtering:
```
GET /api/vehicles?status=available&make=Tesla
GET /api/bookings?status=confirmed
GET /api/support/tickets?priority=high
```

### Sorting

Some endpoints support sorting:
```
GET /api/bookings?sortBy=createdAt&sortOrder=desc
```

## Troubleshooting

### Authentication errors

**Problem**: "401 Unauthorized"

**Solutions**:
- Make sure you've correctly authorized with your token
- Check that the token hasn't expired
- Try logging in again to get a fresh token
- Verify the Bearer prefix is included: `Bearer YOUR_TOKEN`

### Validation errors

**Problem**: "400 Bad Request" with validation errors

**Solutions**:
- Check the error response for field-specific messages
- Review the schema definition for required fields
- Ensure data types match (strings, numbers, booleans)
- Verify date formats (ISO 8601 format required)

### Server errors

**Problem**: "500 Internal Server Error"

**Solutions**:
- The server may be temporarily down
- Check the server logs for details
- Retry the request
- Contact support if the error persists

### Resource not found

**Problem**: "404 Not Found"

**Solutions**:
- Double-check the resource ID (booking, vehicle, etc.)
- Verify the resource exists
- Make sure you're using the correct ID format

### Rate limit exceeded

**Problem**: "429 Too Many Requests"

**Solutions**:
- Wait for the rate limit to reset (check response headers)
- Reduce the frequency of your requests
- Implement exponential backoff in your application

## Accessing Swagger UI

The Swagger UI documentation is available at:

```
http://your-domain:3000/api/docs
```

Or in development:

```
http://localhost:3001/api/docs
```

Replace the port (3001) with your actual application port if it's different.

## Additional Resources

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [Swagger/OpenAPI Official Documentation](https://swagger.io/docs/)
- [HTTP Status Codes Reference](https://httpwg.org/specs/rfc7231.html#status.codes)
- [ISO 8601 Date Format](https://en.wikipedia.org/wiki/ISO_8601)
- [Bearer Token Authentication](https://tools.ietf.org/html/rfc6750)