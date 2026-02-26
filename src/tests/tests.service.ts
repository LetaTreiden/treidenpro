import { Injectable, NotFoundException } from '@nestjs/common';
import { TestType } from '@prisma/client';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { RatingsService } from '../ratings/ratings.service';
import { CreateTestDto } from './dto/create-test.dto';
import { SubmitTestAttemptDto } from './dto/submit-test-attempt.dto';

@Injectable()
export class TestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ratingsService: RatingsService,
    private readonly eventsService: EventsService,
  ) {}

  async createTest(dto: CreateTestDto, authorId: string) {
    const test = await this.prisma.test.create({
      data: {
        title: dto.title,
        type: dto.type,
        courseId: dto.courseId,
        courseVersionId: dto.courseVersionId,
        moduleId: dto.moduleId,
        lessonId: dto.lessonId,
        maxScore: dto.maxScore || 100,
        passScore: dto.passScore || 70,
        shuffleQuestions: dto.shuffleQuestions ?? true,
        shuffleAnswers: dto.shuffleAnswers ?? true,
        questions: {
          create: dto.questions.map((q) => ({
            prompt: q.prompt,
            orderIndex: q.orderIndex,
            answers: {
              create: q.answers.map((a) => ({
                text: a.text,
                isCorrect: a.isCorrect,
                orderIndex: a.orderIndex,
              })),
            },
          })),
        },
      },
      include: { questions: { include: { answers: true } } },
    });

    await this.eventsService.logEvent({
      userId: authorId,
      eventName: 'test.created',
      payload: { testId: test.id, type: test.type },
    });

    return test;
  }

  async startTest(testId: string, userId: string) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { include: { answers: true } } },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const attemptsCount = await this.prisma.testAttempt.count({
      where: { testId, userId },
    });

    const questions = test.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      answers: this.maybeShuffle(
        test.shuffleAnswers,
        question.answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
        })),
      ),
    }));

    return {
      id: test.id,
      title: test.title,
      type: test.type,
      maxScore: test.maxScore,
      passScore: test.passScore,
      attemptsCount,
      questions: this.maybeShuffle(test.shuffleQuestions, questions),
    };
  }

  async submitAttempt(testId: string, userId: string, dto: SubmitTestAttemptDto) {
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
      include: { questions: { include: { answers: true } } },
    });

    if (!test) {
      throw new NotFoundException('Test not found');
    }

    const questionsMap = new Map(test.questions.map((q) => [q.id, q]));
    let correctCount = 0;

    const attemptAnswers = dto.answers
      .map((incoming) => {
        const question = questionsMap.get(incoming.questionId);
        if (!question) {
          return null;
        }

        const selected = incoming.answerId
          ? question.answers.find((a) => a.id === incoming.answerId)
          : null;

        const isCorrect = Boolean(selected?.isCorrect);
        if (isCorrect) {
          correctCount += 1;
        }

        return {
          questionId: question.id,
          answerId: selected?.id,
          answerText: incoming.answerText,
          isCorrect,
        };
      })
      .filter((a): a is NonNullable<typeof a> => Boolean(a));

    const totalQuestions = test.questions.length || 1;
    const score = Math.round((correctCount / totalQuestions) * test.maxScore);
    const passed = score >= test.passScore;

    const attempt = await this.prisma.testAttempt.create({
      data: {
        testId,
        userId,
        score,
        passed,
        attemptAnswers: {
          create: attemptAnswers,
        },
      },
      include: {
        attemptAnswers: true,
      },
    });

    if (passed) {
      const points = test.type === TestType.DIAGNOSTIC ? 30 : 20;
      await this.ratingsService.addPoints(userId, points, 'test_passed', testId);
    }

    await this.eventsService.logEvent({
      userId,
      eventName: 'test.submitted',
      payload: { testId, attemptId: attempt.id, score, passed },
    });

    return {
      ...attempt,
      recommendation:
        test.type === TestType.DIAGNOSTIC
          ? this.getDiagnosticRecommendation(score, test.maxScore)
          : null,
    };
  }

  async getMyDiagnosticRecommendation(userId: string) {
    const attempt = await this.prisma.testAttempt.findFirst({
      where: {
        userId,
        test: { is: { type: TestType.DIAGNOSTIC } },
      },
      include: { test: true },
      orderBy: { completedAt: 'desc' },
    });

    if (!attempt) {
      return { recommendation: null, message: 'No diagnostic attempts yet' };
    }

    return {
      testId: attempt.testId,
      score: attempt.score,
      recommendation: this.getDiagnosticRecommendation(
        attempt.score,
        attempt.test.maxScore,
      ),
    };
  }

  private getDiagnosticRecommendation(score: number, maxScore: number) {
    const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;

    if (pct >= 85) {
      return 'EXPERT';
    }

    if (pct >= 60) {
      return 'PRO';
    }

    return 'BASIC';
  }

  private maybeShuffle<T>(enabled: boolean, list: T[]): T[] {
    if (!enabled) {
      return list;
    }

    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }
}
