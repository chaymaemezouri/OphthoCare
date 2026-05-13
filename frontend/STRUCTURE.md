# Frontend Structure - OphthoCare

## Complete Frontend Organization

```
frontend/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (public)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx              # Login page
│   │   │   ├── search/
│   │   │   │   └── page.tsx              # Doctor search page
│   │   │   ├── doctor/[id]/
│   │   │   │   └── page.tsx              # Doctor profile page
│   │   │   └── layout.tsx                # Public layout (navbar, footer)
│   │   │
│   │   ├── (dashboard)/                  # Protected routes
│   │   │   ├── patient/
│   │   │   │   ├── page.tsx              # Patient dashboard
│   │   │   │   ├── bookings/
│   │   │   │   │   └── page.tsx          # Bookings list
│   │   │   │   └── medical-records/
│   │   │   │       └── page.tsx          # Medical records
│   │   │   │
│   │   │   ├── doctor/[doctorId]/
│   │   │   │   ├── page.tsx              # Doctor dashboard
│   │   │   │   ├── calendar/
│   │   │   │   │   └── page.tsx          # Appointment calendar
│   │   │   │   ├── patients/
│   │   │   │   │   └── page.tsx          # Patients list
│   │   │   │   ├── consultations/
│   │   │   │   │   └── page.tsx          # Consultations
│   │   │   │   └── prescriptions/
│   │   │   │       └── page.tsx          # Prescriptions
│   │   │   │
│   │   │   └── layout.tsx                # Dashboard layout (sidebar, nav)
│   │   │
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/
│   │   │       └── route.ts              # NextAuth handler
│   │   │
│   │   ├── globals.css                   # Global styles
│   │   ├── layout.tsx                    # Root layout
│   │   └── page.tsx                      # Home page
│   │
│   ├── components/                       # Reusable components
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── footer.tsx
│   │   │   └── dashboard-layout.tsx
│   │   │
│   │   ├── search/
│   │   │   ├── search-filters.tsx        # Search form
│   │   │   └── search-results.tsx        # Results display
│   │   │
│   │   ├── appointments/
│   │   │   ├── appointment-item.tsx      # Single appointment card
│   │   │   ├── appointment-list.tsx      # Appointments list
│   │   │   ├── booking-form.tsx          # Booking form
│   │   │   └── calendar-picker.tsx       # Date/time picker
│   │   │
│   │   ├── medical/
│   │   │   ├── medical-records.tsx       # Medical records display
│   │   │   ├── consultation-form.tsx     # Consultation form
│   │   │   └── prescription-view.tsx     # Prescription view
│   │   │
│   │   ├── common/
│   │   │   ├── alerts.tsx                # Alert components
│   │   │   ├── doctor-card.tsx           # Doctor card
│   │   │   ├── loading.tsx               # Loading states
│   │   │   ├── empty-state.tsx           # Empty state
│   │   │   └── pagination.tsx            # Pagination
│   │   │
│   │   └── ui/                           # UI primitives
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── modal.tsx
│   │       ├── card.tsx
│   │       └── badge.tsx
│   │
│   ├── lib/                              # Utilities & config
│   │   ├── api/
│   │   │   ├── client.ts                 # Axios instance
│   │   │   └── index.ts                  # API endpoints
│   │   │
│   │   ├── auth.ts                       # NextAuth config
│   │   │
│   │   ├── constants/
│   │   │   ├── api-endpoints.ts          # API routes
│   │   │   ├── app-config.ts             # App configuration
│   │   │   └── routes.ts                 # Frontend routes
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.ts             # Format functions
│   │   │   ├── error-handler.ts          # Error handling
│   │   │   └── index.ts                  # General utilities
│   │   │
│   │   └── validators/
│   │       └── index.ts                  # Validation rules
│   │
│   ├── store/                            # Zustand stores
│   │   ├── auth-store.ts                 # Auth state
│   │   ├── search-store.ts               # Search state
│   │   └── appointment-store.ts          # Appointments state
│   │
│   ├── hooks/                            # Custom hooks
│   │   ├── use-auth.ts                   # Auth hook
│   │   ├── use-search.ts                 # Search hook
│   │   ├── use-appointments.ts           # Appointments hook
│   │   └── use-doctors.ts                # Doctors hook
│   │
│   ├── types/                            # TypeScript types
│   │   └── index.ts                      # All type definitions
│   │
│   └── styles/                           # CSS modules
│       ├── globals.css
│       └── variables.css
│
├── public/                               # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
│
├── .env.local                            # Environment variables (local)
├── .env.example                          # Environment template
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind config
├── postcss.config.mjs                    # PostCSS config
├── next.config.ts                        # Next.js config
├── eslint.config.mjs                     # ESLint config
├── README.md                             # Documentation
└── .gitignore
```

