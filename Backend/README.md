# OphthoCare Backend - Phase 1

NestJS backend for OphthoCare universal medical platform.

## Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Infrastructure (Docker)

```bash
docker-compose up -d
```

Verify services:
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- Adminer (DB UI): http://localhost:8080
- Redis Commander: http://localhost:8081

### 4. Run Application

#### Development
```bash
npm run start:dev
```

#### Production
```bash
npm run build
npm start
```

## Database Migrations

### Generate Migration
```bash
npm run typeorm:migration:generate src/database/migrations/my-migration
```

### Run Migrations
```bash
npm run typeorm:migration:run
```

### Revert Migration
```bash
npm run typeorm:migration:revert
```

## Seeds

```bash
npm run seed
npm run seed:specialties
```

## Testing

```bash
npm test
npm run test:watch
npm run test:cov
```

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:3001/api
- **OpenAPI JSON**: http://localhost:3001/api-json

## Project Structure

```
src/
├── config/              # Configuration files
├── common/              # Shared entities, filters, pipes
├── modules/             # Feature modules
│   ├── auth/           # Authentication
│   ├── users/          # Users management
│   ├── doctors/        # Doctors module
│   ├── patients/       # Patients module
│   └── specialties/    # Medical specialties
├── database/           # Migrations and seeds
└── main.ts            # Entry point
```

## Architecture Patterns

- **Modular**: Feature-based modules (auth, users, doctors, etc.)
- **DTO Validation**: Class-validator for request validation
- **Database**: TypeORM with PostgreSQL
- **Authentication**: JWT with Passport.js
- **Documentation**: Swagger/OpenAPI

## Common Commands

```bash
# Start development server
npm run start:dev

# Run tests with coverage
npm run test:cov

# Format code
npm run format

# Lint code
npm run lint

# Build for production
npm run build

# Run migrations
npm run typeorm:migration:run

# Seed database
npm run seed
```

## API Endpoints (Phase 1)

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh JWT token

### Users
- `POST /users` - Create user
- `GET /users` - List users
- `GET /users/:id` - Get user by ID

## Status

✅ Phase 1 - Week 1 Backend Initialization Complete

Next: Database migrations and Entity setup

## Contact

For issues or questions, contact the OphthoCare team.
