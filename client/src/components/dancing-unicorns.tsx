import { useEffect, useState } from "react";
import { X } from "lucide-react";

const unicorns = [
  { id: 1, left: "8%", delay: 0, size: 84 },
  { id: 2, left: "23%", delay: 0.3, size: 70 },
  { id: 3, left: "38%", delay: 0.1, size: 98 },
  { id: 4, left: "54%", delay: 0.5, size: 76 },
  { id: 5, left: "70%", delay: 0.2, size: 90 },
  { id: 6, left: "86%", delay: 0.4, size: 66 },
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
    "hsl(38 92% 50%)",
    "hsl(45 100% 70%)",
    "hsl(160 84% 39%)",
    "hsl(160 67% 52%)",
    "hsl(240 45% 74%)",
  ][Math.floor(Math.random() * 5)],
  size: Math.random() * 8 + 4,
}));

function UnicornSVG({ size, flipped = false, seed = 0 }: { size: number; flipped?: boolean; seed?: number }) {
  const uid = `u${seed}`;
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
        <radialGradient id={`${uid}-body`} cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="hsl(0 0% 100%)" />
          <stop offset="100%" stopColor="hsl(280 60% 95%)" />
        </radialGradient>
        <linearGradient id={`${uid}-mane`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(345 90% 72%)" />
          <stop offset="30%" stopColor="hsl(38 95% 62%)" />
          <stop offset="55%" stopColor="hsl(150 60% 55%)" />
          <stop offset="80%" stopColor="hsl(205 85% 65%)" />
          <stop offset="100%" stopColor="hsl(275 80% 72%)" />
        </linearGradient>
        <linearGradient id={`${uid}-horn`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(36 92% 55%)" />
          <stop offset="100%" stopColor="hsl(48 100% 78%)" />
        </linearGradient>
      </defs>

      {/* tiny chibi body */}
      <ellipse cx="50" cy="78" rx="17" ry="12" fill={`url(#${uid}-body)`} stroke="hsl(280 50% 84%)" strokeWidth="1.5" />
      <ellipse cx="40" cy="88" rx="4" ry="6" fill={`url(#${uid}-body)`} stroke="hsl(280 50% 84%)" strokeWidth="1.5" />
      <ellipse cx="60" cy="88" rx="4" ry="6" fill={`url(#${uid}-body)`} stroke="hsl(280 50% 84%)" strokeWidth="1.5" />
      <ellipse cx="48" cy="90" rx="4" ry="6" fill={`url(#${uid}-body)`} stroke="hsl(280 50% 84%)" strokeWidth="1.5" />
      <ellipse cx="68" cy="90" rx="4" ry="6" fill={`url(#${uid}-body)`} stroke="hsl(280 50% 84%)" strokeWidth="1.5" />

      {/* flowing rainbow tail */}
      <path d="M 66 74 Q 86 64 80 84 Q 88 76 90 90 Q 78 86 74 80" fill={`url(#${uid}-mane)`} />

      {/* giant adorable head */}
      <circle cx="50" cy="44" r="27" fill={`url(#${uid}-body)`} stroke="hsl(280 50% 84%)" strokeWidth="1.5" />

      {/* ears */}
      <path d="M 33 26 Q 31 16 39 22 Z" fill={`url(#${uid}-body)`} stroke="hsl(280 50% 84%)" strokeWidth="1.2" />
      <path d="M 67 26 Q 69 16 61 22 Z" fill={`url(#${uid}-body)`} stroke="hsl(280 50% 84%)" strokeWidth="1.2" />

      {/* gold horn */}
      <polygon points="44,22 50,2 56,22" fill={`url(#${uid}-horn)`} stroke="hsl(36 70% 42%)" strokeWidth="0.8" />
      <path d="M 45 19 L 55 19 M 46.5 14 L 53.5 14 M 48 9 L 52 9" stroke="hsl(36 70% 45%)" strokeWidth="0.8" />

      {/* fluffy rainbow forelock/mane */}
      <path d="M 30 30 Q 22 22 26 38 Q 18 34 24 48 Q 20 46 26 56 L 36 44 Q 30 38 36 30 Z" fill={`url(#${uid}-mane)`} />
      <path d="M 36 24 Q 42 14 48 22 Q 46 30 40 32 Z" fill={`url(#${uid}-mane)`} />
      <path d="M 64 24 Q 58 14 52 22 Q 54 30 60 32 Z" fill={`url(#${uid}-mane)`} />

      {/* huge sparkly eyes */}
      <ellipse cx="40" cy="46" rx="6" ry="7.5" fill="hsl(250 30% 18%)" />
      <ellipse cx="60" cy="46" rx="6" ry="7.5" fill="hsl(250 30% 18%)" />
      <circle cx="42" cy="43" r="2.4" fill="white" />
      <circle cx="62" cy="43" r="2.4" fill="white" />
      <circle cx="38.5" cy="49" r="1.2" fill="white" opacity="0.85" />
      <circle cx="58.5" cy="49" r="1.2" fill="white" opacity="0.85" />

      {/* rosy cheeks */}
      <ellipse cx="32" cy="54" rx="4" ry="2.6" fill="hsl(345 90% 78%)" opacity="0.75" />
      <ellipse cx="68" cy="54" rx="4" ry="2.6" fill="hsl(345 90% 78%)" opacity="0.75" />

      {/* tiny snout + happy mouth */}
      <ellipse cx="50" cy="58" rx="6" ry="4.5" fill="hsl(280 40% 97%)" />
      <circle cx="47" cy="58" r="0.9" fill="hsl(280 30% 70%)" />
      <circle cx="53" cy="58" r="0.9" fill="hsl(280 30% 70%)" />
      <path d="M 46 61 Q 50 64 54 61" stroke="hsl(280 30% 60%)" strokeWidth="1" strokeLinecap="round" fill="none" />
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

export function DancingUnicorns({ onDismiss }: { onDismiss?: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const auto = setTimeout(() => handleClose(), 6500);
    return () => clearTimeout(auto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onDismiss?.(), 500);
  };

  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-50 overflow-hidden transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-success/10 to-transparent" />

      <button
        type="button"
        data-testid="button-dismiss-celebration"
        onClick={handleClose}
        aria-label="Dismiss celebration"
        className="pointer-events-auto absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full border border-foreground/20 bg-background/80 text-foreground/80 backdrop-blur-sm transition-all hover:bg-background hover:text-foreground hover:scale-105"
      >
        <X className="h-5 w-5" />
      </button>
      
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
          <UnicornSVG size={unicorn.size} flipped={i % 2 === 0} seed={unicorn.id} />
        </div>
      ))}

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center px-6">
        <div className="font-mono text-xs sm:text-sm uppercase tracking-[0.45em] text-success mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          Q.E.D. — the stars aligned
        </div>
        <div className="font-display text-6xl sm:text-8xl font-extrabold leading-[0.95] animate-in zoom-in-75 duration-700">
          <span
            className="inline-block animate-rainbow-shift"
            style={{
              backgroundImage:
                "linear-gradient(110deg, hsl(45 100% 74%), hsl(160 84% 54%), hsl(240 60% 80%), hsl(38 95% 60%))",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              filter:
                "drop-shadow(0 0 30px hsl(150 60% 50% / 0.55)) drop-shadow(0 2px 3px hsl(0 0% 0% / 0.35))",
            }}
          >
            The stars
            <br />
            aligned
          </span>
        </div>
        <p className="text-base sm:text-lg text-foreground/85 mt-5 max-w-md mx-auto animate-in fade-in duration-500 delay-300">
          Hypothesis confirmed — your keywords and your story now prove each other.
          The foundation holds.
        </p>
        <button
          type="button"
          data-testid="button-keep-writing"
          onClick={handleClose}
          className="pointer-events-auto mt-7 inline-flex items-center gap-2 rounded-full border border-foreground/25 bg-background/70 px-5 py-2 font-mono text-xs uppercase tracking-[0.2em] text-foreground/85 backdrop-blur-sm transition-all hover:bg-background hover:text-foreground animate-in fade-in duration-500 delay-500"
        >
          Keep writing
        </button>
      </div>
    </div>
  );
}
