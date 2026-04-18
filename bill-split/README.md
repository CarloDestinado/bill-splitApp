# Bill Split App

A full-stack web application for splitting bills and shared expenses among friends, groups, or households.

---

## Table of Contents

- [Overview](#overview)
- [What It's Used For](#what-its-used-for)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [System Flow](#system-flow)
- [User Flows](#user-flows)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [User Types & Limits](#user-types--limits)
- [Key Features](#key-features)

---

## Overview

The Bill Split App allows users to create bills, share them with others via invitation codes, and track who has paid their share. It supports both registered users and guest access via invitation links.

---

## What It's Used For

- **Splitting shared expenses** - dinners, trips, rent, utilities, events
- **Tracking payment status** - see who has paid and who owes
- **Invitation-based sharing** - invite others via unique codes or email
- **Guest access** - allow non-registered users to view specific bills
- **Account tier system** - Standard (limited) vs Premium (unlimited)

---

## Tech Stack

### Frontend
- **React 19.2.0** - UI framework
- **Vite 7.3.1** - Build tool
- **React Router DOM 7** - Client-side routing
- **Axios 1** - HTTP client

### Backend
- **Laravel 10.10** - PHP API framework
- **Laravel Sanctum 3.3** - API authentication (token-based)
- **PHP 8.1+**
- **MySQL** - Database

---

## Project Structure

```
bill-splitApp/
├── bill-split/                    # React Frontend
│   ├── src/
│   │   ├── main.jsx              # Entry point
│   │   ├── App.jsx               # Root component
│   │   ├── pages/                # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── BillDetail.jsx
│   │   │   ├── GuestLogin.jsx
│   │   │   ├── GuestDashboard.jsx
│   │   │   └── ...
│   │   ├── services/             # API service layer
│   │   │   └── api.js            # Axios instance with interceptors
│   │   ├── context/              # React contexts
│   │   │   └── AuthContext.jsx   # Auth state management
│   │   └── components/           # Reusable components
│   ├── public/
│   └── package.json
│
└── bill-split-api/               # Laravel Backend
    ├── app/
    │   ├── Http/Controllers/     # API controllers
    │   ├── Models/               # Eloquent models
    │   └── Providers/            # Service providers
    ├── routes/
    │   └── api.php               # API route definitions
    ├── database/
    │   └── migrations/           # Database schema
    ├── config/                   # Laravel config
    ├── public/
    │   └── index.php             # Web entry point
    └── artisan                   # CLI entry point
```

---

## System Flow

### Architecture Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React SPA     │ ──────▶ │   Laravel API   │ ──────▶ │     MySQL       │
│  (Frontend)     │ ◀────── │   (Backend)     │ ◀────── │   (Database)    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  LocalStorage   │         │ Personal Access │
│  (Token/User)   │         │   Tokens Table  │
└─────────────────┘         └─────────────────┘
```

### Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     USER LOGIN                               │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  POST /api/login  { email, password }                       │
│  ───────────────────────────────────────                     │
│  1. Check email verified?                                    │
│  2. Create Sanctum personal access token                    │
│  3. Return { user, token }                                   │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  React stores token in localStorage                          │
│  Axios interceptor attaches Bearer token to all requests    │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  401 Response? → Clear localStorage → Redirect to /login     │
└──────────────────────────────────────────────────────────────┘
```

### Guest Access Flow

```
┌──────────────────────────────────────────────────────────────┐
│  Guest opens link: /guest/login?code=ABC123                  │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│  POST /api/guest/login { email, invitation_code }            │
└──────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
           ┌─────────────┐        ┌─────────────┐
           │ Email not   │        │ Email found │
           │ found       │        │ → continue   │
           └──────┬──────┘        └──────┬──────┘
                  ▼                      ▼
          ┌─────────────┐        ┌─────────────┐
          │ Redirect to │        │ Create/load │
          │ registration│        │ guest token │
          └─────────────┘        └──────┬──────┘
                                         ▼
                                ┌─────────────────┐
                                │ /guest/dashboard│
                                │ (6hr daily limit)│
                                └─────────────────┘
```

---

## User Flows

### Flow 1: Registered User Registration

```
/register
    │
    ▼
Fill: last_name, first_name, nickname, email, username, password
    │
    ▼
POST /api/register
    │
    ▼
Email verification sent
    │
    ▼
User clicks verification link → POST /api/email/verify/{id}/{hash}
    │
    ▼
Can now login
```

### Flow 2: Registered User Login

```
/login
    │
    ▼
Enter email + password → POST /api/login
    │
    ▼
Token created → Redirect /dashboard
    │
    ▼
View all bills, create new bills, invite users
```

### Flow 3: Guest via Invitation Code

```
Received: /guest/login?code=ABC123
    │
    ▼
Enter email → POST /api/guest/login
    │
    ▼
Guest account created/loaded → /guest/dashboard
    │
    ▼
View bill (shared with this code)
    │
    ▼
Option: Upgrade to Standard (set password)
```

### Flow 4: Create and Share a Bill

```
/dashboard → [Create Bill]
    │
    ▼
Fill: title, total_amount, description, due_date
    │
    ▼
POST /api/bills → Bill created with invitation_code
    │
    ▼
Share via:
  - Copy invitation code
  - Select Users → /select-users
  - Share by email → POST /api/bills/{id}/share
```

### Flow 5: Join a Bill

```
Method A: /guest/search → Enter code → POST /api/verify-invitation
    │
    ▼
Navigate /guest/login?code=XXX → Login flow

Method B: POST /api/bills/join-with-code { invitation_code }
    │
    ▼
Added to bill, share_amount recalculated
```

### Flow 6: Upgrade Account

```
Guest → Standard:
/profile or /upgrade
    │
    ▼
Enter password → POST /api/upgrade-account
    │
    ▼
user_type = 'registered'

Standard → Premium:
/upgrade
    │
    ▼
POST /api/user/upgrade-premium { payment_method, payment_token }
    │
    ▼
account_type = 'premium', premium_expiry = +1 year
```

---

## API Endpoints

### Public Routes (No Authentication)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/register` | `{last_name, first_name, nickname, email, username, password, password_confirmation}` | `{message, email}` |
| POST | `/api/login` | `{email, password}` | `{message, user, token, email_verified}` |
| POST | `/api/guest/login` | `{email, invitation_code}` | `{action, message, user?, token?, bill?}` |
| POST | `/api/guest/register` | `{first_name, last_name, username}` | `{message, user, token}` |
| POST | `/api/guest/register-with-code` | `{first_name, last_name, username, nickname, email, invitation_code}` | `{message, user, token, bill}` |
| POST | `/api/verify-invitation` | `{invitation_code}` | `{valid, bill?}` |
| POST | `/api/check-username` | `{username}` | `{exists}` |
| POST | `/api/guest/check-email` | `{email, invitation_code}` | `{exists, user_type, bill?}` |
| POST | `/api/forgot-password` | `{email}` | `{message, reset_token}` |
| POST | `/api/reset-password` | `{nickname, email, password, password_confirmation}` | `{message}` |
| GET | `/api/email/verify/{id}/{hash}` | - | `{message, user}` |

### Protected Routes (Authentication Required)

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/api/user` | - | `{user}` |
| PUT | `/api/user/update` | `{first_name?, last_name?, email?}` | `{message, user}` |
| POST | `/api/logout` | - | `{message}` |
| POST | `/api/upgrade-account` | `{password}` | `{message, user}` |
| POST | `/api/user/upgrade-premium` | `{payment_method, payment_token}` | `{message, user}` |
| GET | `/api/email/verify/check` | - | `{verified}` |
| GET | `/api/users/all` | - | `{users}` |
| GET | `/api/bills` | - | `{bills}` |
| POST | `/api/bills` | `{title, total_amount, description?, due_date?}` | `{message, bill}` |
| GET | `/api/bills/{id}` | - | `{bill}` |
| PUT | `/api/bills/{id}` | `{title?, total_amount?, description?, due_date?, status?}` | `{message, bill}` |
| DELETE | `/api/bills/{id}` | - | `{message}` |
| POST | `/api/bills/{id}/share` | `{email}` | `{message, bill}` |
| GET | `/api/bills/{id}/users` | - | `{users}` |
| POST | `/api/bills/join-with-code` | `{invitation_code}` | `{message, bill}` |
| POST | `/api/invitations/create` | `{bill_id, invitee_email}` | `{message, invitation}` |
| POST | `/api/invitations/{id}/accept` | - | `{message}` |

---

## Database Schema

### users
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| first_name | varchar | User's first name |
| last_name | varchar | User's last name |
| email | varchar | Unique email |
| password | varchar | Hashed password (nullable for guests) |
| nickname | varchar | Unique display name |
| username | varchar | Unique username |
| user_type | enum | 'guest' or 'registered' |
| account_type | enum | 'standard' or 'premium' |
| premium_expiry | datetime | Premium expiration date |
| bills_created_count | int | Bills created this month |
| bills_count_reset_at | timestamp | Monthly reset date |
| access_hours_used | decimal | Hours used by guests |
| access_reset_at | timestamp | Daily access reset |
| last_access_time | timestamp | Last activity |
| email_verified_at | timestamp | Email verification |
| created_at | timestamp | |
| updated_at | timestamp | |

### bills
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| created_by | bigint | FK to users.id |
| title | varchar | Bill title |
| total_amount | decimal | Total bill amount |
| invitation_code | varchar | Unique 8-char code (md5) |
| status | enum | 'active', 'completed', 'cancelled', 'archived' |
| due_date | date | Payment due date |
| description | text | Bill description |
| created_at | timestamp | |
| updated_at | timestamp | |

### bill_users (Pivot Table)
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| bill_id | bigint | FK to bills.id |
| user_id | bigint | FK to users.id |
| share_amount | decimal | User's share (equal split) |
| payment_status | enum | 'pending', 'paid', 'partial' |
| created_at | timestamp | |
| updated_at | timestamp | |

### invitations
| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| bill_id | bigint | FK to bills.id |
| invited_by | bigint | FK to users.id |
| invitee_email | varchar | Email of invitee |
| invitation_code | varchar | Unique code |
| status | enum | 'pending', 'accepted', 'expired' |
| expires_at | timestamp | Expiration time |
| created_at | timestamp | |
| updated_at | timestamp | |

---

## User Types & Limits

| Feature | Guest | Standard | Premium |
|---------|-------|----------|---------|
| Bills per month | N/A | 5 | Unlimited |
| Users per bill | N/A | 3 | Unlimited |
| Access time | 6 hours/day | Unlimited | Unlimited |
| Create bills | No | Yes | Yes |
| Join bills | Yes | Yes | Yes |

### Limit Enforcement

**Guest Access (6hr/day):**
- Backend tracks `access_hours_used` and `access_reset_at`
- Reset after 24 hours of inactivity
- Frontend shows countdown timer, auto-logout at 0

**Standard Bill Limit (5/month):**
- Counter: `bills_created_count`
- Reset monthly: `bills_count_reset_at`
- Checked in User::canCreateBill()

**Standard User Limit (3 per bill):**
- Checked when sharing or joining
- Returns 403 if limit reached

---

## Key Features

### 1. Invitation Code System
- Auto-generated 8-character md5 codes
- Users can join bills without registration
- Codes verified via `/api/verify-invitation`

### 2. Equal Split Calculation
- `share_amount = total_amount / number_of_users`
- Recalculated automatically when users added/removed

### 3. Payment Status Tracking
- Per-user payment status: pending, paid, partial
- Bill creator can mark users as paid

### 4. Email Notifications
- Email verification on registration
- Password reset via token links
- Share bills by email invitation

### 5. Guest Access Control
- Time-limited access (6 hours/day)
- Interval tracking with auto-logout
- Upgrade path to full registration

### 6. Account Tier System
- Guest → Standard (set password)
- Standard → Premium (payment, unlimited access)

---

## Page Routes

| Route | Component | Auth | Purpose |
|-------|-----------|------|---------|
| `/login` | Login.jsx | Public | Registered login |
| `/register` | Register.jsx | Public | Registration |
| `/forgot-password` | ForgotPass.jsx | Public | Reset password |
| `/code-invite` | CodeInvite.jsx | Public | Join via code |
| `/guest/login` | GuestLogin.jsx | Public | Guest access |
| `/guest/search` | GuestBillSearch.jsx | Public | Find bill |
| `/guest/registration` | GuestRegistration.jsx | Public | Guest signup |
| `/guest/dashboard` | GuestDashboard.jsx | Token | Guest view |
| `/dashboard` | Dashboard.jsx | Auth | Main dashboard |
| `/bills/:id` | BillDetail.jsx | Auth | Bill management |
| `/profile` | Profile.jsx | Auth | User profile |
| `/upgrade` | Upgrade.jsx | Auth | Premium upgrade |
| `/select-users` | SelectUsers.jsx | Auth | Invite users |

---

## How to Run

### Backend (Laravel)

```bash
cd bill-split-api

# Install dependencies
composer install

# Run migrations
php artisan migrate

# Start server
php artisan serve
# → http://localhost:8000
```

### Frontend (React/Vite)

```bash
cd bill-split

# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:5173
```

---

## Data Flow Example: Create Bill

```
1. User fills CreateBillModal form
         │
         ▼
2. billAPI.create({ title, total_amount, description, due_date })
         │
         ▼
3. POST /api/bills with Bearer token header
         │
         ▼
4. BillController::store()
         │
         ▼
5. Check $user->canCreateBill()
         │
         ▼
6. Bill::create([ created_by, title, total_amount, ... ])
         │
         ▼
7. BillUser::create([ bill_id, user_id, share_amount = total_amount ])
         │
         ▼
8. Increment bills_created_count
         │
         ▼
9. Return { message, bill } → JSON response
         │
         ▼
10. React updates state, shows success, navigates to bill
```

---

## Data Flow Example: Guest Access Tracking

```
1. Guest opens bill: GET /api/bills/{id}
         │
         ▼
2. BillController::show() → check isGuest()
         │
         ▼
3. Calculate hours since access_reset_at
         │
         ▼
4. Update access_hours_used
         │
         ▼
5. Check if access_hours_used >= 6
         │
         ├── Yes → 403 access_limit_reached
         │
         └── No → Return bill data
```

---

*Document generated from codebase analysis.*