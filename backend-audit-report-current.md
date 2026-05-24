# VeeGo Backend — Complete Audit Report
**Generated:** 2026-05-23  
**Reflects:** Actual live codebase state (post all recent changes)  
**Codebase path:** `artifacts/api-server` + `lib/db`

---

## 1. ARCHITECTURE OVERVIEW

```
┌────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                        │
│   Admin Dashboard (React/Vite)  |  Driver App  |  Passenger App │
└────────────────────┬───────────────────────────────────────┘
                     │ HTTP + WebSocket
┌────────────────────▼───────────────────────────────────────┐
│               API GATEWAY  (Express.js)                    │
│   Path prefix: /api   |   Socket.IO path: /api/socket.io  │
│   Rate limiting: 200 req/15min (API) | 20 req/15min (auth)│
│   Auth: JWT (access 15min) + Refresh Token (7d)           │
│   Security: Helmet, CORS(*), Pino logging                  │
└────────────────────┬───────────────────────────────────────┘
                     │ Drizzle ORM
┌────────────────────▼───────────────────────────────────────┐
│         POSTGRESQL  (Neon serverless)                      │
│         16 tables  |  15 enums                             │
└────────────────────────────────────────────────────────────┘
```

**Tech Stack:**
- Runtime: Node.js 24, TypeScript (compiled with esbuild)
- Framework: Express.js 5
- ORM: Drizzle ORM (drizzle-zod for validation)
- Database: PostgreSQL via Neon (serverless)
- Real-time: Socket.IO
- Auth: bcryptjs + JWT (jsonwebtoken)
- Validation: Zod v4
- Logging: Pino + pino-http
- Rate limiting: express-rate-limit

---

## 2. DATABASE SCHEMA (COMPLETE — CURRENT STATE)

### Table 1: `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| name | text | NOT NULL |
| email | text | NOT NULL, UNIQUE |
| phone | text | NOT NULL |
| password | text | NOT NULL (bcrypt hashed) |
| avatar | text | nullable |
| wallet_balance | numeric(12,2) | NOT NULL, default 0 |
| role | enum(user_role) | NOT NULL, default 'user' |
| staff_role_id | integer | FK → staff_roles.id, nullable |
| is_verified | boolean | NOT NULL, default false |
| is_blocked | boolean | NOT NULL, default false |
| refresh_token | text | nullable |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

**Enum `user_role`:** `user` | `driver` | `admin`

---

### Table 2: `drivers`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| user_id | integer | NOT NULL, FK → users.id CASCADE |
| name | text | NOT NULL |
| phone | text | NOT NULL |
| license_number | text | nullable |
| national_id | text | nullable |
| rating | numeric(3,2) | NOT NULL, default 5.00 |
| assigned_bus_id | integer | FK → buses.id, nullable |
| current_latitude | real | nullable |
| current_longitude | real | nullable |
| current_speed | real | nullable |
| current_heading | real | nullable |
| is_online | boolean | NOT NULL, default false |
| status | enum(driver_status) | NOT NULL, default 'offline' |
| is_active | boolean | NOT NULL, default true |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

**Enum `driver_status`:** `offline` | `online` | `busy` | `suspended`

---

### Table 3: `buses`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| plate_number | text | NOT NULL, UNIQUE |
| capacity | integer | NOT NULL |
| model | text | NOT NULL |
| current_latitude | real | nullable |
| current_longitude | real | nullable |
| is_active | boolean | NOT NULL, default true |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

> ⚠️ No `vehicle_type` column. Buses represent only shuttle/coach vehicles. No car or motorcycle entity exists.

---

### Table 4: `routes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| name | text | NOT NULL |
| from_location | text | NOT NULL |
| to_location | text | NOT NULL |
| estimated_duration | integer | NOT NULL (minutes) |
| base_price | numeric(10,2) | NOT NULL |
| is_active | boolean | NOT NULL, default true |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

> ⚠️ Note: schema field names are `fromLocation`/`toLocation` in Drizzle but the earlier explore said `start_location`/`end_location` — the actual schema file uses `from_location`/`to_location`.

---

### Table 5: `stations`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| route_id | integer | NOT NULL, FK → routes.id CASCADE |
| name | text | NOT NULL |
| latitude | real | NOT NULL |
| longitude | real | NOT NULL |
| order | integer | NOT NULL |
| created_at | timestamptz | NOT NULL, default now() |

---

### Table 6: `trips` ★ (Updated this session)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| route_id | integer | NOT NULL, FK → routes.id |
| bus_id | integer | NOT NULL, FK → buses.id |
| driver_id | integer | NOT NULL, FK → drivers.id |
| departure_time | timestamptz | NOT NULL |
| arrival_time | timestamptz | NOT NULL |
| available_seats | integer | NOT NULL |
| total_seats | integer | NOT NULL |
| price | numeric(10,2) | NOT NULL |
| status | enum(trip_status) | NOT NULL, default 'scheduled' |
| is_active | boolean | NOT NULL, default true |
| recurring_type | enum(recurring_type) | NOT NULL, default 'one_time' |
| weekdays | text | nullable |
| cancel_reason | text | nullable |
| **accepted_at** | timestamptz | nullable ✅ NEW |
| **arrived_at** | timestamptz | nullable ✅ NEW |
| **started_at** | timestamptz | nullable ✅ NEW |
| **completed_at** | timestamptz | nullable ✅ NEW |
| **cancelled_at** | timestamptz | nullable ✅ NEW |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

