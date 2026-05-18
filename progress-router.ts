import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { practiceSessions, examAttempts, userAnswers, questions } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const progressRouter = createRouter({
  getSummary: publicQuery
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!input.userId) {
        return {
          totalPracticeQuestions: 0,
          totalExamAttempts: 0,
          avgAccuracy: 0,
          bestExamScore: 0,
          currentStreak: 0,
        };
      }

      const practice = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, input.userId));

      const exams = await db
        .select()
        .from(examAttempts)
        .where(eq(examAttempts.userId, input.userId));

      const totalPracticeQuestions = practice.reduce(
        (sum, s) => sum + (s.questionsAnswered ?? 0),
        0
      );
      const avgAccuracy =
        practice.length > 0
          ? practice.reduce(
              (sum, s) => sum + Number(s.accuracyPercentage),
              0
            ) / practice.length
          : 0;

      const bestExamScore =
        exams.length > 0
          ? Math.max(...exams.map((e) => Number(e.scorePercentage)))
          : 0;

      return {
        totalPracticeQuestions,
        totalExamAttempts: exams.length,
        avgAccuracy: Math.round(avgAccuracy),
        bestExamScore,
        currentStreak: 0,
      };
    }),

  getTopicMastery: publicQuery
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!input.userId) return [];

      const answers = await db
        .select({
          topic: questions.topic,
          total: sql<number>`count(*)`.as("total"),
          correct: sql<number>`sum(case when ${userAnswers.isCorrect} = 1 then 1 else 0 end)`.as("correct"),
        })
        .from(userAnswers)
        .innerJoin(questions, eq(userAnswers.questionId, questions.id))
        .innerJoin(
          practiceSessions,
          eq(userAnswers.sessionId, practiceSessions.id)
        )
        .where(eq(practiceSessions.userId, input.userId))
        .groupBy(questions.topic);

      return answers.map((a) => ({
        topic: a.topic,
        answered: a.total,
        accuracy: a.total > 0 ? Math.round((a.correct / a.total) * 100) : 0,
      }));
    }),

  getRecentSessions: publicQuery
    .input(z.object({ userId: z.number().optional(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!input.userId) return [];

      const practice = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, input.userId))
        .orderBy(desc(practiceSessions.createdAt))
        .limit(input.limit);

      return practice.map((p) => ({
        id: p.id,
        type: "practice" as const,
        topics: p.topics,
        questionCount: p.questionCount,
        correctCount: p.correctCount,
        accuracy: Number(p.accuracyPercentage),
        createdAt: p.createdAt,
      }));
    }),
});
