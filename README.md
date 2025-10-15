# 0 à 1 Formation - Plateforme Multi-Tenant

Plateforme d'administration interne multi-tenant pour gérer trois écoles (Nexlearn, EVONOVA, POP GENIUS) du réseau 0 à 1 Formation.

## 🚀 Fonctionnalités

- **Multi-tenant** : Gestion de 3 écoles avec isolation stricte des données
- **Authentification Clerk** : Système d'auth moderne avec contrôle d'accès par rôles
- **Génération PDF CERFA** : CERFA 10103*10 automatisé avec pdf-lib
- **Gestion complète** : Contrats, Devis, OPCO, RAC
- **Import/Export CSV** : Import bulk d'étudiants, export données écoles/programmes
- **Analytics cross-école** : Tableaux de bord et KPIs agrégés
- **Audit trail** : Traçabilité complète pour conformité
- **Interface 100% française** : UI entièrement traduite

## 🛠️ Stack Technique

- **Frontend** : React + Vite + TanStack Query + Wouter
- **Backend** : Node.js + Express (TypeScript)
- **Database** : PostgreSQL + Drizzle ORM
- **Storage** : Object Storage pour PDF CERFA
- **Auth** : Clerk Authentication
- **UI** : Tailwind CSS + Shadcn/ui + Lucide Icons

## 📋 Prérequis

- Node.js 18+ et npm
- PostgreSQL 14+
- Compte Clerk (gratuit pour dev)
- Object Storage compatible S3 (optionnel, pour PDF)

## 🔧 Installation

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/0-a-1-formation.git
cd 0-a-1-formation
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration des variables d'environnement

Créez un fichier `.env` à la racine :

```bash
# Database PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/formation_db
PGHOST=localhost
PGPORT=5432
PGUSER=your_user
PGPASSWORD=your_password
PGDATABASE=formation_db

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Session
SESSION_SECRET=votre-secret-session-aleatoire-securise

# Object Storage (optionnel)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
PUBLIC_OBJECT_SEARCH_PATHS=/public
PRIVATE_OBJECT_DIR=/.private

# Environment
NODE_ENV=production
PORT=5000
```

### 4. Configuration Clerk

1. Créez un compte sur [Clerk](https://clerk.com)
2. Créez une nouvelle application
3. Dans **API Keys**, copiez :
   - Publishable Key → `CLERK_PUBLISHABLE_KEY` et `VITE_CLERK_PUBLISHABLE_KEY`
   - Secret Key → `CLERK_SECRET_KEY`

### 5. Initialiser la base de données

```bash
# Créer la base de données
createdb formation_db

# Pousser le schéma Drizzle
npm run db:push
```

### 6. Démarrer l'application

**Développement :**
```bash
npm run dev
```

**Production :**
```bash
npm run build
npm start
```

L'application sera accessible sur `http://localhost:5000`

## 🖥️ Déploiement VPS

### Configuration Nginx (exemple)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Service Systemd (exemple)

Créez `/etc/systemd/system/formation.service` :

```ini
[Unit]
Description=0 à 1 Formation Platform
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/0-a-1-formation
Environment=NODE_ENV=production
EnvironmentFile=/var/www/0-a-1-formation/.env
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Puis :
```bash
sudo systemctl daemon-reload
sudo systemctl enable formation
sudo systemctl start formation
```

## 👥 Système de Rôles

### Rôles disponibles

1. **OpsAdmin** : Accès complet
   - Panel d'administration (écoles, étudiants, programmes, utilisateurs)
   - Création/modification de tous les éléments
   - Logs d'audit
   - Attribution de rôles

2. **BillingOps** : Données financières
   - Contrats et données financières
   - Accès lecture/écriture

3. **AnalystRO** : Lecture seule
   - Analytics et rapports
   - Aucune modification

### Premier utilisateur

Le **premier utilisateur** à s'inscrire devient automatiquement **OpsAdmin** avec accès à toutes les écoles (atomique via PostgreSQL advisory lock).

Les utilisateurs suivants reçoivent le rôle **AnalystRO** sans accès aux écoles (assignation manuelle requise par un OpsAdmin).

## 📁 Structure du Projet

```
.
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/  # Composants UI
│   │   ├── pages/       # Pages de l'app
│   │   ├── hooks/       # Hooks personnalisés
│   │   └── lib/         # Utilitaires
├── server/              # Backend Express
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Couche de persistance
│   ├── clerkAuth.ts     # Auth Clerk
│   └── index.ts         # Point d'entrée
├── shared/              # Code partagé
│   └── schema.ts        # Schéma Drizzle + Zod
└── db/                  # Migrations (auto-générées)
```

## 🔒 Sécurité

- ✅ Authentification Clerk avec JWT
- ✅ Isolation stricte des tenants (scoped queries)
- ✅ RBAC (Role-Based Access Control)
- ✅ PostgreSQL advisory locks pour atomicité
- ✅ Audit trail immuable
- ✅ Validation Zod côté serveur

## 🐛 Développement

### Scripts disponibles

```bash
npm run dev          # Dev avec hot-reload
npm run build        # Build production
npm start            # Start production
npm run db:push      # Sync schéma DB
npm run db:studio    # Interface DB Drizzle
```

### Ajouter une école

Via l'interface admin ou directement en DB :

```sql
INSERT INTO tenants (slug, name, filiz_api_key, filiz_base_url)
VALUES ('paris-nord', 'École Paris Nord', 'your-api-key', 'https://api.filiz.io');
```

## 📝 License

Propriétaire - 0 à 1 Formation © 2025

## 🤝 Support

Pour toute question technique, contactez l'équipe dev.
