
"use client"

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { SlantedContainer } from './slanted-elements';
import { Trophy, Shield, Target, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GlobalLeaderboard() {
  const { firestore } = useFirestore();
  
  const leaderboardQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'leaderboard'),
      orderBy('bestPoints', 'desc'),
      limit(10)
    );
  }, [firestore]);

  const { data: entries, isLoading, error } = useCollection(leaderboardQuery);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <Trophy className="w-10 h-10 text-accent mx-auto" />
        <h2 className="text-2xl font-headline font-bold uppercase tracking-tighter">Hall of Fame</h2>
        <p className="text-[10px] font-headline uppercase opacity-40 tracking-[0.2em]">Global Top 10 Managers</p>
      </div>

      <SlantedContainer className="p-2 border-white/5">
        <div className="flex flex-col">
          <div className="flex justify-between items-center px-4 py-2 text-[8px] font-headline uppercase opacity-40 border-b border-white/5 mb-1">
            <div className="flex gap-4">
              <span className="w-4">#</span>
              <span>Manager / Club</span>
            </div>
            <span>Points</span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto opacity-40" />
            </div>
          ) : error ? (
            <div className="py-20 text-center text-[10px] font-headline uppercase opacity-40">
              Disconnected from Network
            </div>
          ) : entries && entries.length > 0 ? (
            entries.map((entry, i) => (
              <div 
                key={entry.id} 
                className={cn(
                  "flex justify-between items-center px-4 py-3 rounded text-[11px] border transition-all mb-1",
                  i === 0 ? "bg-accent/10 border-accent/50 shadow-[0_0_15px_rgba(255,171,0,0.2)]" : "bg-white/5 border-transparent"
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={cn(
                    "font-headline w-4 font-black italic",
                    i === 0 ? "text-accent" : "opacity-40"
                  )}>{i + 1}</span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold uppercase tracking-tight text-white truncate">{entry.managerName}</span>
                    <span className="text-[8px] opacity-40 uppercase truncate">{entry.teamName}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "font-headline font-black text-lg italic tracking-tighter",
                    i === 0 ? "text-accent" : "text-white"
                  )}>{entry.bestPoints}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center text-[10px] font-headline uppercase opacity-40">
              No Managers Ranked Yet
            </div>
          )}
        </div>
      </SlantedContainer>

      <div className="p-4 premium-glass border border-white/5 text-center">
        <p className="text-[9px] font-headline uppercase opacity-50 leading-relaxed italic">
          Points are calculated based on career performance.<br/>
          Winners write history. Losers get sacked.
        </p>
      </div>
    </div>
  );
}