**Enum `trip_status`:** `scheduled` | `waiting_driver` | `driver_assigned` | `boarding` | `active` | `completed` | `cancelled`  
**Enum `recurring_type`:** `one_time` | `daily` | `weekdays` | `weekends` | `custom`

> ⚠️ No `userId` (passenger) column — this is a fixed-route shuttle trip, not a personal ride-hail trip. Passengers are linked via bookings.  
> ⚠️ No `vehicleType` column — car/motorcycle service not present in schema.

---

### Table 7: `trip_events` ★ (NEWLY CREATED this session)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| trip_id | integer | NOT NULL, FK → trips.id CASCADE |
| type | text | NOT NULL |
| metadata | jsonb | nullable |
| created_at | timestamptz | NOT NULL, default now() |

**Indexes:** `idx_trip_events_trip_id`, `idx_trip_events_type`, `idx_trip_events_created_at`

**Event types in use:**
| Type | Trigger | Metadata |
|------|---------|----------|
| `DRIVER_ACCEPTED` | Driver accepts a trip | `{ driverId }` |
| `TRIP_STARTED` | Driver starts trip | `{ driverId }` |
| `TRIP_COMPLETED` | Driver completes trip | `{ driverId }` |
| `TRIP_CANCELLED` | Driver cancels trip | `{ driverId, reason }` |
| `LOCATION_UPDATE` | Driver location ping (throttled ≥10s) | `{ lat, lng, speed }` |

---

### Table 8: `bookings`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| user_id | integer | NOT NULL, FK → users.id |
| trip_id | integer | NOT NULL, FK → trips.id |
| seat_count | integer | NOT NULL |
| total_price | numeric(10,2) | NOT NULL |
| status | enum(booking_status) | NOT NULL, default 'confirmed' |
| payment_status | enum(payment_status) | NOT NULL, default 'paid' |
| promo_code_id | integer | FK → promo_codes.id, nullable |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

**Enum `booking_status`:** `pending` | `confirmed` | `cancelled` | `completed` | `boarded` | `absent`  
**Enum `payment_status`:** `pending` | `paid` | `refunded`

---

### Table 9: `wallet_transactions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| user_id | integer | NOT NULL, FK → users.id |
| amount | numeric(12,2) | NOT NULL |
| type | enum(transaction_type) | NOT NULL |
| description | text | NOT NULL |
| created_at | timestamptz | NOT NULL, default now() |

**Enum `transaction_type`:** `deposit` | `payment` | `refund`

---

### Table 10: `driver_earnings`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| driver_id | integer | NOT NULL, FK → drivers.id CASCADE |
| trip_id | integer | FK → trips.id SET NULL, nullable |
| amount | numeric(10,2) | NOT NULL |
| status | enum(earning_status) | NOT NULL, default 'pending' |
| date | timestamptz | NOT NULL, default now() |
| created_at | timestamptz | NOT NULL, default now() |

**Enum `earning_status`:** `pending` | `confirmed` | `paid`  
> Driver cut is auto-calculated as 15% of trip price on completion.

---

### Table 11: `trip_station_progress`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| trip_id | integer | NOT NULL, FK → trips.id CASCADE |
| station_id | integer | NOT NULL, FK → stations.id CASCADE |
| status | enum(station_progress_status) | NOT NULL, default 'pending' |
| arrived_at | timestamptz | nullable |
| completed_at | timestamptz | nullable |
| created_at | timestamptz | NOT NULL, default now() |

**Unique constraint:** `(trip_id, station_id)`  
**Enum `station_progress_status`:** `pending` | `arrived` | `completed`

---

### Table 12: `notifications`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| user_id | integer | NOT NULL, FK → users.id |
| title | text | NOT NULL |
| body | text | NOT NULL |
| is_read | boolean | NOT NULL, default false |
| created_at | timestamptz | NOT NULL, default now() |

---

### Table 13: `promo_codes`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| code | text | NOT NULL, UNIQUE |
| discount_type | enum(discount_type) | NOT NULL |
| discount_value | numeric(10,2) | NOT NULL |
| expiry_date | timestamptz | nullable |
| max_usage | integer | nullable |
| used_count | integer | NOT NULL, default 0 |
| is_active | boolean | NOT NULL, default true |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

**Enum `discount_type`:** `percentage` | `fixed`

---

### Table 14: `support_tickets`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| user_id | integer | FK → users.id SET NULL, nullable |
| driver_id | integer | FK → drivers.id SET NULL, nullable |
| type | enum(ticket_type) | NOT NULL, default 'passenger' |
| subject | text | NOT NULL |
| message | text | NOT NULL |
| status | enum(ticket_status) | NOT NULL, default 'open' |
| priority | enum(ticket_priority) | NOT NULL, default 'medium' |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

