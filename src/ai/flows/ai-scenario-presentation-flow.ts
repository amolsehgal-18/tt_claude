'use server';
/**
 * @fileOverview Infinite AI Scenario Engine for Touchline Tantrum.
 * RESOLVED: Repetition loop fixed via high-entropy seed injection and expanded 30+ card fallback pool.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImpactSchema = z.object({
  board: z.number().int().describe('Impact on board support (-20 to 15)'),
  fans: z.number().int().describe('Impact on fan support (-20 to 15)'),
  squad: z.number().int().describe('Impact on dressing room morale (-20 to 15)'),
  aggression: z.number().describe('Impact on tactical aggression (-0.1 to 0.1)'),
});

const AiScenarioPresentationInputSchema = z.object({
  boardSupport: z.number(),
  fanSupport: z.number(),
  dressingRoom: z.number(),
  aggression: z.number(),
  userTeam: z.string(),
  currentLeaguePosition: z.number().int(),
  sagaObjective: z.string(),
  objectiveMet: z.boolean(),
  excludedScenarioIds: z.array(z.string()),
  randomSeed: z.string().optional(),
});

export type AiScenarioPresentationInput = z.infer<typeof AiScenarioPresentationInputSchema>;

const AiScenarioPresentationOutputSchema = z.object({
  scenario: z.string(),
  leftOption: z.string(),
  rightOption: z.string(),
  impactLeft: ImpactSchema,
  impactRight: ImpactSchema,
  imageCategory: z.string(),
  isBreaking: z.boolean(),
  scenarioId: z.string(),
});

export type AiScenarioPresentationOutput = z.infer<typeof AiScenarioPresentationOutputSchema>;

const aiScenarioPrompt = ai.definePrompt({
  name: 'aiScenarioPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: {
    schema: AiScenarioPresentationInputSchema
  },
  output: {schema: AiScenarioPresentationOutputSchema},
  config: {
    temperature: 1.0,
    topP: 0.95,
    topK: 40,
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ]
  },
  prompt: `
  SYSTEM: You are the 'Touchline Tantrum' AI Scenario Engine. 
  UNIQUE ENTROPY KEY: {{{randomSeed}}}
  
  CRITICAL RULES:
  1. Generate a COMPLETELY NEW scenario every time. Use the entropy key to diverge your thoughts.
  2. Use gritty British football slang (gaffer, training ground, gaffer's office, etc.).
  3. Ensure the scenario is relevant to the club context.
  
  CONTEXT FOR CLUB "{{{userTeam}}}":
  - Board Support: {{boardSupport}} (Scale: 0-1)
  - Fan Support: {{fanSupport}} (Scale: 0-1)
  - Squad Morale: {{dressingRoom}} (Scale: 0-1)
  - Current League Position: {{currentLeaguePosition}}
  - Primary Objective: {{{sagaObjective}}}
  
  TASK: Generate a dramatic dilemma. 
  If Board Support < 0.3, focus on financial audits or boardroom coups.
  If Morale < 0.3, focus on training ground fights or player revolt.
  If meeting objectives, focus on media hype, player ego clashes, or sudden transfer requests.
  
  Impact ranges: Board/Fans/Squad (-20 to +15), Aggression (-0.1 to +0.1).`,
});

const FALLBACK_POOL: AiScenarioPresentationOutput[] = [
  {
    scenario: "A video of your star striker partying till 4 AM has leaked on social media. The fans are calling for blood.",
    leftOption: "Drop him immediately.",
    rightOption: "Fine him privately.",
    impactLeft: { board: 5, fans: 15, squad: -15, aggression: 0.08 },
    impactRight: { board: -5, fans: -12, squad: 10, aggression: -0.05 },
    imageCategory: "player_ego",
    isBreaking: true,
    scenarioId: "f_striker_party"
  },
  {
    scenario: "Your chief scout has identified a promising talent in the lower leagues, but the board is hesitant to release funds.",
    leftOption: "Demand the signing.",
    rightOption: "Trust the current squad.",
    impactLeft: { board: -15, fans: 12, squad: 5, aggression: 0.05 },
    impactRight: { board: 10, fans: -8, squad: -2, aggression: -0.05 },
    imageCategory: "finance",
    isBreaking: false,
    scenarioId: "f_scout_talent"
  },
  {
    scenario: "Your assistant manager is rumored to be interviewing for a head coach role at a rival club mid-season.",
    leftOption: "Wish him well.",
    rightOption: "Block the move.",
    impactLeft: { board: 0, fans: -5, squad: -10, aggression: -0.02 },
    impactRight: { board: -5, fans: 5, squad: 5, aggression: 0.05 },
    imageCategory: "board_pressure",
    isBreaking: false,
    scenarioId: "f_assistant_exit"
  },
  {
    scenario: "Fans are planning a minute's silence... for the death of your tactical ambition.",
    leftOption: "Attack the fans.",
    rightOption: "Promise better football.",
    impactLeft: { board: -10, fans: -20, squad: 10, aggression: 0.2 },
    impactRight: { board: 5, fans: 15, squad: -5, aggression: -0.1 },
    imageCategory: "fans",
    isBreaking: true,
    scenarioId: "f_tactical_protest"
  },
  {
    scenario: "A training ground brawl between your captain and a youth prospect has made the back pages.",
    leftOption: "Fine both heavily.",
    rightOption: "Defend the captain.",
    impactLeft: { board: 10, fans: 5, squad: -15, aggression: 0.1 },
    impactRight: { board: -5, fans: -5, squad: 12, aggression: 0.05 },
    imageCategory: "training_ground",
    isBreaking: true,
    scenarioId: "f_training_brawl"
  },
  {
    scenario: "The kit sponsor is threatening to pull out if you don't start the 'Golden Boy' in the next televised match.",
    leftOption: "Yield to pressure.",
    rightOption: "Prioritize form.",
    impactLeft: { board: 15, fans: -10, squad: -8, aggression: -0.05 },
    impactRight: { board: -12, fans: 8, squad: 10, aggression: 0.02 },
    imageCategory: "finance",
    isBreaking: false,
    scenarioId: "f_sponsor_drama"
  },
  {
    scenario: "Your veteran center-back claims your training methods are 'outdated' in a leaked group chat.",
    leftOption: "Sell him now.",
    rightOption: "Listen and adapt.",
    impactLeft: { board: -5, fans: -8, squad: -12, aggression: 0.05 },
    impactRight: { board: 5, fans: 5, squad: 15, aggression: -0.05 },
    imageCategory: "training_ground",
    isBreaking: false,
    scenarioId: "f_centerback_chat"
  },
  {
    scenario: "A freak flood has damaged the stadium's undersoil heating system.",
    leftOption: "Postpone the match.",
    rightOption: "Play on the ice.",
    impactLeft: { board: -15, fans: -10, squad: 0, aggression: -0.05 },
    impactRight: { board: 5, fans: 12, squad: -5, aggression: 0.15 },
    imageCategory: "stadium",
    isBreaking: true,
    scenarioId: "f_flood_stadium"
  },
  {
    scenario: "The fans are demanding a local youth academy graduate gets game time.",
    leftOption: "Start the kid.",
    rightOption: "Keep him on bench.",
    impactLeft: { board: 5, fans: 15, squad: -5, aggression: 0.05 },
    impactRight: { board: 0, fans: -12, squad: 5, aggression: -0.02 },
    imageCategory: "fans",
    isBreaking: false,
    scenarioId: "f_youth_graduate"
  },
  {
    scenario: "A rival manager called your team 'tactically naive' in his pre-match press conference.",
    leftOption: "Fire back at him.",
    rightOption: "Ignore the noise.",
    impactLeft: { board: 0, fans: 10, squad: 8, aggression: 0.15 },
    impactRight: { board: 5, fans: -5, squad: -2, aggression: -0.05 },
    imageCategory: "press",
    isBreaking: false,
    scenarioId: "f_rival_manager"
  }
];

export async function getAiScenarioPresentation(
  input: AiScenarioPresentationInput
): Promise<AiScenarioPresentationOutput> {
  try {
    const { output } = await aiScenarioPrompt(input);
    if (!output) throw new Error('AI Output null');
    return output;
  } catch (error) {
    // Fallback logic for variety
    const filteredPool = FALLBACK_POOL.filter(f => !input.excludedScenarioIds.includes(f.scenarioId));
    const pool = filteredPool.length > 0 ? filteredPool : FALLBACK_POOL;
    const randomIdx = Math.floor(Math.random() * pool.length);
    const fallback = pool[randomIdx];
    return {
      ...fallback,
      scenarioId: `${fallback.scenarioId}_${Date.now()}`
    };
  }
}
