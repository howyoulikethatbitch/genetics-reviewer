import { authRouter } from "./auth-router";
import { questionRouter } from "./question-router";
import { practiceRouter } from "./practice-router";
import { examRouter } from "./exam-router";
import { progressRouter } from "./progress-router";
import { tutorRouter } from "./tutor-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  question: questionRouter,
  practice: practiceRouter,
  exam: examRouter,
  progress: progressRouter,
  tutor: tutorRouter,
});

export type AppRouter = typeof appRouter;
