import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { practiceSessions, userAnswers } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const practiceRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        userId: z.number().optional(),
        topics: z.array(z.string()),
        questionCount: z.number(),
        correctCount: z.number(),
        incorrectCount: z.number(),
        accuracyPercentage: z.number(),
        durationSeconds: z.number(),
        answers: z.array(
          z.object({
            questionId: z.number(),
            selectedAnswer: z.string(),
            isCorrect: z.boolean(),
            timeSpentSeconds: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      const result = await db.insert(practiceSessions).values({
        userId: input.userId ?? null,
        topics: input.topics.join(","),
        questionCount: input.questionCount,
        questionsAnswered: input.answers.length,
        correctCount: input.correctCount,
        incorrectCount: input.incorrectCount,
        accuracyPercentage: String(input.accuracyPercentage.toFixed(2)),
        durationSeconds: input.durationSeconds,
      });

      const sessionId = Number(result[0].insertId);

      for (const ans of input.answers) {
        await db.insert(userAnswers).values({
          sessionId,
          sessionType: "practice",
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer as "A" | "B" | "C" | "D",
          isCorrect: ans.isCorrect,
          timeSpentSeconds: ans.timeSpentSeconds,
        });
      }

      return { sessionId };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const session = await db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.id, input.id));
      const answers = await db
        .select()
        .from(userAnswers)
        .where(eq(userAnswers.sessionId, input.id));
      return {
        session: session[0] ?? null,
        answers,
      };
    }),

  getRecent: publicQuery
    .input(z.object({ userId: z.number().optional(), limit: z.number().default(10) }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!input.userId) return [];
      return db
        .select()
        .from(practiceSessions)
        .where(eq(practiceSessions.userId, input.userId))
        .orderBy(desc(practiceSessions.createdAt))
        .limit(input.limit);
    }),
});