## File Descriptions

### Pages (app/)

| Path | Purpose |
|------|---------|
| `(public)/login/page.tsx` | User login |
| `(public)/search/page.tsx` | Doctor search & filter |
| `(public)/doctor/[id]/page.tsx` | Individual doctor profile |
| `(dashboard)/patient/page.tsx` | Patient dashboard home |
| `(dashboard)/patient/bookings/page.tsx` | Patient bookings |
| `(dashboard)/patient/medical-records/page.tsx` | Medical records |
| `(dashboard)/doctor/[id]/page.tsx` | Doctor dashboard |
| `(dashboard)/doctor/[id]/calendar/page.tsx` | Doctor appointments calendar |
| `(dashboard)/doctor/[id]/patients/page.tsx` | Doctor patients list |
| `(dashboard)/doctor/[id]/consultations/page.tsx` | Doctor consultations |
| `(dashboard)/doctor/[id]/prescriptions/page.tsx` | Doctor prescriptions |

### Components (components/)

| Component | Purpose |
|-----------|---------|
| `search-filters.tsx` | Search form component |
| `appointment-item.tsx` | Single appointment card |
| `doctor-card.tsx` | Doctor profile card |
| `alerts.tsx` | Alert/notification components |
| `navbar.tsx` | Top navigation bar |
| `sidebar.tsx` | Dashboard sidebar |

### Hooks (hooks/)

| Hook | Returns |
|------|---------|
| `use-auth()` | User, auth status, requireAuth |
| `use-search()` | Search state, search function |
| `use-appointments()` | Appointments, CRUD operations |
| `use-doctors()` | Doctors data, fetch functions |

### Stores (store/)

| Store | State |
|-------|-------|
| `auth-store` | User, token, isAuthenticated |
| `search-store` | Specialty, city, results |
| `appointment-store` | Appointments list, selected |

### API (lib/api/)

| Module | Endpoints |
|--------|-----------|
| `authApi` | register, login, refresh, logout |
| `usersApi` | CRUD operations on users |
| `doctorsApi` | search, getById, getAll, availability |
| `patientsApi` | CRUD + medical records |
| `appointmentsApi` | booking, cancellation, rescheduling |
| `specialtiesApi` | list, getById |
| `consultationsApi` | CRUD operations |

## Routing Structure

### Public Routes (No Auth)
- `/` - Home
- `/login` - Login page
- `/search` - Search doctors
- `/doctor/[id]` - Doctor profile

### Protected Routes (Auth Required)
- `/dashboard/patient` - Patient home
- `/dashboard/patient/bookings` - Bookings
- `/dashboard/patient/medical-records` - Records
- `/dashboard/doctor/[id]` - Doctor home
- `/dashboard/doctor/[id]/calendar` - Calendar
- `/dashboard/doctor/[id]/patients` - Patients
- `/dashboard/doctor/[id]/consultations` - Consultations
- `/dashboard/doctor/[id]/prescriptions` - Prescriptions

## Type System

All TypeScript types in `src/types/index.ts`:
- User, Doctor, Patient entities
- API responses and DTOs
- Appointment and Consultation types
- Utility types (ApiResponse, PaginatedResponse, etc.)

## Environment Configuration

Required in `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

## Installation & Running

```bash
# Install
npm install

# Development
npm run dev

# Build
npm run build
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## State Flow

```
User Input → Component → Hook → Store/API → Component Update
   ↓            ↓         ↓        ↓           ↓
 Form      SearchForm  useSearch  Store    Results
                                            displayed
```

## API Call Pattern

```typescript
// 1. Call API through hook
const { search, searchResults } = useSearch();

// 2. Hook fetches data
async search(filters) → API call → Response

// 3. Store updated
setSearchResults(response.data)

// 4. Component re-renders
return <Results data={searchResults} />
```

---

**Status**: ✅ Frontend Structure Complete  
**Phase**: 1 - Weeks 1-4  
**Last Updated**: May 13, 2026