**Enums:** `ticket_type`: `passenger`|`driver` · `ticket_status`: `open`|`pending`|`resolved`|`closed` · `ticket_priority`: `low`|`medium`|`high`

---

### Table 15: `support_messages`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| ticket_id | integer | NOT NULL, FK → support_tickets.id CASCADE |
| sender_type | enum(sender_type) | NOT NULL |
| sender_id | integer | nullable |
| message | text | NOT NULL |
| created_at | timestamptz | NOT NULL, default now() |

**Enum `sender_type`:** `admin` | `passenger` | `driver`

---

### Table 16: `route_suggestions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| user_id | integer | FK → users.id SET NULL |
| driver_id | integer | FK → drivers.id SET NULL |
| type | enum(suggestion_type) | NOT NULL, default 'new_route' |
| title | text | NOT NULL |
| description | text | NOT NULL |
| start_location | text | nullable |
| end_location | text | nullable |
| status | enum(suggestion_status) | NOT NULL, default 'pending' |
| admin_notes | text | nullable |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

**Enums:** `suggestion_type`: `new_route`|`new_station`|`route_edit` · `suggestion_status`: `pending`|`approved`|`rejected`

---

### Table 17: `driver_documents`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| driver_id | integer | NOT NULL, FK → drivers.id CASCADE |
| trip_id | integer | FK → trips.id SET NULL, nullable |
| type | enum(document_type) | NOT NULL |
| file_url | text | NOT NULL |
| mime_type | text | default 'image/jpeg' |
| verification_status | enum(doc_verification_status) | NOT NULL, default 'pending' |
| admin_notes | text | nullable |
| uploaded_at | timestamptz | NOT NULL, default now() |

**Enum `document_type`:** `national_id_front` | `national_id_back` | `driving_license_front` | `driving_license_back` | `vehicle_license_front` | `vehicle_license_back` | `vehicle_photo` | `profile_photo` | `trip_selfie`  
**Enum `doc_verification_status`:** `pending` | `approved` | `rejected`

---

### Table 18: `staff_roles`
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PRIMARY KEY |
| name | text | NOT NULL, UNIQUE |
| description | text | nullable |
| permissions | text[] | NOT NULL, default [] |
| created_at | timestamptz | NOT NULL, default now() |
| updated_at | timestamptz | NOT NULL, auto-update |

---

## 3. TABLE RELATIONSHIP MAP

```
users ──────────────────────────────────────────────────┐
  │                                                      │
  ├──< bookings >──────── trips ──────────────────────┐  │
  │        │                │                         │  │
  │        │          route_id ──> routes ──< stations│  │
  │        │          bus_id ───> buses               │  │
  │        │          driver_id ─> drivers            │  │
  │        │                │                         │  │
  │        └── promo_codes  ├──< trip_station_progress│  │
  │                         └──< trip_events ★NEW     │  │
  │                                                   │  │
  ├──< wallet_transactions                            │  │
  ├──< notifications                                  │  │
  ├──< support_tickets >──< support_messages          │  │
  ├──< route_suggestions                              │  │
  └── staff_role_id ──> staff_roles                   │  │
                                                      │  │
drivers ──────────────────────────────────────────────┘  │
  ├──< driver_earnings ──────────────────────────────────┘
  ├──< driver_documents
  ├── assigned_bus_id ──> buses
  └──< route_suggestions
```

---

## 4. ALL API ENDPOINTS

All endpoints are prefixed with `/api`. Base URL: `https://<domain>/api`

### 4.1 Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/healthz` | None | Server health check |

---

### 4.2 Authentication (`/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register passenger account |
| POST | `/auth/login` | None | Login (email or phone + password) |
| POST | `/auth/refresh` | None | Refresh access token |
| GET | `/auth/me` | Bearer | Get current user profile |

> Rate-limited: 20 requests / 15 minutes on all `/auth` routes.

---

### 4.3 Users (`/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | Bearer(any) | Get own profile |
| PATCH | `/users/me` | Bearer(any) | Update own profile |
| GET | `/users/me/trips` | Bearer(user) | Passenger trip history (via bookings) |
| GET | `/users/me/bookings` | Bearer(user) | Passenger booking history |

---

### 4.4 Routes (`/routes`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/routes` | None | List all active routes |
| POST | `/routes` | Admin | Create route |
| GET | `/routes/:id` | None | Get route by ID |
| PATCH | `/routes/:id` | Admin | Update route |
| DELETE | `/routes/:id` | Admin | Delete route |
| GET | `/routes/:id/stations` | None | Get stations for route |
| POST | `/routes/:id/stations` | Admin | Add station to route |
| PATCH | `/routes/:id/stations/:sid` | Admin | Update station |
| DELETE | `/routes/:id/stations/:sid` | Admin | Delete station |

---

### 4.5 Buses (`/buses`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/buses` | Admin | List all buses |
| POST | `/buses` | Admin | Create bus |
| GET | `/buses/:id` | Admin | Get bus by ID |
| PATCH | `/buses/:id` | Admin | Update bus |
| DELETE | `/buses/:id` | Admin | Soft delete bus |

