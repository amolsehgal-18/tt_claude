"use client"

import React, { useRef, useEffect } from 'react';

interface TensionArcsProps {
  board: number;    // 0–1
  fans: number;     // 0–1
  dressing: number; // 0–1  (squad)
}

// Radar geometry (matches tt_final_ui_v4.html reference)
// Centre: (60, 54) — Board top, Fans bottom-right, Squad bottom-left
const CX = 60, CY = 54;
const DIRS = {
  board: { dx: 0,   dy: -46 },   // top    → green
  fans:  { dx: 44,  dy:  34 },   // right  → pink
  squad: { dx: -44, dy:  34 },   // left   → cyan
};

type Pts = {
  board: { x: number; y: number };
  fans:  { x: number; y: number };
  squad: { x: number; y: number };
};

// Map 0-100 stat to 0.15-1.0 of axis length (amplifies small changes)
function statToScale(v: number) {
  return 0.15 + (v / 100) * 0.85;
}

function computePoints(b100: number, f100: number, q100: number): Pts {
  const b = statToScale(b100);
  const f = statToScale(f100);
  const q = statToScale(q100);
  return {
    board: { x: CX + DIRS.board.dx * b, y: CY + DIRS.board.dy * b },
    fans:  { x: CX + DIRS.fans.dx  * f, y: CY + DIRS.fans.dy  * f },
    squad: { x: CX + DIRS.squad.dx * q, y: CY + DIRS.squad.dy * q },
  };
}

// Spring ease: exponential decay with slight overshoot (600ms)
function springEase(t: number): number {
  return 1 - Math.pow(2, -10 * t) * Math.cos(t * Math.PI * 2.2);
}

