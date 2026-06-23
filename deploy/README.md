# Déploiement VPS (production, sans domaine)

Stack Docker : PostgreSQL, Redis, API NestJS, frontend Next.js.  
Accès par **IP publique** (pas de HTTPS Let’s Encrypt tant qu’il n’y a pas de nom de domaine).

## Structure VPS (plusieurs projets)

Un dossier par application sous `/srv` — **le dépôt git est directement dans ce dossier** (pas de sous-dossier `OphthoCare/OphthoCare`) :

```text
/srv/
  ophthocare/            ← cd ici = racine du projet
    Backend/
    frontend/
    deploy/
      .env
  autre-projet/          ← futur déploiement
    ...
```

Création + clone :

```bash
sudo mkdir -p /srv/ophthocare
sudo chown -R $USER:$USER /srv/ophthocare
cd /srv/ophthocare
git clone https://github.com/chaymaemezouri/OphthoCare.git .
cd deploy
```

Le `.` à la fin de `git clone` évite le dossier imbriqué `OphthoCare/OphthoCare`.

**Déjà cloné avec un dossier en trop** (`/srv/ophthocare/OphthoCare/`) :

```bash
cd /srv/ophthocare
shopt -s dotglob
mv OphthoCare/* .
rmdir OphthoCare
cd deploy
```

Toutes les commandes `docker compose` s’exécutent depuis `/srv/ophthocare/deploy`.

## Prérequis VPS (Ubuntu/Debian)

```bash
sudo apt update && sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker $USER
# Se déconnecter/reconnecter pour le groupe docker
```

Ouvrir les ports :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

## 1. Cloner le dépôt

Voir [Structure VPS](#structure-vps-plusieurs-projets) — exemple rapide :

```bash
sudo mkdir -p /srv/ophthocare && sudo chown -R $USER:$USER /srv/ophthocare
cd /srv/ophthocare
git clone https://github.com/chaymaemezouri/OphthoCare.git .
cd deploy
```

## 2. Fichier `.env`

```bash
cp env.production.example .env
nano .env
```

Remplacer **partout** `YOUR_VPS_IP` par l’IP du VPS (ex. `203.0.113.42`).

Générer des secrets (ne pas réutiliser ceux du dev local) :

```bash
openssl rand -base64 32   # JWT_SECRET
openssl rand -base64 32   # NEXTAUTH_SECRET
```

Choisir un mot de passe PostgreSQL fort (`POSTGRES_PASSWORD`).

## 3. Lancer la stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Attendre que l’API ait appliqué les migrations (`docker compose -f docker-compose.prod.yml logs -f api`).

## 4. Comptes démo (jeu de données)

Mot de passe de tous les comptes : **`OphthoDemo2024!`** (voir `Backend/docs/DEMO_ACCOUNTS.md`).

```bash
docker compose -f docker-compose.prod.yml --env-file .env --profile seed run --rm seed
```

Le seed est idempotent : vous pouvez le relancer sans casser les données.

## 5. Vérifier

| Service | URL |
|---------|-----|
| Application | `http://VOTRE_IP:3000` |
| API / Swagger | `http://VOTRE_IP:3001/api` |
| Connexion démo médecin | `dr.demo@ophthocare.local` / `OphthoDemo2024!` |

## Commandes utiles

```bash
# Logs
docker compose -f docker-compose.prod.yml logs -f

# Redémarrer après changement .env (backend)
docker compose -f docker-compose.prod.yml --env-file .env up -d api

# Rebuild frontend si IP ou NEXT_PUBLIC_* change
docker compose -f docker-compose.prod.yml --env-file .env up -d --build web

# Arrêt
docker compose -f docker-compose.prod.yml down
```

## Quand vous aurez un domaine

1. Pointer le DNS `A` vers l’IP du VPS.
2. Mettre à jour dans `.env` : `FRONTEND_URL`, `CORS_ORIGIN`, `NEXTAUTH_URL`, `NEXT_PUBLIC_API_URL`, `API_URL`.
3. Rebuild : `docker compose ... up -d --build`.
4. Optionnel : Nginx + Certbot sur les ports 80/443 et retirer l’exposition directe de 3000/3001.

## Sécurité prod

- Ne pas exposer PostgreSQL/Redis sur Internet (déjà le cas dans ce compose).
- Changer `POSTGRES_PASSWORD`, `JWT_SECRET`, `NEXTAUTH_SECRET` pour la prod.
- Les comptes `@ophthocare.local` sont **uniquement pour la démo** ; désactiver ou ne pas re-seeder en prod réelle patient.
