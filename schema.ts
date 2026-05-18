import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const questions = mysqlTable("questions", {
  id: serial("id").primaryKey(),
  topic: mysqlEnum("topic", [
    "dna_replication",
    "transcription",
    "translation",
    "mutation",
    "gene_expression",
    "linkage",
    "dominance",
    "genetic_engineering",
  ]).notNull(),
  questionText: text("question_text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctAnswer: mysqlEnum("correct_answer", ["A", "B", "C", "D"]).notNull(),
  explanation: text("explanation").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  hasDiagram: boolean("has_diagram").default(false),
  diagramUrl: text("diagram_url"),
  lessonSource: varchar("lesson_source", { length: 100 }),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

export const practiceSessions = mysqlTable("practice_sessions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  topics: text("topics"),
  questionCount: int("question_count").default(0),
  questionsAnswered: int("questions_answered").default(0),
  correctCount: int("correct_count").default(0),
  incorrectCount: int("incorrect_count").default(0),
  accuracyPercentage: decimal("accuracy_percentage", { precision: 5, scale: 2 }).default("0.00"),
  durationSeconds: int("duration_seconds").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PracticeSession = typeof practiceSessions.$inferSelect;

export const examAttempts = mysqlTable("exam_attempts", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  totalQuestions: int("total_questions").default(150),
  questionsAnswered: int("questions_answered").default(0),
  correctCount: int("correct_count").default(0),
  incorrectCount: int("incorrect_count").default(0),
  unansweredCount: int("unanswered_count").default(0),
  scorePercentage: decimal("score_percentage", { precision: 5, scale: 2 }).default("0.00"),
  timeLimitSeconds: int("time_limit_seconds").default(2400),
  timeUsedSeconds: int("time_used_seconds").default(0),
  passed: boolean("passed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ExamAttempt = typeof examAttempts.$inferSelect;

export const userAnswers = mysqlTable("user_answers", {
  id: serial("id").primaryKey(),
  sessionId: bigint("session_id", { mode: "number", unsigned: true }).notNull(),
  sessionType: mysqlEnum("session_type", ["practice", "exam"]).notNull(),
  questionId: bigint("question_id", { mode: "number", unsigned: true }).references(() => questions.id),
  selectedAnswer: mysqlEnum("selected_answer", ["A", "B", "C", "D"]),
  isCorrect: boolean("is_correct").default(false),
  timeSpentSeconds: int("time_spent_seconds").default(0),
});

export type UserAnswer = typeof userAnswers.$inferSelect;

export const stickers = mysqlTable("stickers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  unlockCondition: text("unlock_condition").notNull(),
  requiredScore: int("required_score").default(0),
});

export type Sticker = typeof stickers.$inferSelect;

export const userStickers = mysqlTable("user_stickers", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  stickerId: bigint("sticker_id", { mode: "number", unsigned: true }).references(() => stickers.id),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export type UserSticker = typeof userStickers.$inferSelect;
