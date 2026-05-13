'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">OphthoCare</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            La plateforme médicale universelle pour tous
          </p>
          <p className="text-lg opacity-80 mb-8 max-w-2xl">
            Trouvez les meilleurs médecins, prenez rendez-vous en ligne, et gérez votre santé
            facilement et en toute sécurité.
          </p>

          <div className="flex flex-col md:flex-row gap-4">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/search"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition"
                >
                  Commencer la recherche
                </Link>
                <Link
                  href="/login"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold py-3 px-8 rounded-lg transition"
                >
                  Se connecter
                </Link>
              </>
            ) : (
              <Link
                href="/dashboard/patient"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition"
              >
                Aller au tableau de bord
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">Nos Services</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-3">Recherche Facile</h3>
              <p className="text-gray-600">
                Trouvez rapidement les médecins de votre choix par spécialité, localisation et
                tarif.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-2xl font-bold mb-3">Prise de Rendez-vous</h3>
              <p className="text-gray-600">
                Réservez votre consultation en ligne en quelques clics, 24h/24 et 7j/7.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">📁</div>
              <h3 className="text-2xl font-bold mb-3">Dossier Patient</h3>
              <p className="text-gray-600">
                Conservez votre dossier médical en ligne de façon sécurisée et accessible.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">💻</div>
              <h3 className="text-2xl font-bold mb-3">Téléconsultation</h3>
              <p className="text-gray-600">
                Consultez depuis chez vous avec la télémédecine sécurisée et conviviale.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-2xl font-bold mb-3">Avis Vérifiés</h3>
              <p className="text-gray-600">
                Consultez les avis vérifiés des autres patients pour faire votre choix.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-2xl font-bold mb-3">Sécurité RGPD</h3>
              <p className="text-gray-600">
                Vos données médicales sont protégées selon les normes les plus strictes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-5xl font-bold text-blue-600">5,000+</p>
              <p className="text-gray-600 mt-2">Médecins inscrits</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-blue-600">50,000+</p>
              <p className="text-gray-600 mt-2">Patients actifs</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-blue-600">100,000+</p>
              <p className="text-gray-600 mt-2">Rendez-vous pris</p>
            </div>
            <div>
              <p className="text-5xl font-bold text-blue-600">99.9%</p>
              <p className="text-gray-600 mt-2">Disponibilité</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Prêt à commencer?</h2>
          <p className="text-lg text-gray-600 mb-10">
            Rejoignez des milliers de patients satisfaits qui ont trouvé le médecin idéal grâce à
            OphthoCare.
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            <Link
              href="/search"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Commencer maintenant
            </Link>
            <Link
              href="#"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg transition"
            >
              En savoir plus
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4">OphthoCare</h3>
              <p className="text-gray-400">La plateforme médicale universelle</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Accueil</a></li>
                <li><a href="#" className="hover:text-white">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white">Prix</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Conditions</a></li>
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white">RGPD</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="mailto:info@ophthocare.com" className="hover:text-white">Email</a></li>
                <li><a href="tel:+212612345678" className="hover:text-white">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 OphthoCare. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
