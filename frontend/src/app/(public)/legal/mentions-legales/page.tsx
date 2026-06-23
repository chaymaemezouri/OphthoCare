import Link from 'next/link';
import { APP_CONFIG } from '@/lib/constants/app-config';

export const metadata = {
  title: `Mentions légales — ${APP_CONFIG.APP_NAME}`,
};

export default function MentionsLegalesPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <Link href="/" className="text-sm font-medium text-teal-800 hover:underline no-underline">
        ← Retour à l&apos;accueil
      </Link>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">Mentions légales</h1>
      <h2>Éditeur</h2>
      <p>
        Plateforme {APP_CONFIG.APP_NAME} — solution de gestion médicale multi-spécialités.
        <br />
        Contact : <a href={`mailto:${APP_CONFIG.PRO_CONTACT_EMAIL}`}>{APP_CONFIG.PRO_CONTACT_EMAIL}</a>
      </p>
      <h2>Hébergement</h2>
      <p>À renseigner selon votre déploiement production (fournisseur cloud, localisation des données).</p>
      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;interface, les textes et l&apos;identité visuelle sont protégés. Toute reproduction non autorisée est
        interdite.
      </p>
      <h2>Responsabilité</h2>
      <p>
        {APP_CONFIG.APP_NAME} est un outil d&apos;organisation et de communication ; il ne remplace pas le jugement
        clinique du professionnel de santé.
      </p>
      <p className="text-sm text-slate-500">Document informatif pour l&apos;environnement de démonstration.</p>
    </article>
  );
}
