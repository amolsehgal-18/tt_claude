"use client"

import React, { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { getWeekKey } from '@/lib/game-logic';
import { Zap, ArrowLeft, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SlantedButton } from './slanted-elements';

interface WeeklyChallengeScreenProps {
  onStart: (managerName: string, userTeam: string) => void;
  onBack: () => void;
  defaultName?: string;
  defaultTeam?: string;
}

function WeeklyLeaderboard() {
  const { firestore } = useFirestore();
  const weekKey = getWeekKey();

  const q = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'weekly_challenges', weekKey, 'scores'),
      orderBy('points', 'desc'),
      limit(10),
    );
  }, [firestore, weekKey]);

  const { data: entries, isLoading, error } = useCollection(q);

  if (isLoading) return (
    <div className="py-6 text-center">
      <RefreshCw className="w-5 h-5 animate-spin mx-auto opacity-30" />
    </div>
  );

  if (error || !entries?.length) return (
    <div className="py-4 text-center text-[10px] font-code uppercase tracking-widest opacity-30">
      No scores yet this week — be first.
    </div>
  );

  return (
    <div className="space-y-1">
      {entries.map((e, i) => (
        <div key={e.id} className="flex items-center justify-between px-3 py-2 rounded-lg"
          style={{ background: i === 0 ? 'rgba(251,177,60,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(251,177,60,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[11px] font-headline font-black w-4 text-center"
              style={{ color: i === 0 ? '#FBB13C' : 'rgba(255,255,255,0.35)' }}>{i + 1}</span>
            <div className="min-w-0">
              <div className="text-[12px] font-headline font-black uppercase truncate text-white">{e.managerName}</div>
              {e.archetype && (
                <div className="text-[8px] uppercase tracking-widest truncate"
                  style={{ fontFamily: "'Share Tech Mono',monospace", color: 'rgba(255,255,255,0.35)' }}>{e.archetype}</div>
              )}
            </div>
          </div>
          <div className="text-[18px] font-headline font-black flex-shrink-0"
            style={{ color: i === 0 ? '#FBB13C' : '#EDF2FF' }}>{e.points}
            <span className="text-[9px] font-code opacity-40 ml-0.5">pts</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function WeeklyChallengeScreen({ onStart, onBack, defaultName = 'Gaffer', defaultTeam = 'United FC' }: WeeklyChallengeScreenProps) {
  const [name, setName]   = useState(defaultName);
  const [team, setTeam]   = useState(defaultTeam);
  const weekKey           = getWeekKey();
  const [year, week]      = weekKey.split('-W');

  return (
    <div className="flex flex-col h-dvh max-md:max-w-md md:max-w-md mx-auto bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(251,177,60,0.07) 0%, transparent 70%)' }} />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 flex flex-col gap-4"
        style={{ scrollbarWidth: 'none' }}>

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-[10px] font-headline font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        </div>

        <div className="text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Zap className="w-5 h-5" style={{ color: '#FBB13C' }} />
            <h2 className="text-2xl font-headline font-black uppercase italic tracking-tight" style={{ color: '#FBB13C' }}>
              Weekly Challenge
            </h2>
          </div>
          <div className="text-[9px] font-code uppercase tracking-[3px]"
            style={{ color: 'rgba(255,255,255,0.35)' }}>
            Week {week} · {year} · Top 4 · 8 Matches
          </div>
          <div className="text-[9px] font-code uppercase tracking-widest mt-1"
            style={{ color: 'rgba(255,255,255,0.25)' }}>
            Same scenarios for everyone this week
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-1.5 text-[9px] font-headline font-black uppercase tracking-[2.5px]"
              style={{ color: '#FBB13C' }}>
              <div className="w-1 h-1 rounded-full blink-dot" style={{ background: '#FBB13C' }} />
              This Week&apos;s Leaderboard
            </div>
          </div>
          <div className="p-2">
            <WeeklyLeaderboard />
          </div>
        </div>

        {/* Entry form */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-[9px] font-headline uppercase font-black opacity-50 tracking-widest px-1">Your Name</label>
            <Input value={name} onChange={e => setName(e.target.value)}
              className="bg-white/5 h-11 border-white/10 font-bold text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-headline uppercase font-black opacity-50 tracking-widest px-1">Club Name</label>
            <Input value={team} onChange={e => setTeam(e.target.value)}
              className="bg-white/5 h-11 border-white/10 font-bold text-sm" />
          </div>
          <SlantedButton
            onClick={() => onStart(name.trim() || 'Gaffer', team.trim() || 'United FC')}
            className="w-full py-4 font-black uppercase text-sm tracking-widest"
            style={{ background: '#FBB13C', color: '#07090F' }}>
            Enter This Week
          </SlantedButton>
        </div>

      </div>
    </div>
  );
}