---

### 4.6 Drivers — Admin Management (`/drivers`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/drivers` | Admin | List active drivers |
| POST | `/drivers` | Admin | Create driver record |
| GET | `/drivers/me` | Driver | Get own driver profile |
| PATCH | `/drivers/me/location` | Driver | Update own location (no event) |
| GET | `/drivers/:id` | Admin | Get driver by ID |
| PATCH | `/drivers/:id` | Admin | Update driver |
| DELETE | `/drivers/:id` | Admin | Soft-delete (sets isActive=false, status=suspended) |

---

### 4.7 Driver — Self-Service (`/driver`)
#### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/driver/auth/register` | None | Driver self-registration |
| POST | `/driver/auth/login` | None | Driver login |
| POST | `/driver/auth/logout` | Driver | Driver logout (clears online status) |
| GET | `/driver/me` | Driver | Get own driver profile |

#### Status
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/driver/status/online` | Driver | Set driver online |
| PATCH | `/driver/status/offline` | Driver | Set driver offline |

#### Location
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/driver/location` | Driver | Update location + optional trip event (throttled ≥10s) |

#### Trip Actions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/driver/trips` | Driver | List own trips (filterable by status) |
| GET | `/driver/trips/:id` | Driver | Get trip detail + bookings |
| PATCH | `/driver/trips/:id/accept` | Driver | Accept trip → records `DRIVER_ACCEPTED` event, stamps `accepted_at` |
| PATCH | `/driver/trips/:id/reject` | Driver | Reject trip assignment |
| PATCH | `/driver/trips/:id/start` | Driver | Start trip → records `TRIP_STARTED` event, stamps `started_at` |
| PATCH | `/driver/trips/:id/complete` | Driver | Complete trip → records `TRIP_COMPLETED` event, stamps `completed_at`, auto-earns 15% |
| PATCH | `/driver/trips/:id/cancel` | Driver | Cancel trip → records `TRIP_CANCELLED` event, stamps `cancelled_at` |

#### Station Progress
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/driver/trips/:id/stations` | Driver | Get station list with progress |
| PATCH | `/driver/trips/:id/stations/:stationId/arrived` | Driver | Mark arrived at station |
| PATCH | `/driver/trips/:id/stations/:stationId/completed` | Driver | Mark station completed |

#### Passenger Boarding
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| PATCH | `/driver/bookings/:id/board` | Driver | Mark passenger as boarded |
| PATCH | `/driver/bookings/:id/absent` | Driver | Mark passenger as absent |

#### Driver Earnings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/driver/earnings` | Driver | List own earnings |
| GET | `/driver/earnings/summary` | Driver | Earnings summary |

#### Driver Documents
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/driver/documents` | Driver | List own documents |
| POST | `/driver/documents` | Driver | Upload document (multipart) |

---

### 4.8 Trips — Public/Shared (`/trips`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/trips` | None | List trips (filterable: routeId, status, date, page, limit) |
| POST | `/trips` | Admin | Create trip |
| GET | `/trips/:id` | None | Get trip by ID |
| PATCH | `/trips/:id` | Admin | Update trip |
| PATCH | `/trips/:id/cancel` | Admin | Cancel trip |

---

### 4.9 Bookings (`/bookings`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/bookings` | Admin | List all bookings (with user join, filterable) |
| POST | `/bookings` | Bearer | Book seats — uses DB transaction (race-condition safe) |
| GET | `/bookings/:id` | Bearer | Get booking (own or admin) |
| PATCH | `/bookings/:id/cancel` | Bearer | Cancel booking + refund seats |

---

### 4.10 Wallet (`/wallet`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wallet` | Bearer | Get own wallet balance |
| GET | `/wallet/transactions` | Bearer | Own transaction history |
| GET | `/admin/wallet/transactions` | Admin | All transactions (filterable by userId, type) |
| POST | `/admin/wallet/refund` | Admin | Manual refund to user wallet |

---

### 4.11 Promo Codes (`/promo`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/promo` | Admin | List all promo codes |
| POST | `/promo` | Admin | Create promo code |
| GET | `/promo/:id` | Admin | Get promo code |
| PATCH | `/promo/:id` | Admin | Update promo code |
| DELETE | `/promo/:id` | Admin | Delete promo code |

---

### 4.12 Notifications (`/notifications`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | Bearer | Get own notifications |
| PATCH | `/notifications/:id/read` | Bearer | Mark as read |
| POST | `/admin/notifications` | Admin | Broadcast notification |

---

### 4.13 Support (`/support`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/support/tickets` | Admin | List all tickets |
| POST | `/support/tickets` | Bearer | Create ticket |
| GET | `/support/tickets/:id` | Bearer | Get ticket + messages |
| PATCH | `/support/tickets/:id` | Admin | Update ticket status/priority |
| POST | `/support/tickets/:id/messages` | Bearer | Reply to ticket |

---

### 4.14 Route Suggestions (`/suggestions`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/suggestions` | Admin | List all suggestions |
| POST | `/suggestions` | Bearer | Submit a route suggestion |
| PATCH | `/suggestions/:id` | Admin | Approve/reject suggestion |

