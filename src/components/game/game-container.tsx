"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, INITIAL_STATE, calculateMood, saveGameLocally, getLeagueTable, CAREER_MODES, CareerMode, calculateMatchResult } from '@/lib/game-logic';
import { SlantedButton } from './slanted-elements';
import { ManagerMoodView } from './manager-mood';
import { MatchRadar } from './match-radar';
import { TensionArcs } from './tension-arcs';
import { SwipeCard } from './swipe-card';
import { SeasonSummary } from './season-summary';
import { getLocalScenario } from '@/lib/scenario-engine';
import type { LocalScenario } from '@/lib/scenario-engine';
import {
  createInitialProfile,
  applySwipe,
  deriveArchetype,
  profileToFirestore,
} from '@/lib/psychProfile';
import type { PsychProfile, Archetype } from '@/lib/psychProfile';
import { AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { PressConferenceCard, getRandomPressQuestion } from './press-conference-card';
import type { PressConferenceResult } from './press-conference-card';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export const GameContainer = ({ initialState }: { initialState?: GameState }) => {
  const [state, setState]                   = useState<GameState | null>(initialState || null);
  const [currentScenario, setCurrentScenario] = useState<LocalScenario | null>(null);
  const [isSimulating, setIsSimulating]     = useState(false);
  const [matchIntro, setMatchIntro]         = useState(false);
  const [pendingResult, setPendingResult]   = useState<'win' | 'draw' | 'loss' | null>(null);
  const [opponentName, setOpponentName]     = useState<string>("");
  const [error, setError]                   = useState<string | null>(null);
  const [timeLeft, setTimeLeft]             = useState(15);

  // ── PsychProfile ──────────────────────────────────────────────────────────
  const [psychProfile, setPsychProfile]       = useState<PsychProfile>(createInitialProfile());
  const [seasonArchetype, setSeasonArchetype] = useState<Archetype | null>(null);
  const psychSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── AI feature state ──────────────────────────────────────────────────────
  const [matchHotTake, setMatchHotTake]         = useState<string | null>(null);
  const [swipeInsight, setSwipeInsight]         = useState<string | null>(null);
  const [showPressConference, setShowPressConference] = useState(false);
  const [pressQuestion, setPressQuestion]       = useState('');
  const [nextOpponentName, setNextOpponentName] = useState<string>('');

  // ── Setup wizard ──────────────────────────────────────────────────────────
  const [setupStep, setSetupStep]       = useState(0);
  const [setupMode, setSetupMode]       = useState<CareerMode>('season');
  const [setupDuration, setSetupDuration] = useState(0);
  const [setupName, setSetupName]       = useState("Gaffer");
  const [setupTeam, setSetupTeam]       = useState("United FC");

  const isFetchingRef = useRef(false);

  const { firestore } = useFirestore();
  const { user }      = useUser();

  // ── Live news ticker ──────────────────────────────────────────────────────
  const DEFAULT_NEWS = [
    "BOMBSHELL: Guardiola considered walking out on Man City mid-season over transfer betrayal",
    "EXCLUSIVE: Slot handed £200m war chest after secret FSG emergency summit — sources",
    "MELTDOWN: Arteta confronts Arsenal board in furious 90-minute showdown over squad",
    "SHOCK: Tuchel demands two England starters sold immediately or threatens to quit",
    "CRISIS: Simeone told by Atletico board his contract WON'T be renewed past 2027",
    "FURIOUS: Postecoglou storms out of Spurs training after player refuses to play position",
    "EXCLUSIVE: Conte secretly interviewed for Premier League role while still in Naples",
    "CHAOS: Mourinho texts Real Madrid players directly despite being out of work",
    "BREAKING: Flick reveals Barcelona dressing room split into two factions over star's role",
    "ULTIMATUM: Ancelotti gives Real Madrid 48 hours to sign striker or he walks in January",
    "HOT MIC: Amorim caught on camera ranting at Man United board after training session",
    "STANDOFF: Gasperini locks himself in office as Atalanta crisis deepens — reports",
    "EXCLUSIVE: Nagelsmann turned down £15m PSG deal to remain with Germany national side",
    "REVEALED: Kompany privately threatened to resign if Bayern miss Bundesliga title",
  ];
  const [newsItems, setNewsItems] = useState<string[]>(DEFAULT_NEWS);

  // Fetch contextual news when a game session starts (once per game ID)
  useEffect(() => {
    if (!state) return;
    fetch('/api/news', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        boardSupport:  state.boardSupport,
        fanSupport:    state.fanSupport,
        dressingRoom:  state.dressingRoom,
        mode:          state.mode,
        position:      state.currentLeaguePosition,
        wins:          state.wins,
        losses:        state.losses,
        matchesPlayed: state.matchesPlayed,
      }),
    })
      .then(r => r.json())
      .then(({ items }: { items: string[] }) => { if (items?.length >= 3) setNewsItems(items); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.id]);

  const activeConfig = state ? CAREER_MODES[state.mode].durations[state.durationIndex] : null;

  // ── Debounced Firestore psych save ────────────────────────────────────────
  const savePsychToFirestore = useCallback((profile: PsychProfile, gameId: string) => {
    if (!firestore || !user) return;
    if (psychSaveTimerRef.current) clearTimeout(psychSaveTimerRef.current);
    psychSaveTimerRef.current = setTimeout(() => {
      const ref = doc(firestore, 'sessions', `${user.uid}_${gameId}`);
      setDocumentNonBlocking(ref, { psychProfile: profileToFirestore(profile) }, { merge: true } as Parameters<typeof setDocumentNonBlocking>[2]);
    }, 500);
  }, [firestore, user]);

  // ── Handle swipe decision ─────────────────────────────────────────────────
  const handleDecision = useCallback((side: 'left' | 'right') => {
    if (!currentScenario || !state) return;

    const impact      = side === 'left' ? currentScenario.impactLeft : currentScenario.impactRight;
    const newCardsSeen = state.cardsSeen + 1;

    const newState: GameState = {
      ...state,
      boardSupport: Math.min(1, Math.max(0, state.boardSupport + (impact.board / 100))),
      fanSupport:   Math.min(1, Math.max(0, state.fanSupport   + (impact.fans  / 100))),
      dressingRoom: Math.min(1, Math.max(0, state.dressingRoom + (impact.squad / 100))),
      cardsSeen: newCardsSeen,
      history:   [...state.history, currentScenario.scenarioId],
    };

    if (newState.boardSupport <= 0.05 || newState.fanSupport <= 0.05) {
      newState.isSacked = true;
    }

    // ── PsychProfile update ───────────────────────────────────────────────
    const psychDelta     = currentScenario.psych[side];
    const updatedProfile = applySwipe(psychProfile, psychDelta);
    setPsychProfile(updatedProfile);
    savePsychToFirestore(updatedProfile, state.id);

    setState(newState);
    saveGameLocally(newState);
    setCurrentScenario(null);
    setTimeLeft(15);

    // ── Fire non-blocking swipe insight ──────────────────────────────────
    setSwipeInsight(null);
    const choiceText = side === 'left' ? currentScenario.leftOption : currentScenario.rightOption;
    fetch('/api/explain', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenarioText: currentScenario.scenario,
        choiceText,
        impact: { board: impact.board, fans: impact.fans, squad: impact.squad },
      }),
    })
      .then(r => r.json())
      .then(({ insight }: { insight: string }) => setSwipeInsight(insight))
      .catch(() => {});

    if (newCardsSeen > 0 && newCardsSeen % 3 === 0) {
      const table             = getLeagueTable(newState);
      const possibleOpponents = table.filter(t => !t.isUser);
      const opp               = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)].team;
      setOpponentName(opp);
      // Pre-pick next fixture opponent for the result card
      const otherOpps = possibleOpponents.filter(t => t.team !== opp);
      setNextOpponentName(otherOpps.length ? otherOpps[Math.floor(Math.random() * otherOpps.length)].team : opp);
      const matchResult = calculateMatchResult(newState);
      setPendingResult(matchResult);
      setMatchHotTake(null);
      setMatchIntro(true);
      setTimeout(() => { setMatchIntro(false); setIsSimulating(true); }, 2000);

      // ── Fire hot take fetch (should resolve before ~5.4s simulation ends) ──
      fetch('/api/match-take', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: matchResult, userTeam: state.userTeam, opponentTeam: opp }),
      })
        .then(r => r.json())
        .then(({ take }: { take: string }) => setMatchHotTake(take))
        .catch(() => {});
    }
  }, [currentScenario, state, psychProfile, savePsychToFirestore]);

  // ── Press conference complete ─────────────────────────────────────────────
  const handlePressConferenceComplete = useCallback((result: PressConferenceResult) => {
    if (!state) return;
    const newCardsSeen = state.cardsSeen + 1;
    const newState: GameState = {
      ...state,
      boardSupport: Math.min(1, Math.max(0, state.boardSupport + result.impacts.board / 100)),
      fanSupport:   Math.min(1, Math.max(0, state.fanSupport   + result.impacts.fans  / 100)),
      dressingRoom: Math.min(1, Math.max(0, state.dressingRoom + result.impacts.squad / 100)),
      cardsSeen: newCardsSeen,
    };
    if (newState.boardSupport <= 0.05 || newState.fanSupport <= 0.05) {
      newState.isSacked = true;
    }

    // Apply psych delta (non-visible axes only; board/fans/squad handled via game state)
    const delta = {
      board: 0, fans: 0, squad: 0,
      TF: result.psychDelta.TF,
      D:  result.psychDelta.D,
      MP: result.psychDelta.MP,
      MM: result.psychDelta.MM,
      TT: result.psychDelta.TT,
    };
    const updatedProfile = applySwipe(psychProfile, delta);
    setPsychProfile(updatedProfile);
    savePsychToFirestore(updatedProfile, state.id);

    setState(newState);
    saveGameLocally(newState);
    setShowPressConference(false);

    // Check match trigger
    if (newCardsSeen % 3 === 0) {
      const table             = getLeagueTable(newState);
      const possibleOpponents = table.filter(t => !t.isUser);
      const opp               = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)].team;
      setOpponentName(opp);
      const otherOpps2 = possibleOpponents.filter(t => t.team !== opp);
      setNextOpponentName(otherOpps2.length ? otherOpps2[Math.floor(Math.random() * otherOpps2.length)].team : opp);
      const matchResult = calculateMatchResult(newState);
      setPendingResult(matchResult);
      setMatchHotTake(null);
      setMatchIntro(true);
      setTimeout(() => { setMatchIntro(false); setIsSimulating(true); }, 2000);
      fetch('/api/match-take', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: matchResult, userTeam: state.userTeam, opponentTeam: opp }),
      })
        .then(r => r.json())
        .then(({ take }: { take: string }) => setMatchHotTake(take))
        .catch(() => {});
    }
  }, [state, psychProfile, savePsychToFirestore]);

  // ── Auto-timer (15 s per card) ────────────────────────────────────────────
  useEffect(() => {
    if (!currentScenario || showPressConference || isSimulating || matchIntro || error || state?.isSacked || state?.isSeasonEnd) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleDecision('left'); return 15; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentScenario, showPressConference, isSimulating, matchIntro, error, state?.isSacked, state?.isSeasonEnd, handleDecision]);

  // ── Fetch next scenario (instant, local DB) ───────────────────────────────
  const fetchScenario = useCallback(() => {
    if (!state || state.isSacked || state.isSeasonEnd || isFetchingRef.current || isSimulating || matchIntro) return;
    isFetchingRef.current = true;
    setError(null);
    try {
      const result = getLocalScenario({
        boardSupport:          state.boardSupport,
        fanSupport:            state.fanSupport,
        dressingRoom:          state.dressingRoom,
        aggression:            state.aggression,
        userTeam:              state.userTeam,
        currentLeaguePosition: state.currentLeaguePosition,
        sagaObjective:         CAREER_MODES[state.mode].name,
        objectiveMet:          state.currentLeaguePosition <= activeConfig!.target,
        excludedScenarioIds:   state.history.slice(-50),
      });
      setCurrentScenario(result);
    } catch {
      setError("Scenario load failed. Tap to retry.");
    } finally {
      isFetchingRef.current = false;
    }
  }, [state, activeConfig, isSimulating, matchIntro]);

  useEffect(() => {
    if (state && !currentScenario && !showPressConference && !isSimulating && !matchIntro && !state.isSacked && !state.isSeasonEnd && !error) {
      // Every 9th card (between match cycles) — trigger a press conference
      if (state.cardsSeen > 0 && state.cardsSeen % 9 === 4) {
        setShowPressConference(true);
        setPressQuestion(getRandomPressQuestion());
      } else {
        fetchScenario();
      }
    }
  }, [state, currentScenario, showPressConference, isSimulating, matchIntro, error, fetchScenario]);

  // ── Match complete ────────────────────────────────────────────────────────
  const onMatchComplete = useCallback(() => {
    if (!state || !activeConfig || !pendingResult) return;
    setIsSimulating(false);
    setMatchHotTake(null);
    setNextOpponentName('');
    const result = pendingResult;
    setPendingResult(null);

    const newMatchesPlayed = state.matchesPlayed + 1;
    const ptsEarned        = result === 'win' ? 3 : result === 'draw' ? 1 : 0;
    const newState: GameState = {
      ...state,
      matchesPlayed: newMatchesPlayed,
      wins:          result === 'win'  ? state.wins  + 1 : state.wins,
      draws:         result === 'draw' ? state.draws + 1 : state.draws,
      losses:        result === 'loss' ? state.losses + 1 : state.losses,
      points:        state.points + ptsEarned,
      isSeasonEnd:   newMatchesPlayed >= activeConfig.matches,
    };

    const table = getLeagueTable(newState);
    newState.currentLeaguePosition = table.find(t => t.isUser)?.pos || state.currentLeaguePosition;
    if (newState.isSeasonEnd && newState.currentLeaguePosition > activeConfig.target) {
      newState.isSacked = true;
    }

    setState(newState);
    saveGameLocally(newState);

    // ── Full psych save on match complete ─────────────────────────────────
    savePsychToFirestore(psychProfile, state.id);

    // ── Derive archetype at season end ────────────────────────────────────
    if (newState.isSeasonEnd) {
      const arch = deriveArchetype(psychProfile);
      setSeasonArchetype(arch);
      if (firestore && user) {
        const ref = doc(firestore, 'sessions', `${user.uid}_${state.id}`);
        setDocumentNonBlocking(ref, {
          psychProfile: profileToFirestore(psychProfile),
          archetype:    arch,
          finalState: {
            wins: newState.wins, draws: newState.draws, losses: newState.losses,
            points: newState.points, position: newState.currentLeaguePosition,
          },
          completedAt: new Date().toISOString(),
        }, { merge: true } as Parameters<typeof setDocumentNonBlocking>[2]);
      }
    }
  }, [state, activeConfig, pendingResult, psychProfile, savePsychToFirestore, firestore, user]);

  // ── League table windowing ────────────────────────────────────────────────
  const windowedLeagueTable = useMemo(() => {
    if (!state) return [];
    const fullTable  = getLeagueTable(state);
    const userIndex  = fullTable.findIndex(t => t.isUser);
    let start = Math.max(0, userIndex - 1);
    let end   = start + 3;
    if (end > fullTable.length) { end = fullTable.length; start = Math.max(0, end - 3); }
    return fullTable.slice(start, end);
  }, [state]);

  // ── Setup screen ──────────────────────────────────────────────────────────
  if (!state) {
    return (
      <div className="flex flex-col h-dvh max-md:max-w-md md:max-w-md mx-auto bg-background p-6 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 100%, rgba(251,177,60,0.08) 0%, transparent 70%)' }} />

        {setupStep === 0 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center z-50">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-black uppercase italic" style={{ color: '#FBB13C' }}>Gaffer Protocol</h1>
              <p className="text-[9px] font-headline uppercase tracking-[0.4em] opacity-40 font-black">Initialization Stage 01</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-headline uppercase font-black opacity-50 tracking-widest px-1">Manager Name</label>
                <Input value={setupName} onChange={(e) => setSetupName(e.target.value)} className="bg-white/5 h-11 border-white/10 font-bold text-sm" />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-headline uppercase font-black opacity-50 tracking-widest px-1">Club Identity</label>
                <Input value={setupTeam} onChange={(e) => setSetupTeam(e.target.value)} className="bg-white/5 h-11 border-white/10 font-bold text-sm" />
              </div>
              <SlantedButton onClick={() => setSetupStep(1)} className="w-full py-4 bg-white text-black font-black uppercase text-xs tracking-widest mt-2">
                Next: Choose Challenge
              </SlantedButton>
            </div>
          </div>
        )}

        {setupStep === 1 && (
          <div className="w-full space-y-5 animate-in fade-in slide-in-from-right-4 duration-500 z-50">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-headline font-black uppercase italic" style={{ color: '#3b82f6' }}>The Mission</h2>
              <p className="text-[9px] font-headline uppercase tracking-[0.3em] opacity-40 font-black">Stage 02: Objectives</p>
            </div>
            <div className="grid gap-2">
              {(Object.keys(CAREER_MODES) as CareerMode[]).map((mode) => (
                <button key={mode} onClick={() => { setSetupMode(mode); setSetupStep(2); }}
                  className="flex flex-col p-3 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group">
                  <span className="font-headline font-black uppercase text-xs group-hover:text-accent">{CAREER_MODES[mode].name}</span>
                  <span className="text-[9px] opacity-60 mt-0.5 leading-tight">{CAREER_MODES[mode].description}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setSetupStep(0)} className="text-[9px] font-headline uppercase opacity-40 mx-auto block hover:opacity-100 font-black tracking-widest">Back to Identity</button>
          </div>
        )}

        {setupStep === 2 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 z-50">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-headline font-black uppercase italic" style={{ color: '#FBB13C' }}>Final Prep</h2>
              <p className="text-[9px] font-headline uppercase tracking-[0.3em] opacity-40 font-black">Stage 03: Season Length</p>
            </div>
            <div className="grid gap-2">
              {CAREER_MODES[setupMode].durations.map((d, idx) => (
                <button key={idx} onClick={() => setSetupDuration(idx)}
                  className={cn("flex justify-between items-center p-4 rounded border transition-all", setupDuration === idx ? "text-black border-transparent" : "bg-white/5 border-white/10 opacity-60")}
                  style={setupDuration === idx ? { background: '#FBB13C' } : {}}>
                  <span className="font-headline font-black uppercase text-[11px]">{d.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <SlantedButton
                onClick={() => {
                  try {
                    const s = INITIAL_STATE(setupMode, setupDuration, setupName, setupTeam);
                    setState(s);
                    setPsychProfile(createInitialProfile());
                    setSeasonArchetype(null);
                    saveGameLocally(s);
                  } catch(e) { console.error('Sign Contract failed:', e); }
                }}
                className="w-full py-5 text-base font-black tracking-widest uppercase bg-white text-black">
                Sign Contract
              </SlantedButton>
              <button onClick={() => setSetupStep(1)} className="text-[9px] font-headline uppercase opacity-40 mx-auto block font-black tracking-widest">Re-select Objective</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Season end → cinematic psych summary ─────────────────────────────────
  if (state.isSeasonEnd || state.isSacked) {
    const arch = seasonArchetype ?? deriveArchetype(psychProfile);
    return (
      <SeasonSummary
        state={state}
        psychProfile={psychProfile}
        archetype={arch}
        onRestart={() => {
          setState(null);
          setPsychProfile(createInitialProfile());
          setSeasonArchetype(null);
        }}
      />
    );
  }

  const mood      = calculateMood(state);
  const currentGW = activeConfig ? activeConfig.startGW + state.matchesPlayed : 0;
  const winChance = Math.round((0.30 + state.boardSupport * 0.20 + state.dressingRoom * 0.20) * 100);

  return (
    <div className="flex flex-col h-dvh max-md:max-w-md md:max-w-md mx-auto relative overflow-hidden bg-background shadow-2xl border-x border-white/5">

      {/* ── Header band ── */}
      <div
        className="mx-3 mt-1 mb-1 flex items-center justify-between z-[100]"
        style={{
          paddingTop: 'max(6px, env(safe-area-inset-top))',
          background: 'linear-gradient(135deg, rgba(251,177,60,0.13) 0%, rgba(251,177,60,0.04) 60%, transparent 100%)',
          border: '1px solid rgba(251,177,60,0.22)',
          borderLeft: '3px solid #FBB13C',
          borderRadius: '4px 10px 10px 4px',
          clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 0 100%)',
        }}
      >
        <div className="py-1.5 pl-3 pr-2 min-w-0">
          <div className="text-[8px] font-headline font-black uppercase tracking-[3px] mb-0.5" style={{ color: '#FBB13C' }}>
            {CAREER_MODES[state.mode].name}
          </div>
          <div className="text-[17px] font-headline font-black uppercase leading-none text-white truncate">
            {state.userTeam}
          </div>
          <div className="font-code text-[7px] text-white mt-0.5" style={{ letterSpacing: '1px' }}>
            W{state.wins} D{state.draws} L{state.losses}
          </div>
        </div>
        <div className="py-1.5 pl-3 pr-5 text-center flex-shrink-0">
          <div className="font-code text-[7px] uppercase tracking-[2px] text-white">Game Week</div>
          <div className="text-[24px] font-headline font-black leading-none" style={{ color: '#FBB13C', letterSpacing: '-1px' }}>
            {currentGW}
          </div>
        </div>
      </div>

      {/* ── Live standings ── */}
      <div className="mx-3 mb-1 rounded-lg overflow-hidden z-[90]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex justify-between items-center px-3 py-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-1.5 text-[9px] font-headline font-black uppercase tracking-[2.5px]" style={{ color: '#FBB13C' }}>
            <div className="w-1 h-1 rounded-full blink-dot" style={{ background: '#FBB13C' }} />
            Live Standings
          </div>
        </div>
        <div className="grid px-3 text-[7px] font-code uppercase tracking-[2px] border-b" style={{ gridTemplateColumns: '22px 1fr 28px 34px', borderColor: 'rgba(255,255,255,0.07)', color: '#4E5A6E' }}>
          <span/><span/><span className="text-center text-white">G</span><span className="text-right text-white">Pts</span>
        </div>
        {windowedLeagueTable.map((team) => (
          <div key={team.team} className="grid items-center px-3 py-[4px] relative" style={{
            gridTemplateColumns: '22px 1fr 28px 34px',
            borderTop: team.isUser ? '1px solid rgba(115,210,222,0.15)' : '1px solid rgba(255,255,255,0.04)',
            background: team.isUser ? 'linear-gradient(90deg,rgba(115,210,222,0.08) 0%,rgba(115,210,222,0.02) 80%,transparent 100%)' : 'transparent',
          }}>
            {team.isUser && <div className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r" style={{ background: '#73D2DE' }} />}
            <div className="text-[11px] font-headline font-black text-center" style={{ color: team.isUser ? '#73D2DE' : '#5A6878' }}>{team.pos}</div>
            <div className="text-[12px] font-headline font-black uppercase truncate" style={{ color: team.isUser ? '#73D2DE' : '#EDF2FF' }}>{team.team}</div>
            <div className="font-code text-[10px] text-center opacity-50">{team.gp}</div>
            <div className="text-[14px] font-headline font-black text-right" style={{ color: team.isUser ? '#73D2DE' : '#EDF2FF' }}>{team.pts}</div>
          </div>
        ))}
      </div>

      {/* ── Tension triangle + Manager portrait ── */}
      <div className="flex items-center justify-center px-3 pb-0 gap-8 z-10">
        <TensionArcs board={state.boardSupport} fans={state.fanSupport} dressing={state.dressingRoom} />
        <ManagerMoodView mood={mood} />
      </div>

      {/* Thin amber divider */}
      <div className="mx-3 my-1 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(251,177,60,0.12),transparent)' }} />

      {/* ── Scenario area ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-1 relative overflow-hidden z-[80]">
        {matchIntro && (
          <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="space-y-2 text-center">
              <Zap className="w-10 h-10 mx-auto animate-bounce" style={{ color: '#FBB13C' }} />
              <h2 className="text-4xl font-headline font-black uppercase italic text-white tracking-tighter">MATCHDAY</h2>
              <div className="text-[10px] font-headline font-black uppercase tracking-[0.4em]" style={{ color: '#FBB13C' }}>Deploying Tactics</div>
            </div>
          </div>
        )}
        {isSimulating ? (
          <MatchRadar
            userTeam={state.userTeam}
            opponentTeam={opponentName}
            result={pendingResult}
            onComplete={onMatchComplete}
            hotTake={matchHotTake}
            nextOpponent={nextOpponentName}
            nextGW={currentGW + 1}
            winChance={winChance}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center relative gap-2">
            {error ? (
              <div className="text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
                <p className="text-xs uppercase font-headline opacity-60 font-black">{error}</p>
                <SlantedButton onClick={fetchScenario} className="text-[10px] py-2">Retry</SlantedButton>
              </div>
            ) : showPressConference ? (
              <PressConferenceCard
                question={pressQuestion}
                onComplete={handlePressConferenceComplete}
              />
            ) : currentScenario ? (
              <>
                <SwipeCard scenario={currentScenario} onDecision={handleDecision} timeLeft={timeLeft} />
                {/* Swipe insight toast */}
                {swipeInsight && (
                  <div
                    className="w-full max-w-[300px] px-3 py-2 rounded-lg text-center animate-in fade-in slide-in-from-bottom-2 duration-400"
                    style={{ background: 'rgba(251,177,60,0.07)', border: '1px solid rgba(251,177,60,0.15)' }}
                  >
                    <p
                      className="text-[11px] italic leading-snug"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'rgba(255,255,255,0.5)' }}
                    >
                      {swipeInsight}
                    </p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Win % bar ── */}
      {!isSimulating && (
        <div
          className="mx-3 mb-1 flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 flex-shrink-0 z-[90]"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex-shrink-0">
            <div className="font-code text-[7px] uppercase tracking-[2.5px] mb-0.5" style={{ color: '#4E5A6E' }}>Win chance</div>
            <div
              className="text-[24px] font-headline font-black leading-none"
              style={{ color: winChance >= 55 ? '#1E6B3C' : winChance >= 40 ? '#FBB13C' : '#D81159', transition: 'color 0.4s' }}
            >
              {winChance}%
            </div>
          </div>
          <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${winChance}%`,
                transition: 'width 0.5s cubic-bezier(.4,0,.2,1), background 0.4s',
                background: winChance >= 55
                  ? 'linear-gradient(90deg,#1E6B3C,rgba(30,107,60,0.5))'
                  : winChance >= 40
                  ? 'linear-gradient(90deg,#FBB13C,rgba(251,177,60,0.5))'
                  : 'linear-gradient(90deg,#D81159,rgba(216,17,89,0.4))',
              }}
            />
          </div>
          <div className="font-code text-[8px] uppercase tracking-wide text-right flex-shrink-0 leading-snug" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Next<br/>Match
          </div>
        </div>
      )}

      {/* ── Breaking news ticker — amber bg, black text ── */}
      <div
        className="overflow-hidden flex-shrink-0 relative z-[100]"
        style={{
          background: '#FBB13C',
          paddingTop: '9px',
          paddingBottom: 'max(9px, env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* Badge — absolute, sits on top of scroll area */}
        <div
          className="absolute left-0 top-0 bottom-0 z-20 flex items-center px-3 font-grotesk font-bold text-[11px] uppercase text-black whitespace-nowrap"
          style={{ letterSpacing: '2.5px', background: 'rgba(0,0,0,0.18)', borderRight: '2px solid rgba(0,0,0,0.15)' }}
        >
          BREAKING
        </div>
        {/* Masked scroll area — starts after badge to prevent overlap */}
        <div style={{ overflow: 'hidden', marginLeft: '88px' }}>
          <div className="animate-ticker flex items-center">
            {[...newsItems, ...newsItems].map((item, idx) => (
              <React.Fragment key={idx}>
                <span className="font-grotesk font-bold text-black" style={{ fontSize: '11px', letterSpacing: '0.2px', whiteSpace: 'nowrap' }}>{item}</span>
                <span className="inline-block mx-4 flex-shrink-0 font-bold text-black/30" style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '14px' }}>◆</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
