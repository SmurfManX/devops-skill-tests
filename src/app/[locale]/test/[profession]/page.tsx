import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import db from '@/lib/db/client';
import type { Profession } from '@/lib/db/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '../../../../../i18n/routing';

export const dynamic = 'force-dynamic';

async function getProfession(slug: string, locale: string) {
  try {
    const profession = db.prepare(`
      SELECT
        p.*,
        COUNT(q.id) as questions_count
      FROM professions p
      LEFT JOIN questions q ON p.id = q.profession_id
      WHERE p.slug = ?
      GROUP BY p.id
    `).get(slug) as (Profession & { questions_count: number }) | undefined;

    if (!profession) {
      return null;
    }

    return {
      ...profession,
      name: locale === 'ru' ? profession.name_ru : profession.name_en,
      description: locale === 'ru' ? profession.description_ru : profession.description_en,
    };
  } catch (error) {
    console.error('Error fetching profession:', error);
    return null;
  }
}

export default async function TestSetupPage({
  params,
}: {
  params: Promise<{ locale: string; profession: string }>;
}) {
  const { locale, profession: professionSlug } = await params;
  const t = await getTranslations('test');
  const profession = await getProfession(professionSlug, locale);

  if (!profession) {
    notFound();
  }

  const questionOptions = [
    { count: 30, key: 'questions_30' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Profession Info */}
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">{profession.icon}</div>
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {profession.name}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              {profession.description}
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <span className="text-blue-700 dark:text-blue-300 font-semibold">
                {profession.questions_count} {t('selectAnswer')}
              </span>
            </div>
          </div>

          {/* Question Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('chooseQuestions')}</CardTitle>
              <CardDescription>
                Select how many questions you want to answer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {questionOptions
                .filter(option => option.count <= profession.questions_count)
                .map((option) => (
                  <Link
                    key={option.count}
                    href={`/test/${professionSlug}/start?count=${option.count}` as any}
                  >
                    <div className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer hover:shadow-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                            {option.count} {locale === 'ru' ? 'вопросов' : 'Questions'}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {t(option.key)}
                          </p>
                        </div>
                        <div className="text-blue-600 dark:text-blue-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link href="/">
              <Button variant="outline">
                ← {locale === 'ru' ? 'Назад к выбору профессии' : 'Back to professions'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