---

### 4.15 Driver Documents (`/driver-documents`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/driver-documents` | Admin | List all documents (filterable) |
| PATCH | `/admin/driver-documents/:id/verify` | Admin | Approve/reject document |

---

### 4.16 Admin — Users & Analytics (`/admin`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/analytics` | Admin | Full analytics (revenue, booking stats, recent) |
| GET | `/admin/users` | Admin | List users (search, role filter, paginated) |
| GET | `/admin/users/:id` | Admin | Get user by ID |
| PATCH | `/admin/users/:id` | Admin | Update user |
| PATCH | `/admin/users/:id/toggle-block` | Admin | Block/unblock user |
| GET | `/admin/driver-analytics` | Admin | Driver analytics (earnings, top earners) |
| GET | `/admin/drivers/live` | Admin | Live driver positions + active trips |
| **GET** | **`/admin/trips/:id/full-timeline`** | **Admin** | **★ NEW — Full trip reconstruction** |

---

### 4.17 Staff & Roles (`/admin/staff`, `/admin/roles`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/permissions/all` | Admin | List all available permissions |
| GET | `/admin/roles` | Admin | List staff roles |
| POST | `/admin/roles` | Admin | Create staff role |
| PATCH | `/admin/roles/:id` | Admin | Update role permissions |
| DELETE | `/admin/roles/:id` | Admin | Delete role (unlinks users) |
| GET | `/admin/staff` | Admin | List all admin staff |
| POST | `/admin/staff` | Admin | Create staff account |
| PATCH | `/admin/staff/:id` | Admin | Update staff account |

**Available Permissions (28 total):**
`view_dashboard`, `view_routes`, `edit_routes`, `view_trips`, `edit_trips`, `view_drivers`, `edit_drivers`, `view_buses`, `edit_buses`, `view_passengers`, `edit_passengers`, `view_bookings`, `edit_bookings`, `view_wallet`, `edit_wallet`, `view_support`, `edit_support`, `view_suggestions`, `view_verification`, `edit_verification`, `view_analytics`, `view_staff`, `edit_staff`, `view_settings`, `edit_settings`, `view_promo`, `edit_promo`, `view_live_tracking`, `view_driver_analytics`, `view_notifications`

---

### 4.18 Dashboard (`/dashboard`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard/summary` | Admin | Full platform summary (20 metrics) |
| GET | `/dashboard/activity` | Admin | Recent activity feed (tickets, docs, bookings, trips) |
| GET | `/dashboard/analytics` | Admin | Charts data (trips/day, route popularity, driver activity) |

---

## 5. NEW: FULL TRIP TIMELINE ENDPOINT

### `GET /api/admin/trips/:id/full-timeline`

**Authentication:** Admin Bearer token required

**Response Shape:**
```json
{
  "trip": {
    "id": 1,
    "routeId": 2,
    "busId": 3,
    "driverId": 4,
    "departureTime": "...",
    "arrivalTime": "...",
    "status": "completed",
    "price": 45.00,
    "acceptedAt": "2026-05-23T10:01:00Z",
    "startedAt": "2026-05-23T10:15:00Z",
    "completedAt": "2026-05-23T11:30:00Z",
    "cancelledAt": null
  },
  "driver": {
    "id": 4,
    "name": "Ahmed Khalil",
    "phone": "...",
    "licenseNumber": "...",
    "rating": 4.9,
    "user": { "id": 12, "name": "...", "email": "..." }
  },
  "vehicle": {
    "id": 3,
    "plateNumber": "ABC-1234",
    "model": "Toyota Coaster",
    "capacity": 22
  },
  "route": {
    "id": 2,
    "name": "City Center → Airport",
    "startLocation": "...",
    "endLocation": "..."
  },
  "passengers": [
    { "id": 7, "name": "Sara", "email": "...", "phone": "..." }
  ],
  "bookings": [
    { "id": 5, "userId": 7, "seatCount": 1, "totalPrice": 45.00, "status": "completed" }
  ],
  "timeline": [
    { "id": 1, "tripId": 1, "type": "DRIVER_ACCEPTED", "metadata": { "driverId": 4 }, "createdAt": "..." },
    { "id": 2, "tripId": 1, "type": "LOCATION_UPDATE", "metadata": { "lat": 24.7, "lng": 46.6, "speed": 60 }, "createdAt": "..." },
    { "id": 3, "tripId": 1, "type": "TRIP_STARTED", "metadata": { "driverId": 4 }, "createdAt": "..." },
    { "id": 4, "tripId": 1, "type": "TRIP_COMPLETED", "metadata": { "driverId": 4 }, "createdAt": "..." }
  ],
  "summary": {
    "totalEvents": 12,
    "locationSnapshots": 8,
    "lifecycleEvents": 4
  }
}
```

---

## 6. SOCKET.IO REAL-TIME FLOWS

**Path:** `/api/socket.io`  
**Authentication:** JWT token in `socket.handshake.auth.token`  
**CORS:** `origin: "*"`

