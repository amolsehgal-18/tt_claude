
"use client"

import React, { useState, useEffect } from 'react';
import { GameContainer } from '@/components/game/game-container';
import { loadGameLocally, loadWeeklySave, GameState, WEEKLY_CHALLENGE_STATE, loadManagerProfile, ManagerProfile } from '@/lib/game-logic';
import { SlantedButton } from '@/components/game/slanted-elements';
import { GlobalLeaderboard } from '@/components/game/global-leaderboard';
import { WeeklyChallengeScreen } from '@/components/game/weekly-challenge';
import { Trophy, Zap, Info, Shield } from 'lucide-react';
import { useAuth, initiateAnonymousSignIn, FirebaseClientProvider } from '@/firebase';
import { loadLegacy, legacyWinRate, ordinal } from '@/lib/legacy';
import { loadCareerRating } from '@/lib/career-rating';
import { InstallPrompt } from '@/components/game/install-prompt';

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

// ── Manager Profile Card ──────────────────────────────────────────────────────
function ManagerProfileCard({ profile }: { profile: ManagerProfile }) {
  const legacy   = loadLegacy();
  const cr       = loadCareerRating();
  const winRate  = legacyWinRate(legacy);
  const lastSeason = legacy.history[legacy.history.length - 1];
  const bestFinish = legacy.bestFinish < 20 ? legacy.bestFinish : null;

  const bestFinishColor =
    bestFinish !== null && bestFinish <= 4  ? '#1E6B3C' :
    bestFinish !== null && bestFinish <= 10 ? '#FBB13C' :
    'rgba(255,255,255,0.5)';

  return (
    <div className="w-full rounded-2xl px-4 py-3 space-y-2"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Name row */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ background: profile.kitPrimary ?? '#3b82f6' }} />
        <div className="flex-1 min-w-0">
          <div className="font-headline font-black uppercase text-white text-xl leading-none truncate">
            {profile.name.toUpperCase()}
          </div>
          <div className="font-code text-[10px] text-white/50 uppercase tracking-[2px] mt-0.5 truncate">
            {profile.team}
          </div>
        </div>
        {cr.seasons > 0 && (
          <div className="text-right flex-shrink-0">
            <div className="text-[18px] font-headline font-black leading-none" style={{ color: '#FBB13C' }}>
              {cr.rating}
            </div>
            <div className="font-code text-[7px] uppercase tracking-[1px] text-white/40">Rating</div>
          </div>
        )}
      </div>

      {/* Career rating bar */}
      {cr.seasons > 0 && (
        <div className="h-1 w-full rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${cr.rating}%`, background: '#FBB13C' }} />
        </div>
      )}

      {/* Stats row */}
      {legacy.totalSeasons > 0 && (
        <div className="font-code text-[9px] text-white/50 flex items-center gap-1 flex-wrap">
          <span>W{legacy.totalWins} D{legacy.totalDraws} L{legacy.totalLosses}</span>
          <span className="text-white/20">·</span>
          <span>{winRate}% win rate</span>
        </div>
      )}

      {/* Milestones */}
      {legacy.totalSeasons > 0 && (
        <div className="font-code text-[9px] flex items-center gap-1 flex-wrap">
          <span className="text-white/50">{legacy.totalSeasons} Season{legacy.totalSeasons !== 1 ? 's' : ''}</span>
          {legacy.titles > 0 && (
            <>
              <span className="text-white/20">·</span>
              <span style={{ color: '#FBB13C' }}>{legacy.titles} Title{legacy.titles !== 1 ? 's' : ''}</span>
            </>
          )}
          {bestFinish !== null && (
            <>
              <span className="text-white/20">·</span>
              <span style={{ color: bestFinishColor }}>Best: {ordinal(bestFinish)}</span>
            </>
          )}
        </div>
      )}

      {/* Last archetype */}
      {lastSeason && (
        <div className="font-code text-[9px] text-white/40 flex items-center gap-1">
          <span>Last:</span>
          <span className="text-white/60">{lastSeason.archetype}</span>
          <span>↗ S{lastSeason.season}</span>
        </div>
      )}
    </div>
  );
}

