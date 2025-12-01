# Frontend-Backend Integration Guide

## Overview

Frontend has been successfully integrated with the ASP.NET Core backend API, replacing Supabase authentication.

## Changes Made

### 1. Removed Supabase
- ✅ Deleted `src/integrations/supabase/` folder
- ✅ Removed `@supabase/supabase-js` from package.json
- ✅ Removed all Supabase imports and usage

### 2. Created New Services

#### API Client (`src/services/api.ts`)
- HTTP client for backend communication
- Automatic JWT token injection
- Error handling
- Base URL from environment variable

#### Authentication Service (`src/services/auth.ts`)
- Login/Register methods
- Token management
- User data storage
- Session management

### 3. Created Auth Context (`src/contexts/AuthContext.tsx`)
- React context for global auth state
- Provides `useAuth()` hook
- Manages user state across the app

### 4. Updated Components

#### Login Page
- Now uses `authService.login()` and `authService.register()`
- Connected to backend `/api/auth/login` and `/api/auth/register`

#### ProtectedRoute
- Uses `useAuth()` hook instead of Supabase
- Checks authentication via AuthContext

#### Layout
- Uses `useAuth()` for user data
- Logout calls `authService.logout()`

## Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_URL=http://localhost:5234
```

Default value is `http://localhost:5234` if not set.

## API Endpoints Used

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout (protected)

## Authentication Flow

1. User logs in → `authService.login()` → JWT token stored in localStorage
2. Token automatically added to all API requests via `apiClient`
3. Protected routes check `useAuth()` hook
4. Token validated on each protected API call

## Token Storage

- Token: `localStorage.getItem("auth_token")`
- User: `localStorage.getItem("auth_user")`

## Next Steps

1. Install dependencies: `npm install` (Supabase removed)
2. Create `.env` file with `VITE_API_URL`
3. Ensure backend is running on port 5234
4. Start frontend: `npm run dev`

## Testing

1. Register a new user
2. Login with credentials
3. Access protected routes
4. Logout functionality

