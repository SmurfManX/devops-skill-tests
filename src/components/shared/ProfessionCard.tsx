'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { Link } from '../../../i18n/routing';

interface ProfessionCardProps {
  slug: string;
  name: string;
  description: string;
  icon: string;
  questionsCount: number;
  locale: string;
}

export function ProfessionCard({
  slug,
  name,
  description,
  icon,
  questionsCount,
  locale,
}: ProfessionCardProps) {
  const t = useTranslations('home');

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="text-4xl">{icon}</div>
          <Badge variant="secondary">
            {questionsCount} {t('questionsAvailable', { count: questionsCount })}
          </Badge>
        </div>
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-end">
        {questionsCount > 0 ? (
          <Link href={`/test/${slug}` as any}>
            <Button className="w-full">
              {t('startTest')}
            </Button>
          </Link>
        ) : (
          <Button disabled className="w-full">
            Coming Soon
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
