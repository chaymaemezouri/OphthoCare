'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LANDING_EASE } from '@/components/marketing/landing-motion';

const FAQ_ITEMS = [
  {
    q: 'Comment prendre rendez-vous ?',
    a: 'Recherchez un praticien par spécialité et ville, consultez sa fiche puis choisissez un créneau disponible. Vous pouvez aussi créer un compte patient pour suivre vos RDV et documents.',
  },
  {
    q: 'La pré-consultation en ligne, comment ça marche ?',
    a: 'Avant certains rendez-vous, votre médecin peut vous envoyer un lien sécurisé pour remplir un questionnaire (symptômes, antécédents). Les réponses sont importées dans la consultation pour gagner du temps en cabinet.',
  },
  {
    q: 'Je suis médecin : comment rejoindre la plateforme ?',
    a: 'Contactez-nous via le formulaire cabinet pour une proposition adaptée à votre structure. Une fois onboardé, vous disposez d’un espace multi-sites, agenda, dossier structuré par spécialité et gestion d’équipe (secrétaire, stagiaire).',
  },
  {
    q: 'Mes données de santé sont-elles protégées ?',
    a: 'Les dossiers sont isolés par cabinet (multi-tenant). Les administrateurs plateforme n’accèdent pas au contenu médical. Consentements et journal d’audit sont prévus dans le parcours.',
  },
  {
    q: 'Puis-je faire une téléconsultation ?',
    a: 'Oui, lorsque le praticien propose ce type de créneau. Réservez un RDV « vidéo » depuis la fiche médecin ; le lien de téléconsultation est accessible depuis votre espace patient.',
  },
] as const;

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="w-full divide-y divide-[#E8EAED] border-y border-[#E8EAED]">
      {FAQ_ITEMS.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-5 text-left transition hover:opacity-70"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className="text-sm font-medium text-[#111111] sm:text-base">{item.q}</span>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 text-[#77777D] transition-transform duration-300', isOpen && 'rotate-180')}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: LANDING_EASE }}
                  className="overflow-hidden"
                >
                  <p className="pb-5 text-sm leading-relaxed text-[#77777D]">{item.a}</p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
