# 🚀 CHECKLIST DE DÉMARRAGE IMMÉDIAT

Voici **exactement ce qu'il faut faire** pour commencer le projet en ordre de priorité.

---

## 📋 CHECKLIST PHASE 1 - SEMAINE 1

### Backend Initialization (Jour 1-2)
- [ ] **Créer** dossier `backend/` à la racine OphthoCare
- [ ] **Installer** NestJS: `nest new backend --skip-git --package-manager npm`
- [ ] **Installer** dépendances (voir DEVELOPMENT_GUIDE.md)
- [ ] **Créer** `.env` et `.env.example`
- [ ] **Créer** `docker-compose.yml`
- [ ] **Lancer** Docker services: `docker-compose up -d`
- [ ] **Vérifier** connexion DB via Adminer (localhost:8080)

### Database & TypeORM (Jour 2-3)
- [ ] **Créer** `src/config/database.config.ts`
- [ ] **Mettre à jour** `src/app.module.ts` avec TypeOrmModule
- [ ] **Créer** dossier `src/common/entities/`
- [ ] **Créer** `src/common/entities/base.entity.ts`
- [ ] **Créer** toutes entités (User, Doctor, Patient, Appointment, Consultation)
- [ ] **Générer** migration initiale: `npm run typeorm migration:generate`
- [ ] **Exécuter** migration: `npm run typeorm migration:run`
- [ ] **Vérifier** tables en DB via Adminer

### Initial Services (Jour 3-4)
- [ ] **Générer** modules: `nest g module modules/{users,doctors,patients}`
- [ ] **Générer** services: `nest g service modules/{users,doctors,patients}`
- [ ] **Générer** controllers: `nest g controller modules/{users,doctors,patients}`
- [ ] **Implémenter** UsersService (CRUD basique)
- [ ] **Créer** DTOs de base

### Backend Test (Jour 5)
- [ ] **Lancer** serveur: `npm run start:dev`
- [ ] **Tester** endpoints via Postman/curl (voir exemples DEVELOPMENT_GUIDE)
- [ ] **Vérifier** pas d'erreurs TypeORM

---

## 📋 CHECKLIST PHASE 1 - SEMAINE 2

### Auth Module (Jour 1-2)
- [ ] **Générer** auth module: `nest g module modules/auth`
- [ ] **Créer** `src/modules/auth/auth.service.ts`
- [ ] **Créer** `src/modules/auth/auth.controller.ts`
- [ ] **Créer** `src/modules/auth/strategies/jwt.strategy.ts`
- [ ] **Créer** `src/modules/auth/guards/jwt.guard.ts`
- [ ] **Créer** `src/modules/auth/guards/role.guard.ts`
- [ ] **Tester** register endpoint
- [ ] **Tester** login endpoint
- [ ] **Tester** JWT token validation

### Database Seed & Spécialités (Jour 2-3)
- [ ] **Créer** `src/database/seeds/specialties.seed.ts`
- [ ] **Créer** `src/modules/specialties/entities/specialty.entity.ts`
- [ ] **Générer** Specialty module
- [ ] **Implémenter** seed runner
- [ ] **Exécuter** seed: `npm run seed`

### Error Handling & Middleware (Jour 3-4)
- [ ] **Créer** `src/common/filters/http-exception.filter.ts`
- [ ] **Créer** `src/common/interceptors/transform.interceptor.ts`
- [ ] **Créer** `src/common/pipes/validation.pipe.ts`
- [ ] **Intégrer** dans `main.ts`

### Tests Unitaires (Jour 5)
- [ ] **Créer** `test/auth.spec.ts`
- [ ] **Créer** `test/users.spec.ts`
- [ ] **Lancer** tests: `npm run test`

---

## 📋 CHECKLIST PHASE 1 - SEMAINE 3-4

### Frontend Restructuration
- [ ] **Créer** structure dossiers (voir PROJECT_STRUCTURE.md)
- [ ] **Créer** `src/types/index.ts` avec tous les types
- [ ] **Créer** `src/lib/api/client.ts` (axios instance)
- [ ] **Créer** `src/store/` structure (Zustand stores)
- [ ] **Créer** `src/hooks/` hooks personnalisés

### NextAuth Setup
- [ ] **Installer** next-auth: `npm install next-auth`
- [ ] **Créer** `src/lib/auth.ts` (authOptions)
- [ ] **Créer** `src/app/api/auth/[...nextauth]/route.ts`
- [ ] **Configurer** `.env.local` avec NEXTAUTH_SECRET

### Login Page
- [ ] **Créer** `src/app/(public)/login/page.tsx`
- [ ] **Créer** formulaire login
- [ ] **Intégrer** avec NextAuth
- [ ] **Tester** login end-to-end (frontend ↔ backend)

### Protected Routes
- [ ] **Créer** middleware d'authentification
- [ ] **Configurer** redirects pour routes protégées
- [ ] **Tester** redirection après login

---

## 📋 CHECKLIST PHASE 1 - SEMAINE 5-6

### Doctors Module
- [ ] **Implémenter** DoctorsService (CRUD)
- [ ] **Implémenter** DoctorsController
- [ ] **Créer** DTOs (CreateDoctorDto, UpdateDoctorDto)
- [ ] **Ajouter** validations

### Patients Module
- [ ] **Implémenter** PatientsService
- [ ] **Implémenter** PatientsController
- [ ] **Créer** DTOs
- [ ] **Ajouter** medical data fields

### Appointments Module
- [ ] **Générer** appointments module
- [ ] **Implémenter** base service
- [ ] **Tester** création appointment

