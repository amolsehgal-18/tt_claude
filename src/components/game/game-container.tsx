"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameState, INITIAL_STATE, calculateMood, saveGameLocally, getMatchOdds, getLeagueTable, CAREER_MODES, CareerMode, calculateMatchResult } from '@/lib/game-logic';
import { SlantedButton } from './slanted-elements';
import { ManagerMoodView } from './manager-mood';
import { MatchRadar } from './match-radar';
import { TensionArcs } from './tension-arcs';
import { SwipeCard } from './swipe-card';
import { SeasonSummary } from './season-summary';
import { getAiScenarioPresentation } from '@/ai/flows/ai-scenario-presentation-flow';
import type { AiScenarioPresentationOutput } from '@/ai/flows/ai-scenario-presentation-flow';
import { RefreshCw, AlertTriangle, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export const GameContainer = ({ initialState }: { initialState?: GameState }) => {
  const [state, setState] = useState<GameState | null>(initialState || null);
  const [currentScenario, setCurrentScenario] = useState<AiScenarioPresentationOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchIntro, setMatchIntro] = useState(false);
  const [pendingResult, setPendingResult] = useState<'win' | 'draw' | 'loss' | null>(null);
  const [opponentName, setOpponentName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  
  const [setupStep, setSetupStep] = useState(0);
  const [setupMode, setSetupMode] = useState<CareerMode>('season');
  const [setupDuration, setSetupDuration] = useState(0);
  const [setupName, setSetupName] = useState("Gaffer");
  const [setupTeam, setSetupTeam] = useState("United FC");

  const isFetchingRef = useRef(false);

  const activeConfig = state ? CAREER_MODES[state.mode].durations[state.durationIndex] : null;

  const handleDecision = useCallback((side: 'left' | 'right') => {
    if (!currentScenario || !state) return;

    const impact = side === 'left' ? currentScenario.impactLeft : currentScenario.impactRight;
    const newCardsSeen = state.cardsSeen + 1;
    
    const newState: GameState = {
      ...state,
      boardSupport: Math.min(1, Math.max(0, state.boardSupport + (impact.board / 100))),
      fanSupport: Math.min(1, Math.max(0, state.fanSupport + (impact.fans / 100))),
      dressingRoom: Math.min(1, Math.max(0, state.dressingRoom + (impact.squad / 100))),
      aggression: Math.min(1, Math.max(0.05, state.aggression + (impact.aggression || 0))),
      cardsSeen: newCardsSeen,
      history: [...state.history, currentScenario.scenarioId],
    };

    if (newState.boardSupport <= 0.05 || newState.fanSupport <= 0.05) {
      newState.isSacked = true;
    }

    setState(newState);
    saveGameLocally(newState);
    setCurrentScenario(null);
    setTimeLeft(15);

    if (newCardsSeen > 0 && newCardsSeen % 3 === 0) {
      const table = getLeagueTable(newState);
      const possibleOpponents = table.filter(t => !t.isUser);
      const opp = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)].team;
      setOpponentName(opp);
      setPendingResult(calculateMatchResult(newState));
      
      setMatchIntro(true);
      setTimeout(() => {
        setMatchIntro(false);
        setIsSimulating(true);
      }, 2000);
    }
  }, [currentScenario, state]);

  useEffect(() => {
    if (!currentScenario || isSimulating || matchIntro || loading || error || state?.isSacked || state?.isSeasonEnd) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleDecision('left');
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentScenario, isSimulating, matchIntro, loading, error, state?.isSacked, state?.isSeasonEnd, handleDecision]);

  const fetchScenario = useCallback(async () => {
    if (!state || state.isSacked || state.isSeasonEnd || isFetchingRef.current || isSimulating || matchIntro) return;
    
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const uniqueSeed = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      const result = await getAiScenarioPresentation({
        boardSupport: state.boardSupport,
        fanSupport: state.fanSupport,
        dressingRoom: state.dressingRoom,
        aggression: state.aggression,
        userTeam: state.userTeam,
        currentLeaguePosition: state.currentLeaguePosition,
        sagaObjective: CAREER_MODES[state.mode].name,
        objectiveMet: state.currentLeaguePosition <= activeConfig!.target,
        excludedScenarioIds: state.history.slice(-20), 
        randomSeed: uniqueSeed,
      });
      setCurrentScenario(result);
    } catch (err) {
      setError("Intel transmission interrupted.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [state, activeConfig, isSimulating, matchIntro]);

  useEffect(() => {
    if (state && !currentScenario && !isSimulating && !matchIntro && !state.isSacked && !state.isSeasonEnd && !loading && !error) {
      fetchScenario();
    }
  }, [state, currentScenario, isSimulating, matchIntro, loading, error, fetchScenario]);

  const onMatchComplete = () => {
    if (!state || !activeConfig || !pendingResult) return;

    setIsSimulating(false);
    const result = pendingResult;
    setPendingResult(null);
    
    const newMatchesPlayed = state.matchesPlayed + 1;
    const ptsEarned = result === 'win' ? 3 : result === 'draw' ? 1 : 0;
    
    const newState: GameState = {
      ...state,
      matchesPlayed: newMatchesPlayed,
      wins: result === 'win' ? state.wins + 1 : state.wins,
      draws: result === 'draw' ? state.draws + 1 : state.draws,
      losses: result === 'loss' ? state.losses + 1 : state.losses,
      points: state.points + ptsEarned,
      isSeasonEnd: newMatchesPlayed >= activeConfig.matches
    };

    const table = getLeagueTable(newState);
    newState.currentLeaguePosition = table.find(t => t.isUser)?.pos || state.currentLeaguePosition;

    if (newState.isSeasonEnd && newState.currentLeaguePosition > activeConfig.target) {
      newState.isSacked = true;
    }

    setState(newState);
    saveGameLocally(newState);
  };

  const windowedLeagueTable = useMemo(() => {
    if (!state) return [];
    const fullTable = getLeagueTable(state);
    const userIndex = fullTable.findIndex(t => t.isUser);
    
    let start = Math.max(0, userIndex - 1);
    let end = start + 3;
    
    if (end > fullTable.length) {
      end = fullTable.length;
      start = Math.max(0, end - 3);
    }
    
    return fullTable.slice(start, end);
  }, [state]);

  const odds = state ? getMatchOdds(state.aggression) : { win: '0.33', draw: '0.33', loss: '0.34' };
  
  const newsItems = [
    "BREAKING: Fans plan protest outside stadium following tactical leaks.",
    "EXCLUSIVE: Board considering alternative options if results don't improve.",
    "RUMOR: Star striker linked with shock move to rivals.",
    "TAKEOVER: Mystery consortium interested in club acquisition.",
    "MARKET: Scouting reports suggest lack of depth in defensive areas."
  ];

  if (!state) {
    return (
      <div className="flex flex-col h-screen max-md:max-w-md md:max-w-md mx-auto bg-background p-6 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] pointer-events-none" />
        
        {setupStep === 0 && (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center z-50">
            <div className="space-y-1">
              <h1 className="text-3xl font-headline font-black text-accent uppercase italic">Gaffer Protocol</h1>
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
              <h2 className="text-2xl font-headline font-black text-primary uppercase italic">The Mission</h2>
              <p className="text-[9px] font-headline uppercase tracking-[0.3em] opacity-40 font-black">Stage 02: Objectives</p>
            </div>
            <div className="grid gap-2">
              {(Object.keys(CAREER_MODES) as CareerMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setSetupMode(mode);
                    setSetupStep(2);
                  }}
                  className="flex flex-col p-3 rounded bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-left group"
                >
                  <span className="font-headline font-black uppercase text-xs group-hover:text-primary">{CAREER_MODES[mode].name}</span>
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
              <h2 className="text-2xl font-headline font-black text-accent uppercase italic">Final Prep</h2>
              <p className="text-[9px] font-headline uppercase tracking-[0.3em] opacity-40 font-black">Stage 03: Season Length</p>
            </div>
            <div className="grid gap-2">
              {CAREER_MODES[setupMode].durations.map((d, idx) => (
                <button
                  key={idx}
                  onClick={() => setSetupDuration(idx)}
                  className={cn(
                    "flex justify-between items-center p-4 rounded border transition-all",
                    setupDuration === idx ? "bg-accent text-black border-accent" : "bg-white/5 border-white/10 opacity-60"
                  )}
                >
                  <span className="font-headline font-black uppercase text-[11px]">{d.label}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
            <div className="space-y-4">
              <SlantedButton 
                onClick={() => {
                  const s = INITIAL_STATE(setupMode, setupDuration, setupName, setupTeam);
                  setState(s);
                  saveGameLocally(s);
                }} 
                className="w-full py-5 text-base font-black tracking-widest uppercase bg-white text-black"
              >
                Sign Contract
              </SlantedButton>
              <button onClick={() => setSetupStep(1)} className="text-[9px] font-headline uppercase opacity-40 mx-auto block font-black tracking-widest">Re-select Objective</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (state.isSeasonEnd || state.isSacked) {
    return <SeasonSummary state={state} onRestart={() => setState(null)} />;
  }

  const mood = calculateMood(state);
  const currentGW = activeConfig ? activeConfig.startGW + state.matchesPlayed : 0;

  return (
    <div className="flex flex-col h-screen max-md:max-w-md md:max-w-md mx-auto relative overflow-hidden bg-background shadow-2xl border-x border-white/5">
      <div className="bg-black/95 py-2.5 border-b border-white/10 text-center z-[100]">
        <span className="text-white text-[11px] font-headline font-black uppercase tracking-[0.4em]">
          {CAREER_MODES[state.mode].name} | GW {currentGW}
        </span>
      </div>

      <div className="bg-black/60 border-b border-white/5 p-2 z-[90] backdrop-blur-xl">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-headline uppercase tracking-widest text-accent flex items-center gap-1 font-black">
            <RefreshCw className="w-3 h-3 animate-spin" /> Live Standings
          </span>
          <span className="text-[9px] font-headline uppercase opacity-40 font-black">Matchday {currentGW}</span>
        </div>
        <div className="flex justify-between items-center px-2 py-0.5 text-[8px] font-headline uppercase opacity-40 border-b border-white/10 mb-1 font-black">
          <div className="flex gap-4"><span className="w-3">#</span><span>Name</span></div>
          <div className="flex gap-4 pr-1"><span className="w-3 text-center">G</span><span className="w-4 text-right">P</span></div>
        </div>
        <div className="flex flex-col gap-0.5">
          {windowedLeagueTable.map((team) => (
            <div key={team.team} className={cn("flex justify-between items-center px-2 py-1 rounded text-[10px] transition-colors", team.isUser ? "bg-primary/20 border-l-2 border-primary" : "bg-white/5")}>
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-headline opacity-40 w-3 font-black">{team.pos}</span>
                <span className={cn("font-black truncate max-w-[120px] uppercase tracking-tight text-[11px]", team.isUser ? "text-primary" : "text-white")}>{team.team}</span>
              </div>
              <div className="flex items-center gap-4 pr-1 font-headline font-black">
                <span className="opacity-40 w-3 text-center">{team.gp}</span>
                <span className="font-black w-4 text-right">{team.pts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 flex justify-around items-center bg-transparent z-10 border-b border-white/5 relative -mb-4">
        <div className="flex-1 flex justify-center scale-95 opacity-80"><TensionArcs board={state.boardSupport} fans={state.fanSupport} /></div>
        <div className="flex-1 flex justify-center scale-95 opacity-80"><ManagerMoodView mood={mood} /></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-2 relative overflow-hidden z-[80]">
        {matchIntro && (
          <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl animate-in fade-in duration-500">
             <div className="space-y-2 text-center">
                <Zap className="w-10 h-10 text-accent mx-auto animate-bounce" />
                <h2 className="text-4xl font-headline font-black uppercase italic text-white tracking-tighter">MATCHDAY</h2>
                <div className="text-[10px] font-headline uppercase tracking-[0.4em] text-accent/80 font-black">Deploying Tactics</div>
             </div>
          </div>
        )}

        {isSimulating ? (
          <MatchRadar userTeam={state.userTeam} opponentTeam={opponentName} result={pendingResult} onComplete={onMatchComplete} />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            {loading ? (
              <div className="text-center space-y-3">
                <RefreshCw className="w-10 h-10 animate-spin text-primary mx-auto" />
                <p className="text-[10px] font-headline uppercase tracking-[0.3em] opacity-40 font-black">Syncing Intel...</p>
              </div>
            ) : error ? (
              <div className="text-center space-y-3">
                <AlertTriangle className="w-10 h-10 text-destructive mx-auto" />
                <p className="text-xs uppercase font-headline opacity-60 font-black">{error}</p>
                <SlantedButton onClick={fetchScenario} className="text-[10px] py-2">Retry Feed</SlantedButton>
              </div>
            ) : currentScenario ? (
              <SwipeCard scenario={currentScenario} onDecision={handleDecision} />
            ) : null}
          </div>
        )}
      </div>

      <div className="bg-black/95 border-t border-white/10 z-[100]">
        <div className="p-4 py-3 space-y-2">
          <div className="flex justify-between items-end px-1">
            <div className="flex flex-col gap-0.5">
              <div className="text-[9px] font-headline uppercase opacity-40 font-black tracking-widest">Next Match Odds</div>
              <div className="text-[13px] font-headline font-black text-white/90 tracking-tighter">
                W: {Math.round(parseFloat(odds.win)*100)}% | D: {Math.round(parseFloat(odds.draw)*100)}% | L: {Math.round(parseFloat(odds.loss)*100)}%
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="text-[9px] font-headline uppercase opacity-40 font-black tracking-widest">Squad Aggression</div>
              <div className="text-[13px] font-headline font-black text-accent tracking-tighter">{Math.round(state.aggression * 100)}%</div>
            </div>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className={cn("h-full transition-all duration-1000 ease-linear", timeLeft <= 5 ? "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "bg-primary")} style={{ width: `${(timeLeft / 15) * 100}%` }} />
          </div>
        </div>

        <div className="bg-destructive/10 border-t border-white/5 h-10 flex items-center overflow-hidden relative">
          <div className="bg-destructive text-white text-[10px] font-headline font-black px-4 py-1.5 z-20 absolute left-0 uppercase tracking-tighter flex items-center h-full">Breaking</div>
          <div className="flex items-center animate-ticker">
            {[...newsItems, ...newsItems].map((item, idx) => (
              <span key={idx} className="text-[11px] font-headline uppercase tracking-[0.2em] text-white/90 whitespace-nowrap font-black italic px-10">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
