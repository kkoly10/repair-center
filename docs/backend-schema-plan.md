# Repair Center backend schema plan

This backend is designed for a trust-first mail-in repair business with this flow:

1. guest or customer submits free estimate request
2. staff reviews photos and sends preliminary estimate
3. customer approves mail-in and pays inspection deposit
4. device is received and inspected
5. final quote is sent and approved
6. repair is completed, paid, and shipped back
7. customer tracks status through a quote ID or account

## Core table groups

### 1. Identity and access
- `profiles` — links Supabase auth users to business roles
- `customers` — customer records, whether guest or account-linked
- `customer_addresses` — shipping and billing addresses

### 2. Catalog and pricing
- `repair_catalog_brands`
- `repair_catalog_models`
- `repair_types`
- `pricing_rules`
- `pricing_rule_conditions`

### 3. Intake and estimates
- `quote_requests`
- `quote_request_photos`
- `quote_estimates`
- `quote_estimate_items`

### 4. Repair operations
- `repair_orders`
- `device_intake_reports`
- `repair_order_status_history`
- `repair_messages`

### 5. Logistics and payments
- `shipments`
- `payments`

## Practical notes

### Guest estimate flow
The public estimate form should usually submit through a secure server route using the service role, not direct anonymous table writes. That keeps abuse lower and gives you more control over validation and rate limiting.

### Customer account flow
Later, when a customer creates an account, you can link `customers.auth_user_id` to `auth.users.id` so they can see their quote requests, estimates, orders, shipments, and payment history.

### Staff roles
Use `profiles.role` with:
- `customer`
- `tech`
- `admin`

### Quote IDs and order numbers
The SQL file creates helper functions for:
- `RCQ-000001` style quote IDs
- `RCO-000001` style order numbers

### Storage
A private `repair-uploads` bucket is included for device photos and intake photos. Keep uploads private and serve them through signed URLs or secure backend routes.

### RLS strategy
- staff can manage almost everything
- customers can only see their own linked records
- public guest inserts should be handled by backend code using service role

## Recommended build order

1. run the SQL migration in Supabase
2. seed brands, models, repair types, and pricing rules
3. connect the estimate page to create `customers` and `quote_requests`
4. upload estimate photos into `repair-uploads`
5. create admin review screens for quote requests and estimates
6. create customer tracking screen powered by `quote_requests`, `repair_orders`, and `repair_order_status_history`
7. add payment integration for deposits and balances
8. add shipment generation and tracking integration
