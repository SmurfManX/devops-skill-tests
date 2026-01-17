'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: number;
  order: number;
  question_en: string;
  question_ru: string;
  options: {
    A: { en: string; ru: string };
    B: { en: string; ru: string };
    C: { en: string; ru: string };
    D: { en: string; ru: string };
  };
  difficulty: string;
}

interface TestSession {
  sessionId: string;
  questions: Question[];
  questionsCount: number;
}

export default function TestPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const locale = params.locale as string;
  const profession = params.profession as string;
  const questionsCount = parseInt(searchParams.get('count') || '20');

  const [session, setSession] = useState<TestSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question

  const TIME_PER_QUESTION = 60; // seconds

  // Initialize test session
  useEffect(() => {
    async function startTest() {
      try {
        const response = await fetch('/api/test/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            professionSlug: profession,
            questionsCount,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to start test');
        }

        const data = await response.json();
        setSession(data);
        setLoading(false);
      } catch (error) {
        console.error('Error starting test:', error);
        alert('Failed to start test. Please try again.');
        router.push(`/${locale}/test/${profession}`);
      }
    }

    startTest();
  }, [profession, questionsCount, locale, router]);

  const currentQuestion = session?.questions[currentQuestionIndex];
  const progress = session ? ((currentQuestionIndex + 1) / session.questionsCount) * 100 : 0;

  // Timer countdown
  useEffect(() => {
    if (!session || submitting) return;

    setTimeLeft(TIME_PER_QUESTION); // Reset timer for new question

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - auto skip to next question
          clearInterval(interval);
          handleAutoSkip();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, session]);

  const handleSelectAnswer = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAutoSkip = async () => {
    if (!session || submitting) return;

    setSubmitting(true);

    // Move to next question or finish
    if (currentQuestionIndex < session.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setSubmitting(false);
    } else {
      // Test completed - redirect to results
      router.push(`/${locale}/results/${session.sessionId}`);
    }
  };

  const handleNext = async () => {
    if (!selectedAnswer || !session || !currentQuestion) return;

    setSubmitting(true);

    try {
      // Save answer
      await fetch('/api/test/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.sessionId,
          questionId: currentQuestion.id,
          answer: selectedAnswer,
        }),
      });

      // Update answers
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: selectedAnswer,
      }));

      // Move to next question or finish
      if (currentQuestionIndex < session.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        // Test completed - redirect to results
        router.push(`/${locale}/results/${session.sessionId}`);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      alert('Failed to save answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (!session) return;

    setSubmitting(true);

    try {
      // Move to next question or finish
      if (currentQuestionIndex < session.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        // Test completed - redirect to results
        router.push(`/${locale}/results/${session.sessionId}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">
            {locale === 'ru' ? 'Загрузка теста...' : 'Loading test...'}
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          {locale === 'ru' ? 'Ошибка загрузки теста' : 'Error loading test'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {locale === 'ru' ? 'Вопрос' : 'Question'} {currentQuestionIndex + 1} {locale === 'ru' ? 'из' : 'of'} {session.questionsCount}
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{currentQuestion.difficulty}</Badge>
              <Badge
                variant={timeLeft <= 10 ? "destructive" : "default"}
                className={`font-mono text-lg px-3 ${timeLeft <= 10 ? 'animate-pulse' : ''}`}
              >
                ⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <Progress
            value={(timeLeft / TIME_PER_QUESTION) * 100}
            className={`h-1 ${timeLeft <= 10 ? 'bg-red-100' : ''}`}
          />
        </div>

        {/* Question Card */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {locale === 'ru' ? currentQuestion.question_ru : currentQuestion.question_en}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Answer Options */}
              {(['A', 'B', 'C', 'D'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => handleSelectAnswer(option)}
                  disabled={submitting}
                  className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                    selectedAnswer === option
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      selectedAnswer === option
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {option}
                    </div>
                    <div className="flex-1 text-gray-900 dark:text-gray-100">
                      {locale === 'ru' ? currentQuestion.options[option].ru : currentQuestion.options[option].en}
                    </div>
                  </div>
                </button>
              ))}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={submitting}
                  className="flex-1"
                >
                  {locale === 'ru' ? 'Пропустить' : 'Skip'}
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={!selectedAnswer || submitting}
                  className="flex-1"
                >
                  {submitting
                    ? (locale === 'ru' ? 'Сохранение...' : 'Saving...')
                    : currentQuestionIndex < session.questions.length - 1
                    ? (locale === 'ru' ? 'Следующий' : 'Next')
                    : (locale === 'ru' ? 'Завершить' : 'Finish')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
