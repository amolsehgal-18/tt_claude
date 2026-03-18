
"use client"

import React, { useState, useEffect } from 'react';
import { GameContainer } from '@/components/game/game-container';
import { loadGameLocally, loadWeeklySave, GameState, WEEKLY_CHALLENGE_STATE } from '@/lib/game-logic';
import { SlantedButton } from '@/components/game/slanted-elements';
import { GlobalLeaderboard } from '@/components/game/global-leaderboard';
import { WeeklyChallengeScreen } from '@/components/game/weekly-challenge';
import { Trophy, Zap, Info, Shield } from 'lucide-react';
import { useAuth, initiateAnonymousSignIn, FirebaseClientProvider } from '@/firebase';

function MainMenuContent() {
  const [isPlaying, setIsPlaying]           = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWeekly, setShowWeekly]         = useState(false);
  const [weeklyState, setWeeklyState]       = useState<GameState | null>(null);
  const [savedGame, setSavedGame]           = useState<GameState | null>(null);
  const { auth, user } = useAuth();

  useEffect(() => {
    if (auth && !user) initiateAnonymousSignIn(auth);
  }, [auth, user]);

  useEffect(() => {
    const saved = loadGameLocally();
    if (saved && !saved.isSacked) setSavedGame(saved);
  }, []);

  // Resume in-progress weekly game
  const savedWeekly = typeof window !== 'undefined' ? loadWeeklySave() : null;

  if (isPlaying) {
    return <GameContainer initialState={savedGame || undefined} />;
  }

  if (weeklyState) {
    return <GameContainer initialState={weeklyState} />;
  }

  if (showLeaderboard) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-start p-6 pb-[env(safe-area-inset-bottom,1.5rem)] bg-background">
        <div className="w-full max-w-sm">
          <button onClick={() => setShowLeaderboard(false)}
            className="mb-8 text-accent font-headline uppercase text-xs flex items-center gap-2 hover:opacity-70">
            <Shield className="w-4 h-4" /> Back to Base
          </button>
          <GlobalLeaderboard />
        </div>
      </main>
    );
  }

  if (showWeekly) {
    return (
      <WeeklyChallengeScreen
        onStart={(name, team) => {
          const ws = savedWeekly ?? WEEKLY_CHALLENGE_STATE(name, team);
          setWeeklyState(ws);
          setShowWeekly(false);
        }}
        onBack={() => setShowWeekly(false)}
      />
    );
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 pb-[env(safe-area-inset-bottom,1.5rem)] bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-12 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-headline font-bold uppercase tracking-tighter text-white">
            TOUCHLINE<br/><span className="text-accent italic">TANTRUM</span>
          </h1>
        </div>

        <div className="flex flex-col gap-4">
          {savedGame && (
            <SlantedButton onClick={() => setIsPlaying(true)}
              className="w-full bg-accent text-accent-foreground py-6 text-xl">
              RESUME CAREER
            </SlantedButton>
          )}

          <SlantedButton
            onClick={() => { setSavedGame(null); setIsPlaying(true); }}
            className="w-full bg-primary text-white py-4 text-lg">
            {savedGame ? "NEW SEASON" : "START CAREER"}
          </SlantedButton>

          {/* Weekly Challenge — full-width amber CTA */}
          <button onClick={() => setShowWeekly(true)}
            className="w-full py-3 rounded font-headline font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(251,177,60,0.12)', border: '1px solid rgba(251,177,60,0.30)', color: '#FBB13C' }}>
            <Zap className="w-4 h-4" />
            {savedWeekly ? 'Resume Weekly Challenge' : 'Weekly Challenge'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setShowLeaderboard(true)}
              className="flex items-center justify-center gap-2 premium-glass slanted-button py-3 text-xs uppercase font-headline">
              <Trophy className="w-4 h-4 text-accent" /> Rankings
            </button>
            <button className="flex items-center justify-center gap-2 premium-glass slanted-button py-3 text-xs uppercase font-headline">
              <Info className="w-4 h-4 text-blue-400" /> Help
            </button>
          </div>
        </div>

        <div className="text-[10px] font-headline uppercase tracking-[0.3em] opacity-30 mt-8">
          Global Engine v2.0 • {user ? "Secure Session Active" : "Initializing..."}
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <FirebaseClientProvider>
      <MainMenuContent />
    </FirebaseClientProvider>
  );
}