### API Documentation
- [ ] **Installer** Swagger: `npm install @nestjs/swagger swagger-ui-express`
- [ ] **Configurer** Swagger dans `main.ts`
- [ ] **Générer** OpenAPI docs
- [ ] **Accéder** via `http://localhost:3001/api`

### Deployment Prep
- [ ] **Créer** `Dockerfile` backend
- [ ] **Créer** `.dockerignore`
- [ ] **Créer** `docker-compose.prod.yml`
- [ ] **Tester** build Docker

---

## 📊 Fichiers à Créer - Résumé

### Backend Essentiels
```
backend/
├── src/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   ├── common/
│   │   ├── entities/
│   │   │   └── base.entity.ts
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   ├── database/
│   │   ├── migrations/
│   │   │   └── 001-initial-schema.ts
│   │   └── seeds/
│   │       └── specialties.seed.ts
│   ├── modules/
│   │   ├── auth/ ✨
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── strategies/
│   │   │   ├── guards/
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   ├── users/ ✨
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── dto/
│   │   ├── doctors/ ⏳
│   │   ├── patients/ ⏳
│   │   ├── appointments/ ⏳
│   │   └── consultations/
│   ├── app.module.ts ✨
│   └── main.ts ✨
├── .env ✨
├── .env.example ✨
├── docker-compose.yml ✨
├── Dockerfile
└── package.json ✨
```

### Frontend Essentiels
```
frontend/src/
├── app/
│   ├── (public)/
│   │   ├── login/
│   │   │   └── page.tsx ✨
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts ✨
│   ├── layout.tsx ✨
│   └── page.tsx
├── lib/
│   ├── api/
│   │   └── client.ts ✨
│   ├── auth.ts ✨
│   └── constants/
├── store/
│   └── auth-store.ts ✨
├── types/
│   └── index.ts ✨
└── hooks/
    └── use-auth.ts ✨

✨ = Priorité haute / ⏳ = Après auth / 🏗️ = Après auth
```

---

## 🛠️ Commands Rapides à Retenir

```bash
# BACKEND
cd backend

# Setup initial
npm install
docker-compose up -d
npm run start:dev

# Database
npm run typeorm migration:generate src/database/migrations/initial
npm run typeorm migration:run
npm run seed

# Tests
npm run test
npm run test:watch

# Build
npm run build


# FRONTEND
cd frontend

# Setup initial
npm install
npm run dev

# Build
npm run build
npm start

# Types check
npm run type-check

# Lint
npm run lint
```

---

## 🔗 Intégrations à Tester (End-to-End)

### Test 1: Registration
```bash
# 1. Frontend: Remplir formulaire register
# 2. Frontend envoie vers POST /auth/register
# 3. Backend crée user en DB
# 4. Frontend reçoit confirmation
# ✅ Vérifier en Adminer que user créé
```

### Test 2: Login
```bash
# 1. Frontend: Login avec email/password
# 2. Backend vérifie credentials, retourne JWT
# 3. Frontend stocke token en session
# 4. Frontend redirige vers dashboard
# ✅ Vérifier token valid en headers
```

### Test 3: Protected Route
```bash
# 1. Frontend accès /dashboard/patient
# 2. Middleware vérifie token
# 3. Si pas token, redirect /login
# 4. Si token valid, affiche page
# ✅ Tester sans token (redirect)
# ✅ Tester avec token (accès)
```

---

## 📈 Progress Tracking

Marquer les étapes complètes:

### Semaine 1
- [ ] Backend repo setup
- [ ] Docker & DB ready
- [ ] Entities created
- [ ] Initial services

### Semaine 2
- [ ] Auth module working
- [ ] JWT guards in place
- [ ] Tests passing
- [ ] Swagger docs generated

### Semaine 3-4
- [ ] Frontend restructured
- [ ] NextAuth configured
- [ ] Login page working
- [ ] Protected routes working

### Semaine 5-6
- [ ] All modules basic CRUD done
- [ ] API fully documented
- [ ] End-to-end tests passing
- [ ] Ready for Phase 2

---

## 🎯 PHASE 2 Prerequisites Check

Avant de commencer Phase 2 (MVP), vérifier:

- ✅ Backend stable (no crashes)
- ✅ Auth working (register + login + refresh)
- ✅ Database migrations versioned
- ✅ Frontend can call backend
- ✅ Error handling in place
- ✅ CORS configured
- ✅ Logging working
- ✅ Environment variables documented
- ✅ Docker compose reproducible
- ✅ Team can clone & run locally

Si tous ✅ → **Phase 2 peut commencer!**

---

## 📞 Troubleshooting Rapide

| Problème | Solution |
|----------|----------|
| **Port 3001 déjà utilisé** | `lsof -i :3001` + `kill -9 <PID>` |
| **DB connection error** | Vérifier docker-compose: `docker-compose ps` |
| **Migration failed** | Check TypeORM config, drop DB + recreate |
| **CORS error** | Backend: ajouter origin frontend en CORS config |
| **JWT invalid** | Vérifier JWT_SECRET match et expiry |
| **NextAuth session vide** | Vérifier NEXTAUTH_SECRET set + callbacksUrl |
| **Modules not found** | Vérifier import paths utilisent `@/` alias |

---

## 🎓 Resources

- NestJS Docs: https://docs.nestjs.com
- TypeORM: https://typeorm.io
- Next.js: https://nextjs.org/docs
- NextAuth.js: https://next-auth.js.org
- Passport: http://www.passportjs.org
- JWT: https://jwt.io

---

**🚀 Ready to start? Let's build OphthoCare!**

