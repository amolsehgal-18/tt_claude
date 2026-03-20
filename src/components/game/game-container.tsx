"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, INITIAL_STATE, calculateMood, saveGameLocally, getLeagueTable, CAREER_MODES, CareerMode, calculateMatchResult, simulateGameweek, computeFlags, getMomentumWinChance, ALL_TEAMS, loadManagerProfile, saveManagerProfile, isNameLocked, nameLockDaysRemaining, ManagerProfile, LastDecision, getMatchVerdict } from '@/lib/game-logic';
import { loadCareerRating, saveCareerRating, applySeasonEnd } from '@/lib/career-rating';
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
import { AlertTriangle, Zap, ArrowRight, VolumeX, Volume2 } from 'lucide-react';
import { getSoundManager } from '@/lib/sound-manager';
import { PressConferenceCard, getRandomPressQuestion } from './press-conference-card';
import type { PressConferenceResult } from './press-conference-card';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

// ── Sync client-side hot-take fallbacks (result-indexed) ─────────────────────
// These are set immediately so the result screen always shows a matching quote,
// even if the API response is slow or comes back stale from a previous match.
const CLIENT_FALLBACKS: Record<'win' | 'draw' | 'loss', string[]> = {
  win:  [
    "Three points. Unconvincing, functional, sufficient.",
    "Ugly but it counts. Three points on the board.",
    "Not pretty. The scoreboard disagreed with the performance.",
  ],
  draw: [
    "A point shared. Nobody celebrating, nobody crying.",
    "Stalemate. Both sides earned their share.",
    "Honours split. The work continues.",
  ],
  loss: [
    "Outclassed and undone. Back to the drawing board.",
    "The scoreline told the truth nobody wanted to hear.",
    "Three points surrendered. The next match arrives too quickly.",
  ],
};

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
  const [showPressConference, setShowPressConference] = useState(false);
  const [pressQuestion, setPressQuestion]       = useState('');
  const [nextOpponentName, setNextOpponentName] = useState<string>('');
  const [matchVerdict, setMatchVerdict]           = useState<string>('');
  const [lastDecisionsForMatch, setLastDecisionsForMatch] = useState<LastDecision[]>([]);
  const lastDecisionsRef = useRef<LastDecision[]>([]);
  const [matchIntroFading, setMatchIntroFading]   = useState(false);

  // ── Setup wizard ──────────────────────────────────────────────────────────
  const [setupStep, setSetupStep]         = useState(0);
  const [setupMode, setSetupMode]         = useState<CareerMode>('season');
  const [setupDuration, setSetupDuration] = useState(0);
  const [setupName, setSetupName]         = useState("Gaffer");
  const [setupTeam, setSetupTeam]         = useState("United FC");
  const [managerProfile, setManagerProfile] = useState<ManagerProfile | null>(null);

  // ── New retention & UX states ────────────────────────────────────────────
  const [sackingPhase, setSackingPhase]   = useState<0 | 1 | 2 | 3 | 4>(0);
  const [psychTeaserText, setPsychTeaserText] = useState<string | null>(null);
  const [muteOn, setMuteOn]               = useState(false);

  const isFetchingRef      = useRef(false);
  const matchGenRef        = useRef(0);
  const recentImpactsRef   = useRef<Array<{ board: number; fans: number; squad: number }>>([]);

  // ── Sacking sequence auto-advance ────────────────────────────────────────
  useEffect(() => {
    if (!state?.isSacked || sackingPhase !== 0) return;
    // Start the sequence
    getSoundManager().playDramaticSting();
    setSackingPhase(1);
    const t1 = setTimeout(() => setSackingPhase(2), 2600);
    const t2 = setTimeout(() => {
      getSoundManager().playCameraFlash();
      setSackingPhase(3);
    }, 5200);
    const t3 = setTimeout(() => setSackingPhase(4), 7800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.isSacked]);

  // ── Load manager profile on mount — skip name step if returning manager ───
  useEffect(() => {
    const profile = loadManagerProfile();
    if (profile) {
      setManagerProfile(profile);
      setSetupName(profile.name);
      setSetupTeam(profile.team);
      if (!initialState) setSetupStep(1); // skip name entry for returning managers
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // ── Sound: card flip ──────────────────────────────────────────────────
    getSoundManager().unlock();
    getSoundManager().playCardFlip();

    const impact      = side === 'left' ? currentScenario.impactLeft : currentScenario.impactRight;
    const newCardsSeen = state.cardsSeen + 1;

    // ── Momentum buffer: track last 3 card net impacts ────────────────────
    const netImpact = (impact.board + impact.fans + impact.squad) / 3;
    const newMomentumBuffer = [...(state.momentumBuffer ?? []), netImpact].slice(-3);

    // ── Consequence flag tracking ─────────────────────────────────────────
    const recentImpacts = [
      ...(recentImpactsRef.current),
      { board: impact.board, fans: impact.fans, squad: impact.squad },
    ].slice(-3);
    recentImpactsRef.current = recentImpacts;

    // Track this decision for match result breakdown
    const newDecision: LastDecision = {
      scenario: currentScenario.scenario,
      chosenOption: side === 'left' ? currentScenario.leftOption : currentScenario.rightOption,
      impact: { board: impact.board, fans: impact.fans, squad: impact.squad },
    };
    lastDecisionsRef.current = [...lastDecisionsRef.current, newDecision].slice(-3);

    // Play distinct impact sound for the stat hit hardest
    const absB = Math.abs(impact.board), absF = Math.abs(impact.fans), absS = Math.abs(impact.squad);
    if (Math.max(absB, absF, absS) > 3) {
      if (absB >= absF && absB >= absS) getSoundManager().playBoardImpact(impact.board > 0);
      else if (absF >= absB && absF >= absS) getSoundManager().playFansImpact(impact.fans > 0);
      else getSoundManager().playSquadImpact(impact.squad > 0);
    }

    const newState: GameState = {
      ...state,
      boardSupport: Math.min(1, Math.max(0, state.boardSupport + (impact.board / 100))),
      fanSupport:   Math.min(1, Math.max(0, state.fanSupport   + (impact.fans  / 100))),
      dressingRoom: Math.min(1, Math.max(0, state.dressingRoom + (impact.squad / 100))),
      cardsSeen: newCardsSeen,
      history:   [...state.history, currentScenario.scenarioId],
      momentumBuffer: newMomentumBuffer,
    };

    newState.flags = computeFlags(newState, recentImpacts);

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

    // ── Psych teaser milestones ────────────────────────────────────────────
    if (newCardsSeen === 6) {
      const trendArch = deriveArchetype(updatedProfile);
      setPsychTeaserText(`Your profile is forming… trending toward ${trendArch}`);
      setTimeout(() => setPsychTeaserText(null), 3500);
    } else if (newCardsSeen === 15) {
      setPsychTeaserText('Your fingerprint is sharpening. Full reveal at season end.');
      setTimeout(() => setPsychTeaserText(null), 3500);
    }

    if (newCardsSeen > 0 && newCardsSeen % 3 === 0) {
      const table             = getLeagueTable(newState);
      const possibleOpponents = table.filter(t => !t.isUser);
      const oppTeam           = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
      const opp               = oppTeam.team;
      const oppPosition       = oppTeam.pos;
      setOpponentName(opp);
      // Pre-pick next fixture opponent for the result card
      const otherOpps = possibleOpponents.filter(t => t.team !== opp);
      setNextOpponentName(otherOpps.length ? otherOpps[Math.floor(Math.random() * otherOpps.length)].team : opp);
      const matchResult = calculateMatchResult(newState, oppPosition);
      setPendingResult(matchResult);
      // ── Immediately set a result-correct fallback (prevents stale-API bleed) ──
      matchGenRef.current += 1;
      const thisGen1 = matchGenRef.current;
      const pool1 = CLIENT_FALLBACKS[matchResult];
      setMatchHotTake(pool1[Math.floor(Math.random() * pool1.length)]);
      // Compute verdict + snapshot decisions for this match
      const verdict = getMatchVerdict(matchResult, newState, lastDecisionsRef.current);
      setMatchVerdict(verdict);
      setLastDecisionsForMatch([...lastDecisionsRef.current]);
      lastDecisionsRef.current = [];

      getSoundManager().playMatchIntro();
      setMatchIntro(true);
      setMatchIntroFading(false);
      setTimeout(() => {
        setMatchIntroFading(true);
        setTimeout(() => { setMatchIntro(false); setMatchIntroFading(false); setIsSimulating(true); }, 350);
      }, 1500);

      // ── Fire hot take fetch — only apply if still the current match ──
      fetch('/api/match-take', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: matchResult, userTeam: state.userTeam, opponentTeam: opp }),
      })
        .then(r => r.json())
        .then(({ take }: { take: string }) => { if (matchGenRef.current === thisGen1) setMatchHotTake(take); })
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
      const oppTeam2          = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
      const opp               = oppTeam2.team;
      const oppPosition2      = oppTeam2.pos;
      setOpponentName(opp);
      const otherOpps2 = possibleOpponents.filter(t => t.team !== opp);
      setNextOpponentName(otherOpps2.length ? otherOpps2[Math.floor(Math.random() * otherOpps2.length)].team : opp);
      const matchResult = calculateMatchResult(newState, oppPosition2);
      setPendingResult(matchResult);
      // ── Immediately set a result-correct fallback (prevents stale-API bleed) ──
      matchGenRef.current += 1;
      const thisGen2 = matchGenRef.current;
      const pool2 = CLIENT_FALLBACKS[matchResult];
      setMatchHotTake(pool2[Math.floor(Math.random() * pool2.length)]);
      const verdictPc = getMatchVerdict(matchResult, newState, lastDecisionsRef.current);
      setMatchVerdict(verdictPc);
      setLastDecisionsForMatch([...lastDecisionsRef.current]);
      lastDecisionsRef.current = [];

      getSoundManager().playMatchIntro();
      setMatchIntro(true);
      setMatchIntroFading(false);
      setTimeout(() => {
        setMatchIntroFading(true);
        setTimeout(() => { setMatchIntro(false); setMatchIntroFading(false); setIsSimulating(true); }, 350);
      }, 1500);
      // ── Fire hot take fetch — only apply if still the current match ──
      fetch('/api/match-take', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: matchResult, userTeam: state.userTeam, opponentTeam: opp }),
      })
        .then(r => r.json())
        .then(({ take }: { take: string }) => { if (matchGenRef.current === thisGen2) setMatchHotTake(take); })
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
        flags:                 state.flags ?? [],
        weeklyMode:            state.isWeeklyChallenge,
        randomSeed:            state.isWeeklyChallenge
          ? `${state.weekKey}-card${state.cardsSeen}`
          : undefined,
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

    // ── Result sounds ─────────────────────────────────────────────────────
    if (result === 'win')       getSoundManager().playCrowdCheer();
    else if (result === 'loss') getSoundManager().playCrowdGroan();
    else                        getSoundManager().playDrawSound();

    const newMatchesPlayed = state.matchesPlayed + 1;
    const ptsEarned        = result === 'win' ? 3 : result === 'draw' ? 1 : 0;

    // ── Simulate other teams' gameweek ────────────────────────────────────
    const nonUserTeams = ALL_TEAMS
      .map(t => t === 'United FC' ? state.userTeam : t)
      .filter(t => t !== state.userTeam);
    const updatedTeamPoints = simulateGameweek(
      state.id,
      newMatchesPlayed,
      state.teamPoints ?? {},
      nonUserTeams,
    );

    const newState: GameState = {
      ...state,
      matchesPlayed: newMatchesPlayed,
      wins:          result === 'win'  ? state.wins  + 1 : state.wins,
      draws:         result === 'draw' ? state.draws + 1 : state.draws,
      losses:        result === 'loss' ? state.losses + 1 : state.losses,
      points:        state.points + ptsEarned,
      isSeasonEnd:   newMatchesPlayed >= activeConfig.matches,
      teamPoints:    updatedTeamPoints,
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

    // ── Derive archetype + career rating + weekly score at season end ────
    if (newState.isSeasonEnd) {
      const arch = deriveArchetype(psychProfile);
      setSeasonArchetype(arch);

      // Career rating (localStorage)
      const prevRating = loadCareerRating();
      const updatedRating = applySeasonEnd(prevRating, {
        objectiveMet: newState.currentLeaguePosition <= activeConfig.target,
        isSacked:     newState.isSacked,
        finalPosition: newState.currentLeaguePosition,
        targetPosition: activeConfig.target,
        wins:           newState.wins,
        matchesPlayed:  newMatchesPlayed,
      });
      saveCareerRating(updatedRating);

      if (firestore && user) {
        // Session save (normal + weekly)
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

        // Weekly challenge leaderboard save
        if (newState.isWeeklyChallenge && newState.weekKey) {
          const weekRef = doc(firestore, 'weekly_challenges', newState.weekKey, 'scores', user.uid);
          setDocumentNonBlocking(weekRef, {
            managerName: newState.managerName,
            points:      newState.points,
            archetype:   arch,
            uid:         user.uid,
            completedAt: new Date().toISOString(),
            position:    newState.currentLeaguePosition,
          }, { merge: false } as Parameters<typeof setDocumentNonBlocking>[2]);
        }
      }
    }
  }, [state, activeConfig, pendingResult, psychProfile, savePsychToFirestore, firestore, user]);

  // ── VAR use ───────────────────────────────────────────────────────────────
  const handleVARUse = useCallback((newResult: 'win' | 'draw') => {
    setPendingResult(newResult);
    setState(prev => prev ? { ...prev, varCardsLeft: Math.max(0, (prev.varCardsLeft ?? 1) - 1) } : prev);
  }, []);

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

        {setupStep === 0 && (() => {
          const locked = isNameLocked(managerProfile);
          const daysLeft = nameLockDaysRemaining(managerProfile);
          return (
            <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center z-50">
              <div className="space-y-1">
                <h1 className="text-3xl font-headline font-black uppercase italic" style={{ color: '#FBB13C' }}>Gaffer Protocol</h1>
                <p className="text-[9px] font-headline uppercase tracking-[0.4em] opacity-40 font-black">Initialization Stage 01</p>
                {(() => {
                  const cr = loadCareerRating();
                  if (cr.seasons === 0) return null;
                  return (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mt-2"
                      style={{ background: 'rgba(251,177,60,0.10)', border: '1px solid rgba(251,177,60,0.20)' }}>
                      <span className="text-[9px] font-code uppercase tracking-[2px]" style={{ color: '#FBB13C' }}>
                        Rating {cr.rating} · {cr.seasons} Season{cr.seasons !== 1 ? 's' : ''}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-headline uppercase font-black opacity-50 tracking-widest">Manager Name</label>
                    {locked && <span className="text-[8px] font-code" style={{ color: '#FBB13C' }}>Locked · {daysLeft}d remaining</span>}
                  </div>
                  <Input
                    value={setupName}
                    onChange={(e) => { if (!locked) setSetupName(e.target.value); }}
                    readOnly={locked}
                    className={cn("bg-white/5 h-11 border-white/10 font-bold text-sm", locked && "opacity-50 cursor-not-allowed")}
                  />
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
          );
        })()}

        {setupStep === 1 && (
          <div className="w-full space-y-5 animate-in fade-in slide-in-from-right-4 duration-500 z-50">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-headline font-black uppercase italic" style={{ color: '#3b82f6' }}>The Mission</h2>
              <p className="text-[9px] font-headline uppercase tracking-[0.3em] opacity-40 font-black">Stage 02: Objectives</p>
              {/* Manager identity chip */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-[10px] font-headline font-black uppercase text-white opacity-60">{setupName} · {setupTeam}</span>
                <button onClick={() => setSetupStep(0)} className="text-[8px] font-code uppercase tracking-wide hover:opacity-100 transition-opacity"
                  style={{ color: '#FBB13C', opacity: 0.7 }}>
                  {isNameLocked(managerProfile) ? `Change (${nameLockDaysRemaining(managerProfile)}d)` : 'Change'}
                </button>
              </div>
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
                  const name = setupName.trim() || 'Gaffer';
                  const team = setupTeam.trim() || 'United FC';
                  // Save manager profile — only update nameChangedAt if name actually changed
                  const prevProfile = managerProfile;
                  const nameActuallyChanged = !prevProfile || prevProfile.name !== name;
                  const newProfile: ManagerProfile = {
                    name,
                    team,
                    nameChangedAt: nameActuallyChanged ? Date.now() : (prevProfile?.nameChangedAt ?? Date.now()),
                  };
                  saveManagerProfile(newProfile);
                  setManagerProfile(newProfile);
                  const s = INITIAL_STATE(setupMode, setupDuration, name, team);
                  setState(s);
                  setPsychProfile(createInitialProfile());
                  setSeasonArchetype(null);
                  saveGameLocally(s);
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

  // ── Sacking cinematic (phases 1-3) ───────────────────────────────────────
  if (state.isSacked && sackingPhase >= 1 && sackingPhase <= 3) {
    const SACKING_STATEMENTS = [
      `${state.userTeam} would like to thank ${state.managerName} for their contribution and wish them well in their next endeavour.`,
      `The board have made the difficult decision to relieve ${state.managerName} of their duties with immediate effect.`,
      `After careful consideration, ${state.userTeam} and ${state.managerName} have agreed to part ways.`,
      `${state.userTeam} can confirm that ${state.managerName} is no longer the club's manager.`,
    ];
    const SACKING_REACTIONS = [
      '"Good riddance tbh" — fan account',
      '"We deserved better than this." — supporter',
      '"Who?" — someone on social media',
      '"Sack the board too." — ultras statement',
      '"It was only a matter of time." — former player',
    ];
    const statement = SACKING_STATEMENTS[Math.floor((state.wins + state.losses) % SACKING_STATEMENTS.length)];
    const reaction  = SACKING_REACTIONS[Math.floor(state.matchesPlayed % SACKING_REACTIONS.length)];

    return (
      <div className="flex flex-col h-dvh max-md:max-w-md md:max-w-md mx-auto items-center justify-center relative overflow-hidden"
        style={{ background: '#07090F' }}>

        {/* Phase 1 — The Call */}
        {sackingPhase === 1 && (
          <div className="text-center space-y-6 px-8 animate-in fade-in duration-500">
            <div className="text-[64px] animate-bounce">📱</div>
            <div className="space-y-2">
              <div className="text-[11px] font-code uppercase tracking-[4px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Incoming call</div>
              <div className="text-2xl font-headline font-black uppercase italic text-white">The Chairman</div>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#D81159', animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Phase 2 — The Statement (with camera flash effect) */}
        {sackingPhase === 2 && (
          <div className="text-center space-y-5 px-6 animate-in fade-in duration-300">
            {/* White flash */}
            <div className="absolute inset-0 pointer-events-none animate-out fade-out duration-600 z-50"
              style={{ background: 'rgba(255,255,255,0.15)' }} />
            <div className="text-[48px]">📋</div>
            <div className="space-y-2">
              <div className="text-[10px] font-code uppercase tracking-[4px] mb-3" style={{ color: '#D81159' }}>
                Official Statement
              </div>
              <div className="text-3xl font-headline font-black uppercase italic" style={{ color: '#D81159', letterSpacing: '-1px' }}>
                SACKED
              </div>
              <p className="text-[12px] italic leading-relaxed"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'rgba(255,255,255,0.5)' }}>
                &ldquo;{statement}&rdquo;
              </p>
            </div>
            <div className="text-[10px] font-code" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {reaction}
            </div>
          </div>
        )}

        {/* Phase 3 — The Walk */}
        {sackingPhase === 3 && (
          <div className="text-center space-y-5 px-6 animate-in fade-in duration-500">
            <div className="text-[48px]">🚗</div>
            <div className="space-y-2">
              <div className="text-[10px] font-code uppercase tracking-[3px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {state.userTeam}
              </div>
              <div className="font-headline font-black text-white uppercase leading-none" style={{ fontSize: '22px' }}>
                W{state.wins} D{state.draws} L{state.losses} · {state.matchesPlayed} matches
              </div>
              <p className="text-[12px] italic mt-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", color: 'rgba(255,255,255,0.35)' }}>
                &ldquo;The car park was quiet. Nobody came to say goodbye.&rdquo;
              </p>
            </div>
            <div className="text-[9px] font-code uppercase tracking-[3px] animate-pulse"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              What your decisions revealed about you →
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Season end → cinematic psych summary ─────────────────────────────────
  if (state.isSeasonEnd || (state.isSacked && sackingPhase >= 4)) {
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
          setSackingPhase(0);
          const profile = loadManagerProfile();
          if (profile) {
            setManagerProfile(profile);
            setSetupName(profile.name);
            setSetupTeam(profile.team);
            setSetupStep(1);
          } else {
            setSetupStep(0);
          }
        }}
      />
    );
  }

  const mood      = calculateMood(state);
  const currentGW = activeConfig ? activeConfig.startGW + state.matchesPlayed : 0;
  // Win chance now reflects momentum + opponent average position
  const winChance = getMomentumWinChance(state, 10);

  return (
    <div className="flex flex-col h-dvh max-md:max-w-md md:max-w-md mx-auto relative overflow-hidden bg-background shadow-2xl border-x border-white/5">

      {/* ── Psych teaser toast ── */}
      {psychTeaserText && (
        <div className="absolute top-16 left-3 right-3 z-[200] animate-in fade-in slide-in-from-top-2 duration-400">
          <div className="rounded-lg px-3 py-2 flex items-center gap-2"
            style={{ background: 'rgba(251,177,60,0.14)', border: '1px solid rgba(251,177,60,0.3)', backdropFilter: 'blur(12px)' }}>
            <span className="text-base">🧠</span>
            <span className="text-[10px] font-headline font-black uppercase tracking-wide" style={{ color: '#FBB13C' }}>
              {psychTeaserText}
            </span>
          </div>
        </div>
      )}

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
          <div className="text-[18px] font-headline font-black uppercase leading-none text-white truncate">
            {state.userTeam}
          </div>
          <div className="font-code text-[7px] text-white mt-0.5" style={{ letterSpacing: '1px' }}>
            W{state.wins} D{state.draws} L{state.losses}
          </div>
        </div>
        <div className="py-1.5 pl-3 pr-2 text-center flex-shrink-0 flex items-center gap-2">
          <div>
            <div className="font-code text-[7px] uppercase tracking-[2px] text-white">Game Week</div>
            <div className="text-[24px] font-headline font-black leading-none" style={{ color: '#FBB13C', letterSpacing: '-1px' }}>
              {currentGW}
            </div>
          </div>
          {/* Mute toggle */}
          <button
            onClick={() => {
              const muted = getSoundManager().toggleMute();
              setMuteOn(muted);
            }}
            className="p-1.5 rounded-full transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)' }}
            title={muteOn ? 'Unmute' : 'Mute'}
          >
            {muteOn
              ? <VolumeX className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
              : <Volume2 className="w-3 h-3" style={{ color: '#FBB13C' }} />
            }
          </button>
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
        <div className="grid px-3 py-0.5 text-[7px] font-code uppercase tracking-[2px] border-b text-white" style={{ gridTemplateColumns: '22px 1fr 28px 34px', borderColor: 'rgba(255,255,255,0.07)' }}>
          <span className="text-center">#</span><span>Club</span><span className="text-center">G</span><span className="text-right">Pts</span>
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
            <div className="text-[15px] font-headline font-black text-right" style={{ color: team.isUser ? '#73D2DE' : '#EDF2FF' }}>{team.pts}</div>
          </div>
        ))}
      </div>

      {/* ── Tension triangle + Manager portrait (hidden during match sim) ── */}
      <div className={`flex items-center justify-center px-3 pb-0 gap-6 z-10 h-[152px] flex-shrink-0 overflow-hidden ${isSimulating ? 'hidden' : ''}`}>
        <TensionArcs board={state.boardSupport} fans={state.fanSupport} dressing={state.dressingRoom} />
        <ManagerMoodView mood={mood} timeLeft={timeLeft} />
      </div>

      {/* Thin amber divider — hidden during match sim */}
      {!isSimulating && <div className="mx-3 my-1 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(251,177,60,0.12),transparent)' }} />}

      {/* ── Scenario area ── */}
      <div
        className={`flex-1 min-h-0 flex flex-col items-center ${isSimulating ? 'justify-start overflow-y-auto' : showPressConference ? 'justify-start pt-2 overflow-y-auto' : 'justify-end pb-3 overflow-hidden'} px-1 relative z-[80]`}
        style={(isSimulating || showPressConference) ? { scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties : undefined}
      >
        {matchIntro && (() => {
          const mb = state.momentumBuffer ?? [];
          const allGood = mb.length === 3 && mb.every(v => v > 2);
          const allBad  = mb.length === 3 && mb.every(v => v < -2);
          const momentumMsg = allGood
            ? '📈 Momentum Surge — the squad is fired up'
            : allBad
            ? '📉 Morale Low — the dressing room is unsettled'
            : null;
          return (
            <div className={`absolute inset-0 z-[120] flex flex-col items-center justify-center backdrop-blur-xl transition-opacity duration-300 ${matchIntroFading ? 'opacity-0' : 'opacity-100 animate-in fade-in duration-400'}`}
              style={{ background: allGood ? 'rgba(30,107,60,0.12)' : allBad ? 'rgba(216,17,89,0.10)' : 'rgba(7,9,15,0.95)' }}>
              <div className="space-y-3 text-center px-6">
                <Zap className="w-10 h-10 mx-auto animate-bounce" style={{ color: '#FBB13C' }} />
                <h2 className="text-4xl font-headline font-black uppercase italic text-white tracking-tighter">MATCHDAY</h2>
                <div className="text-[10px] font-headline font-black uppercase tracking-[0.4em]" style={{ color: '#FBB13C' }}>
                  {opponentName ? `vs ${opponentName}` : 'Deploying Tactics'}
                </div>
                {momentumMsg && (
                  <div className="text-[10px] font-headline font-black uppercase tracking-wide animate-in fade-in duration-500"
                    style={{ color: allGood ? '#1E6B3C' : '#D81159' }}>
                    {momentumMsg}
                  </div>
                )}
                {/* Momentum dots */}
                <div className="flex items-center justify-center gap-2 mt-1">
                  {[0,1,2].map(i => {
                    const val = mb[i];
                    const col = val === undefined ? 'rgba(255,255,255,0.12)' : val > 2 ? '#1E6B3C' : val < -2 ? '#D81159' : '#FBB13C';
                    return <div key={i} className="rounded-full" style={{ width: 10, height: 10, background: col, boxShadow: val !== undefined ? `0 0 8px ${col}` : 'none', transition: 'all 0.3s' }} />;
                  })}
                </div>
              </div>
            </div>
          );
        })()}
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
            verdict={matchVerdict}
            lastDecisions={lastDecisionsForMatch}
            varCardsLeft={state.varCardsLeft ?? 0}
            momentumBuffer={state.momentumBuffer}
            onVARUse={handleVARUse}
          />
        ) : (
          <div className="w-full flex items-center justify-center relative bg-background">
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
              <SwipeCard
                key={currentScenario.scenarioId}
                scenario={currentScenario}
                onDecision={handleDecision}
                timeLeft={timeLeft}
                cardsToNextMatch={3 - (state.cardsSeen % 3)}
                isConsequence={(state.flags ?? []).some(f => currentScenario.scenarioId.includes(f))}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* ── Win % bar (hidden during simulation and press conference) ── */}
      {!isSimulating && !showPressConference && (
        <div
          className="mx-3 mb-1 mt-auto flex items-center gap-3 rounded-[10px] px-3.5 py-[5px] flex-shrink-0 z-[90]"
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
          <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
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
          <div className="font-code text-[8px] uppercase tracking-wide text-right flex-shrink-0 leading-snug">
            <div className="text-white">Next Match</div>
            <div style={{ color: winChance >= 55 ? '#1E6B3C' : winChance >= 40 ? '#FBB13C' : '#D81159', fontSize: '7px' }}>
              {winChance >= 55 ? 'Favourite' : winChance >= 40 ? 'Coin flip' : 'Underdog'}
            </div>
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
        {/* Scroll area — starts after badge, right-edge fade prevents hard clip */}
        <div style={{ overflow: 'hidden', marginLeft: '88px', WebkitMaskImage: 'linear-gradient(to right, black 0%, black calc(100% - 28px), transparent 100%)', maskImage: 'linear-gradient(to right, black 0%, black calc(100% - 28px), transparent 100%)' }}>
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
