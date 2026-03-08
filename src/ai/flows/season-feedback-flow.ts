
'use server';
/**
 * @fileOverview A Genkit flow for generating post-season feedback from stakeholders.
 * Provides a structured way to get flavor text based on the manager's performance.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FeedbackInputSchema = z.object({
  pos: z.number(),
  target: z.number(),
  board: z.number(),
  fans: z.number(),
  squad: z.number(),
  mode: z.string(),
});

export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

const FeedbackOutputSchema = z.object({
  board: z.string(),
  fans: z.string(),
  squad: z.string(),
});

export type FeedbackOutput = z.infer<typeof FeedbackOutputSchema>;

const seasonFeedbackPrompt = ai.definePrompt({
  name: 'seasonFeedbackPrompt',
  model: 'gemini-1.5-flash',
  input: { schema: FeedbackInputSchema },
  output: { schema: FeedbackOutputSchema },
  prompt: `You are a football club's press officer. Provide three punchy, one-sentence feedback snippets after the season ends.
  
  MANAGER PERFORMANCE REPORT:
  Final Position: {{{pos}}} (Target: Top {{{target}}})
  Board Support: {{board}}
  Fan Support: {{fans}}
  Squad Morale: {{squad}}
  Mode: {{{mode}}}
  
  Provide feedback from:
  1. The Board (Focus on targets and financial stability)
  2. The Fans (Focus on passion, style of play, and results)
  3. The Squad (Focus on leadership and dressing room atmosphere)
  
  Make the feedback context-aware. If they were sacked, make it cold. If they succeeded, make it celebratory.`,
});

export async function getSeasonFeedback(input: FeedbackInput): Promise<FeedbackOutput> {
  try {
    const { output } = await seasonFeedbackPrompt(input);
    if (!output) throw new Error('AI failed to provide feedback');
    return output;
  } catch (error) {
    // Fallback logic
    const isSuccess = input.pos <= input.target;
    return {
      board: isSuccess ? "Mission accomplished. Your contract is being reviewed." : "You failed to meet the target. We have no choice but to terminate your contract.",
      fans: isSuccess ? "We're singing your name in the streets! A legendary campaign." : "Time for a change. We deserve better than this mid-table mediocrity.",
      squad: input.squad > 0.5 ? "The boys are behind you, boss. We'll follow you anywhere." : "The dressing room has been a toxic place lately. Trust has been lost."
    };
  }
}
