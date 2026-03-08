"use client"

import React from 'react';

interface TensionArcsProps {
  board: number;
  fans: number;
}

export const TensionArcs = ({ board, fans }: TensionArcsProps) => {
  const size = 120; 
  const strokeWidth = 10; 
  const center = size / 2;
  
  const drawArc = (value: number, radius: number, color: string, label: string) => {
    const circumference = Math.PI * radius;
    const dash = value * circumference;
    const gap = circumference - dash;
    
    const pathData = `M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`;

    return (
      <g key={label}>
        <path
          d={pathData}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dash} ${gap + circumference}`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </g>
    );
  };

  return (
    <div className="relative flex flex-col items-center bg-transparent" style={{ width: size }}>
      <svg width={size} height={size / 2 + 10} className="overflow-visible">
        {drawArc(board, 50, "hsl(var(--primary))", "board")}
        {drawArc(fans, 35, "#ef4444", "fans")}
      </svg>
      
      <div className="grid grid-cols-2 gap-3 text-[11px] font-headline uppercase tracking-wider mt-2 w-full px-2 font-black">
        <div className="flex flex-col items-center border-r border-white/10">
          <span className="text-primary brightness-150">{Math.round(board * 100)}%</span>
          <span className="text-white brightness-200 text-[9px] uppercase tracking-widest font-bold">Board</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[#ef4444] brightness-150">{Math.round(fans * 100)}%</span>
          <span className="text-white brightness-200 text-[9px] uppercase tracking-widest font-bold">Fans</span>
        </div>
      </div>
    </div>
  );
};
