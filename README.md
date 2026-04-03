# Zorvyn Finance Backend

Backend for a role-based finance data platform using Node.js, Express, and MongoDB.

## Run

- Install dependencies: `npm install`
- Start server: `npm run start`
- Dev mode: `npm run dev`

## Role Header

All protected endpoints use a role from request header:

- Header key: `x-user-role`
- Allowed values: `viewer`, `analyst`, `admin`
- Missing header defaults to `viewer`

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
- `categoryTotals`

## Smoke Test

Run API smoke checks against a running local server:

- `npm run smoke`

The script checks:

- RBAC behavior
- User creation
- Record creation
- `userId` filtering
- Dashboard access by role