export const TensionArcs = ({ board, fans, dressing }: TensionArcsProps) => {
  const shapeRef      = useRef<SVGPolygonElement>(null);
  const dotBoardRef   = useRef<SVGCircleElement>(null);
  const dotFansRef    = useRef<SVGCircleElement>(null);
  const dotSquadRef   = useRef<SVGCircleElement>(null);
  const pulseBoardRef = useRef<SVGCircleElement>(null);
  const pulseFansRef  = useRef<SVGCircleElement>(null);
  const pulseSquadRef = useRef<SVGCircleElement>(null);

  const currentPtsRef = useRef<Pts>(computePoints(board * 100, fans * 100, dressing * 100));
  const prevRef       = useRef({ board, fans, dressing });
  const rafRef        = useRef<number | null>(null);

  // Directly mutate SVG attributes (no re-render needed)
  const applyPoints = (pts: Pts) => {
    const poly = `${pts.board.x},${pts.board.y} ${pts.fans.x},${pts.fans.y} ${pts.squad.x},${pts.squad.y}`;
    shapeRef.current?.setAttribute('points', poly);
    dotBoardRef.current?.setAttribute('cx', String(pts.board.x));
    dotBoardRef.current?.setAttribute('cy', String(pts.board.y));
    dotFansRef.current?.setAttribute('cx',  String(pts.fans.x));
    dotFansRef.current?.setAttribute('cy',  String(pts.fans.y));
    dotSquadRef.current?.setAttribute('cx', String(pts.squad.x));
    dotSquadRef.current?.setAttribute('cy', String(pts.squad.y));
    pulseBoardRef.current?.setAttribute('cx', String(pts.board.x));
    pulseBoardRef.current?.setAttribute('cy', String(pts.board.y));
    pulseFansRef.current?.setAttribute('cx',  String(pts.fans.x));
    pulseFansRef.current?.setAttribute('cy',  String(pts.fans.y));
    pulseSquadRef.current?.setAttribute('cx', String(pts.squad.x));
    pulseSquadRef.current?.setAttribute('cy', String(pts.squad.y));
    currentPtsRef.current = pts;
  };

  // Expand + fade pulse ring on a single vertex
  const pulseVertex = (el: SVGCircleElement) => {
    const startTime = performance.now();
    const pframe = (now: number) => {
      const t = Math.min((now - startTime) / 500, 1);
      el.setAttribute('r',       String(3.5 + t * 10));
      el.setAttribute('opacity', String(0.9 * (1 - t)));
      if (t < 1) requestAnimationFrame(pframe);
      else        el.setAttribute('opacity', '0');
    };
    requestAnimationFrame(pframe);
  };

  useEffect(() => {
    const toPts   = computePoints(board * 100, fans * 100, dressing * 100);
    const fromPts = currentPtsRef.current;
    const prev    = prevRef.current;

    // Collect which vertices changed so we can pulse them
    const changed: SVGCircleElement[] = [];
    if (Math.abs(board    - prev.board)    > 0.001 && pulseBoardRef.current) changed.push(pulseBoardRef.current);
    if (Math.abs(fans     - prev.fans)     > 0.001 && pulseFansRef.current)  changed.push(pulseFansRef.current);
    if (Math.abs(dressing - prev.dressing) > 0.001 && pulseSquadRef.current) changed.push(pulseSquadRef.current);
    prevRef.current = { board, fans, dressing };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = 600;
    const start    = performance.now();
    const frame = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const e = springEase(t);
      applyPoints({
        board: { x: fromPts.board.x + (toPts.board.x - fromPts.board.x) * e, y: fromPts.board.y + (toPts.board.y - fromPts.board.y) * e },
        fans:  { x: fromPts.fans.x  + (toPts.fans.x  - fromPts.fans.x)  * e, y: fromPts.fans.y  + (toPts.fans.y  - fromPts.fans.y)  * e },
        squad: { x: fromPts.squad.x + (toPts.squad.x - fromPts.squad.x) * e, y: fromPts.squad.y + (toPts.squad.y - fromPts.squad.y) * e },
      });
      if (t < 1) rafRef.current = requestAnimationFrame(frame);
      else        applyPoints(toPts);
    };
    rafRef.current = requestAnimationFrame(frame);
    changed.forEach(el => pulseVertex(el));

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [board, fans, dressing]);

  // Initial points for SSR / first paint
  const init     = computePoints(board * 100, fans * 100, dressing * 100);
  const initPoly = `${init.board.x},${init.board.y} ${init.fans.x},${init.fans.y} ${init.squad.x},${init.squad.y}`;

  return (
    <div style={{ flexShrink: 0, width: 120, height: 108 }}>
      <svg viewBox="0 0 120 108" width={120} height={108} fill="none">

        {/* ── Grid ── */}
        <polygon points="60,8 104,88 16,88"  fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>
        <polygon points="60,26 89,74 31,74"  fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>
        <polygon points="60,44 74,60 46,60"  fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8"/>
        <line x1="60" y1="8"  x2="60"  y2="88" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>
        <line x1="60" y1="8"  x2="16"  y2="88" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>
        <line x1="60" y1="8"  x2="104" y2="88" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>

        {/* ── Data shape (spring-animated) ── */}
        <polygon
          ref={shapeRef}
          points={initPoly}
          fill="rgba(115,210,222,0.09)"
          stroke="rgba(115,210,222,0.5)"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />

        {/* ── Vertex dots ── */}
        <circle ref={dotBoardRef} cx={init.board.x} cy={init.board.y} r="3.5" fill="#1E6B3C"/>
        <circle ref={dotFansRef}  cx={init.fans.x}  cy={init.fans.y}  r="3.5" fill="#D81159"/>
        <circle ref={dotSquadRef} cx={init.squad.x} cy={init.squad.y} r="3.5" fill="#73D2DE"/>

        {/* ── Pulse rings (expand + fade on stat change) ── */}
        <circle ref={pulseBoardRef} cx={init.board.x} cy={init.board.y} r="3.5" fill="none" stroke="#1E6B3C" strokeWidth="1.5" opacity="0"/>
        <circle ref={pulseFansRef}  cx={init.fans.x}  cy={init.fans.y}  r="3.5" fill="none" stroke="#D81159" strokeWidth="1.5" opacity="0"/>
        <circle ref={pulseSquadRef} cx={init.squad.x} cy={init.squad.y} r="3.5" fill="none" stroke="#73D2DE" strokeWidth="1.5" opacity="0"/>
      </svg>
    </div>
  );
};
