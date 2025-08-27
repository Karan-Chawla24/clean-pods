import React, { useMemo, useRef, useEffect } from "react";

interface AnimationElement {
  id: number;
  size: number;
  left: number;
  delay: number;
  duration: number;
  type: "bubble" | "droplet" | "pod";
  variant?: string;
}

interface LaundryAnimationProps {
  intensity?: "low" | "medium" | "high";
  className?: string;
  reduceMotion?: boolean;
}

const LaundryAnimation: React.FC<LaundryAnimationProps> = ({
  intensity = "medium",
  className = "",
  reduceMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Optimize element counts based on intensity and performance
  const config = useMemo(() => {
    const configs = {
      low: { bubbles: 12, droplets: 6, pods: 4 },
      medium: { bubbles: 18, droplets: 8, pods: 6 },
      high: { bubbles: 25, droplets: 12, pods: 8 },
    };
    return configs[intensity];
  }, [intensity]);

  // Memoize element generation for performance
  const elements = useMemo(() => {
    const bubbles: AnimationElement[] = Array.from(
      { length: config.bubbles },
      (_, i) => ({
        id: i,
        type: "bubble",
        size: Math.random() * 40 + 25,
        left: Math.random() * 95 + 2.5, // Keep away from edges
        delay: Math.random() * 8,
        duration: Math.random() * 8 + 12,
      }),
    );

    const droplets: AnimationElement[] = Array.from(
      { length: config.droplets },
      (_, i) => ({
        id: i + 100,
        type: "droplet",
        size: Math.random() * 12 + 6,
        left: Math.random() * 95 + 2.5,
        delay: Math.random() * 5,
        duration: Math.random() * 6 + 4,
        variant:
          Math.random() > 0.6
            ? "large"
            : Math.random() > 0.3
              ? "medium"
              : "small",
      }),
    );

    const pods: AnimationElement[] = Array.from(
      { length: config.pods },
      (_, i) => ({
        id: i + 200,
        type: "pod",
        size: Math.random() * 25 + 35,
        left: Math.random() * 90 + 5,
        delay: Math.random() * 12,
        duration: Math.random() * 15 + 20,
        variant: ["blue", "green", "purple", "orange"][
          Math.floor(Math.random() * 4)
        ],
      }),
    );

    return { bubbles, droplets, pods };
  }, [config]);

  // Handle reduced motion preference
  useEffect(() => {
    if (reduceMotion && containerRef.current) {
      containerRef.current.style.animation = "none";
      const allAnimated =
        containerRef.current.querySelectorAll("[data-animated]");
      allAnimated.forEach((el) => {
        (el as HTMLElement).style.animation = "none";
      });
    }
  }, [reduceMotion]);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
      role="presentation"
    >
      <style jsx>{`
        /* Performance optimizations */
        .element {
          position: absolute;
          will-change: transform, opacity;
          transform: translateZ(0);
          backface-visibility: hidden;
          contain: layout style paint;
        }

        /* Animations */
        @keyframes float-up {
          0% {
            transform: translate3d(0, 105vh, 0) scale(0.8);
            opacity: 0;
          }
          5% {
            opacity: 0.9;
            transform: translate3d(0, 100vh, 0) scale(1);
          }
          95% {
            opacity: 0.8;
          }
          100% {
            transform: translate3d(0, -10vh, 0) scale(0.9);
            opacity: 0;
          }
        }

        @keyframes gentle-sway {
          0%,
          100% {
            transform: translateX(0) rotate(0deg);
          }
          25% {
            transform: translateX(8px) rotate(2deg);
          }
          75% {
            transform: translateX(-8px) rotate(-2deg);
          }
        }

        @keyframes bubble-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes droplet-fall {
          0% {
            transform: translate3d(0, -5vh, 0) rotate(0deg);
            opacity: 0;
          }
          3% {
            opacity: 1;
          }
          97% {
            opacity: 0.7;
          }
          100% {
            transform: translate3d(0, 105vh, 0) rotate(10deg);
            opacity: 0;
          }
        }

        @keyframes pod-float {
          0% {
            transform: translate3d(0, 105vh, 0) rotate(0deg);
            opacity: 0;
          }
          4% {
            opacity: 1;
          }
          96% {
            opacity: 0.9;
          }
          100% {
            transform: translate3d(0, -15vh, 0) rotate(180deg);
            opacity: 0;
          }
        }

        @keyframes subtle-shimmer {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes gel-swirl {
          0%,
          100% {
            transform: rotate(0deg) scale(1);
          }
          33% {
            transform: rotate(120deg) scale(1.1);
          }
          66% {
            transform: rotate(240deg) scale(0.9);
          }
        }

        /* Bubbles */
        .bubble-element {
          animation: float-up linear infinite;
        }
        .bubble-sway {
          width: 100%;
          height: 100%;
          animation: gentle-sway 6s ease-in-out infinite;
        }
        .bubble {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 25% 25%,
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.12) 30%,
            rgba(173, 216, 230, 0.08) 60%,
            transparent 80%
          );
          border: 1px solid rgba(255, 255, 255, 0.35);
          box-shadow:
            inset -3px -3px 10px rgba(255, 255, 255, 0.4),
            inset 3px 3px 10px rgba(0, 50, 100, 0.1),
            0 0 20px rgba(173, 216, 230, 0.3);
          animation: bubble-pulse 5s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .bubble::before {
          content: "";
          position: absolute;
          top: 12%;
          left: 18%;
          width: 30%;
          height: 30%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 20% 20%,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 255, 255, 0.4) 60%,
            transparent 100%
          );
          animation: subtle-shimmer 3s ease-in-out infinite;
        }

        /* Droplets */
        .droplet-element {
          animation: droplet-fall linear infinite;
        }
        .droplet {
          width: 100%;
          height: 120%;
          background: linear-gradient(
            to bottom,
            rgba(100, 150, 200, 0.8) 0%,
            rgba(135, 206, 235, 0.7) 50%,
            rgba(173, 216, 230, 0.6) 100%
          );
          border-radius: 50% 50% 50% 70%;
          border: 1px solid rgba(100, 150, 200, 0.5);
          box-shadow:
            inset -2px -2px 6px rgba(255, 255, 255, 0.6),
            0 2px 8px rgba(0, 50, 100, 0.3);
        }
        .droplet.small {
          border-radius: 50%;
        }
        .droplet.medium {
          border-radius: 50% 50% 50% 60%;
        }
        .droplet.large {
          border-radius: 50% 50% 50% 75%;
        }

        /* Realistic Laundry Pods */
        .pod-element {
          animation: pod-float linear infinite;
        }
        .pod-sway {
          width: 100%;
          height: 100%;
          animation: gentle-sway 8s ease-in-out infinite;
        }

        .pod {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          /* More realistic pod shape - slightly flattened sphere */
          border-radius: 45% 45% 40% 40%;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.1) 30%,
            rgba(0, 0, 0, 0.1) 70%,
            rgba(0, 0, 0, 0.2) 100%
          );
          box-shadow:
            inset -4px -4px 12px rgba(255, 255, 255, 0.8),
            inset 4px 4px 12px rgba(0, 0, 0, 0.3),
            0 8px 20px rgba(0, 0, 0, 0.4),
            0 0 30px rgba(255, 255, 255, 0.2);
          transform-style: preserve-3d;
        }

        /* Gel chambers - more realistic liquid appearance */
        .gel-chamber {
          position: absolute;
          border-radius: 45%;
          background: var(--gel-color);
          box-shadow:
            inset -3px -3px 8px rgba(255, 255, 255, 0.4),
            inset 3px 3px 8px rgba(0, 0, 0, 0.4),
            0 2px 6px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: gel-swirl 8s ease-in-out infinite;
        }

        /* Main large chamber */
        .gel-chamber.main {
          width: 65%;
          height: 65%;
          top: 18%;
          left: 18%;
          background: var(--main-gel-color);
          border-radius: 40%;
        }

        /* Secondary smaller chambers */
        .gel-chamber.secondary-1 {
          width: 25%;
          height: 25%;
          top: 12%;
          right: 8%;
          background: var(--secondary-gel-color);
          animation-delay: -2s;
        }

        .gel-chamber.secondary-2 {
          width: 20%;
          height: 20%;
          bottom: 15%;
          left: 12%;
          background: var(--tertiary-gel-color);
          animation-delay: -4s;
        }

        /* Gel liquid effect inside chambers */
        .gel-chamber::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            ellipse at 30% 20%,
            rgba(255, 255, 255, 0.6) 0%,
            rgba(255, 255, 255, 0.3) 40%,
            transparent 70%
          );
          border-radius: inherit;
          animation: subtle-shimmer 4s ease-in-out infinite;
        }

        /* Pod membrane/wrapper effect */
        .pod::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.15) 0%,
            transparent 30%,
            rgba(255, 255, 255, 0.08) 70%,
            transparent 100%
          );
          border-radius: inherit;
          pointer-events: none;
        }

        /* Glossy highlight */
        .pod::after {
          content: "";
          position: absolute;
          top: 8%;
          left: 15%;
          width: 35%;
          height: 25%;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.8) 0%,
            rgba(255, 255, 255, 0.4) 50%,
            transparent 100%
          );
          border-radius: 60% 40% 50% 70%;
          pointer-events: none;
          animation: subtle-shimmer 6s ease-in-out infinite;
        }

        /* Color variants for pods */
        .pod.blue {
          --main-gel-color: linear-gradient(
            135deg,
            rgba(30, 144, 255, 0.9),
            rgba(65, 105, 225, 0.8)
          );
          --secondary-gel-color: linear-gradient(
            135deg,
            rgba(0, 191, 255, 0.85),
            rgba(30, 144, 255, 0.75)
          );
          --tertiary-gel-color: linear-gradient(
            135deg,
            rgba(173, 216, 230, 0.8),
            rgba(135, 206, 235, 0.7)
          );
        }

        .pod.green {
          --main-gel-color: linear-gradient(
            135deg,
            rgba(34, 139, 34, 0.9),
            rgba(50, 205, 50, 0.8)
          );
          --secondary-gel-color: linear-gradient(
            135deg,
            rgba(0, 250, 154, 0.85),
            rgba(34, 139, 34, 0.75)
          );
          --tertiary-gel-color: linear-gradient(
            135deg,
            rgba(144, 238, 144, 0.8),
            rgba(152, 251, 152, 0.7)
          );
        }

        .pod.purple {
          --main-gel-color: linear-gradient(
            135deg,
            rgba(138, 43, 226, 0.9),
            rgba(147, 112, 219, 0.8)
          );
          --secondary-gel-color: linear-gradient(
            135deg,
            rgba(186, 85, 211, 0.85),
            rgba(138, 43, 226, 0.75)
          );
          --tertiary-gel-color: linear-gradient(
            135deg,
            rgba(221, 160, 221, 0.8),
            rgba(216, 191, 216, 0.7)
          );
        }

        .pod.orange {
          --main-gel-color: linear-gradient(
            135deg,
            rgba(255, 140, 0, 0.9),
            rgba(255, 165, 0, 0.8)
          );
          --secondary-gel-color: linear-gradient(
            135deg,
            rgba(255, 69, 0, 0.85),
            rgba(255, 140, 0, 0.75)
          );
          --tertiary-gel-color: linear-gradient(
            135deg,
            rgba(255, 218, 185, 0.8),
            rgba(255, 215, 180, 0.7)
          );
        }

        /* Responsive design improvements */
        @media (max-width: 768px) {
          .element {
            transform: scale(0.8);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .element {
            animation-duration: 0.1s !important;
            animation-iteration-count: 1 !important;
          }

          .bubble-sway,
          .pod-sway {
            animation: none !important;
          }
        }

        /* Performance optimizations for high element counts */
        @media (max-width: 480px) {
          .bubble-element:nth-child(n + 15),
          .droplet-element:nth-child(n + 6),
          .pod-element:nth-child(n + 4) {
            display: none;
          }
        }
      `}</style>

      {/* Soap Bubbles */}
      {elements.bubbles.map((bubble) => (
        <div
          key={`bubble-${bubble.id}`}
          className="element bubble-element"
          data-animated="true"
          style={
            {
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: `${bubble.left}%`,
              animationDelay: `${bubble.delay}s`,
              animationDuration: `${bubble.duration}s`,
            } as React.CSSProperties
          }
        >
          <div
            className="bubble-sway"
            style={{ animationDelay: `${bubble.delay * 0.3}s` }}
          >
            <div className="bubble" />
          </div>
        </div>
      ))}

      {/* Water Droplets */}
      {elements.droplets.map((droplet) => (
        <div
          key={`droplet-${droplet.id}`}
          className="element droplet-element"
          data-animated="true"
          style={
            {
              width: `${droplet.size}px`,
              height: `${droplet.size * 1.2}px`,
              left: `${droplet.left}%`,
              animationDelay: `${droplet.delay}s`,
              animationDuration: `${droplet.duration}s`,
            } as React.CSSProperties
          }
        >
          <div className={`droplet ${droplet.variant}`} />
        </div>
      ))}

      {/* Realistic Laundry Pods */}
      {elements.pods.map((pod) => (
        <div
          key={`pod-${pod.id}`}
          className="element pod-element"
          data-animated="true"
          style={
            {
              width: `${pod.size}px`,
              height: `${pod.size}px`,
              left: `${pod.left}%`,
              animationDelay: `${pod.delay}s`,
              animationDuration: `${pod.duration}s`,
            } as React.CSSProperties
          }
        >
          <div
            className="pod-sway"
            style={{ animationDelay: `${pod.delay * 0.4}s` }}
          >
            <div className={`pod ${pod.variant}`}>
              <div className="gel-chamber main" />
              <div className="gel-chamber secondary-1" />
              <div className="gel-chamber secondary-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LaundryAnimation;
