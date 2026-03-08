
"use client"

import React, { useState, useEffect } from 'react';
import { GameContainer } from '@/components/game/game-container';
import { loadGameLocally, GameState } from '@/lib/game-logic';
import { SlantedButton } from '@/components/game/slanted-elements';
import { GlobalLeaderboard } from '@/components/game/global-leaderboard';
import { Trophy, Play, Info, Users, Shield } from 'lucide-react';
import { useAuth, initiateAnonymousSignIn, FirebaseClientProvider } from '@/firebase';

function MainMenuContent() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [savedGame, setSavedGame] = useState<GameState | null>(null);
  const { auth, user } = useAuth();

  useEffect(() => {
    if (auth && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user]);

  useEffect(() => {
    const saved = loadGameLocally();
    if (saved && !saved.isSacked) {
      setSavedGame(saved);
    }
  }, []);

  if (isPlaying) {
    return <GameContainer initialState={savedGame || undefined} />;
  }

  if (showLeaderboard) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start p-6 bg-background">
        <div className="w-full max-w-sm">
          <button 
            onClick={() => setShowLeaderboard(false)}
            className="mb-8 text-accent font-headline uppercase text-xs flex items-center gap-2 hover:opacity-70"
          >
            <Shield className="w-4 h-4" /> Back to Base
          </button>
          <GlobalLeaderboard />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      <div className="relative z-10 w-full max-w-sm flex flex-col gap-12 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-headline font-bold uppercase tracking-tighter text-white">
            TOUCHLINE<br/><span className="text-accent italic">TANTRUM</span>
          </h1>
          <p className="text-white/60 font-medium tracking-wide">THE TENSION TRIANGLE SIMULATOR</p>
        </div>

        <div className="flex flex-col gap-4">
          {savedGame && (
            <SlantedButton 
              onClick={() => setIsPlaying(true)}
              className="w-full bg-accent text-accent-foreground py-6 text-xl"
            >
              RESUME CAREER
            </SlantedButton>
          )}
          
          <SlantedButton 
            onClick={() => {
              setSavedGame(null);
              setIsPlaying(true);
            }}
            className="w-full bg-primary text-white py-4 text-lg"
          >
            {savedGame ? "NEW SEASON" : "START CAREER"}
          </SlantedButton>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="flex items-center justify-center gap-2 premium-glass slanted-button py-3 text-xs uppercase font-headline"
            >
              <Trophy className="w-4 h-4 text-accent" /> Rankings
            </button>
            <button className="flex items-center justify-center gap-2 premium-glass slanted-button py-3 text-xs uppercase font-headline">
              <Info className="w-4 h-4 text-blue-400" /> Help
            </button>
          </div>
        </div>

        <div className="text-[10px] font-headline uppercase tracking-[0.3em] opacity-30 mt-8">
          Global Engine v1.5 • {user ? "Secure Session Active" : "Initializing..."}
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
