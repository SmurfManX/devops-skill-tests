'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from '../../../../../i18n/routing';

interface QuestionResult {
  id: number;
  question_en: string;
  question_ru: string;
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  options: {
    A: { en: string; ru: string };
    B: { en: string; ru: string };
    C: { en: string; ru: string };
    D: { en: string; ru: string };
  };
  difficulty: string;
}

interface TestResults {
  sessionId: string;
  professionName: string;
  professionSlug: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  skippedAnswers: number;
  percentage: number;
  questions: QuestionResult[];
}

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();

  const locale = params.locale as string;
  const sessionId = params.sessionId as string;

  const [results, setResults] = useState<TestResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(`/api/test/results/${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        const data = await response.json();
        setResults(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching results:', err);
        setError('Failed to load results');
        setLoading(false);
      }
    }

    fetchResults();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">
            {locale === 'ru' ? 'Загрузка результатов...' : 'Loading results...'}
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">
            {locale === 'ru' ? 'Ошибка загрузки результатов' : 'Error loading results'}
          </div>
          <Link href="/">
            <Button>{locale === 'ru' ? 'На главную' : 'Back to Home'}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage: number) => {
    if (locale === 'ru') {
      if (percentage >= 90) return 'Отлично! Превосходный результат!';
      if (percentage >= 80) return 'Очень хорошо! Отличные знания!';
      if (percentage >= 70) return 'Хорошо! Есть над чем поработать.';
      if (percentage >= 60) return 'Неплохо, но можно лучше.';
      return 'Требуется дополнительное изучение материала.';
    } else {
      if (percentage >= 90) return 'Excellent! Outstanding result!';
      if (percentage >= 80) return 'Very good! Great knowledge!';
      if (percentage >= 70) return 'Good! Room for improvement.';
      if (percentage >= 60) return 'Not bad, but you can do better.';
      return 'Additional study required.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Results Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-3xl text-center">
                {locale === 'ru' ? 'Результаты теста' : 'Test Results'}
              </CardTitle>
              <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                {results.professionName}
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-8">
                <div className={`text-6xl font-bold mb-4 ${getScoreColor(results.percentage)}`}>
                  {results.percentage.toFixed(0)}%
                </div>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                  {getScoreMessage(results.percentage)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {results.correctAnswers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'ru' ? 'Правильно' : 'Correct'}
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {results.incorrectAnswers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'ru' ? 'Неправильно' : 'Incorrect'}
                  </div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                    {results.skippedAnswers}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {locale === 'ru' ? 'Пропущено' : 'Skipped'}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link href={`/test/${results.professionSlug}`}>
                  <Button variant="outline">
                    {locale === 'ru' ? 'Попробовать снова' : 'Try Again'}
                  </Button>
                </Link>
                <Link href="/">
                  <Button>
                    {locale === 'ru' ? 'Другая профессия' : 'Other Profession'}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Review */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {locale === 'ru' ? 'Детальный разбор' : 'Detailed Review'}
            </h2>

            <div className="space-y-4">
              {results.questions.map((question, index) => (
                <Card key={question.id} className={question.user_answer === null ? 'border-gray-300' : question.is_correct ? 'border-green-300' : 'border-red-300'}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {locale === 'ru' ? 'Вопрос' : 'Question'} {index + 1}
                          </span>
                          <Badge variant="secondary">{question.difficulty}</Badge>
                          {question.user_answer === null ? (
                            <Badge variant="outline">{locale === 'ru' ? 'Пропущено' : 'Skipped'}</Badge>
                          ) : question.is_correct ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {locale === 'ru' ? '✓ Правильно' : '✓ Correct'}
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              {locale === 'ru' ? '✗ Неправильно' : '✗ Incorrect'}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">
                          {locale === 'ru' ? question.question_ru : question.question_en}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(['A', 'B', 'C', 'D'] as const).map((option) => {
                        const isUserAnswer = question.user_answer === option;
                        const isCorrectAnswer = question.correct_answer === option;

                        let bgColor = 'bg-white dark:bg-gray-800';
                        if (isCorrectAnswer) {
                          bgColor = 'bg-green-50 dark:bg-green-900/20 border-green-500';
                        } else if (isUserAnswer && !isCorrectAnswer) {
                          bgColor = 'bg-red-50 dark:bg-red-900/20 border-red-500';
                        }

                        return (
                          <div
                            key={option}
                            className={`p-3 border-2 rounded-lg ${bgColor}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                isCorrectAnswer
                                  ? 'bg-green-500 text-white'
                                  : isUserAnswer
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}>
                                {option}
                              </div>
                              <div className="flex-1">
                                {locale === 'ru' ? question.options[option].ru : question.options[option].en}
                                {isUserAnswer && (
                                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                    ({locale === 'ru' ? 'Ваш ответ' : 'Your answer'})
                                  </span>
                                )}
                                {isCorrectAnswer && (
                                  <span className="ml-2 text-sm text-green-600 dark:text-green-400">
                                    ({locale === 'ru' ? 'Правильный ответ' : 'Correct answer'})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
