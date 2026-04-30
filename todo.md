# Project TODO - Refonte Les Bâtisseurs Engagés

## Phase 1 - Audit
- [x] Analyser la structure du projet existant
- [x] Identifier les problèmes UI/UX
- [x] Identifier les problèmes de performance
- [x] Identifier les bugs et incohérences

## Phase 2 - Migration Backend
- [x] Migrer le schéma de base de données (drizzle/schema.ts)
- [x] Migrer les helpers de base de données (server/db.ts)
- [x] Migrer les routers tRPC (server/routers.ts)
- [x] Migrer les routers auxiliaires (auth, email, crm, admin-settings, users)
- [x] Migrer les fichiers utilitaires (audit.ts, shared/*)

## Phase 3 - Système de Design
- [x] Refonte complète du index.css avec palette OKLCH cohérente
- [x] Supprimer les styles dark mode inutilisés
- [x] Nettoyer les classes CSS redondantes
- [x] Ajouter la police Google Fonts (Inter)
- [x] Harmoniser les espacements et rayons de bordure

## Phase 4 - Navigation et Layout
- [x] Refonte du DashboardLayout avec sidebar améliorée
- [x] Implémenter le lazy loading via Suspense dans App.tsx
- [x] Ajouter des squelettes de chargement pour le layout
- [x] Améliorer la responsivité mobile du layout
- [x] Corriger la navigation et les échappatoires

## Phase 5 - Pages Principales
- [x] Refonte de Home.tsx (dashboard avec stats dynamiques)
- [ ] Refonte de Documents.tsx (filtres, pagination, loading states)
- [ ] Refonte de Members.tsx (recherche debounce, optimistic updates)
- [ ] Refonte de Finance.tsx (connecter au backend, graphiques)

## Phase 6 - Pages Secondaires
- [ ] Refonte Events.tsx
- [ ] Refonte Campaigns.tsx
- [ ] Refonte Adhesions.tsx
- [ ] Refonte Archives.tsx
- [ ] Refonte CRM pages (Dashboard, Contacts, Activities, Reports)
- [ ] Refonte Announcements.tsx
- [ ] Refonte EmailComposer.tsx
- [ ] Refonte GlobalSettings.tsx (corriger bug hook)
- [ ] Refonte Users.tsx (corriger incohérence rôles)
- [ ] Refonte Settings.tsx
- [ ] Refonte AdminRoles.tsx et AdminAuditLogs.tsx
- [ ] Refonte NotFound.tsx et ErrorBoundary

## Phase 7 - Qualité
- [x] Écrire les tests vitest pour les routers
- [x] Vérifier tous les boutons et liens
- [x] Valider la responsivité mobile
- [x] Vérifier les états de chargement et erreurs

## Phase 8 - Documentation
- [x] Créer le rapport d'améliorations détaillé


## Phase 9 - Plateforme Multi-Associations et Hors Ligne

### Paramètres d'Association
- [x] Créer la table association_settings
- [x] Créer la table offline_sync_queue
- [x] Ajouter les routers tRPC pour les paramètres
- [x] Créer la page Settings améliorée avec upload de logo
- [x] Ajouter la personnalisation du nom et des couleurs

### Mode Hors Ligne
- [x] Créer le Service Worker
- [x] Implémenter la synchronisation des données
- [x] Ajouter un indicateur de statut en ligne/hors ligne
- [x] Tester la synchronisation lors du retour en ligne

### Branding Dynamique
- [x] Mettre à jour le header avec le logo dynamique
- [x] Mettre à jour le dashboard avec le nom de l'association
- [x] Ajouter les couleurs personnalisées au thème
- [x] Tester sur plusieurs associations


## Phase 10 - Authentification par Email/Mot de Passe

### Tables de Base de Données
- [x] Créer la table users_local pour l'authentification locale
- [x] Créer la table user_sessions pour gérer les sessions
- [x] Ajouter les migrations SQL

### Backend (tRPC)
- [x] Implémenter la procédure register (enregistrement)
- [x] Implémenter la procédure login (connexion)
- [x] Implémenter la procédure logout (déconnexion)
- [x] Implémenter la procédure getCurrentUser (utilisateur courant)
- [x] Ajouter la validation des emails et des mots de passe
- [x] Ajouter le hachage des mots de passe avec bcrypt

### Frontend
- [x] Créer la page Login
- [x] Créer la page Register
- [x] Créer le hook useLocalAuth pour gérer l'authentification locale
- [x] Mettre à jour App.tsx pour gérer les routes publiques/privées
- [x] Ajouter la redirection après login

### Tests
- [x] Écrire les tests pour l'enregistrement
- [x] Écrire les tests pour la connexion
- [x] Écrire les tests pour la déconnexion


## Phase 11 - Intégration de l'Authentification dans le Dashboard

### DashboardLayout
- [x] Afficher le nom de l'utilisateur dans le header
- [x] Créer un composant UserMenu avec options de profil
- [x] Ajouter un bouton de déconnexion
- [x] Afficher l'avatar ou les initiales de l'utilisateur

### Composants
- [x] Créer le composant UserMenu avec dropdown
- [x] Ajouter les icônes pour les options du menu
- [x] Ajouter la confirmation de déconnexion

### Tests
- [x] Tester l'affichage du nom de l'utilisateur
- [x] Tester la déconnexion
- [x] Tester la redirection après déconnexion


## Phase 12 - Système de Rapports & Exports (PRIORITAIRE)
- [ ] Créer les routers tRPC pour générer les rapports
- [ ] Implémenter l'export PDF (factures, budgets, rapports financiers)
- [ ] Implémenter l'export Excel avec tableaux croisés
- [ ] Créer la page "Rapports & Exports"
- [ ] Ajouter les graphiques statistiques (Recharts)
- [ ] Implémenter les rapports mensuels/annuels

## Phase 13 - Gestion des Adhésions & Cotisations (PRIORITAIRE)
- [ ] Créer les tables pour adhésions et cotisations
- [ ] Implémenter les routers tRPC pour adhésions
- [ ] Créer la page "Adhésions & Cotisations"
- [ ] Ajouter le suivi automatique des cotisations
- [ ] Implémenter les rappels de paiement
- [ ] Générer les factures/quittances automatiquement
- [ ] Ajouter l'historique des paiements

## Phase 14 - Tableau de Bord Personnalisable (PRIORITAIRE)
- [x] Créer les widgets personnalisables
- [x] Implémenter la sauvegarde des préférences
- [x] Ajouter les widgets KPI dynamiques
- [x] Ajouter les graphiques en temps réel
- [x] Implémenter les alertes configurables
- [x] Tester la personnalisation par rôle


## Phase 15 - Gestion Complète des Projets
- [x] Enrichir le router tRPC projects avec update, delete, getMembers, addMember, removeMember
- [x] Créer une page Projects complète avec formulaire de création/édition en modal
- [x] Implémenter la gestion des tâches (create, update, delete, complete)
- [x] Ajouter l'assignation de membres aux projets
- [x] Créer une page détail de projet avec onglets (Infos, Tâches, Membres, Budget, Historique)
- [x] Implémenter le suivi du budget et des dépenses
- [x] Ajouter les graphiques de progression et budget
- [x] Tester le système complet de gestion de projets


## Phase 16 - Rapports Avancés avec Graphiques et Export

- [x] Enrichir le router tRPC avec les procédures de génération de rapports
- [x] Créer la page de rapports avec filtres et sélection de projets
- [x] Implémenter les graphiques interactifs (Recharts)
- [ ] Ajouter l'export PDF avec mise en forme professionnelle
- [ ] Ajouter l'export Excel avec données détaillées
- [x] Tester et valider le système de rapports


## Phase 17 - Recherche Globale (NOUVELLE)
- [x] Créer le router tRPC pour la recherche globale
- [x] Implémenter la recherche en temps réel pour membres et documents
- [x] Créer le composant SearchBar avec autocomplétion
- [x] Ajouter la barre de recherche au header
- [x] Implémenter le debounce pour optimiser les requêtes
- [ ] Créer la page de résultats de recherche
- [x] Ajouter les raccourcis clavier (Cmd+K / Ctrl+K)
- [x] Tester la recherche avec différents termes

## Phase 18 - Aperçu Riche dans la Recherche (NOUVELLE)
- [x] Enrichir le router tRPC search.global avec métadonnées complètes des documents
- [x] Ajouter statut, priorité, catégorie, date dans les résultats
- [x] Implémenter la mise en évidence du terme recherché dans les résultats
- [x] Améliorer le composant SearchBar avec un aperçu riche
- [x] Ajouter les badges de statut et priorité dans les résultats
- [x] Tester l'affichage des aperçus enrichis


## Phase 19 - Amélioration Projets (Style OOTI) (NOUVELLE)
- [x] Analyser la structure OOTI et identifier les fonctionnalités clés
- [x] Enrichir le schéma projects avec champs supplémentaires (budget, statut, priorité, dates, équipe)
- [x] Créer la vue Résumé avec cartes de projets (actifs, en attente, complétés)
- [x] Créer la vue Tableau avec liste détaillée des projets
- [x] Implémenter la vue Gantt pour la visualisation des timelines
- [x] Ajouter les filtres (statut, priorité, responsable, date)
- [x] Implémenter les statistiques et graphiques de progression
- [x] Ajouter les actions rapides (créer, éditer, archiver, supprimer)
- [x] Tester toutes les vues et fonctionnalités
