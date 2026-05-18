import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { examAttempts, userAnswers } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const examRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        userId: z.number().optional(),
        totalQuestions: z.number().default(150),
        questionsAnswered: z.number(),
        correctCount: z.number(),
        incorrectCount: z.number(),
        unansweredCount: z.number(),
        scorePercentage: z.number(),
        timeUsedSeconds: z.number(),
        passed: z.boolean(),
        answers: z.array(
          z.object({
            questionId: z.number(),
            selectedAnswer: z.string().nullable(),
            isCorrect: z.boolean(),
            timeSpentSeconds: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const result = await db.insert(examAttempts).values({
        userId: input.userId ?? null,
        totalQuestions: input.totalQuestions,
        questionsAnswered: input.questionsAnswered,
        correctCount: input.correctCount,
        incorrectCount: input.incorrectCount,
        unansweredCount: input.unansweredCount,
        scorePercentage: String(input.scorePercentage.toFixed(2)),
        timeUsedSeconds: input.timeUsedSeconds,
        passed: input.passed,
      });

      const attemptId = Number(result[0].insertId);

      for (const ans of input.answers) {
        await db.insert(userAnswers).values({
          sessionId: attemptId,
          sessionType: "exam",
          questionId: ans.questionId,
          selectedAnswer: (ans.selectedAnswer as "A" | "B" | "C" | "D") ?? null,
          isCorrect: ans.isCorrect,
          timeSpentSeconds: ans.timeSpentSeconds,
        });
      }

      return { attemptId };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const attempt = await db
        .select()
        .from(examAttempts)
        .where(eq(examAttempts.id, input.id));
      const answers = await db
        .select()
        .from(userAnswers)
        .where(eq(userAnswers.sessionId, input.id));
      return {
        attempt: attempt[0] ?? null,
        answers,
      };
    }),

  getRecent: publicQuery
    .input(z.object({ userId: z.number().optional(), limit: z.number().default(5) }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!input.userId) return [];
      return db
        .select()
        .from(examAttempts)
        .where(eq(examAttempts.userId, input.userId))
        .orderBy(desc(examAttempts.createdAt))
        .limit(input.limit);
    }),

  getLeaderboard: publicQuery
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(examAttempts)
        .orderBy(desc(examAttempts.scorePercentage))
        .limit(input.limit);
    }),
});
