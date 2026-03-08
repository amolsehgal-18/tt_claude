
"use client"

import React, { useEffect, useState } from 'react';
import { GameState, CAREER_MODES } from '@/lib/game-logic';
import { SlantedContainer, SlantedButton } from './slanted-elements';
import { Trophy, XCircle, Users, Briefcase, Heart, CloudUpload } from 'lucide-react';
import { getSeasonFeedback, type FeedbackOutput } from '@/ai/flows/season-feedback-flow';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

export const SeasonSummary = ({ state, onRestart }: { state: GameState, onRestart: () => void }) => {
  const [feedback, setFeedback] = useState<FeedbackOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const { firestore } = useFirestore();
  const { user } = useUser();
  
  const config = CAREER_MODES[state.mode];
  const isSuccess = state.currentLeaguePosition <= config.durations[state.durationIndex].target && !state.isSacked;

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const result = await getSeasonFeedback({
          pos: state.currentLeaguePosition,
          target: config.durations[state.durationIndex].target,
          board: state.boardSupport,
          fans: state.fanSupport,
          squad: state.dressingRoom,
          mode: config.name
        });
        setFeedback(result);
      } catch (e) {
        setFeedback({
          board: isSuccess ? "Mission accomplished." : "Targets were missed.",
          fans: isSuccess ? "The fans are happy." : "The fans want more.",
          squad: state.dressingRoom > 0.5 ? "The squad is united." : "The squad is fractured."
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [state, config, isSuccess]);

  const submitToLeaderboard = () => {
    if (!firestore || !user || submitted) return;

    const entryRef = doc(firestore, 'leaderboard', user.uid);
    setDocumentNonBlocking(entryRef, {
      userId: user.uid,
      managerName: state.managerName,
      teamName: state.userTeam,
      totalWins: state.wins,
      bestPoints: state.points,
      timestamp: new Date().toISOString()
    }, { merge: true });

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center gap-6 overflow-y-auto">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          {isSuccess ? (
            <Trophy className="w-16 h-16 text-accent mx-auto animate-bounce" />
          ) : (
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
          )}
          <h1 className="text-4xl font-headline font-bold uppercase tracking-tighter text-white">
            {isSuccess ? "OBJECTIVE MET" : "CONTRACT TERMINATED"}
          </h1>
          <p className="text-white/40 font-headline uppercase text-[10px] tracking-widest font-black">Season Final Report</p>
        </div>

        <SlantedContainer className="space-y-6 border-white/10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[8px] font-headline uppercase opacity-50 font-black">Final Position</div>
              <div className="text-2xl font-headline font-black italic text-accent">{state.currentLeaguePosition}th</div>
            </div>
            <div>
              <div className="text-[8px] font-headline uppercase opacity-50 font-black">Total Points</div>
              <div className="text-2xl font-headline font-black italic text-white">{state.points}</div>
            </div>
            <div>
              <div className="text-[8px] font-headline uppercase opacity-50 font-black">Record</div>
              <div className="text-xs font-headline font-black text-white/80">{state.wins}W - {state.draws}D - {state.losses}L</div>
            </div>
            <div>
              <div className="text-[8px] font-headline uppercase opacity-50 font-black">Mode</div>
              <div className="text-xs font-headline font-black text-white/80">{config.name}</div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <Briefcase className="w-4 h-4 text-primary shrink-0 mt-1" />
                <div className="space-y-1">
                  <div className="text-[8px] font-headline uppercase opacity-40 font-black">Board Room</div>
                  <p className="text-[10px] italic font-medium leading-tight">{loading ? "Analyzing..." : feedback?.board}</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Users className="w-4 h-4 text-destructive shrink-0 mt-1" />
                <div className="space-y-1">
                  <div className="text-[8px] font-headline uppercase opacity-40 font-black">The Stands</div>
                  <p className="text-[10px] italic font-medium leading-tight">{loading ? "Analyzing..." : feedback?.fans}</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Heart className="w-4 h-4 text-accent shrink-0 mt-1" />
                <div className="space-y-1">
                  <div className="text-[8px] font-headline uppercase opacity-40 font-black">Dressing Room</div>
                  <p className="text-[10px] italic font-medium leading-tight">{loading ? "Analyzing..." : feedback?.squad}</p>
                </div>
              </div>
            </div>
          </div>
        </SlantedContainer>

        <div className="flex flex-col gap-3">
          <SlantedButton 
            onClick={submitToLeaderboard}
            disabled={submitted || !user}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4",
              submitted ? "bg-green-500/20 text-green-500 border border-green-500/30" : "bg-primary text-white"
            )}
          >
            <CloudUpload className="w-4 h-4" /> 
            {submitted ? "RANKED ON BOARD" : "POST TO LEADERBOARD"}
          </SlantedButton>
          
          <SlantedButton onClick={onRestart} className="w-full bg-white text-black py-4 font-black">
            START NEW CHAPTER
          </SlantedButton>
        </div>
      </div>
    </div>
  );
};
