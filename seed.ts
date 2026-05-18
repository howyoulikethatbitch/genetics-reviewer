import { getDb } from "../api/queries/connection";
import { questions } from "./schema";
import { questionsData } from "./questions-data";

async function seed() {
  const db = getDb();
  console.log(`Seeding ${questionsData.length} questions...`);

  // Clear existing questions
  await db.delete(questions);
  console.log("Cleared existing questions");

  // Insert in batches of 20
  const batchSize = 20;
  for (let i = 0; i < questionsData.length; i += batchSize) {
    const batch = questionsData.slice(i, i + batchSize);
    await db.insert(questions).values(
      batch.map((q) => ({
        topic: q.topic as any,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer as any,
        explanation: q.explanation,
        difficulty: q.difficulty as any,
        lessonSource: q.lessonSource,
      }))
    );
    console.log(`Inserted batch ${i / batchSize + 1} (${batch.length} questions)`);
  }

  console.log(`Successfully seeded ${questionsData.length} questions!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
