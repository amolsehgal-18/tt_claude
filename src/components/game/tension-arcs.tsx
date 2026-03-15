"use client"

import React from 'react';

interface TensionArcsProps {
  board: number;
  fans: number;
  dressing: number;
}

// Arc circumferences: π × radius
// Board  r=68 → π×68 ≈ 213.6
// Fans   r=56 → π×56 ≈ 175.9
// Squad  r=42 → π×42 ≈ 131.9
const ARCS = [
  {
    key: 'board',
    label: 'Board',
    path: 'M 16 86 A 68 68 0 0 1 152 86',
    circumference: Math.PI * 68,
    color: '#1E6B3C',
    trackColor: 'rgba(27,94,32,0.18)',
    glow: 'rgba(30,107,60,0.45)',
  },
  {
    key: 'fans',
    label: 'Fans',
    path: 'M 28 86 A 56 56 0 0 1 140 86',
    circumference: Math.PI * 56,
    color: '#D81159',
    trackColor: 'rgba(216,17,89,0.18)',
    glow: 'rgba(216,17,89,0.45)',
  },
  {
    key: 'squad',
    label: 'Squad',
    path: 'M 42 86 A 42 42 0 0 1 126 86',
    circumference: Math.PI * 42,
    color: '#3b82f6',
    trackColor: 'rgba(59,130,246,0.18)',
    glow: 'rgba(59,130,246,0.45)',
  },
];

export const TensionArcs = ({ board, fans, dressing }: TensionArcsProps) => {
  const values = [board, fans, dressing];

  return (
    <div className="flex flex-col items-center" style={{ width: 130 }}>
      <svg
        viewBox="0 0 168 88"
        width={130}
        height={68}
        style={{ display: 'block', overflow: 'visible' }}
      >
        {ARCS.map((arc, i) => {
          const v = Math.max(0, Math.min(1, values[i]));
          // strokeDashoffset approach: dasharray = full circumference, offset = (1-v)*circ
          const circ = arc.circumference;
          const offset = circ * (1 - v);
          return (
            <g key={arc.key}>
              {/* Track */}
              <path
                d={arc.path}
                fill="none"
                stroke={arc.trackColor}
                strokeWidth={5.5}
                strokeLinecap="round"
              />
              {/* Fill */}
              <path
                d={arc.path}
                fill="none"
                stroke={arc.color}
                strokeWidth={5.5}
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                style={{
                  filter: `drop-shadow(0 0 3px ${arc.glow})`,
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Legend row below SVG */}
      <div className="flex justify-between w-full mt-1 px-1">
        {ARCS.map((arc, i) => (
          <div key={arc.key} className="flex flex-col items-center flex-1">
            <div
              className="w-[5px] h-[5px] rounded-full mb-0.5"
              style={{ background: arc.color }}
            />
            <span
              className="text-[13px] font-headline font-black leading-none"
              style={{ color: arc.color }}
            >
              {Math.round(values[i] * 100)}%
            </span>
            <span className="font-code text-[7px] uppercase tracking-[1.5px] mt-0.5" style={{ color: arc.color }}>
              {arc.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