### Rooms
| Room | Joined By | Description |
|------|-----------|-------------|
| `admin:room` | Role=admin on connect | Receives all live tracking events |
| `trip:{tripId}` | Passenger via `passenger:join:trip` | Receives trip tracking for that trip |

### Client → Server Events
| Event | Allowed Role | Payload | Description |
|-------|-------------|---------|-------------|
| `driver:location:update` | driver | `{ latitude, longitude, speed?, heading?, tripId? }` | Driver sends GPS update |
| `passenger:join:trip` | user | `tripId: number` | Passenger subscribes to trip room |
| `driver:trip:start` | driver | `tripId: number` | Driver signals trip start (broadcast only) |
| `driver:trip:complete` | driver | `tripId: number` | Driver signals trip complete (broadcast only) |

### Server → Client Events
| Event | Target | Payload | Description |
|-------|--------|---------|-------------|
| `admin:track:trip` | admin:room | `{ driverId, latitude, longitude, speed, heading, tripId, timestamp }` | Real-time driver location |
| `passenger:trip:tracking` | trip:{tripId} room | `{ driverId, latitude, longitude, ...}` or `{ event: "trip:started"|"trip:completed", ... }` | Tracking for specific trip |
| `driver:location:ack` | driver socket | `{ ok: true }` | ACK for successful location update |
| `error` | emitting socket | `{ message: string }` | Error feedback |

> ⚠️ **Note:** Socket `driver:location:update` does NOT write `trip_events` — only the REST endpoint `PATCH /driver/location` does. Socket is broadcast-only for location.  
> ⚠️ Socket also updates `buses.current_latitude/longitude` if driver has `assigned_bus_id`.

---

## 7. TRIP LIFECYCLE FLOWS

### 7.1 Complete Shuttle Trip Lifecycle

```
[Admin creates trip]
      │
      ▼
  status: "scheduled"
      │
      ▼ PATCH /driver/trips/:id/accept
  status: "driver_assigned"
  accepted_at = NOW()
  trip_events: DRIVER_ACCEPTED
      │
      │  [Optional: boarding phase]
      ▼ (manual status change or boarding flow)
  status: "boarding"
      │
      ▼ PATCH /driver/trips/:id/start
  status: "active"
  started_at = NOW()
  trip_events: TRIP_STARTED
  driver.status = "busy"
  trip_station_progress rows created
      │
      │  [Ongoing: location updates, station progress]
      │  LOCATION_UPDATE events throttled ≥10s (REST only)
      │  Station arrived/completed markers updated
      │
      ▼ PATCH /driver/trips/:id/complete
  status: "completed"
  completed_at = NOW()
  trip_events: TRIP_COMPLETED
  driver.status = "online"
  bookings → "completed"
  driver_earnings: 15% of price (status=confirmed)
      │
  [OR] PATCH /driver/trips/:id/cancel
  status: "cancelled"
  cancelled_at = NOW()
  trip_events: TRIP_CANCELLED (with reason)
  driver.status = "online"
```

### 7.2 Passenger Booking Flow

```
GET /trips (browse available trips)
      │
POST /bookings (select trip + seat count + optional promo)
      │ DB transaction:
      │  - validate seats available
      │  - apply promo discount
      │  - decrement available_seats
      │  - create booking (status=confirmed, paymentStatus=paid)
      │
socket: passenger:join:trip(tripId)   ← subscribe to live tracking
      │
PATCH /driver/bookings/:id/board      ← driver marks boarded
  booking.status = "boarded"
      │
PATCH /driver/trips/:id/complete      ← trip ends
  booking.status = "completed"
      │
[OR] PATCH /bookings/:id/cancel
  booking.status = "cancelled"
  paymentStatus = "refunded"
  available_seats restored
```

### 7.3 Driver Registration Flow

```
POST /driver/auth/register
  → creates users row (role=driver)
  → creates drivers row
  → returns access + refresh tokens

PATCH /driver/status/online
  → driver.isOnline = true, status = "online"

PATCH /driver/location (periodically)
  → updates driver position
  → if tripId provided + ≥10s since last snapshot → writes LOCATION_UPDATE event
  → emits location via Socket.IO to admin:room + trip room

POST /driver/documents (upload verification docs)
  → creates driver_documents rows (status=pending)
  → admin approves/rejects via PATCH /admin/driver-documents/:id/verify
```

---

## 8. VEHICLE SERVICE STATUS

### 8.1 Shuttle Service
| Feature | Status |
|---------|--------|
| Schema (buses, routes, stations) | ✅ Fully implemented |
| Trip creation & management | ✅ Fully implemented |
| Driver assignment & lifecycle | ✅ Fully implemented |
| Seat booking & promo codes | ✅ Fully implemented |
| Station progress tracking | ✅ Fully implemented |
| Passenger boarding/absent marking | ✅ Fully implemented |
| Live GPS tracking (Socket.IO) | ✅ Fully implemented |
| Trip timeline/audit trail | ✅ NEW — Fully implemented |
| Driver earnings (15% auto) | ✅ Fully implemented |
| Admin full-timeline reconstruction | ✅ NEW — Fully implemented |

