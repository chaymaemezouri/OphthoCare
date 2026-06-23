# Comptes et données de démonstration

Après migration et seed :

```bash
cd Backend
npx prisma migrate deploy
npx prisma generate
npm run seed
```

**Mot de passe (tous les comptes)** : `OphthoDemo2024!`

## Comptes par rôle

| Rôle | E-mail | Dashboard |
|------|--------|-----------|
| Médecin (ophtalmo) | `dr.demo@ophthocare.local` | `/dashboard/medecin` |
| Médecin (cardio, annuaire) | `dr.cardio.demo@ophthocare.local` | `/dashboard/medecin` |
| Secrétaire | `secretaire.demo@ophthocare.local` | `/dashboard/secretaire` |
| Stagiaire | `stagiaire.demo@ophthocare.local` | `/dashboard/stagiaire` |
| Patient | `patient.demo@ophthocare.local` | `/dashboard/patient` |
| Patients suppl. | `fatima.demo@…`, `karim.demo@…`, `nadia.demo@…`, `hassan.demo@…` | `/dashboard/patient` |
| Admin | `admin@ophthocare.local` | `/dashboard/admin` |
| Super admin | `superadmin@ophthocare.local` | `/dashboard/admin` |

Connexion : frontend `/login` (pro : `/login?intent=pro`).

## Données créées (jeu riche)

- **Agenda** : RDV passés (terminés), aujourd’hui (en cours + confirmé), à venir (confirmé, en attente), téléconsultation, annulé ; blocage congés.
- **Pré-consultation** : formulaires liés aux RDV (tokens publics `demo-pre-ahmed`, `demo-pre-nadia`).
- **Consultations** : terminées, en cours, brouillon ; reçus de consultation.
- **Dossier** : entrées `MedicalRecord`, consentements, diagnostics CIM-10 par patient.
- **Documents** : ordonnances, reçus numérotés (`2026-00001`…), compte rendu, lettre d’orientation.
- **Messagerie** : conversation patient ↔ cabinet, messages cabinet, newsletter (broadcast).
- **Patient** : notifications in-app (RDV, document, reçu).
- **Stagiaire** : sessions quiz/chat, image OCT fictive avec analyse pédagogique.
- **Admin** : avis en attente de modération, avis approuvés, logs d’audit, tentatives de login échouées.

Les seeds sont **idempotents** : relancer `npm run seed` met à jour sans dupliquer les entités clés (repère par e-mail, libellés « démo », numéros de reçu).

## Alignement avec la production

En production, les mêmes modèles Prisma sont alimentés par l’usage réel (RDV → accès cabinet → consultation → PDF). Les données de démo reproduisent ce flux avec des valeurs fictives (PDF en `pdfStatus: ready` avec URL locales, pas de génération BullMQ obligatoire pour naviguer l’UI).
