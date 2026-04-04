# Zorvyn Finance Backend

Backend for a role-based finance data platform using Node.js, Express, and MongoDB.

## Architecture

Request flow is: Route -> Middleware -> Controller -> Model -> Database.

- Routes define endpoints and map requests.
- Middleware handles role checks and shared request logic.
- Controllers handle validation and business logic.
- Models define schema and database interaction.
- MongoDB stores users and financial records.

## Validation and Error Handling

- Required fields are validated in controllers before DB operations.
- Invalid ids, invalid enum values, invalid date filters, and bad pagination inputs return `400`.
- Missing resources return `404`.
- RBAC violations return `403`.
- Unknown routes are handled by centralized `404` middleware.

## Data Models

- User: `name`, `email`, `role`, timestamps.
- Financial Record: `amount`, `type`, `category`, `date`, `note`, `userId`, timestamps.
- Relationship: `FinancialRecord.userId` references `User._id`.

## Run

- Install dependencies: `npm install`
- Start server: `npm run start`
- Dev mode: `npm run dev`

## Role Header

All protected endpoints use a role from request header:

- Header key: `x-user-role`
- Identity header (for scoped data): `x-user-id`
- Allowed values: `viewer`, `analyst`, `admin`
- Missing header defaults to `viewer`
- RBAC is enforced using middleware before controllers run.

Data scope rules:

- `viewer` and `analyst` can only read their own data (`x-user-id` required on scoped endpoints).
- `admin` can read all data and can still use optional `userId` query filter.

Role permissions used in this project:

- `viewer`: read financial records only
- `analyst`: read financial records + access dashboard summary
- `admin`: full access (user management + record CRUD + dashboard)

## API Endpoints

### Health

- `GET /`

### Users (admin only)

- `POST /api/users`
- `GET /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

`GET /api/users` query params:

- `page` (default `1`)
- `limit` (default `10`, max `100`)
- `sortBy` (`name`, `email`, `role`, `createdAt`, `updatedAt`)
- `order` (`asc` or `desc`)

### Financial Records

- `POST /api/records` (admin)
- `GET /api/records` (viewer, analyst, admin)
- `PUT /api/records/:id` (admin)
- `DELETE /api/records/:id` (admin)

`GET /api/records` query params:

- `userId` (optional)
- `type` (`income` or `expense`)
- `category`
- `startDate` (ISO date)
- `endDate` (ISO date)
- `page` (default `1`)
- `limit` (default `10`, max `100`)
- `sortBy` (`date`, `amount`, `category`, `type`, `createdAt`, `updatedAt`)
- `order` (`asc` or `desc`)

Scope behavior for `GET /api/records`:

- `viewer`/`analyst`: only own records are returned (based on `x-user-id`).
- `admin`: can read all records or filter by `userId`.

### Dashboard Summary

- `GET /api/dashboard/summary` (analyst, admin)

Query params:

- `userId` (optional)
- `startDate` (optional)
- `endDate` (optional)

Response includes:

- `totalIncome`
- `totalExpense`
- `netBalance`
- `monthlyTrends` (monthly income/expense breakdown)
- `categoryTotals`

Scope behavior for `GET /api/dashboard/summary`:

- `viewer`/`analyst`: summary is scoped to own records (`x-user-id`).
- `admin`: can see all data or pass `userId` for per-user summary.

## Smoke Test

Run API smoke checks:

- `npm run smoke`

Smoke script behavior:

- If server is not running, the script starts it automatically.
- It waits for API readiness, runs checks, then stops only the process it started.
- If server is already running, it uses the existing server.

## Postman

Shared Postman request/workspace link:

- https://kingbadshah0304-7970561.postman.co/workspace/Tanishk-Deore's-Workspace~ede9b7b5-4bfa-447b-8a44-96fcf0fcfb1a/request/53746953-4fba48ae-d13f-40e7-b4eb-57f005ef806a?action=share&creator=53746953&active-environment=53746953-fc46a987-0aa7-4f38-843e-867ac63faf8a

Postman collection documentation:

- https://documenter.getpostman.com/view/53746953/2sBXionW1V

The script checks:

- RBAC behavior
- User creation
- Record creation
- `userId` filtering
- Dashboard access by role

## Design Decisions

- Used header-based role (`x-user-role`) to focus this assignment on backend logic, not auth setup.
- Used MongoDB + Mongoose because records are document-like and easy to aggregate for dashboard totals.
- Kept RBAC in middleware so controllers stay clean and role checks are centralized.
- Kept the system simple on purpose: clear layers, predictable APIs, minimal abstractions.

## Assumptions

- Authentication is mocked through request headers (`x-user-role`).
- Request identity for scoped reads is mocked through `x-user-id`.
- No login/signup or token flow is included in this version.
- `userId` filter is optional for records and dashboard summary.
- Roles are limited to `viewer`, `analyst`, and `admin`.
