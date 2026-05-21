## Overview

Build a first usable authentication flow and homepage experience for the existing TanStack Start app.

The app should support two homepage states:

- Unauthenticated users see a public landing page at `/`
- Authenticated users see a user homepage at `/`

The first implementation will use these backend endpoints from the OpenAPI spec:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

The backend auth mechanism is bearer token based.

## Goals

- Add a working register page
- Add a working login page
- Add login state persistence with local token storage
- Make `/` render a public landing page for guests
- Make `/` render a user homepage for authenticated users
- Update header actions based on auth state
- Handle invalid or expired local token by falling back to guest state

## Non-Goals

- Refresh token flow
- SMS login or verification code login
- Password reset
- Profile editing
- Avatar upload
- Role-based routing
- Full dashboard feature set
- Integrating `/api/home-videos/public` in this first pass

## Route Design

Add three user-facing routes:

- `/`
  - Guest state: public landing page
  - Authenticated state: user homepage
- `/login`
  - Login form
- `/register`
  - Registration form

`/` stays the primary entry route. The route decides what to render based on the resolved auth state instead of splitting the first version into separate `/` and `/app` destinations.

## Auth State Model

Auth state is not determined only by the presence of a token. The source of truth is the profile request.

Rules:

- No local token: guest state
- Local token exists and `GET /api/auth/profile` succeeds: authenticated state
- Local token exists and `GET /api/auth/profile` fails: clear token and return to guest state

This avoids treating stale or invalid tokens as a valid session.

## API and Storage Design

Add a minimal request layer and token storage helpers.

### Token Storage

Create a small auth utility for local storage operations:

- read access token
- write access token
- clear access token

Only `access_token` is required for the first version.

### API Client

Create a small JSON request helper that:

- prefixes requests with the backend base URL
- attaches `Authorization: Bearer <token>` when a token exists
- parses JSON responses
- unwraps backend response envelopes when `success === true`
- throws a normalized error using backend `message` when available

The response envelope shape expected from auth endpoints is:

- `success`
- `code`
- `message`
- `data`
- `timestamp`

### Base URL

The frontend should not hardcode `http://localhost:8004` directly inside route components. Put the base URL in one place inside the request layer so it can be changed later with minimal impact.

## Data Fetching Design

Use React Query for the authenticated user profile.

### Profile Query

Add a single query for current user profile, for example with a query key like:

- `['auth', 'profile']`

Behavior:

- If there is no stored token, do not fetch
- If there is a stored token, fetch profile
- On success, the app is authenticated
- On auth failure, clear token and treat the app as logged out

### Login Mutation

`POST /api/auth/login`

Request body:

- `username`
- `password`

Success flow:

1. submit credentials
2. receive token payload
3. save `access_token`
4. fetch or refresh profile query
5. navigate to `/`

### Register Mutation

`POST /api/auth/register`

Request body first version:

- `username`
- `email`
- `password`

Optional backend fields such as `nickname`, `invite_code`, and `brand_key` are intentionally skipped in the first UI unless later required.

Success flow:

1. submit registration data
2. receive token payload
3. save `access_token`
4. fetch or refresh profile query
5. navigate to `/`

### Logout Flow

First version uses local logout:

1. clear local token
2. clear or invalidate profile query cache
3. navigate to `/`

The backend `POST /api/auth/logout` endpoint is not required for the first pass.

## UI Structure

Keep the structure small and readable.

### Routes

- `src/routes/index.tsx`
- `src/routes/login.tsx`
- `src/routes/register.tsx`

### Shared/Auth Modules

- `src/lib/api.ts`
- `src/lib/auth.ts`
- `src/features/auth/use-profile.ts`
- `src/features/auth/use-login.ts`
- `src/features/auth/use-register.ts`

### UI Components

- `src/features/home/public-home.tsx`
- `src/features/home/user-home.tsx`
- update `src/components/Header.tsx`

If the two auth forms are nearly identical, a shared form component is acceptable. If abstraction makes the code harder to read, keep separate form implementations.

## Page Content

### Public Home

Reuse the current visual tone of the starter rather than introducing a disconnected design language.

The public home should include:

- product headline
- short supporting copy
- clear CTAs for login and register
- a few simple value points

### User Home

The authenticated homepage should focus on profile-derived information only.

Display these fields when available:

- `username`
- `nickname`
- `email`
- `membership_level`
- `remaining_quota`
- `used_quota`
- `created_at`

Also include a logout action.

### Header Behavior

Guest header:

- show links/actions for `Login` and `Register`

Authenticated header:

- show current username or nickname
- show logout action

## Loading and Error Handling

### Initial App State

When `/` is visited and a token exists but profile is still loading, render a light loading state rather than immediately flashing guest content.

### Form Validation

Keep validation minimal and aligned with known backend requirements.

Login:

- `username` required
- `password` required

Register:

- `username` required
- `email` required
- `password` required

### Error Messages

- Prefer backend `message` when present
- Otherwise show a simple fallback like `Request failed`
- Do not infer extra password rules the backend has not documented

### Invalid Token Recovery

If profile fetch fails because the token is no longer valid:

- clear token
- clear cached profile
- render guest UI

## Testing Strategy

Implementation should follow TDD.

Minimum test coverage for first pass:

- token storage helpers
- request helper auth header behavior
- request helper error parsing
- homepage guest rendering with no token
- homepage authenticated rendering with successful profile fetch
- homepage fallback to guest rendering when profile fetch fails
- login success flow stores token and returns to `/`
- register success flow stores token and returns to `/`

Tests should focus on user-visible behavior and request-layer behavior, not styling details.

## Acceptance Criteria

- Visiting `/` while logged out shows the public landing page
- Visiting `/login` shows a login form
- Visiting `/register` shows a registration form
- Successful login returns the user to `/` and shows the authenticated homepage
- Successful registration returns the user to `/` and shows the authenticated homepage
- Refreshing the browser preserves login state when the stored token is still valid
- An invalid stored token automatically falls back to guest state
- Header actions change correctly between guest and authenticated states
- Logout returns the app to guest state

## Implementation Notes

- Prefer small additions that match the existing TanStack Start structure
- Avoid introducing a large global auth provider unless route/query integration clearly needs it
- Keep the first version centered on the three confirmed endpoints: register, login, and profile
