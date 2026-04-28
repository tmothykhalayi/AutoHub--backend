# AutoHub Advanced Backend Features

This document provides comprehensive documentation for the advanced business logic features in AutoHub, including refund processing, penalty calculations, vehicle inspections, invoicing, and fleet analytics.

---

## Table of Contents

1. [Cancellation & Refund Engine](#1-cancellation--refund-engine)
2. [Late Return & Penalty System](#2-late-return--penalty-system)
3. [Vehicle Inspection & Damage Management](#3-vehicle-inspection--damage-management)
4. [Invoice & Tax Engine](#4-invoice--tax-engine)
5. [Fleet Analytics & Business Intelligence](#5-fleet-analytics--business-intelligence)
6. [Scheduled Tasks & Automation](#6-scheduled-tasks--automation)
7. [Email Notification Flows](#7-email-notification-flows)
8. [Configuration & Customization](#8-configuration--customization)
9. [API Integration Examples](#9-api-integration-examples)
10. [Troubleshooting Guide](#10-troubleshooting-guide)

---

## 1. Cancellation & Refund Engine

### Overview

The Cancellation & Refund Engine automatically processes booking cancellations and calculates refunds based on configurable time-based policies. This system reduces manual work, ensures consistent policy application, and improves compliance.

### How It Works

#### Policy Configuration

The system supports time-based refund tiers that determine refund percentages based on when the cancellation occurs relative to the booking start date:

```typescript
Example Default Policy:
┌──────────────────────┬─────────────────┬────────────────┐
│ Hours Before Booking │ Refund %        │ Cancellation Fee│
├──────────────────────┼─────────────────┼────────────────┤
│ > 48 hours          │ 100%            │ $0             │
│ 24-48 hours         │ 75%             │ $25            │
│ 12-24 hours         │ 50%             │ $50            │
│ < 12 hours          │ 0%              │ Full booking   │
└──────────────────────┴─────────────────┴────────────────┘
```

#### Refund Calculation Formula

```typescript
// Calculate time until booking starts
hoursUntilBooking = (bookingStartDate - currentTime) / 3600000

// Find matching policy tier
matchedPolicy = policies.find(p => hoursUntilBooking > p.threshold)

// Calculate refund
refundAmount = totalAmount * (matchedPolicy.refundPercentage / 100)
totalDeduction = totalAmount - refundAmount + matchedPolicy.cancellationFee
```

#### Workflow

```
Customer Initiates Cancellation
           ↓
System Validates Booking Status (must be Pending/Confirmed)
           ↓
Calculate Hours Until Start Date
           ↓
Match Against Policy Tiers
           ↓
Calculate Refund Amount
           ↓
Create Payment Refund via Gateway (Stripe/Paystack)
           ↓
Update Booking Status → Cancelled
           ↓
Send Confirmation Email to Customer
```

### Features & Benefits

| Feature | Benefit |
|---------|---------|
| Automated Calculation | No manual refund processing |
| Policy Enforcement | Consistent application across all bookings |
| Grace Periods | Support for penalty-free cancellations |
| Payment Integration | Automatic refund to original payment method |
| Audit Trail | Complete record for compliance & accounting |
| Email Notifications | Customers instantly informed |

### Database Schema

```sql
-- Refunds Table
CREATE TABLE refunds (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    original_amount DECIMAL(10, 2),
    refund_amount DECIMAL(10, 2),
    cancellation_fee DECIMAL(10, 2),
    applied_policy_id UUID REFERENCES cancellation_policies(id),
    payment_gateway VARCHAR(50),     -- 'stripe', 'paystack'
    gateway_refund_id VARCHAR(255),
    status VARCHAR(50),               -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP,
    completed_at TIMESTAMP,
    reason TEXT,
    admin_notes TEXT
);

-- Cancellation Policies Table
CREATE TABLE cancellation_policies (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    hours_threshold INTEGER,
    refund_percentage DECIMAL(5, 2),
    cancellation_fee DECIMAL(10, 2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### API Endpoints

#### Cancel Booking

**Request:**
```http
POST /api/bookings/{bookingId}/cancel
Content-Type: application/json
Authorization: Bearer {token}

{
    "reason": "Change of plans",
    "requestedByAdmin": false
}
```

**Response:**
```http
200 OK
{
    "booking": {
        "id": "booking-123",
        "status": "cancelled",
        "cancelledAt": "2025-04-28T10:30:00Z"
    },
    "refund": {
        "id": "refund-456",
        "originalAmount": 500.00,
        "refundAmount": 375.00,
        "cancellationFee": 25.00,
        "netRefund": 350.00,
        "status": "processing",
        "estimatedCompletion": "2025-04-30"
    }
}
```

#### Get Refund Details

```http
GET /api/refunds/{refundId}
Authorization: Bearer {token}

Response:
{
    "id": "refund-456",
    "booking": {
        "id": "booking-123",
        "vehicle": "Tesla Model 3",
        "startDate": "2025-05-01",
        "endDate": "2025-05-05"
    },
    "appliedPolicy": {
        "name": "Standard Policy",
        "hourThreshold": 24,
        "refundPercentage": 75,
        "cancellationFee": 25
    },
    "timeline": {
        "cancellationTime": "2025-04-28T10:30:00Z",
        "hoursBeforeBooking": 98,
        "initiatedBy": "customer",
        "status": "processing"
    }
}
```

### Configuration

Environment variables to customize refund behavior:

```env
# Cancellation Policies (in hours)
REFUND_POLICY_TIER_1_HOURS=48        # > 48 hours
REFUND_POLICY_TIER_1_PERCENT=100
REFUND_POLICY_TIER_1_FEE=0

REFUND_POLICY_TIER_2_HOURS=24        # 24-48 hours
REFUND_POLICY_TIER_2_PERCENT=75
REFUND_POLICY_TIER_2_FEE=25

REFUND_POLICY_TIER_3_HOURS=12        # 12-24 hours
REFUND_POLICY_TIER_3_PERCENT=50
REFUND_POLICY_TIER_3_FEE=50

REFUND_POLICY_TIER_4_HOURS=0         # < 12 hours
REFUND_POLICY_TIER_4_PERCENT=0
REFUND_POLICY_TIER_4_FEE=FULL_AMOUNT

# Refund Processing
AUTOMATIC_REFUND_PROCESSING=true
REFUND_PROCESSING_TIMEOUT_HOURS=24
```

---

## 2. Late Return & Penalty System

### Overview

The Late Return & Penalty System automatically monitors bookings and charges customers who return vehicles after the scheduled return date/time. This system maximizes revenue recovery and incentivizes on-time returns.

### How It Works

#### Penalty Calculation Formula

```typescript
// Step 1: Calculate how long the vehicle is overdue
lateReturnMinutes = (actualReturnTime - expectedReturnTime) / 60000

// Step 2: Apply grace period (typically 2 hours)
billableMinutes = max(0, lateReturnMinutes - GRACE_PERIOD_MINUTES)

// Step 3: Convert to hours (round up)
billableHours = Math.ceil(billableMinutes / 60)

// Step 4: Get the daily rate from the booking
hourlyRate = booking.dailyRate / 24

// Step 5: Apply penalty multiplier (typically 1.5x)
penaltyAmount = billableHours * hourlyRate * PENALTY_MULTIPLIER

// Example:
// Vehicle due at 10:00 AM
// Returned at 1:30 PM (3.5 hours late)
// Grace period: 2 hours
// Billable: 1.5 hours
// Daily rate: $75, Hourly: $3.125
// Penalty: 1.5 * $3.125 * 1.5 = $7.03
```

#### Automated Processing

The system runs hourly via cron job to detect and process overdue bookings:

```typescript
@Cron(CronExpression.EVERY_HOUR)
async processLateReturns() {
    // 1. Find all active bookings with overdue return dates
    // 2. For each overdue booking:
    //    - Calculate penalty amount
    //    - Check if grace period applies
    //    - Create charge record
    //    - Process payment via gateway
    //    - Send notification email
    // 3. Log all actions for audit trail
}
```

#### Workflow

```
Booking Expected Return Time Passes
           ↓
Cron Job Checks (hourly)
           ↓
Booking Still Active? (Not returned)
           ↓
Calculate Late Hours (minus grace period)
           ↓
Calculate Penalty Amount
           ↓
Attempt Payment Charge via Gateway
           ↓
Success? Create Penalty Record
           ↓
Send Late Return Notification Email
           ↓
(Optional) Admin Reviews Dispute
```

### Features & Benefits

| Feature | Benefit |
|---------|---------|
| Automated Hourly Checks | Real-time detection of late returns |
| Grace Period | Fair policy (typically 2 hours) |
| Penalty Multiplier | Incentivizes timely returns (1.5x rate) |
| Auto-Charging | Revenue captured automatically |
| Waiver System | Flexibility for exceptional cases |
| Dispute Management | Handle customer disagreements |
| Audit Trail | Complete record keeping |

### Database Schema

```sql
CREATE TABLE late_return_penalties (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    expected_return_time TIMESTAMP,
    actual_return_time TIMESTAMP NULL,
    late_minutes INTEGER,
    grace_period_minutes INTEGER,
    billable_hours DECIMAL(5, 2),
    daily_rate DECIMAL(10, 2),
    penalty_multiplier DECIMAL(3, 1),
    penalty_amount DECIMAL(10, 2),
    charge_status VARCHAR(50),        -- 'pending', 'charged', 'waived', 'disputed'
    payment_gateway_charge_id VARCHAR(255),
    waived_by_user_id UUID REFERENCES users(id),
    waive_reason TEXT,
    dispute_status VARCHAR(50),       -- 'none', 'open', 'resolved'
    detected_at TIMESTAMP,
    charged_at TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### API Endpoints

#### Get Late Return Penalties

```http
GET /api/bookings/{bookingId}/late-penalties
Authorization: Bearer {token}

Response:
{
    "penalties": [
        {
            "id": "penalty-789",
            "booking": "booking-123",
            "expectedReturnTime": "2025-04-28T10:00:00Z",
            "actualReturnTime": "2025-04-28T13:30:00Z",
            "lateMinutes": 210,
            "gracePeriodMinutes": 120,
            "billableHours": 1.5,
            "hourlyRate": 3.13,
            "penaltyAmount": 7.03,
            "status": "charged",
            "chargedAt": "2025-04-28T13:45:00Z"
        }
    ],
    "totalPenalties": 7.03
}
```

#### Waive Late Return Penalty

```http
POST /api/late-penalties/{penaltyId}/waive
Content-Type: application/json
Authorization: Bearer {adminToken}

{
    "reason": "Customer reported emergency situation",
    "adminNotes": "Waived by Sarah (Manager)"
}

Response:
{
    "id": "penalty-789",
    "status": "waived",
    "waivedAt": "2025-04-28T14:00:00Z",
    "waivedBy": "user-456",
    "reason": "Customer reported emergency situation"
}
```

#### Dispute Late Penalty

```http
POST /api/late-penalties/{penaltyId}/dispute
Content-Type: application/json
Authorization: Bearer {token}

{
    "reason": "GPS shows I arrived at 10:05 AM",
    "attachments": ["image-url-1", "image-url-2"]
}

Response:
{
    "id": "penalty-789",
    "disputeStatus": "open",
    "disputedAt": "2025-04-28T14:15:00Z",
    "reason": "GPS shows I arrived at 10:05 AM",
    "attachments": ["image-url-1", "image-url-2"]
}
```

### Configuration

```env
# Late Return Settings (in hours)
LATE_RETURN_GRACE_PERIOD_HOURS=2        # 2-hour grace before charges apply
LATE_RETURN_PENALTY_MULTIPLIER=1.5      # 1.5x daily rate for late hours
ENABLE_AUTO_CHARGE=true                 # Automatically charge customers

# Cron Schedule (how often to check)
LATE_RETURN_CHECK_FREQUENCY="0 * * * *" # Every hour, at minute 0

# Waiver Settings
REQUIRE_ADMIN_APPROVAL_FOR_WAIVER=true
AUTO_WAIVE_THRESHOLD_HOURS=0.5          # Auto-waive if < 30 minutes late
```

---

## 3. Vehicle Inspection & Damage Management

### Overview

The Vehicle Inspection & Damage Management system enables pre-rental and post-rental inspections to document vehicle condition, identify damages, estimate repair costs, and manage disputes.

### Inspection Types

#### 1. Pre-Rental Inspection

**Purpose:** Document baseline condition before customer takes vehicle

**Components:**
- Vehicle exterior condition (no damages)
- Interior cleanliness
- Fuel level
- Mileage
- Tire condition
- Photos of entire vehicle
- Customer signature

**Outcome:** Creates baseline record for comparison

#### 2. Post-Rental Inspection

**Purpose:** Identify any new damages after customer returns vehicle

**Components:**
- Compare with pre-rental inspection
- Document all new damages
- Take photos of each damage
- Estimate repair costs
- Note any mechanical issues
- Record fuel level and mileage
- Customer & Inspector signatures

**Outcome:** Generates damage report and repair estimate

### Damage Severity Levels

```
Level 1 - NONE
├─ No damage detected
└─ Vehicle in perfect condition

Level 2 - MINOR
├─ Small scratches (< 6 inches)
├─ Minor paint chips
├─ Surface-level damage
└─ Estimated cost: < $100

Level 3 - MODERATE
├─ Visible dents
├─ Scratches (6-12 inches)
├─ Cracked trim/plastic
├─ Minor glass damage
└─ Estimated cost: $100 - $500

Level 4 - MAJOR
├─ Deep dents affecting multiple areas
├─ Large scratches (> 12 inches)
├─ Broken mirrors/lights
├─ Significant paint damage
└─ Estimated cost: $500 - $2,000

Level 5 - SEVERE
├─ Frame damage
├─ Major accidents
├─ Multiple systems affected
├─ Unsafe to drive
└─ Estimated cost: > $2,000
```

### Inspection Workflow

```
Pre-Rental ──────────► Vehicle Handover ──────────► Post-Rental
Inspection            (Customer Takes Vehicle)     Inspection
    │                                                   │
    ├─ Document condition                              ├─ Compare with pre-rental
    ├─ Take photos                                    ├─ Identify new damages
    ├─ Record readings                               ├─ Classify severity
    ├─ Get signature                                 ├─ Estimate costs
    └─ Email copy to customer                        ├─ Get signatures
                                                     └─ Generate report
                                                          │
                                                          ├─ No Damage
                                                          │  └─ Release full deposit
                                                          │
                                                          ├─ Damage Detected
                                                          │  ├─ Create charges
                                                          │  ├─ Send report to customer
                                                          │  └─ Request payment/dispute
                                                          │
                                                          └─ Admin Review
                                                             ├─ Approve charges
                                                             ├─ Request more photos
                                                             └─ Handle disputes
```

### Damage Documentation

**For each damage:**

```typescript
{
    location: "Front bumper left side",           // Specific area
    type: "scratch",                              // scratch, dent, crack, etc.
    severity: "moderate",                         // none, minor, moderate, major, severe
    description: "Long horizontal scratch",
    estimatedRepairCost: 350,
    photos: [
        { url: "image-1.jpg", timestamp: "..." },
        { url: "image-2.jpg", timestamp: "..." }
    ],
    discoveredByRole: "inspector",                // inspector, customer
    notes: "Appears to be from side-swipe"
}
```

### Database Schema

```sql
CREATE TABLE inspections (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    inspection_type VARCHAR(50),          -- 'pre-rental', 'post-rental'
    inspector_user_id UUID NOT NULL REFERENCES users(id),
    fuel_level DECIMAL(5, 2),             -- As percentage (0-100)
    mileage INTEGER,
    tire_condition VARCHAR(100),
    general_condition_notes TEXT,
    status VARCHAR(50),                   -- 'pending', 'completed', 'approved'
    signed_by_customer_at TIMESTAMP,
    signed_by_inspector_at TIMESTAMP,
    created_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE damage_reports (
    id UUID PRIMARY KEY,
    post_inspection_id UUID NOT NULL REFERENCES inspections(id),
    pre_inspection_id UUID REFERENCES inspections(id),
    location VARCHAR(255),
    damage_type VARCHAR(50),
    severity VARCHAR(50),                 -- 'none', 'minor', 'moderate', 'major', 'severe'
    description TEXT,
    estimated_repair_cost DECIMAL(10, 2),
    actual_repair_cost DECIMAL(10, 2) NULL,
    approval_status VARCHAR(50),          -- 'pending', 'approved', 'disputed'
    dispute_reason TEXT,
    created_at TIMESTAMP,
    disputed_at TIMESTAMP
);

CREATE TABLE inspection_photos (
    id UUID PRIMARY KEY,
    damage_report_id UUID REFERENCES damage_reports(id),
    inspection_id UUID REFERENCES inspections(id),
    photo_url VARCHAR(2048),
    taken_at TIMESTAMP,
    uploaded_at TIMESTAMP
);
```

### API Endpoints

#### Create Pre-Rental Inspection

```http
POST /api/inspections/pre-rental/{bookingId}
Content-Type: application/json
Authorization: Bearer {token}

{
    "fuelLevel": 100,
    "mileage": 45230,
    "tireCondition": "Good",
    "generalConditionNotes": "Vehicle in excellent condition",
    "photos": ["image-url-1", "image-url-2"],
    "inspectorNotes": "All systems functional"
}

Response: 201 Created
{
    "id": "insp-123",
    "type": "pre-rental",
    "booking": "booking-456",
    "status": "completed"
}
```

#### Create Post-Rental Inspection

```http
POST /api/inspections/post-rental/{bookingId}
Content-Type: application/json
Authorization: Bearer {token}

{
    "fuelLevel": 75,
    "mileage": 45450,
    "tireCondition": "Good",
    "damages": [
        {
            "location": "Front bumper left",
            "type": "scratch",
            "severity": "moderate",
            "description": "Long horizontal scratch",
            "estimatedRepairCost": 350,
            "photos": ["damage-1.jpg", "damage-2.jpg"]
        }
    ],
    "inspectorNotes": "Minor damage on front bumper"
}

Response: 201 Created
{
    "id": "insp-789",
    "type": "post-rental",
    "damagesFound": 1,
    "totalEstimatedCost": 350,
    "status": "pending_approval"
}
```

#### Approve Damage Report

```http
POST /api/damage-reports/{reportId}/approve
Authorization: Bearer {adminToken}

Response:
{
    "id": "dmg-report-123",
    "status": "approved",
    "approvedAt": "2025-04-28T15:00:00Z",
    "approvedBy": "user-789",
    "chargeCreated": true,
    "chargeAmount": 350
}
```

---

## 4. Invoice & Tax Engine

### Overview

The Invoice & Tax Engine automatically generates invoices for bookings, applies location-specific tax rates, handles multi-currency, and tracks payments.

### Invoice Components

#### Standard Invoice Structure

```
═══════════════════════════════════════════════════════
                  AutoHub Invoice
                    Invoice #INV-2025-000123
                    Date: 2025-04-28

Customer Information:
─────────────────────
John Smith
john@example.com
License: DL-123456

Vehicle Information:
────────────────────
2024 Tesla Model 3
License Plate: TESLA3
Location: Los Angeles Downtown

Rental Period:
──────────────
From: 2025-05-01, 9:00 AM
To:   2025-05-05, 5:00 PM
Duration: 4 days, 8 hours

Line Items:
──────────────────────────────────────┬──────────┐
Description                           │ Amount   │
──────────────────────────────────────┼──────────┤
Vehicle Rental (4 days × $75)         │ $300.00  │
Vehicle Rental (8 hours × $3.125)     │ $25.00   │
Insurance Coverage (4.33 days × $15)  │ $64.95   │
Different Location Fee (LA Downtown)  │ $50.00   │
                                      ├──────────┤
Subtotal                              │ $439.95  │
Sales Tax - CA (7.25%)                │ $31.90   │
                                      ├──────────┤
Total Amount Due                      │ $471.85  │
════════════════════════════════════════════════════════
```

### Tax Rate Configuration

The system applies location-specific tax rates based on where the vehicle is picked up:

```typescript
Tax Rate Database:
─────────────────────────────────────────────
State/Province          Tax Rate
─────────────────────────────────────────────
California (CA)         7.25%
New York (NY)           8.875%
Texas (TX)              6.25%
Florida (FL)            6.0%
Illinois (IL)           6.25%
Washington (WA)         10.1%
Oregon (OR)             0% (No sales tax)
Montana (MT)            0% (No sales tax)
New Hampshire (NH)      0% (No sales tax)
Delaware (DE)           0% (No sales tax)
Canada - Ontario        13% (HST)
Canada - British Col.   12% (HST)
─────────────────────────────────────────────
Default (if not found): 7.0%
```

### Database Schema

```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id),
    invoice_number VARCHAR(50) UNIQUE,         -- INV-2025-000123
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50),                        -- 'draft', 'sent', 'paid', 'overdue', 'cancelled'
    
    -- Customer Information
    customer_id UUID NOT NULL REFERENCES users(id),
    customer_email VARCHAR(255),
    customer_license VARCHAR(255),
    
    -- Vehicle Information
    vehicle_id UUID REFERENCES vehicles(id),
    vehicle_license_plate VARCHAR(50),
    
    -- Rental Information
    pickup_location VARCHAR(255),
    dropoff_location VARCHAR(255),
    pickup_time TIMESTAMP,
    dropoff_time TIMESTAMP,
    rental_duration_days INTEGER,
    rental_duration_hours INTEGER,
    
    -- Financial Details
    subtotal DECIMAL(10, 2),
    insurance_amount DECIMAL(10, 2),
    fees_amount DECIMAL(10, 2),
    tax_rate DECIMAL(5, 2),
    tax_amount DECIMAL(10, 2),
    total_amount DECIMAL(10, 2),
    
    -- Payment Tracking
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    amount_due DECIMAL(10, 2),
    due_date DATE,
    paid_date DATE,
    payment_method VARCHAR(50),
    
    -- Audit
    created_at TIMESTAMP,
    sent_at TIMESTAMP,
    paid_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE invoice_line_items (
    id UUID PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    description VARCHAR(255),
    quantity DECIMAL(10, 2),
    unit_price DECIMAL(10, 2),
    total_price DECIMAL(10, 2),
    item_type VARCHAR(50),      -- 'rental', 'insurance', 'fee', 'damage'
    category VARCHAR(100),
    created_at TIMESTAMP
);

CREATE TABLE tax_rates (
    id UUID PRIMARY KEY,
    state_province VARCHAR(50),
    country VARCHAR(50),
    tax_percentage DECIMAL(5, 2),
    effective_date DATE,
    discontinued_date DATE NULL,
    created_at TIMESTAMP
);
```

### API Endpoints

#### Generate Invoice

```http
GET /api/invoices/{bookingId}/generate
Authorization: Bearer {token}

Response:
{
    "invoice": {
        "id": "inv-001",
        "invoiceNumber": "INV-2025-000123",
        "booking": "booking-456",
        "status": "generated",
        "customer": {
            "name": "John Smith",
            "email": "john@example.com"
        },
        "lineItems": [
            {
                "description": "Vehicle Rental (4 days)",
                "quantity": 4,
                "unitPrice": 75,
                "total": 300
            },
            {
                "description": "Insurance Coverage",
                "quantity": 4.33,
                "unitPrice": 15,
                "total": 64.95
            }
        ],
        "subtotal": 439.95,
        "taxRate": 7.25,
        "taxAmount": 31.90,
        "totalAmount": 471.85
    }
}
```

#### Get Invoice

```http
GET /api/invoices/{invoiceId}
Authorization: Bearer {token}

Response: (Full invoice details)
```

#### Export Invoice as PDF

```http
GET /api/invoices/{invoiceId}/pdf
Authorization: Bearer {token}

Response: 200 OK (PDF file)
```

---

## 5. Fleet Analytics & Business Intelligence

### Overview

The Fleet Analytics system provides real-time insights into vehicle utilization, revenue generation, maintenance costs, and profitability to enable data-driven business decisions.

### Key Metrics

#### 1. Vehicle Utilization Rate

```typescript
Utilization Rate = (Booked Days / Total Available Days) × 100

Example:
- Vehicle booked: 25 days out of 30 days in month
- Utilization: (25 / 30) × 100 = 83.3%

Performance Classification:
├─ High (> 70%): Excellent revenue generator
├─ Good (50-70%): Performing well
├─ Average (30-50%): Room for improvement
└─ Low (< 30%): Underutilized, consider relocation/retirement
```

#### 2. Revenue Analytics

```typescript
Daily Revenue = All bookings' total_amount for that day
Monthly Revenue = Sum of all daily revenues
Average Revenue Per Vehicle = Total Revenue / Vehicle Count
Revenue Per Booking = Total Revenue / Number of Bookings

Example Monthly Summary:
─────────────────────────────────────────
Total Fleet Revenue:        $125,450
Average Per Vehicle:        $2,509
Number of Bookings:         187
Average Per Booking:        $671
Best Performing Vehicle:    Tesla Model 3 - $8,920
Worst Performing Vehicle:   Luxury SUV - $450
```

#### 3. Maintenance & Cost Tracking

```typescript
Total Maintenance Cost = All service expenses for vehicle
Profitability = Total Revenue - Total Maintenance Cost
Cost Ratio = (Maintenance Cost / Revenue) × 100

Example:
Vehicle: Tesla Model 3
├─ Monthly Revenue: $8,920
├─ Maintenance Costs: $1,200
├─ Net Profit: $7,720
└─ Cost Ratio: 13.5% (healthy)

Vehicle: Luxury SUV
├─ Monthly Revenue: $450
├─ Maintenance Costs: $800
├─ Net Loss: -$350
└─ Cost Ratio: 177.8% (unprofitable)
```

### Database Queries for Analytics

```sql
-- High Performers (> 70% utilization)
SELECT 
    v.id,
    v.license_plate,
    v.make,
    v.model,
    COUNT(b.id) as total_bookings,
    ROUND(COUNT(b.id) * 100.0 / 30, 2) as utilization_rate,
    COALESCE(SUM(b.total_price), 0) as total_revenue
FROM vehicles v
LEFT JOIN bookings b ON v.id = b.vehicle_id 
    AND b.status IN ('completed', 'active')
    AND DATE_TRUNC('month', b.start_date) = CURRENT_DATE
GROUP BY v.id, v.license_plate, v.make, v.model
HAVING COUNT(b.id) > 21  -- > 70% of 30 days
ORDER BY total_revenue DESC;

-- Fleet Performance Summary
SELECT 
    COUNT(v.id) as total_vehicles,
    COUNT(CASE WHEN v.status = 'available' THEN 1 END) as available_count,
    COUNT(CASE WHEN v.status = 'maintenance' THEN 1 END) as maintenance_count,
    AVG(ROUND(COUNT(b.id) * 100.0 / 30, 2)) as avg_utilization,
    COALESCE(SUM(b.total_price), 0) as total_revenue
FROM vehicles v
LEFT JOIN bookings b ON v.id = b.vehicle_id;
```

### Dashboard Visualizations

#### Real-Time Vehicle Utilization

```
High Performers (>70%):
┌─────────────────┬──────────┬──────────┬───────────┐
│ Vehicle         │ Booked   │ Idle     │ Util. Rate│
├─────────────────┼──────────┼──────────┼───────────┤
│ Tesla Model 3   │ 25 days  │ 5 days   │ 83.3%    │
│ BMW 3 Series    │ 22 days  │ 8 days   │ 73.3%    │
│ Audi A6         │ 21 days  │ 9 days   │ 70.0%    │
└─────────────────┴──────────┴──────────┴───────────┘

Underutilized (<30%):
┌─────────────────┬──────────┬──────────┬───────────┐
│ Vehicle         │ Booked   │ Idle     │ Util. Rate│
├─────────────────┼──────────┼──────────┼───────────┤
│ Luxury SUV      │ 7 days   │ 23 days  │ 23.3%    │
│ Sports Car      │ 5 days   │ 25 days  │ 16.7%    │
│ Vintage Model   │ 3 days   │ 27 days  │ 10.0%    │
└─────────────────┴──────────┴──────────┴───────────┘
```

#### Revenue vs Maintenance

```
Vehicle Profitability Analysis:
┌─────────────┬─────────┬─────────────┬──────────┐
│ Vehicle     │ Revenue │ Maintenance │ Profit   │
├─────────────┼─────────┼─────────────┼──────────┤
│ Tesla 3     │ $8,920  │ $1,200 (13%)│ +$7,720 │
│ BMW 3       │ $5,490  │ $1,800 (33%)│ +$3,690 │
│ Luxury SUV  │ $450    │ $800 (178%) │ -$350   │
└─────────────┴─────────┴─────────────┴──────────┘
```

### API Endpoints

#### Get Fleet Overview

```http
GET /api/fleet-management/analytics/overview
Authorization: Bearer {token}

Response:
{
    "summary": {
        "totalVehicles": 50,
        "activeVehicles": 42,
        "maintenanceVehicles": 6,
        "retiredVehicles": 2,
        "averageUtilization": 58.5,
        "totalRevenue": 125450,
        "averageVehicleRevenue": 2509
    },
    "topPerformers": [
        {
            "id": "v1",
            "make": "Tesla",
            "model": "Model 3",
            "utilization": 83.3,
            "monthlyRevenue": 8920
        }
    ],
    "underutilized": [
        {
            "id": "v25",
            "make": "Luxury",
            "model": "SUV",
            "utilization": 23.3,
            "monthlyRevenue": 450
        }
    ]
}
```

#### Get Vehicle Analytics

```http
GET /api/fleet-management/analytics/vehicles/{vehicleId}
Authorization: Bearer {token}

Response:
{
    "vehicle": {
        "id": "v1",
        "licensePlate": "TESLA3",
        "make": "Tesla",
        "model": "Model 3"
    },
    "monthlyMetrics": {
        "bookings": 25,
        "revenue": 8920,
        "maintenanceCost": 1200,
        "profit": 7720,
        "utilization": 83.3
    },
    "trends": {
        "revenueGrowth": "+12.5%",
        "utilizationTrend": "↑ Improving"
    }
}
```

---

## 6. Scheduled Tasks & Automation

### Cron Schedule

The system includes automated background jobs that run on a defined schedule:

```typescript
Hourly (Every Hour at :00):
├─ @Cron(CronExpression.EVERY_HOUR)
│  ├─ Check for overdue bookings
│  ├─ Calculate and charge late penalties
│  └─ Send late return notifications

Daily (8:00 AM):
├─ @Cron('0 8 * * *')
│  ├─ Send booking reminders (24h before)
│  ├─ Update vehicle availability
│  └─ Check for expiring maintenance schedules

Daily (12:00 PM Noon):
├─ @Cron(CronExpression.EVERY_DAY_AT_NOON)
│  ├─ Generate daily revenue report
│  └─ Aggregate fleet metrics

Daily (Midnight):
├─ @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
│  ├─ Archive completed bookings
│  ├─ Update overdue invoices
│  └─ Process overnight failures
```

### Implementation Example

```typescript
// Late return processor (runs every hour)
@Injectable()
export class LateReturnService {
    @Cron(CronExpression.EVERY_HOUR)
    async processLateReturns() {
        const overdueBookings = await this.findOverdueBookings();
        
        for (const booking of overdueBookings) {
            try {
                // Calculate penalty
                const penalty = this.calculatePenalty(booking);
                
                // Charge via payment gateway
                await this.paymentService.createCharge(
                    booking.user.id,
                    penalty.amount,
                    `Late return penalty for ${booking.vehicle.model}`
                );
                
                // Send notification
                await this.mailService.sendLateReturnNotification(
                    booking.user.email,
                    penalty
                );
                
                // Log for audit
                this.logger.log(`Penalty processed for booking ${booking.id}`);
            } catch (error) {
                this.logger.error(`Failed to process penalty: ${error.message}`);
            }
        }
    }
}
```

---

## 7. Email Notification Flows

### Refund Process

```
Customer Initiates Cancellation
           ↓ (via API)
System Calculates Refund
           ↓
Payment Gateway Processes Refund
           ↓
Email 1: Cancellation Confirmation
├─ Refund amount
├─ Cancellation fee (if any)
├─ Expected refund timeline
└─ Booking details
           ↓
Email 2: Refund Processed (24-48h later)
├─ Refund confirmation number
├─ Amount refunded
├─ Refund method
└─ Timeline for fund availability
```

### Late Return Notification

```
Grace Period Expires (2 hours after due time)
           ↓
Penalty Calculated
           ↓
Email 1: Late Return Alert
├─ Vehicle due time
├─ Current time
├─ Hours overdue
├─ Estimated penalty amount
└─ Call to action
           ↓
Payment Charged
           ↓
Email 2: Penalty Charged
├─ Penalty amount
├─ Breakdown: (hours × hourly rate × multiplier)
├─ Payment confirmation
└─ Receipt
```

### Inspection Report

```
Post-Rental Inspection Completed
           ↓
Damages Found?
├─ YES: Email 1: Damage Report
│       ├─ Photos of damages
│       ├─ Severity levels
│       ├─ Estimated costs
│       └─ Option to dispute
│
└─ NO: Email 1: No Damage Found
       ├─ Confirmation of vehicle condition
       ├─ Full deposit will be refunded
       └─ Timeline
```

---

## 8. Configuration & Customization

### Environment Variables

```env
# ========================================
# Cancellation & Refund Settings
# ========================================
REFUND_POLICY_TIER_1_HOURS=48
REFUND_POLICY_TIER_1_PERCENT=100
REFUND_POLICY_TIER_1_FEE=0

REFUND_POLICY_TIER_2_HOURS=24
REFUND_POLICY_TIER_2_PERCENT=75
REFUND_POLICY_TIER_2_FEE=25

REFUND_POLICY_TIER_3_HOURS=12
REFUND_POLICY_TIER_3_PERCENT=50
REFUND_POLICY_TIER_3_FEE=50

REFUND_POLICY_TIER_4_HOURS=0
REFUND_POLICY_TIER_4_PERCENT=0
REFUND_POLICY_TIER_4_FEE=FULL_AMOUNT

# ========================================
# Late Return & Penalty Settings
# ========================================
LATE_RETURN_GRACE_PERIOD_HOURS=2
LATE_RETURN_PENALTY_MULTIPLIER=1.5
ENABLE_AUTO_CHARGE=true
PENALTY_CHECK_FREQUENCY="0 * * * *"

# ========================================
# Tax Configuration
# ========================================
DEFAULT_TAX_RATE=7.0
ENABLE_LOCATION_TAX=true
CA_TAX_RATE=7.25
NY_TAX_RATE=8.875
TX_TAX_RATE=6.25

# ========================================
# Analytics Thresholds
# ========================================
LOW_UTILIZATION_THRESHOLD=30
HIGH_UTILIZATION_THRESHOLD=70
ANALYTICS_CACHE_DURATION=3600

# ========================================
# Inspection & Damage
# ========================================
REQUIRE_INSPECTION_APPROVAL=true
DAMAGE_COST_THRESHOLD=100
```

---

## 9. API Integration Examples

### Complete Booking-to-Refund Flow

```typescript
// 1. Create booking
POST /api/bookings
{
    "vehicleId": "v1",
    "startDate": "2025-05-01",
    "endDate": "2025-05-05",
    "userId": "u1"
}
→ Creates booking, generates invoice

// 2. Customer cancels within 24 hours
POST /api/bookings/b1/cancel
{
    "reason": "Change of plans"
}
→ Calculates refund (75%), processes payment
→ Sends confirmation email

// 3. Verify refund
GET /api/refunds/r1
→ Shows refund status and timeline
```

### Late Return Scenario

```typescript
// 1. Booking created with return date May 5, 10:00 AM
POST /api/bookings
{
    "vehicleId": "v1",
    "returnDate": "2025-05-05T10:00:00Z"
}

// 2. Customer returns at 1:30 PM (3.5 hours late)
// Hourly cron job detects at 2:00 PM

// 3. System calculates:
// - Late: 3.5 hours
// - Grace: 2 hours
// - Billable: 1.5 hours
// - Hourly rate: $75/24 = $3.13/hr
// - Penalty: 1.5 × $3.13 × 1.5 = $7.03

POST /api/bookings/b1/mark-returned
{
    "returnTime": "2025-05-05T13:30:00Z",
    "finalMileage": 45450,
    "fuelLevel": 75
}
→ Cron detects late return
→ Charges customer $7.03
→ Sends penalty notification email
```

---

## 10. Troubleshooting Guide

### Common Issues

#### 1. Refund Not Processing

**Symptoms:** Refund status stuck in "processing"

**Causes:**
- Payment gateway API error
- Network connection issue
- Invalid payment method

**Solution:**
```bash
# 1. Check payment gateway logs
# 2. Verify API credentials in .env
# 3. Retry: POST /api/refunds/{refundId}/retry
# 4. Contact support if manual intervention needed
```

#### 2. Late Penalty Not Charging

**Symptoms:** Vehicle returned late but no penalty

**Causes:**
- Cron job not running
- Auto-charge disabled
- Payment method invalid

**Solution:**
```bash
# 1. Verify cron job is running: check server logs
# 2. Check ENABLE_AUTO_CHARGE=true in .env
# 3. Verify customer payment method
# 4. Manually charge: POST /api/late-penalties/{id}/manual-charge
```

#### 3. Inspection Photos Not Saving

**Symptoms:** Inspection created but photos missing

**Causes:**
- File upload service error
- Storage bucket full
- Invalid image format

**Solution:**
```bash
# 1. Verify image format (jpg, png)
# 2. Check storage service status
# 3. Re-upload photos: POST /api/inspections/{id}/photos
```

---

## Summary

The advanced features in AutoHub provide a comprehensive system for managing complex vehicle rental operations, from refund processing to fleet analytics. These systems are:

- **Automated**: Reduce manual work through scheduled tasks
- **Configurable**: Customizable policies and thresholds
- **Integrated**: Work seamlessly with payment gateways
- **Auditable**: Complete record keeping for compliance
- **Data-Driven**: Analytics enable informed business decisions