### 8.2 Car Service
| Feature | Status |
|---------|--------|
| Schema (vehicleType column) | ❌ NOT IMPLEMENTED |
| Car-specific trips | ❌ NOT IMPLEMENTED |
| On-demand ride request | ❌ NOT IMPLEMENTED |
| Car driver assignment | ❌ NOT IMPLEMENTED |
| Pickup/dropoff location per trip | ❌ NOT IMPLEMENTED |
| Price calculation for cars | ❌ NOT IMPLEMENTED |
| **Overall** | ❌ **DOES NOT EXIST — 0% complete** |

### 8.3 Motorcycle Service
| Feature | Status |
|---------|--------|
| Schema (vehicleType column) | ❌ NOT IMPLEMENTED |
| Motorcycle-specific trips | ❌ NOT IMPLEMENTED |
| On-demand ride request | ❌ NOT IMPLEMENTED |
| Motorcycle driver assignment | ❌ NOT IMPLEMENTED |
| Pickup/dropoff location per trip | ❌ NOT IMPLEMENTED |
| Price calculation for motorcycles | ❌ NOT IMPLEMENTED |
| **Overall** | ❌ **DOES NOT EXIST — 0% complete** |

---

## 9. TRACKING SYSTEM — SOURCE OF TRUTH

### Before This Session
- Driver location stored only in `drivers.current_latitude/longitude` (overwritten each update — no history)
- Trip state changes not recorded anywhere except the `trips.status` column

### After This Session — Current State

**Primary source of truth for trip tracking:**

| Data | Where Stored | Notes |
|------|-------------|-------|
| Current trip state | `trips.status` | Enum, single current value |
| When trip was accepted | `trips.accepted_at` | ✅ NEW — nullable timestamp |
| When trip started | `trips.started_at` | ✅ NEW — nullable timestamp |
| When trip completed | `trips.completed_at` | ✅ NEW — nullable timestamp |
| When trip cancelled | `trips.cancelled_at` | ✅ NEW — nullable timestamp |
| Full event history | `trip_events` | ✅ NEW table — append-only |
| Location snapshots | `trip_events` (LOCATION_UPDATE) | ✅ NEW — throttled ≥10s |
| Current driver position | `drivers.current_latitude/longitude` | Live only — always overwritten |
| Station progress | `trip_station_progress` | Per-station arrived/completed timestamps |

**To reconstruct any trip:** `GET /api/admin/trips/:id/full-timeline`

---

## 10. SECURITY STATUS

| Control | Status | Detail |
|---------|--------|--------|
| Password hashing | ✅ Active | bcrypt, cost factor 12 (auth) / 10 (driver) |
| JWT access tokens | ✅ Active | 15 minute expiry |
| JWT refresh tokens | ✅ Active | 7 day expiry, stored in DB (invalidatable) |
| Token rotation | ✅ Active | New refresh token issued on each `/auth/refresh` |
| Rate limiting (API) | ✅ Active | 200 req / 15 min |
| Rate limiting (auth) | ✅ Active | 20 req / 15 min |
| Helmet headers | ✅ Active | Security headers on all responses |
| CORS | ⚠️ Open | `origin: "*"` — should be restricted to known domains in production |
| Password in logs | ✅ Redacted | Auth route explicitly redacts password before logging |
| Refresh token in DB | ✅ Present | Allows logout/invalidation |
| Role-based access | ✅ Active | `requireRole()` middleware on all sensitive endpoints |
| Admin-only endpoints | ✅ Active | All `/admin/*` paths require admin role |
| Input validation | ✅ Active | Zod schemas on all request bodies/params |
| SQL injection | ✅ Protected | Drizzle ORM parameterized queries |
| File uploads | ✅ Present | Stored under `/uploads/`, served statically |
| Socket auth | ✅ Active | JWT verified on socket connection |
| Trust proxy | ✅ Set | `app.set("trust proxy", 1)` |

---

## 11. PRODUCTION READINESS

| Category | Status | Notes |
|----------|--------|-------|
| Database | ✅ Ready | Neon PostgreSQL, production-grade |
| API server | ✅ Ready | esbuild compiled, source maps, port from ENV |
| Auth | ✅ Ready | JWT + refresh token rotation |
| Logging | ✅ Ready | Pino structured JSON logging |
| Rate limiting | ✅ Ready | Configured on auth + API |
| Error handling | ⚠️ Partial | Some routes use try/catch, others let errors propagate |
| Environment config | ✅ Ready | `NEON_DATABASE_URL` or `DATABASE_URL` env vars |
| CORS | ❌ Not Ready | Open wildcard — must be restricted before prod |
| Wallet top-up | ❌ Not Ready | No payment gateway integrated (Stripe etc.) |
| Push notifications | ❌ Not Ready | DB notifications table exists but no FCM/APNs push |
| Email verification | ❌ Not Ready | `is_verified` field exists but no email flow |
| Background jobs | ❌ Missing | No cron for recurring trips, earnings payouts etc. |
| Migrations | ⚠️ Manual | Drizzle Kit push used; no versioned migration files |
| Health check | ✅ Ready | `GET /api/healthz` endpoint exists |

