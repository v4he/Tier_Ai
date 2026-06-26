# Déploiement de TierMaster AI

## Démarrage rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Docker (optionnel)

### Installation
```bash
git clone https://github.com/yourusername/tiermaster-ai.git
cd back
npm install
cp .env.example .env
# Remplir .env (clés API, configuration BDD)
npm run migrate
npm start