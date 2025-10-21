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

## Troubleshooting

If you encounter issues when using the Swagger UI:

1. **Authentication errors**: Make sure you've correctly authorized with your bearer token
2. **Validation errors**: Check the error response for details about what fields need to be corrected
3. **Server errors**: Check the server logs for more details about the error

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Swagger Documentation](https://swagger.io/docs/)