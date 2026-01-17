'use client';

import { usePathname, useRouter } from '../../../i18n/routing';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  const switchLanguage = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={currentLocale === 'en' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLanguage('en')}
      >
        EN
      </Button>
      <Button
        variant={currentLocale === 'ru' ? 'default' : 'outline'}
        size="sm"
        onClick={() => switchLanguage('ru')}
      >
        RU
      </Button>
    </div>
  );
}