---

## 12. MISSING / INCOMPLETE FEATURES

### Critical Missing
- **Car ride service** — completely absent from codebase
- **Motorcycle ride service** — completely absent from codebase
- **Payment gateway** — wallet exists but no top-up mechanism
- **Push notifications** — table exists, no delivery pipeline
- **Email verification** — field exists (`is_verified`), no email flow
- **Recurring trip automation** — `recurring_type` column exists, no cron/job to auto-generate

### Incomplete / Partial
- **Wallet deduction on booking** — booking charges `totalPrice` to the record but does NOT deduct from `users.wallet_balance` — it just creates the booking with `paymentStatus=paid`
- **Driver arrived phase** — `trips.arrived_at` column exists but no endpoint stamps it; there's no `DRIVER_ARRIVED` event triggered from any route
- **Booking `seatNumbers`** — mentioned in original design but schema only has `seat_count` (no specific seat selection)
- **Promo: `reference_id`** — wallet transactions have no `reference_id` column (original design mentioned it)
- **CORS restriction** — currently `origin: "*"`

### Features Marked Effectively as "TODO/Soon"
- **Car service** — no schema, no routes, no events
- **Motorcycle service** — no schema, no routes, no events
- **`DRIVER_ARRIVED` event** — `arrived_at` column added to trips but no code stamps it
- **Socket.IO location events → `trip_events`** — the WebSocket `driver:location:update` handler does NOT write `trip_events`; only the REST endpoint does

---

## 13. CURRENT DATABASE COUNT (Tables)

| # | Table Name | Purpose |
|---|-----------|---------|
| 1 | `users` | All user accounts (passengers, drivers, admins) |
| 2 | `drivers` | Driver profiles + GPS state |
| 3 | `buses` | Fleet vehicles |
| 4 | `routes` | Fixed shuttle routes |
| 5 | `stations` | Stops along each route |
| 6 | `trips` | Trip instances (source of truth) |
| 7 | `trip_events` | ★ NEW: Event log / audit trail |
| 8 | `trip_station_progress` | Per-trip station arrival state |
| 9 | `bookings` | Passenger seat reservations |
| 10 | `wallet_transactions` | User wallet ledger |
| 11 | `driver_earnings` | Driver payout records |
| 12 | `promo_codes` | Discount codes |
| 13 | `notifications` | In-app notifications |
| 14 | `support_tickets` | Customer support tickets |
| 15 | `support_messages` | Support ticket replies |
| 16 | `route_suggestions` | User/driver route requests |
| 17 | `driver_documents` | KYC documents for driver verification |
| 18 | `staff_roles` | Role-based permission groups |

**Total: 18 tables**

---

## 14. ROUTE FILES SUMMARY

| File | Routes Count | Domain |
|------|-------------|--------|
| `health.ts` | 1 | Health check |
| `auth.ts` | 4 | Authentication |
| `users.ts` | 4 | Passenger profile |
| `routes.ts` | 9 | Route/station management |
| `buses.ts` | 5 | Fleet management |
| `drivers.ts` | 7 | Admin driver management |
| `driver.ts` | ~22 | Driver self-service |
| `trips.ts` | 5 | Trip management |
| `bookings.ts` | 4 | Booking flow |
| `wallet.ts` | 4 | Wallet & transactions |
| `promo.ts` | 5 | Promo codes |
| `notifications.ts` | 3 | Notifications |
| `support.ts` | 5 | Support tickets |
| `suggestions.ts` | 3 | Route suggestions |
| `driverDocuments.ts` | 2 | Document verification |
| `admin.ts` | 8 | Admin analytics + **full-timeline** |
| `staff.ts` | 7 | Staff/role management |
| `dashboard.ts` | 3 | Dashboard data |

**Total: ~111 endpoints**

---

## 15. SUMMARY OF CHANGES IN THIS SESSION

| Change | Type | File |
|--------|------|------|
| Added `accepted_at`, `arrived_at`, `started_at`, `completed_at`, `cancelled_at` to `trips` table | Schema + Migration | `lib/db/src/schema/trips.ts` |
| Created `trip_events` table | Schema + Migration | `lib/db/src/schema/tripEvents.ts` |
| Exported `tripEventsTable` from schema index | Schema | `lib/db/src/schema/index.ts` |
| Record `DRIVER_ACCEPTED` event + stamp `accepted_at` on trip accept | API | `driver.ts` |
| Record `TRIP_STARTED` event + stamp `started_at` on trip start | API | `driver.ts` |
| Record `TRIP_COMPLETED` event + stamp `completed_at` on trip complete | API | `driver.ts` |
| Record `TRIP_CANCELLED` event + stamp `cancelled_at` on trip cancel | API | `driver.ts` |
| Record `LOCATION_UPDATE` event (throttled ≥10s) on location ping | API | `driver.ts` |
| Added `GET /admin/trips/:id/full-timeline` endpoint | API | `admin.ts` |
| Applied DB migration script | DB | `lib/db/scripts/migrate-tracking.ts` |

---

*End of Report — VeeGo Backend Audit v2.0 (2026-05-23)*
