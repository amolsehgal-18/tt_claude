
"use client"

import React, { useState, useEffect } from 'react';
import { GameContainer } from '@/components/game/game-container';
import { loadGameLocally, loadWeeklySave, GameState, WEEKLY_CHALLENGE_STATE } from '@/lib/game-logic';
import { SlantedButton } from '@/components/game/slanted-elements';
import { GlobalLeaderboard } from '@/components/game/global-leaderboard';
import { WeeklyChallengeScreen } from '@/components/game/weekly-challenge';
import { Trophy, Zap, Info, Shield } from 'lucide-react';
import { useAuth, initiateAnonymousSignIn, FirebaseClientProvider } from '@/firebase';

// ── Cinematic intro screen ────────────────────────────────────────────────────
function IntroScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 400);
    const t2 = setTimeout(() => setPhase('exit'), 2800);
    const t3 = setTimeout(onDone, 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop') center/cover no-repeat",
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.6s ease-in-out',
      }}
      onClick={onDone}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.78)' }} />

      {/* Animated grain texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundSize: '128px 128px' }} />

      <div
        className="relative z-10 text-center space-y-4 px-8"
        style={{
          transform: phase === 'enter' ? 'translateY(24px)' : phase === 'exit' ? 'translateY(-12px)' : 'translateY(0)',
          opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
          transition: 'transform 0.7s cubic-bezier(.22,1,.36,1), opacity 0.6s ease',
        }}
      >
        {/* Top pip */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-px w-12" style={{ background: 'rgba(251,177,60,0.4)' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#FBB13C' }} />
          <div className="h-px w-12" style={{ background: 'rgba(251,177,60,0.4)' }} />
        </div>

        {/* Game title */}
        <div className="space-y-0">
          <h1 className="font-headline font-black uppercase leading-none text-white"
            style={{ fontSize: 'clamp(42px, 12vw, 68px)', letterSpacing: '-2px' }}>
            TOUCHLINE
          </h1>
          <h1 className="font-headline font-black uppercase leading-none italic"
            style={{ fontSize: 'clamp(42px, 12vw, 68px)', letterSpacing: '-2px', color: '#FBB13C' }}>
            TANTRUM
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-[11px] font-headline uppercase tracking-[0.45em] font-black"
          style={{ color: 'rgba(255,255,255,0.38)' }}>
          Every decision has consequences
        </p>

        {/* Bottom pip */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="h-px w-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <span className="text-[8px] font-code uppercase tracking-[3px]"
            style={{ color: 'rgba(255,255,255,0.22)' }}>Tap to continue</span>
          <div className="h-px w-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>
      </div>

      {/* Bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
    </div>
  );
}

// ── Main menu ─────────────────────────────────────────────────────────────────
function MainMenuContent() {
  const [isPlaying, setIsPlaying]           = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showWeekly, setShowWeekly]         = useState(false);
  const [weeklyState, setWeeklyState]       = useState<GameState | null>(null);
  const [savedGame, setSavedGame]           = useState<GameState | null>(null);
  const [showIntro, setShowIntro]           = useState(false);
  const { auth, user } = useAuth();

  useEffect(() => {
    if (auth && !user) initiateAnonymousSignIn(auth);
  }, [auth, user]);

  useEffect(() => {
    const saved = loadGameLocally();
    if (saved && !saved.isSacked) setSavedGame(saved);

    // Show intro only on first session visit
    const seen = sessionStorage.getItem('tt_intro_seen');
    if (!seen) setShowIntro(true);
  }, []);

  const handleIntroDone = () => {
    setShowIntro(false);
    sessionStorage.setItem('tt_intro_seen', '1');
  };

  // Resume in-progress weekly game
  const savedWeekly = typeof window !== 'undefined' ? loadWeeklySave() : null;

  if (isPlaying) return <GameContainer initialState={savedGame || undefined} />;
  if (weeklyState) return <GameContainer initialState={weeklyState} />;

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
    <>
      {showIntro && <IntroScreen onDone={handleIntroDone} />}

      <main className="min-h-dvh flex flex-col items-center justify-center p-6 pb-[env(safe-area-inset-bottom,1.5rem)] bg-[url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <div className="relative z-10 w-full max-w-sm flex flex-col gap-12 text-center">
          <div className="space-y-2">
            <h1 className="text-6xl font-headline font-bold uppercase tracking-tighter text-white">
              TOUCHLINE<br /><span className="text-accent italic">TANTRUM</span>
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

            {/* Weekly Challenge */}
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
    </>
  );
}

export default function Home() {
  return (
    <FirebaseClientProvider>
      <MainMenuContent />
    </FirebaseClientProvider>
  );
}
