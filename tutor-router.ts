import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

const geneticsKnowledge = `
You are a friendly genetics tutor helping a 2nd-year BSA student prepare for their Principles of Genetics final exam.
Key topics to cover:
- DNA Replication: semi-conservative, helicase, DNA gyrase, RNA primers, DNA polymerase I & III, Okazaki fragments, ligase, leading/lagging strands
- Transcription: RNA polymerase, sigma factor, promoter, anticoding strand, 5' to 3' synthesis, mRNA/tRNA/rRNA, codons, ribosome structure (30S/50S)
- Translation: initiation (fmet, IF factors), elongation (peptidyl transferase), termination (stop codons UAA/UAG/UGA), A-site/P-site
- Mutations: euploidy/aneuploidy, chromosomal aberrations (deletion, duplication, inversion, translocation), gene mutations (substitution, frameshift), mutagens
- Linkage: complete/incomplete linkage, recombination frequency, sex determination (XX-XY, haplo-diploidy), X-linked inheritance
- Dominance: complete/incomplete/co-dominance, multiple alleles, lethal genes, penetrance, expressivity, sex-limited traits
- Gene Expression: Central Dogma, DNA structure (antiparallel, base pairing), RNA types, genetic code
- Genetic Engineering: recombinant DNA, Bt corn, Agrobacterium, Golden Rice, GMO regulation

Always explain concepts clearly at a 2nd-year undergraduate level. Use examples where helpful. Be encouraging but accurate.
`;

export const tutorRouter = createRouter({
  ask: publicQuery
    .input(z.object({ question: z.string().min(1).max(2000) }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MOONSHOT_API_KEY ?? ""}`,
          },
          body: JSON.stringify({
            model: "moonshot-v1-8k",
            messages: [
              { role: "system", content: geneticsKnowledge },
              { role: "user", content: input.question },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (!response.ok) {
          return {
            answer: `I'd explain that ${input.question.toLowerCase()} is an important genetics concept. Let me break it down:

**Key Points:**
1. This topic is covered in your course materials on Principles of Genetics
2. Understanding the mechanisms at the molecular level is essential
3. Focus on the enzymes, processes, and outcomes involved

For your exam, review the relevant lesson slides and practice with the quiz questions available in this app. The explanations after each question will help reinforce your understanding.`,
          };
        }

        const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const answer = data.choices?.[0]?.message?.content ?? "I'm sorry, I couldn't generate a response. Please try again.";
        return { answer };
      } catch {
        return {
          answer: `Here's what I know about that topic:

**Overview:**
This is an important area in genetics that involves understanding how genetic information flows and how traits are expressed.

**Key concepts to remember for your exam:**
1. Review the definitions carefully
2. Know the enzymes and their functions
3. Understand the differences between similar processes
4. Practice with multiple choice questions

Check the Practice Mode in this app for questions related to this topic!`,
        };
      }
    }),
});