// ── Rival Managers (deterministic per user) ───────────────────────────────────
const RIVAL_NAMES    = ['A. Ferreira','C. Vidal','T. Mwangi','D. Okonkwo','L. Petrov','J. Hartmann','R. Santos','M. Al-Rashid','G. Lannister','S. Bergkamp'];
const RIVAL_CLUBS    = ['Red Storm','The Wanderers','City Elite','Northern FC','Athletic CF','The United','Rovers SC','Galaxy XI','Iron FC','Blue Devils'];
const RIVAL_ARCHETYPE = ['The Tactician','The Maverick','The Politician','The Hairdryer','The Father Figure','The Pragmatist','The Showman'];

function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
  return h;
}

function genRivals(seed: string) {
  const base = hashStr(seed);
  return [0, 1, 2].map(i => {
    const h  = hashStr(seed + i);
    const w  = 10 + (h % 20);
    const d  = 2  + ((h >> 5) % 8);
    const l  = 5  + ((h >> 9) % 12);
    const cr = 40 + ((h >> 3) % 45);
    return {
      name:      RIVAL_NAMES[(base + i * 3)     % RIVAL_NAMES.length],
      club:      RIVAL_CLUBS[(base + i * 7 + 1) % RIVAL_CLUBS.length],
      archetype: RIVAL_ARCHETYPE[(h >> 2)        % RIVAL_ARCHETYPE.length],
      w, d, l, cr,
    };
  });
}

function RivalManagers({ userTeam }: { userTeam: string }) {
  const rivals = genRivals(userTeam);
  return (
    <div className="w-full space-y-1.5">
      <div className="text-[8px] font-code uppercase tracking-[3px] text-white/25 px-1">Rival Managers This Season</div>
      {rivals.map((r, i) => (
        <div key={i} className="flex items-center gap-2.5 rounded-xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-lg flex-shrink-0">🧔</div>
          <div className="flex-1 min-w-0">
            <div className="font-headline font-black uppercase text-white text-[11px] leading-none truncate">{r.name}</div>
            <div className="font-code text-[8px] text-white/35 mt-0.5 truncate">{r.club} · {r.archetype}</div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="font-code text-[9px] text-white/50">W{r.w} D{r.d} L{r.l}</div>
            <div className="font-code text-[8px] mt-0.5" style={{ color: r.cr >= 65 ? '#1E6B3C' : r.cr >= 45 ? '#FBB13C' : '#D81159' }}>
              {r.cr} rating
            </div>
          </div>
        </div>
      ))}
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
  const [managerProfile, setManagerProfile] = useState<ManagerProfile | null>(null);
  const { auth, user } = useAuth();

  useEffect(() => {
    if (auth && !user) initiateAnonymousSignIn(auth);
  }, [auth, user]);

  useEffect(() => {
    const saved = loadGameLocally();
    if (saved && !saved.isSacked) setSavedGame(saved);

    const profile = loadManagerProfile();
    if (profile) setManagerProfile(profile);

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

        <div className="relative z-10 w-full max-w-sm flex flex-col gap-6 text-center">
          <div className="space-y-2">
            <h1 className="text-6xl font-headline font-bold uppercase tracking-tighter text-white">
              TOUCHLINE<br /><span className="text-accent italic">TANTRUM</span>
            </h1>
          </div>

          {/* Manager Profile Card */}
          {managerProfile ? (
            <ManagerProfileCard profile={managerProfile} />
          ) : (
            <div className="text-[10px] font-code text-white/30 uppercase tracking-[2px]">
              No manager profile yet — start a career
            </div>
          )}

          {/* Rival Managers */}
          {managerProfile && (
            <RivalManagers userTeam={managerProfile.team} />
          )}

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

          <div className="text-[10px] font-headline uppercase tracking-[0.3em] opacity-30 mt-4">
            Global Engine v2.0 • {user ? "Secure Session Active" : "Initializing..."}
          </div>
        </div>
      </main>

      <InstallPrompt />
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
