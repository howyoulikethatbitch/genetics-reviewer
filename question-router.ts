import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { questions } from "@db/schema";
import { eq, inArray, sql } from "drizzle-orm";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function shuffleOptions(question: typeof questions.$inferSelect) {
  const options = [
    { letter: "A", text: question.optionA },
    { letter: "B", text: question.optionB },
    { letter: "C", text: question.optionC },
    { letter: "D", text: question.optionD },
  ];
  const shuffled = shuffleArray(options);
  const correctIndex = shuffled.findIndex(
    (o) => o.letter === question.correctAnswer
  );
  const newCorrectLetter = ["A", "B", "C", "D"][correctIndex];

  return {
    ...question,
    optionA: shuffled[0].text,
    optionB: shuffled[1].text,
    optionC: shuffled[2].text,
    optionD: shuffled[3].text,
    correctAnswer: newCorrectLetter as "A" | "B" | "C" | "D",
  };
}

export const questionRouter = createRouter({
  getByTopics: publicQuery
    .input(
      z.object({
        topics: z.array(z.string()),
        limit: z.number().min(1).max(150).default(25),
        randomize: z.boolean().default(true),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const results = await db
        .select()
        .from(questions)
        .where(inArray(questions.topic, input.topics as any));

      let final = input.randomize ? shuffleArray(results) : results;
      final = final.slice(0, input.limit);

      return final.map(shuffleOptions);
    }),

  getExamSet: publicQuery.query(async () => {
    const db = getDb();
    const allQuestions = await db.select().from(questions);
    const shuffled = shuffleArray(allQuestions).slice(0, 150);
    return shuffled.map(shuffleOptions);
  }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const result = await db
        .select()
        .from(questions)
        .where(eq(questions.id, input.id));
      return result[0] ?? null;
    }),

  getTopicCounts: publicQuery.query(async () => {
    const db = getDb();
    const results = await db
      .select({
        topic: questions.topic,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(questions)
      .groupBy(questions.topic);
    return results;
  }),
});
