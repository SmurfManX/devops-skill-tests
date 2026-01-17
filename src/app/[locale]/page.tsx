import { getTranslations } from 'next-intl/server';
import { ProfessionCard } from '@/components/shared/ProfessionCard';
import type { Profession } from '@/lib/db/schema';
import db from '@/lib/db/client';

export const dynamic = 'force-dynamic';

async function getProfessions(locale: string) {
  try {
    const professions = db.prepare(`
      SELECT
        p.*,
        COUNT(q.id) as questions_count
      FROM professions p
      LEFT JOIN questions q ON p.id = q.profession_id
      GROUP BY p.id
      ORDER BY p.created_at ASC
    `).all() as (Profession & { questions_count: number })[];

    return professions.map((prof: any) => ({
      ...prof,
      name: locale === 'ru' ? prof.name_ru : prof.name_en,
      description: locale === 'ru' ? prof.description_ru : prof.description_en,
    }));
  } catch (error) {
    console.error('Error fetching professions:', error);
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('home');
  const professions = await getProfessions(locale);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            {t('title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Professions Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">
            {t('chooseProfession')}
          </h2>

          {professions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {professions.map((profession: any) => (
                <ProfessionCard
                  key={profession.id}
                  slug={profession.slug}
                  name={profession.name}
                  description={profession.description}
                  icon={profession.icon}
                  questionsCount={profession.questions_count}
                  locale={locale}
                />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Loading professions...
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="p-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {professions.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {locale === 'ru' ? 'Профессий' : 'Professions'}
              </div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-indigo-600 mb-2">
                {professions.reduce((acc: number, p: any) => acc + p.questions_count, 0)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {locale === 'ru' ? 'Вопросов' : 'Questions'}
              </div>
            </div>
            <div className="p-6">
              <div className="text-4xl font-bold text-purple-600 mb-2">2</div>
              <div className="text-gray-600 dark:text-gray-400">
                {locale === 'ru' ? 'Языка' : 'Languages'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
