export interface ArcBeat {
  key: "hook" | "tension" | "payoff";
  label: string;
  present: boolean;
  hint: string;
}

export interface Appeal {
  key: "ethos" | "pathos" | "logos";
  label: string;
  score: number;
  blurb: string;
}

export interface CoachResult {
  arc: ArcBeat[];
  appeals: Appeal[];
  tips: string[];
  score: number;
  arcComplete: boolean;
}

const HOOK_WORDS = [
  "imagine", "what if", "meet", "introducing", "discover", "ever", "tired of",
  "stop", "why", "the secret", "finally", "say hello",
];

const TENSION_WORDS = [
  "but", "without", "no more", "instead", "struggle", "problem", "hard",
  "frustrat", "tired", "slow", "messy", "chaos", "before", "used to",
  "transform", "turn", "from", "unlike", "beyond",
];

const PAYOFF_WORDS = [
  "now", "today", "get", "start", "join", "save", "results", "grow",
  "win", "love", "enjoy", "effortless", "in minutes", "so you", "finally",
  "discover", "unlock", "achieve", "boost", "free",
];

const ETHOS_WORDS = [
  "trusted", "expert", "proven", "award", "certified", "leading", "official",
  "years", "guarantee", "backed", "rated", "recommended", "authentic", "since",
];

const PATHOS_WORDS = [
  "love", "dream", "feel", "imagine", "delight", "joy", "beautiful", "effortless",
  "happy", "confident", "inspire", "passion", "care", "comfort", "magic", "wonder",
];

const LOGOS_WORDS = [
  "because", "data", "results", "save", "faster", "more", "less", "proven",
  "double", "boost", "increase", "reduce", "%", "x", "step", "method",
];

function countHits(text: string, words: string[]): number {
  const lower = text.toLowerCase();
  return words.reduce((n, w) => (lower.includes(w) ? n + 1 : n), 0);
}

function hasNumbers(text: string): boolean {
  return /\d/.test(text) || /%/.test(text);
}

function clampScore(hits: number, maxForFull: number): number {
  return Math.min(100, Math.round((hits / maxForFull) * 100));
}

export function analyzeStory(story: string): CoachResult {
  const text = story.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const len = text.length;

  const firstChunk = words.slice(0, 5).join(" ").toLowerCase();
  const lastChunk = words.slice(-5).join(" ").toLowerCase();

  const hook =
    text.length > 0 &&
    (countHits(firstChunk, HOOK_WORDS) > 0 ||
      /^["“]/.test(text) ||
      text.trim().endsWith("?") === false && /[A-Z]/.test(text.charAt(0)) && countHits(text, HOOK_WORDS) > 0 ||
      text.includes("?"));

  const tension = countHits(text, TENSION_WORDS) > 0;
  const payoff =
    countHits(lastChunk, PAYOFF_WORDS) > 0 || countHits(text, PAYOFF_WORDS) > 0;

  const arc: ArcBeat[] = [
    {
      key: "hook",
      label: "Hook",
      present: !!hook,
      hint: "Open with a question, a bold claim, or an intriguing promise.",
    },
    {
      key: "tension",
      label: "Tension",
      present: tension,
      hint: "Hint at the problem or the 'before' — what changes because of you.",
    },
    {
      key: "payoff",
      label: "Payoff",
      present: payoff,
      hint: "End on the outcome or a nudge to act: the reward of choosing you.",
    },
  ];

  const ethosHits = countHits(text, ETHOS_WORDS);
  const pathosHits = countHits(text, PATHOS_WORDS);
  const logosHits = countHits(text, LOGOS_WORDS) + (hasNumbers(text) ? 2 : 0);

  const appeals: Appeal[] = [
    {
      key: "ethos",
      label: "Ethos",
      score: clampScore(ethosHits, 3),
      blurb: "Credibility — proof you can be trusted.",
    },
    {
      key: "pathos",
      label: "Pathos",
      score: clampScore(pathosHits, 3),
      blurb: "Emotion — how you make them feel.",
    },
    {
      key: "logos",
      label: "Logos",
      score: clampScore(logosHits, 3),
      blurb: "Logic — concrete reasons and numbers.",
    },
  ];

  const tips: string[] = [];

  if (len === 0) {
    tips.push("Start with one vivid line about what your brand changes for people.");
  } else {
    if (!hook) tips.push("Add a hook up front — a question or bold promise pulls readers in.");
    if (!tension) tips.push("Introduce a little tension: the problem you solve or the 'before' state.");
    if (!payoff) tips.push("Close with the payoff — the result, feeling, or action you want.");

    const strongest = [...appeals].sort((a, b) => b.score - a.score)[0];
    const weakest = [...appeals].sort((a, b) => a.score - b.score)[0];
    if (strongest.score > 0 && weakest.score === 0) {
      tips.push(
        `You lean on ${strongest.label.toLowerCase()}. Mix in a touch of ${weakest.label.toLowerCase()} (${weakest.blurb.toLowerCase()}) for balance.`
      );
    }

    if (len < 90) {
      tips.push(`You have ${160 - len} characters left — add a concrete benefit or detail.`);
    } else if (len > 150) {
      tips.push("You're near the limit — trim filler words so every word earns its place.");
    }

    if (words.length > 0 && !hasNumbers(text)) {
      tips.push("A specific number ('3x faster', '24/7') makes a brand story instantly more credible.");
    }
  }

  const arcPresent = arc.filter((a) => a.present).length;
  const arcComplete = arcPresent === 3;
  const appealAvg = (appeals.reduce((s, a) => s + a.score, 0) / 3) * 0.4;
  const lengthBonus = len > 0 && len <= 160 ? 20 : 0;
  const score = Math.min(
    100,
    Math.round((arcPresent / 3) * 40 + appealAvg + lengthBonus)
  );

  return { arc, appeals, tips: tips.slice(0, 4), score, arcComplete };
}
