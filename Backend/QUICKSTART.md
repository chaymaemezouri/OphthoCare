# 🚀 DÉMARRAGE RAPIDE - OphthoCare Backend Phase 1

## ✅ Étape 1: Installer les dépendances

```bash
cd backend
npm install
```

**Durée**: 5-10 minutes

**Résultat attendu**:
```
added XXX packages in XXXs
```

---

## ✅ Étape 2: Vérifier Docker

```bash
docker --version
docker-compose --version
```

**Résultat attendu**:
```
Docker version XX.X.X
docker-compose version XXX
```

---

## ✅ Étape 3: Lancer les services Docker

```bash
docker-compose up -d
```

**Durée**: 2-5 minutes (première fois)

**Vérifier le statut**:
```bash
docker-compose ps
```

**Résultat attendu**:
```
NAME                        STATUS
ophthoccare_postgres        Up 2 minutes (healthy)
ophthoccare_redis           Up 2 minutes (healthy)
ophthoccare_adminer         Up 2 minutes
ophthoccare_redis_commander Up 2 minutes
```

**Accès aux services**:
- 📊 Adminer (DB UI): http://localhost:8080
  - Username: `ophthoccare`
  - Password: `secure_password_123`
  - Database: `ophthoccare_db`
- 🔴 Redis Commander: http://localhost:8081

---

## ✅ Étape 4: Démarrer le serveur

```bash
npm run start:dev
```

**Durée**: 10-20 secondes

**Résultat attendu**:
```
[Nest] XXXXX - 01/01/2025, 10:00:00 LOG [NestFactory] Starting Nest application...
[Nest] XXXXX - 01/01/2025, 10:00:01 LOG [InstanceLoader] AppModule dependencies initialized
[Nest] XXXXX - 01/01/2025, 10:00:02 LOG [NestApplication] Nest application successfully started
[Nest] XXXXX - 01/01/2025, 10:00:02 LOG Listen on port 3001

🚀 OphthoCare Backend running on http://localhost:3001
📚 Swagger API Documentation on http://localhost:3001/api
```

---

## ✅ Étape 5: Tester l'API

### Test 1: Swagger Documentation

Ouvrir: http://localhost:3001/api

Vous devez voir:
- Documentation interactive
- Endpoints listés
- Try it out buttons

### Test 2: Register User

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@ophthoccare.com",
    "password":"TestPassword123",
    "role":"patient",
    "firstName":"Test",
    "lastName":"User"
  }'
```

**Résultat attendu**:
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid-here",
    "email": "test@ophthoccare.com",
    "role": "patient"
  }
}
```

### Test 3: Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@ophthoccare.com",
    "password":"TestPassword123"
  }'
```

**Résultat attendu**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-here",
    "email": "test@ophthoccare.com",
    "firstName": "Test",
    "lastName": "User",
    "role": "patient"
  }
}
```

Copier le `access_token` pour les prochains tests!

### Test 4: Get Users (Protected Route)

```bash
curl -X GET http://localhost:3001/users \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Résultat attendu**:
```json
[
  [
    {
      "id": "uuid-here",
      "email": "test@ophthoccare.com",
      "firstName": "Test",
      "lastName": "User",
      "role": "patient",
      ...
    }
  ],
  1
]
```

---

## 🐛 Troubleshooting

### Error: Port 3001 already in use

```bash
# Trouver le processus
lsof -i :3001

# Tuer le processus
kill -9 <PID>
```

### Error: Database connection refused

```bash
# Vérifier Docker services
docker-compose ps

# Redémarrer
docker-compose restart postgres
```

### Error: Module not found

```bash
# Nettoyer et reinstaller
rm -rf node_modules package-lock.json
npm install
```

### Error: CORS issue

✅ Configuré dans `main.ts`, assurez-vous que `.env` contient:
```
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

---

## 📊 Prochaines Étapes

### Phase 1 - Semaine 2
- [ ] Créer migrations database
- [ ] Implémenter modules Doctor, Patient
- [ ] Ajouter API endpoints pour doctors/patients
- [ ] Tester end-to-end

### Commandes Utiles

```bash
# Tests
npm run test

# Build
npm run build

# Linting
npm run lint

# Format
npm run format

# Migrations (Prisma)
npm run prisma:migrate
npm run prisma:push
```

---

## 🎯 Status

✅ Backend Phase 1 - Week 1 COMPLETE
- NestJS setup
- Prisma schema (User, Doctor, Patient, Specialty)
- Auth module (JWT)
- Docker infrastructure
- API Documentation (Swagger)
- Basic CRUD endpoints

**Next**: Database Migrations & Advanced Modules

---

## 📝 Notes

- JWT Secret is hardcoded in `.env` - CHANGE in production!
- Passwords are hashed with bcrypt
- Database schema auto-synced in dev mode
- CORS enabled for http://localhost:3000 (frontend)

---

## ❓ Questions?

Check DEVELOPMENT_GUIDE.md for detailed technical information.

