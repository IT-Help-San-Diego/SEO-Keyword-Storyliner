import { useEffect, useState } from "react";

const unicorns = [
  { id: 1, left: "10%", delay: 0, size: 60 },
  { id: 2, left: "25%", delay: 0.3, size: 50 },
  { id: 3, left: "40%", delay: 0.1, size: 70 },
  { id: 4, left: "55%", delay: 0.5, size: 55 },
  { id: 5, left: "70%", delay: 0.2, size: 65 },
  { id: 6, left: "85%", delay: 0.4, size: 45 },
];

const sparkles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  delay: Math.random() * 2,
  size: Math.random() * 20 + 10,
}));

const confetti = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: Math.random() * 2,
  color: [
    "hsl(160 84% 39%)",
    "hsl(160 67% 52%)",
    "hsl(258 90% 66%)",
    "hsl(239 84% 67%)",
    "hsl(38 92% 50%)",
  ][Math.floor(Math.random() * 5)],
  size: Math.random() * 8 + 4,
}));

function UnicornSVG({ size, flipped = false }: { size: number; flipped?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: flipped ? "scaleX(-1)" : undefined }}
    >
      <defs>
        <linearGradient id="unicornBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(258 90% 96%)" />
          <stop offset="100%" stopColor="hsl(240 5% 96%)" />
        </linearGradient>
        <linearGradient id="rainbowMane" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(0 84% 60%)" />
          <stop offset="20%" stopColor="hsl(38 92% 50%)" />
          <stop offset="40%" stopColor="hsl(60 92% 50%)" />
          <stop offset="60%" stopColor="hsl(160 84% 39%)" />
          <stop offset="80%" stopColor="hsl(239 84% 67%)" />
          <stop offset="100%" stopColor="hsl(258 90% 66%)" />
        </linearGradient>
        <linearGradient id="hornGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(38 92% 50%)" />
          <stop offset="100%" stopColor="hsl(45 100% 70%)" />
        </linearGradient>
      </defs>
      
      <ellipse cx="50" cy="55" rx="25" ry="18" fill="url(#unicornBody)" stroke="hsl(258 90% 80%)" strokeWidth="1" />
      <ellipse cx="68" cy="45" rx="12" ry="10" fill="url(#unicornBody)" stroke="hsl(258 90% 80%)" strokeWidth="1" />
      <circle cx="73" cy="43" r="3" fill="hsl(215 28% 17%)" />
      <circle cx="74" cy="42" r="1" fill="white" />
      <polygon points="65,30 68,18 71,30" fill="url(#hornGradient)" stroke="hsl(38 70% 40%)" strokeWidth="0.5" />
      <path d="M 58 35 Q 48 25 40 30 Q 50 28 55 38" fill="url(#rainbowMane)" />
      <path d="M 53 38 Q 43 28 35 35 Q 45 32 50 42" fill="url(#rainbowMane)" />
      <path d="M 48 42 Q 38 32 30 40 Q 40 36 45 46" fill="url(#rainbowMane)" />
      <ellipse cx="38" cy="68" rx="3" ry="8" fill="url(#unicornBody)" stroke="hsl(258 90% 80%)" strokeWidth="1" />
      <ellipse cx="48" cy="70" rx="3" ry="8" fill="url(#unicornBody)" stroke="hsl(258 90% 80%)" strokeWidth="1" />
      <ellipse cx="58" cy="70" rx="3" ry="8" fill="url(#unicornBody)" stroke="hsl(258 90% 80%)" strokeWidth="1" />
      <ellipse cx="65" cy="68" rx="3" ry="8" fill="url(#unicornBody)" stroke="hsl(258 90% 80%)" strokeWidth="1" />
      <path d="M 25 55 Q 10 50 15 60 Q 12 55 18 50" fill="url(#rainbowMane)" />
      <path d="M 25 58 Q 8 55 12 65 Q 8 58 15 52" fill="url(#rainbowMane)" />
    </svg>
  );
}

function StarSparkle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L13.5 9L21 10.5L13.5 12L12 19L10.5 12L3 10.5L10.5 9L12 2Z"
        fill="hsl(45 100% 70%)"
        stroke="hsl(38 92% 50%)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function DancingUnicorns() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-success/10 to-transparent" />
      
      {confetti.map((c) => (
        <div
          key={`confetti-${c.id}`}
          className="absolute animate-confetti-fall"
          style={{
            left: c.left,
            top: "-20px",
            width: c.size,
            height: c.size,
            backgroundColor: c.color,
            borderRadius: c.id % 2 === 0 ? "50%" : "2px",
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      {sparkles.map((sparkle) => (
        <div
          key={`sparkle-${sparkle.id}`}
          className="absolute animate-sparkle"
          style={{
            left: sparkle.left,
            top: sparkle.top,
            animationDelay: `${sparkle.delay}s`,
          }}
        >
          <StarSparkle size={sparkle.size} />
        </div>
      ))}

      {unicorns.map((unicorn, i) => (
        <div
          key={unicorn.id}
          className="absolute bottom-20 animate-unicorn-dance"
          style={{ 
            left: unicorn.left,
            animationDelay: `${unicorn.delay}s`,
          }}
        >
          <UnicornSVG size={unicorn.size} flipped={i % 2 === 0} />
        </div>
      ))}

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
        <div 
          className="text-6xl font-bold text-success animate-pulse"
          style={{
            textShadow: "0 0 20px hsl(160 84% 39% / 0.5)",
          }}
        >
          Success!
        </div>
        <p className="text-lg text-muted-foreground mt-2 animate-in fade-in duration-500 delay-300">
          Your brand story is SEO-ready!
        </p>
      </div>
    </div>
  );
}
