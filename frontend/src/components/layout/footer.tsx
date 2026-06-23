import { APP_CONFIG } from '@/lib/constants/app-config';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-slate-50 py-6 text-center text-xs text-slate-500">
      © {new Date().getFullYear()} {APP_CONFIG.APP_NAME}
    </footer>
  );
}
