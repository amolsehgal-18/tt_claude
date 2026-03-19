"use client"

import React, { useRef, useEffect } from 'react';

interface TensionArcsProps {
  board: number;    // 0–1
  fans: number;     // 0–1
  dressing: number; // 0–1  (squad)
}

// Radar geometry — Centre: (60, 60) — Board top, Fans bottom-right, Squad bottom-left
const CX = 60, CY = 60;
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

  // Expand + fade pulse ring on a single vertex — dramatic flash
  const pulseVertex = (el: SVGCircleElement, dotEl?: SVGCircleElement | null) => {
    const startTime = performance.now();
    const origR = dotEl ? '3' : '1.75';
    const pframe = (now: number) => {
      const t = Math.min((now - startTime) / 900, 1);
      // Ring expands wide and fades
      el.setAttribute('r',            String(3 + t * 34));
      el.setAttribute('opacity',      String(1.2 * (1 - t)));
      el.setAttribute('stroke-width', String(3 - t * 1.5));
      // Dot flashes bright then returns
      if (dotEl) {
        const flash = t < 0.15 ? 1 : Math.max(0, 1 - (t - 0.15) / 0.35);
        dotEl.setAttribute('r', String(parseFloat(origR) + flash * 2.5));
      }
      if (t < 1) requestAnimationFrame(pframe);
      else {
        el.setAttribute('opacity', '0');
        if (dotEl) dotEl.setAttribute('r', origR);
      }
    };
    requestAnimationFrame(pframe);
  };

  useEffect(() => {
    const toPts   = computePoints(board * 100, fans * 100, dressing * 100);
    const fromPts = currentPtsRef.current;
    const prev    = prevRef.current;

    // Only pulse the vertex that changed the most
    const deltas = [
      { el: pulseBoardRef.current, delta: Math.abs(board    - prev.board)    },
      { el: pulseFansRef.current,  delta: Math.abs(fans     - prev.fans)     },
      { el: pulseSquadRef.current, delta: Math.abs(dressing - prev.dressing) },
    ];
    const biggest = deltas.reduce((a, b) => b.delta > a.delta ? b : a);
    // Map pulse ring to its corresponding vertex dot for the flash effect
    const dotMap: Record<number, SVGCircleElement | null> = {
      0: dotBoardRef.current,
      1: dotFansRef.current,
      2: dotSquadRef.current,
    };
    const biggestIdx = deltas.indexOf(biggest);
    const changed: Array<[SVGCircleElement, SVGCircleElement | null]> =
      (biggest.delta > 0.001 && biggest.el) ? [[biggest.el, dotMap[biggestIdx]]] : [];
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
    changed.forEach(([ring, dot]) => pulseVertex(ring, dot));

    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [board, fans, dressing]);

  // Initial points for SSR / first paint
  const init     = computePoints(board * 100, fans * 100, dressing * 100);
  const initPoly = `${init.board.x},${init.board.y} ${init.fans.x},${init.fans.y} ${init.squad.x},${init.squad.y}`;

  return (
    <div style={{ flexShrink: 0, width: 168 }}>
      <svg viewBox="0 0 120 108" width={168} height={152} fill="none" overflow="visible" style={{ display: 'block' }}>

        {/* ── Grid ── */}
        <polygon points="60,14 104,94 16,94"  fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8"/>
        <polygon points="60,30 89,78 31,78"  fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>
        <polygon points="60,48 74,64 46,64"  fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8"/>
        <line x1="60" y1="14" x2="60"  y2="94" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>
        <line x1="60" y1="14" x2="16"  y2="94" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>
        <line x1="60" y1="14" x2="104" y2="94" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8"/>

        {/* ── Axis labels — near outer triangle vertices ── */}
        <text x="60" y="8" textAnchor="middle" fill="#1E6B3C" fontSize="7.5" fontWeight="700" letterSpacing="1" style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}>BOARD</text>
        <text x="108" y="103" textAnchor="middle" fill="#D81159" fontSize="7.5" fontWeight="700" letterSpacing="1" style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}>FANS</text>
        <text x="12" y="103" textAnchor="middle" fill="#73D2DE" fontSize="7.5" fontWeight="700" letterSpacing="1" style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}>SQUAD</text>

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
        <circle ref={dotBoardRef} cx={init.board.x} cy={init.board.y} r="1.75" fill="#1E6B3C"/>
        <circle ref={dotFansRef}  cx={init.fans.x}  cy={init.fans.y}  r="1.75" fill="#D81159"/>
        <circle ref={dotSquadRef} cx={init.squad.x} cy={init.squad.y} r="1.75" fill="#73D2DE"/>

        {/* ── Pulse rings (expand + fade on stat change) ── */}
        <circle ref={pulseBoardRef} cx={init.board.x} cy={init.board.y} r="1.75" fill="none" stroke="#1E6B3C" strokeWidth="1" opacity="0"/>
        <circle ref={pulseFansRef}  cx={init.fans.x}  cy={init.fans.y}  r="1.75" fill="none" stroke="#D81159" strokeWidth="1" opacity="0"/>
        <circle ref={pulseSquadRef} cx={init.squad.x} cy={init.squad.y} r="1.75" fill="none" stroke="#73D2DE" strokeWidth="1" opacity="0"/>
      </svg>
    </div>
  );
};
