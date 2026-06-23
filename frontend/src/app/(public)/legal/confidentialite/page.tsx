import Link from 'next/link';
import { APP_CONFIG } from '@/lib/constants/app-config';

export const metadata = {
  title: `Confidentialité — ${APP_CONFIG.APP_NAME}`,
};

export default function ConfidentialitePage() {
  return (
    <article className="prose prose-slate max-w-none">
      <Link href="/" className="text-sm font-medium text-teal-800 hover:underline no-underline">
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Politique de confidentialité</h1>
      <p className="lead text-slate-600">
        {APP_CONFIG.APP_NAME} traite les données personnelles et de santé dans le respect du secret médical et des
        obligations applicables au Maroc et au RGPD lorsque pertinent.
      </p>
      <h2>Données collectées</h2>
      <p>
        Compte utilisateur (identité, contact), rendez-vous, dossier clinique saisi par les professionnels, documents
        générés (ordonnances, reçus) et journaux techniques (connexion, audit sans contenu médical pour les
        administrateurs plateforme).
      </p>
      <h2>Isolation par cabinet</h2>
      <p>
        Chaque espace médecin est isolé (multi-tenant). Les administrateurs {APP_CONFIG.APP_NAME} modèrent les avis et la
        plateforme sans accéder au contenu médical des patients.
      </p>
      <h2>Vos droits</h2>
      <p>
        Accès, rectification et suppression peuvent être demandés via votre médecin traitant ou à{' '}
        <a href={`mailto:${APP_CONFIG.PRO_CONTACT_EMAIL}`}>{APP_CONFIG.PRO_CONTACT_EMAIL}</a>.
      </p>
      <p className="text-sm text-slate-500">Document informatif pour l&apos;environnement de démonstration.</p>
    </article>
  );
}
