# OphthoCare Backend - Phase 1

NestJS backend for OphthoCare universal medical platform.

## API (extrait)

- `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`
- `GET /users/me`, `PATCH /users/me` (JWT)
- `GET /patients/me`, `PUT /patients/me` (JWT, rôle patient)
- `GET /appointments/me`, `POST /appointments`, `DELETE /appointments/:id` (JWT, patient)
- `GET /doctors`, `GET /doctors/search`, `GET /doctors/:id` (public pour l’annuaire)

Après `npm run seed` (ou `npx ts-node src/database/seeds/run-seeds.ts`), comptes de démonstration :

**Mot de passe (tous)** : `OphthoDemo2024!` — détail complet : [`docs/DEMO_ACCOUNTS.md`](docs/DEMO_ACCOUNTS.md)

| Rôle | E-mail |
|------|--------|
| Médecin (ophtalmo) | `dr.demo@ophthocare.local` |
| Médecin (cardio, annuaire) | `dr.cardio.demo@ophthocare.local` |
| Secrétaire | `secretaire.demo@ophthocare.local` |
| Stagiaire | `stagiaire.demo@ophthocare.local` |
| Patient | `patient.demo@ophthocare.local` |
| Patients suppl. | `fatima.demo@…`, `karim.demo@…`, `nadia.demo@…`, `hassan.demo@…` |
| Admin | `admin@ophthocare.local` |
| Super admin | `superadmin@ophthocare.local` |

Le seed remplit aussi agenda, consultations, documents, messagerie, notifications et modération (jeu de données idempotent).

Documentation interactive : `http://localhost:3001/api` (Swagger).

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

## Database (Prisma)

Configurer `DATABASE_URL` dans `.env` (voir `.env.example`).

### Créer / appliquer les migrations (développement)
```bash
npm run prisma:migrate
```

### Pousser le schéma sans fichier de migration (prototypage)
```bash
npm run prisma:push
```

### Régénérer le client après changement de schéma
```bash
npm run prisma:generate
```

### Prisma Studio
```bash
npm run prisma:studio
```

## Seeds

```bash
npm run seed
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
prisma/
└── schema.prisma        # Modèle Prisma + migrations

src/
├── prisma/              # PrismaModule + PrismaService
├── common/              # Shared decorators, filters, pipes
├── modules/             # Feature modules
│   ├── auth/           # Authentication
│   ├── users/          # Users management
│   ├── doctors/        # Doctors module
│   ├── patients/       # Patients module
│   └── specialties/    # Medical specialties
├── database/           # Seeds
└── main.ts            # Entry point
```

## Architecture Patterns

- **Modular**: Feature-based modules (auth, users, doctors, etc.)
- **DTO Validation**: Class-validator for request validation
- **Database**: Prisma ORM with PostgreSQL
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

# Apply Prisma migrations
npm run prisma:migrate

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
