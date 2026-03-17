
"use client"

import React, { useState, useEffect } from 'react';
import { GameContainer } from '@/components/game/game-container';
import { loadGameLocally, GameState } from '@/lib/game-logic';
import { SlantedButton } from '@/components/game/slanted-elements';
import { GlobalLeaderboard } from '@/components/game/global-leaderboard';
import { Trophy, Shield, Calendar } from 'lucide-react';
import { useAuth, initiateAnonymousSignIn, FirebaseClientProvider } from '@/firebase';
import { loadReputation, createReputation, getRatingLabel, getRatingColor, BADGE_LABELS } from '@/lib/manager-reputation';
import type { ManagerReputation } from '@/lib/manager-reputation';
import { getWeeklyChallengeConfig } from '@/lib/weekly-challenge';
import type { WeeklyChallengeConfig } from '@/lib/weekly-challenge';

type Screen = 'menu' | 'playing' | 'leaderboard' | 'weekly';

function MainMenuContent() {
  const [screen, setScreen]         = useState<Screen>('menu');
  const [savedGame, setSavedGame]   = useState<GameState | null>(null);
  const [reputation, setReputation] = useState<ManagerReputation | null>(null);
  const [weeklyConfig, setWeeklyConfig] = useState<WeeklyChallengeConfig | null>(null);
  const { auth, user } = useAuth();

  useEffect(() => {
    if (auth && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user]);

  useEffect(() => {
    const saved = loadGameLocally();
    if (saved && !saved.isSacked && !saved.isSeasonEnd) {
      setSavedGame(saved);
    }
    const rep = loadReputation();
    setReputation(rep);
    setWeeklyConfig(getWeeklyChallengeConfig());
  }, []);

  const managerName = savedGame?.managerName ?? reputation?.managerName ?? null;

  if (screen === 'playing') {
    return <GameContainer initialState={savedGame || undefined} />;
  }

  if (screen === 'weekly' && weeklyConfig) {
    return <GameContainer weeklyConfig={weeklyConfig} />;
  }

  if (screen === 'leaderboard') {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-start p-6 pb-[env(safe-area-inset-bottom,1.5rem)] bg-background">
        <div className="w-full max-w-sm">
          <button
            onClick={() => setScreen('menu')}
            className="mb-8 text-accent font-headline uppercase text-xs flex items-center gap-2 hover:opacity-70"
          >
            <Shield className="w-4 h-4" /> Back to Base
          </button>
          <GlobalLeaderboard />
        </div>
      </main>
    );
  }

  // ── Main menu ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center p-6 pb-[env(safe-area-inset-bottom,1.5rem)] bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-sm flex flex-col gap-8 text-center">

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-6xl font-headline font-bold uppercase tracking-tighter text-white">
            TOUCHLINE<br/><span className="text-accent italic">TANTRUM</span>
          </h1>
        </div>

        {/* Reputation card — shown if any career data exists */}
        {reputation && reputation.totalSeasons > 0 && (
          <div className="rounded-xl px-4 py-3 text-left"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[9px] font-headline uppercase tracking-[0.3em] opacity-40">Manager</div>
                <div className="text-[15px] font-headline font-black uppercase text-white leading-tight">
                  {managerName ?? 'Unknown Gaffer'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] font-headline uppercase tracking-[0.3em] opacity-40">Rating</div>
                <div className="text-[20px] font-headline font-black leading-tight"
                  style={{ color: getRatingColor(reputation.rating) }}>
                  {reputation.rating}
                </div>
              </div>
            </div>
            {/* Rating bar */}
            <div className="h-1 w-full rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full"
                style={{ width: `${reputation.rating}%`, background: getRatingColor(reputation.rating), transition: 'width 0.6s' }} />
            </div>
            {/* Stats row */}
            <div className="flex gap-4 text-[9px] font-headline uppercase tracking-[0.2em] opacity-50">
              <span>{reputation.totalSeasons} {reputation.totalSeasons === 1 ? 'season' : 'seasons'}</span>
              <span>·</span>
              <span>{reputation.totalWins}W</span>
              <span>·</span>
              <span>{getRatingLabel(reputation.rating)}</span>
            </div>
            {/* Badges */}
            {reputation.badges.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {reputation.badges.slice(0, 5).map(b => (
                  <span key={b} className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(251,177,60,0.12)', border: '1px solid rgba(251,177,60,0.25)', color: '#FBB13C' }}>
                    {BADGE_LABELS[b]?.icon} {BADGE_LABELS[b]?.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-4">
          {savedGame && (
            <SlantedButton
              onClick={() => setScreen('playing')}
              className="w-full bg-accent text-accent-foreground py-6 text-xl"
            >
              RESUME CAREER
            </SlantedButton>
          )}

          <SlantedButton
            onClick={() => {
              setSavedGame(null);
              setScreen('playing');
            }}
            className="w-full bg-primary text-white py-4 text-lg"
          >
            {savedGame ? "NEW SEASON" : "START CAREER"}
          </SlantedButton>

          {/* Weekly challenge */}
          {weeklyConfig && (
            <button
              onClick={() => setScreen('weekly')}
              className="w-full flex items-center justify-between premium-glass slanted-button px-4 py-3"
              style={{ border: '1px solid rgba(115,210,222,0.25)' }}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: '#73D2DE' }} />
                <div className="text-left">
                  <div className="text-[10px] font-headline font-black uppercase tracking-[2px]" style={{ color: '#73D2DE' }}>
                    Weekly Challenge
                  </div>
                  <div className="text-[8px] font-headline uppercase opacity-50">
                    {weeklyConfig.weekLabel} · {weeklyConfig.teamName}
                  </div>
                </div>
              </div>
              <div className="text-[9px] font-headline font-black uppercase opacity-60">
                Play →
              </div>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setScreen('leaderboard')}
              className="flex items-center justify-center gap-2 premium-glass slanted-button py-3 text-xs uppercase font-headline"
            >
              <Trophy className="w-4 h-4 text-accent" /> Rankings
            </button>
            <button className="flex items-center justify-center gap-2 premium-glass slanted-button py-3 text-xs uppercase font-headline">
              <Shield className="w-4 h-4 text-blue-400" /> Help
            </button>
          </div>
        </div>

        <div className="text-[10px] font-headline uppercase tracking-[0.3em] opacity-30 mt-4">
          Global Engine v2.0 · {user ? "Secure Session Active" : "Initializing..."}
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
