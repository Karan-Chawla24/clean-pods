'use client';

import React from 'react';

interface Bubble {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
  color: string[]; // gradient colors
}

const FloatingBubbles: React.FC = () => {
  // Colors sampled from your logo
  const colors: string[][] = [
    ['#f97316', '#fbbf24'], // orange → amber
    ['#38bdf8', '#3b82f6'], // sky → blue
    ['#a855f7', '#ec4899'], // purple → pink
    ['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)'], // transparent bubble
  ];

  const bubbles: Bubble[] = Array.from({ length: 20 }, (_, i) => {
    const color = colors[Math.floor(Math.random() * colors.length)];
    return {
      id: i,
      size: Math.random() * 40 + 20,             // 20–60px
      left: Math.random() * 100,                 // 0–100%
      delay: Math.random() * 8,                  // 0–8s
      duration: Math.random() * 10 + 14,         // 14–24s
      color,
    };
  });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden w-full h-full">
      <style jsx>{`
        @keyframes floatY {
          0%   { transform: translate3d(0, 110vh, 0); opacity: 0; }
          10%  { opacity: 0.7; }
          80%  { opacity: 0.8; }
          100% { transform: translate3d(0, -10vh, 0); opacity: 0; }
        }

        @keyframes swayX {
          0%,100% { transform: translateX(0); }
          25%     { transform: translateX(8px); }   /* reduced from 12px */
          75%     { transform: translateX(-8px); }
        }

        @keyframes pulse {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.08); }
        }

        .outer {
          position: absolute;
          will-change: transform, opacity;
          transform: translateZ(0);
          animation-name: floatY;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .sway {
          width: 100%;
          height: 100%;
          will-change: transform;
          animation-name: swayX;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-duration: 4s;
        }

        .bubble {
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          border: 1px solid rgba(255,255,255,0.3);
          box-shadow:
            inset -6px -6px 12px rgba(255,255,255,0.4),
            0 2px 10px rgba(0,0,0,0.06);
          backdrop-filter: blur(1.5px);
          will-change: transform;
          animation-name: pulse;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          animation-duration: 3.8s;
        }
      `}</style>

      {bubbles.map((b) => (
        <div
          key={b.id}
          className="outer"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        >
          <div className="sway" style={{ animationDelay: `${b.delay * 0.4}s` }}>
            <div
              className="bubble"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${b.color[0]}, ${b.color[1]})`,
                opacity: Math.random() * 0.5 + 0.4, // 0.4–0.9
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloatingBubbles;
