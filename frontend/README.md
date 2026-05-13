# OphthoCare Frontend - Phase 1

Next.js 14 frontend for OphthoCare universal medical platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Authentication**: NextAuth.js v5
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS
- **UI Components**: Custom + shadcn/ui

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/          # Public pages (no auth required)
│   │   ├── login/         # Login page
│   │   ├── search/        # Doctor search
│   │   └── layout.tsx     # Public layout
│   ├── (dashboard)/       # Protected dashboard
│   │   ├── patient/       # Patient pages
│   │   ├── doctor/        # Doctor pages
│   │   └── layout.tsx     # Dashboard layout
│   └── api/auth/          # NextAuth endpoints
│
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   ├── search/           # Search components
│   ├── appointments/     # Appointment components
│   ├── medical/          # Medical components
│   ├── common/           # Common components
│   └── ui/               # UI components
│
├── lib/                  # Utilities
│   ├── api/             # API client & endpoints
│   ├── auth.ts          # NextAuth config
│   ├── constants/       # Constants
│   ├── utils/           # Utility functions
│   └── validators/      # Validation rules
│
├── store/               # Zustand stores
│   ├── auth-store.ts
│   ├── search-store.ts
│   └── appointment-store.ts
│
├── hooks/               # Custom hooks
│   ├── use-auth.ts
│   ├── use-search.ts
│   ├── use-appointments.ts
│   └── use-doctors.ts
│
├── types/               # TypeScript types
└── styles/              # Global styles
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

Required variables:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3001)
- `NEXTAUTH_URL`: Frontend URL (default: http://localhost:3000)
- `NEXTAUTH_SECRET`: Random secret key for NextAuth

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Available Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start               # Run production build

# Quality
npm run lint            # ESLint check
npm run type-check      # TypeScript check
npm run format          # Prettier format

# Testing
npm run test            # Run tests
npm run test:watch      # Watch mode
```

## Key Features - Phase 1

✅ User Authentication (Login/Register)
✅ Protected Routes
✅ Doctor Search
✅ Doctor Profiles
✅ Appointment Booking
✅ Patient Dashboard
✅ Doctor Dashboard
✅ Responsive Design
✅ Error Handling
✅ Loading States

## Architecture Patterns

### Authentication Flow
1. User enters credentials in login form
2. NextAuth contacts `/auth/login` endpoint
3. Backend returns JWT tokens
4. Tokens stored in session
5. Axios interceptor adds token to requests
6. Token auto-refreshed when expired

### State Management
- **Auth**: Zustand store + NextAuth session
- **Search**: Zustand store for search state
- **Appointments**: Zustand store for appointments
- **API**: Axios instance with interceptors

### Component Structure
- **Page Components**: Server-side rendered (app directory)
- **UI Components**: Client-side interactive (use 'use client')
- **Layout Components**: Wrapper for pages
- **Common Components**: Reusable atoms (alerts, cards, etc.)

## API Integration

All API calls go through `/lib/api/` modules:

```typescript
import { authApi, doctorsApi } from '@/lib/api';

// Login
const response = await authApi.login(email, password);

// Search doctors
const doctors = await doctorsApi.search({ specialty, city });

// Get doctor availability
const slots = await doctorsApi.getAvailability(doctorId, date);
```

## Hooks

### useAuth()
Get current user and auth status
```typescript
const { user, isLoading, isAuthenticated, status } = useAuth();
```

### useSearch()
Search functionality
```typescript
const { specialty, city, searchResults, isLoading, search } = useSearch();
```

### useAppointments()
Appointment management
```typescript
const { appointments, createAppointment, cancelAppointment } = useAppointments();
```

### useDoctors()
Doctor data fetching
```typescript
const { doctors, fetchDoctors, fetchDoctorById } = useDoctors();
```

## TypeScript Types

All types are in `/src/types/index.ts`:

- `User` - User information
- `Doctor` - Doctor profile
- `Patient` - Patient profile
- `Appointment` - Appointment data
- `Specialty` - Medical specialty
- `Consultation` - Consultation record

## NextAuth Configuration

JWT strategy with credentials provider:
- Email/password authentication
- JWT tokens (access + refresh)
- 7-day session duration
- Auto token refresh on expiry
- Redirect to login on auth error

## Environment Variables

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here

# Features
NEXT_PUBLIC_ENABLE_VIDEO_CONSULTATION=true
NEXT_PUBLIC_ENABLE_AI_FEATURES=false
```

## Common Issues

### "Session not found"
- Ensure NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear cookies/cache

### "API connection error"
- Verify backend is running
- Check NEXT_PUBLIC_API_URL
- Check CORS config in backend

### "401 Unauthorized"
- Token may be expired
- Try logging in again
- Check sessionStorage for tokens

## Next Steps - Phase 1

- [ ] Implement search page
- [ ] Implement doctor profile page
- [ ] Implement appointment booking flow
- [ ] Implement patient dashboard
- [ ] Implement doctor dashboard
- [ ] Add error boundaries
- [ ] Add loading skeletons
- [ ] Add form validation

## Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [NextAuth.js v5](https://next-auth.js.org)
- [Zustand](https://github.com/pmndrs/zustand)
- [Axios](https://axios-http.com)
- [TypeScript](https://www.typescriptlang.org)

## Support

For issues or questions, check:
1. Backend logs: `npm run start:dev` in /backend
2. Browser console for client errors
3. Network tab for API responses
4. NextAuth logs in development

---

**Status**: 🟢 Phase 1 - Week 1-2 In Progress

Created: May 2026  
Last Updated: May 13, 2026
