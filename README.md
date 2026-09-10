# PGC — Top Mythic+ par spécialisation

Squelette de départ (React + Vite). Rien de connecté à Warcraft Logs pour
l'instant — c'est juste la coquille du site, à déployer pour valider que
l'infrastructure (GitHub → Vercel) fonctionne.

## Mise en route locale (optionnel, pour tester avant de pousser)

```
npm install
npm run dev
```

## Déploiement

1. `git init`
2. `git add .`
3. `git commit -m "Premier commit"`
4. `git remote add origin <URL de ton dépôt GitHub>`
5. `git push -u origin main`
6. Importer le dépôt dans Vercel (Add New → Project)
7. Ajouter les variables d'environnement `WCL_CLIENT_ID` et `WCL_CLIENT_SECRET`
8. Activer Vercel KV dans l'onglet Storage du projet
