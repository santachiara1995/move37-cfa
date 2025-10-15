# Guide de Déploiement GitHub + VPS

## 📦 Pousser vers GitHub

### 1. Créer un nouveau repository GitHub

1. Allez sur [GitHub](https://github.com) et créez un **nouveau repository**
2. Nommez-le : `0-a-1-formation` (ou votre nom préféré)
3. **NE PAS** cocher "Initialize with README" (on a déjà tout le code)
4. Cliquez sur **Create repository**

### 2. Pousser le code depuis Replit

Ouvrez le **Shell** dans Replit et exécutez :

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter tous les fichiers
git add .

# Créer le premier commit
git commit -m "Initial commit - 0 à 1 Formation platform"

# Ajouter votre repository GitHub comme remote
git remote add origin https://github.com/VOTRE-USERNAME/0-a-1-formation.git

# Pousser le code
git push -u origin main
```

Si la branche par défaut est `master` :
```bash
git branch -M main
git push -u origin main
```

## 🖥️ Déploiement sur VPS

### Configuration VPS (Ubuntu/Debian)

#### 1. Installer les dépendances

```bash
# Se connecter au VPS
ssh user@votre-vps.com

# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Installer Nginx
sudo apt-get install -y nginx

# Installer PM2 (gestionnaire de processus)
sudo npm install -g pm2
```

#### 2. Configurer PostgreSQL

```bash
# Créer utilisateur et base de données
sudo -u postgres psql

CREATE USER formation_user WITH PASSWORD 'votre_mot_de_passe_securise';
CREATE DATABASE formation_db OWNER formation_user;
GRANT ALL PRIVILEGES ON DATABASE formation_db TO formation_user;
\q
```

#### 3. Cloner et configurer l'application

```bash
# Aller dans le répertoire web
cd /var/www

# Cloner le repository
sudo git clone https://github.com/VOTRE-USERNAME/0-a-1-formation.git
sudo chown -R $USER:$USER 0-a-1-formation
cd 0-a-1-formation

# Installer les dépendances
npm install

# Créer le fichier .env
cp .env.example .env
nano .env
```

Configurez votre `.env` :

```bash
# Database
DATABASE_URL=postgresql://formation_user:votre_mot_de_passe@localhost:5432/formation_db
PGHOST=localhost
PGPORT=5432
PGUSER=formation_user
PGPASSWORD=votre_mot_de_passe_securise
PGDATABASE=formation_db

# Clerk (utilisez vos vraies clés)
CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxx
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Session (générer avec: openssl rand -base64 32)
SESSION_SECRET=votre-secret-genere-aleatoirement

# Environment
NODE_ENV=production
PORT=5000
```

#### 4. Initialiser la base de données

```bash
# Pousser le schéma Drizzle
npm run db:push
```

#### 5. Build de l'application

```bash
npm run build
```

#### 6. Configurer PM2

```bash
# Démarrer l'app avec PM2
pm2 start npm --name "formation" -- start

# Sauvegarder la config PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup
# Suivre les instructions affichées
```

#### 7. Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/formation
```

Collez cette configuration :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Logs
    access_log /var/log/nginx/formation_access.log;
    error_log /var/log/nginx/formation_error.log;

    # Proxy vers Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        
        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Cache pour assets statiques
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Activer le site :

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/formation /etc/nginx/sites-enabled/

# Tester la config
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

#### 8. Configurer SSL avec Let's Encrypt (HTTPS)

```bash
# Installer Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Auto-renouvellement (déjà configuré par défaut)
sudo certbot renew --dry-run
```

#### 9. Configurer le Firewall

```bash
# Autoriser les connexions HTTP/HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

## 🔄 Mises à jour

Pour déployer une nouvelle version :

```bash
cd /var/www/0-a-1-formation

# Récupérer les derniers changements
git pull origin main

# Installer les nouvelles dépendances
npm install

# Rebuild
npm run build

# Mettre à jour le schéma DB si nécessaire
npm run db:push

# Redémarrer l'app
pm2 restart formation
```

## 📊 Monitoring

```bash
# Voir les logs PM2
pm2 logs formation

# Voir le status
pm2 status

# Monitoring en temps réel
pm2 monit
```

## 🐛 Troubleshooting

### L'application ne démarre pas

```bash
# Vérifier les logs
pm2 logs formation --lines 100

# Vérifier le port
sudo netstat -tulpn | grep :5000
```

### Problème de connexion base de données

```bash
# Vérifier PostgreSQL
sudo systemctl status postgresql

# Se connecter manuellement
psql -U formation_user -d formation_db -h localhost
```

### Problème Nginx

```bash
# Vérifier la config
sudo nginx -t

# Voir les logs
sudo tail -f /var/log/nginx/formation_error.log
```

## 🔒 Sécurité VPS

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Configurer fail2ban
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban

# Désactiver l'accès root SSH
sudo nano /etc/ssh/sshd_config
# Mettre: PermitRootLogin no
sudo systemctl restart sshd
```

## ✅ Checklist Finale

- [ ] Code poussé sur GitHub
- [ ] VPS configuré (Node.js, PostgreSQL, Nginx)
- [ ] Database créée et schema déployé
- [ ] Variables d'environnement configurées
- [ ] Application buildée et démarrée avec PM2
- [ ] Nginx configuré et SSL activé
- [ ] Firewall configuré
- [ ] Premier utilisateur créé (devient OpsAdmin)
- [ ] Domaine pointé vers le VPS
- [ ] Backups automatiques configurés

Votre plateforme est maintenant en ligne ! 🚀
