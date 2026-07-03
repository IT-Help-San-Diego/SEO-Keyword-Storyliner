export const APPEAL_GLYPHS: Record<string, { greek: string; meaning: string }> = {
  ethos: { greek: "ἦθος", meaning: "character — why they can trust you" },
  pathos: { greek: "πάθος", meaning: "feeling — why a stranger cares" },
  logos: { greek: "λόγος", meaning: "logic — the concrete proof" },
};

export interface ArcBeat {
  key: "hook" | "tension" | "payoff";
  label: string;
  present: boolean;
  hint: string;
  evidence: string | null;
  rule: string;
}

export interface Appeal {
  key: "ethos" | "pathos" | "logos";
  label: string;
  level: number; // 0..3 — honest discrete strength, not a precise percentage
  score: number; // 0..100, derived from level, only for the bar width
  blurb: string;
  evidence: string[];
  why: string;
}

export interface CoachResult {
  arc: ArcBeat[];
  appeals: Appeal[];
  tips: string[];
  score: number;
  arcComplete: boolean;
}

const HOOK_OPENERS = [
  "imagine", "what if", "meet", "introducing", "discover", "ever", "tired of",
  "stop", "why", "the secret", "finally", "say hello", "picture", "ready to",
];

const CLAIM_WORDS = [
  "best", "only", "first", "#1", "world's", "never", "always", "most",
  "leading", "unmatched", "the secret", "#",
];

const TURN_WORDS = [
  "but", "without", "no more", "instead", "unlike", "beyond", "versus", "vs",
  "before", "used to", "transform", "however", "yet", "turned", "turn",
];

const PAYOFF_WORDS = [
  "now", "today", "get", "start", "join", "save", "results", "grow", "win",
  "enjoy", "effortless", "in minutes", "so you", "unlock", "achieve", "boost",
  "free", "try", "book", "shop", "build",
];

const ETHOS_WORDS = [
  "trusted", "expert", "proven", "award", "certified", "leading", "official",
  "guarantee", "backed", "rated", "recommended", "authentic",
];

const PATHOS_WORDS = [
  "love", "loved", "dream", "feel", "delight", "joy", "beautiful", "effortless",
  "happy", "confident", "inspire", "passion", "care", "comfort", "magic",
  "wonder", "heart", "soul", "hope",
];

const LOGOS_WORDS = [
  "because", "data", "results", "faster", "proven", "double", "step", "method",
  "rate", "%", "measured", "tested", "research",
];

const STOPWORDS = new Set(
  "a an and are as at be been but by for from had has have he her his i in into is it its like more most my no not of on one or our she so than that the their them then there these they this to up us was we were what when where which who will with you your".split(
    " ",
  ),
);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Match a lexicon entry only on word/phrase boundaries, so "care" never
// matches inside "career" and "rate" never matches inside "separate".
// Returns the actual matched text (original case) for honest evidence, or null.
function matchEvidence(text: string, w: string): string | null {
  if (w === "%") return text.includes("%") ? "%" : null;
  if (w === "#") return text.includes("#") ? "#" : null;
  const re = new RegExp(`(?:^|[^A-Za-z0-9])(${escapeRegex(w)})(?:[^A-Za-z0-9]|$)`, "i");
  const m = re.exec(text);
  return m ? m[1] : null;
}

// Like matchEvidence but allows a few common inflections (get → gets/getting,
// start → started) without matching unrelated words ("win" does NOT match
// "winter", "free" does NOT match "freezer").
function matchStem(text: string, w: string): string | null {
  if (w === "%" || w === "#") return matchEvidence(text, w);
  const re = new RegExp(
    `(?:^|[^A-Za-z0-9])(${escapeRegex(w)}(?:s|es|ed|ing|d|r)?)(?:[^A-Za-z0-9]|$)`,
    "i",
  );
  const m = re.exec(text);
  return m ? m[1] : null;
}

function strip(w: string): string {
  return w.replace(/^[^A-Za-z0-9#]+|[^A-Za-z0-9'’.\-]+$/g, "");
}

function isTitleCase(w: string): boolean {
  const c = strip(w);
  return c.length > 1 && /^[A-Z]/.test(c) && /[a-z]/.test(c);
}

function hasInternalCap(w: string): boolean {
  const c = strip(w);
  return c.length > 1 && /[A-Z]/.test(c.slice(1));
}

function unique(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of arr) {
    const k = a.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(a);
    }
  }
  return out;
}

function findHits(text: string, words: string[]): string[] {
  const hits: string[] = [];
  for (const w of words) {
    const m = matchEvidence(text, w);
    if (m) hits.push(m);
  }
  return unique(hits);
}

// Hook — a confident, specific opening. Counts when the opening names a
// subject, asks a question, opens with a quote, uses a curiosity opener, or
// makes a bold claim. Deliberately ignores a plain, generic opener.
function detectHook(text: string, words: string[]): { present: boolean; evidence: string | null } {
  if (!text) return { present: false, evidence: null };
  const head = words.slice(0, 6);
  const headStr = head.join(" ");

  for (const w of HOOK_OPENERS) {
    const m = matchStem(headStr, w);
    if (m) return { present: true, evidence: m };
  }
  if (/^\s*["“'‘]/.test(text)) return { present: true, evidence: "opens with a quote" };
  if (text.includes("?")) return { present: true, evidence: "asks a question" };

  const headTokens = head.filter((w) => /[A-Za-z]/.test(w));
  for (let i = 0; i < headTokens.length - 1; i++) {
    if (isTitleCase(headTokens[i]) && isTitleCase(headTokens[i + 1])) {
      return { present: true, evidence: `${strip(headTokens[i])} ${strip(headTokens[i + 1])}` };
    }
  }
  for (const w of headTokens) {
    if (hasInternalCap(w)) return { present: true, evidence: strip(w) };
  }

  for (const w of CLAIM_WORDS) {
    const m = matchStem(headStr, w);
    if (m) return { present: true, evidence: m };
  }
  return { present: false, evidence: null };
}

// Tension — narrative movement: a contrast/turn, a journey through time
// (a founding date or "since"), or an em-dash turn.
function detectTension(text: string, lower: string): { present: boolean; evidence: string | null } {
  const sinceYear = text.match(/\bsince\s+((?:1[5-9]|20)\d{2})\b/i);
  if (sinceYear) return { present: true, evidence: sinceYear[0] };
  if (/\bfrom\b[^.]*?\bto\b/.test(lower)) return { present: true, evidence: "from … to" };
  for (const w of TURN_WORDS) {
    const m = matchEvidence(text, w);
    if (m) return { present: true, evidence: m };
  }
  if (/\bfounded\b/i.test(text)) return { present: true, evidence: "founded" };
  const year = text.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  if (year) return { present: true, evidence: year[0] };
  if (/\bsince\b/i.test(text)) return { present: true, evidence: "since" };
  if (/—|–/.test(text)) return { present: true, evidence: "a turn (—)" };
  return { present: false, evidence: null };
}

// Payoff — the landing: a result/action word near the end, or a short,
// confident closing identity.
function detectPayoff(text: string, words: string[]): { present: boolean; evidence: string | null } {
  if (!text) return { present: false, evidence: null };
  const tail = words.slice(-6).join(" ");
  for (const w of PAYOFF_WORDS) {
    const m = matchStem(tail, w);
    if (m) return { present: true, evidence: m };
  }
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const last = sentences[sentences.length - 1];
  if (last) {
    const lw = last.split(/\s+/).filter(Boolean);
    if (lw.length >= 2 && lw.length <= 5) {
      const titled = lw.filter((w) => isTitleCase(w) || hasInternalCap(w)).length;
      if (titled >= Math.ceil(lw.length / 2)) return { present: true, evidence: last };
    }
  }
  return { present: false, evidence: null };
}

function buildAppeal(
  key: Appeal["key"],
  label: string,
  blurb: string,
  evidence: string[],
  why: (first: string) => string,
): Appeal {
  const level = Math.min(3, evidence.length);
  const widths = [0, 40, 70, 100];
  const score = widths[level];
  const whyText =
    evidence.length === 0
      ? "no signal yet"
      : why(evidence[0]) + (evidence.length > 1 ? ` (+${evidence.length - 1} more)` : "");
  return { key, label, level, score, blurb, evidence, why: whyText };
}

function detectAppeals(text: string): Appeal[] {
  const heritage: string[] = [];
  const sinceYear = text.match(/\bsince\s+((?:1[5-9]|20)\d{2})\b/i);
  if (sinceYear) heritage.push(sinceYear[0]);
  else if (/\bsince\b/i.test(text)) heritage.push("since");
  if (/\bfounded\b/i.test(text)) heritage.push("founded");

  const ethosEv = unique([...heritage, ...findHits(text, ETHOS_WORDS)]);
  const pathosEv = findHits(text, PATHOS_WORDS);

  const logosRaw: string[] = [];
  const numbers = text.match(/\b\d[\d,.]*%?\b/g);
  if (numbers) logosRaw.push(...numbers.slice(0, 2));
  logosRaw.push(...findHits(text, LOGOS_WORDS));
  const logosEv = unique(logosRaw);

  return [
    buildAppeal(
      "ethos",
      "Ethos",
      "Credibility — proof you can be trusted.",
      ethosEv,
      (e) => (heritage.includes(e) ? `heritage signal: '${e}'` : `a trust signal: '${e}'`),
    ),
    buildAppeal(
      "pathos",
      "Pathos",
      "Emotion — how you make them feel.",
      pathosEv,
      (e) => `an emotional cue: '${e}'`,
    ),
    buildAppeal(
      "logos",
      "Logos",
      "Logic — concrete reasons and facts.",
      logosEv,
      (e) => `a concrete fact: '${e}'`,
    ),
  ];
}

function buildTips(
  words: string[],
  len: number,
  arc: ArcBeat[],
  appeals: Appeal[],
): string[] {
  const tips: string[] = [];
  if (len === 0) {
    tips.push("Start with one vivid line about what your brand changes for people.");
    return tips;
  }

  const [hook, tension, payoff] = arc;
  if (!hook.present)
    tips.push("Open with something specific — name your brand, ask a question, or make a bold, true claim.");
  if (!tension.present)
    tips.push("Add a little movement: a date you started, a contrast, or the change you bring.");
  if (!payoff.present)
    tips.push("Land it — close on the outcome, a nudge to act, or a confident statement of who you are.");

  const sorted = [...appeals].sort((a, b) => b.level - a.level);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  if (strongest.level > 0 && weakest.level === 0) {
    tips.push(
      `You lean on ${strongest.label.toLowerCase()}. A touch of ${weakest.label.toLowerCase()} (${weakest.blurb.toLowerCase()}) would round it out.`,
    );
  }

  const freq: Record<string, number> = {};
  for (const w of words) {
    const c = w.toLowerCase().replace(/[^a-z0-9'’-]/g, "");
    if (c.length > 3 && !STOPWORDS.has(c)) freq[c] = (freq[c] || 0) + 1;
  }
  const repeated = Object.entries(freq)
    .filter(([, n]) => n >= 4)
    .sort((a, b) => b[1] - a[1])[0];
  if (repeated) {
    tips.push(
      `You use "${repeated[0]}" ${repeated[1]} times — once, woven in naturally, reads better and avoids keyword stuffing.`,
    );
  }

  if (len < 90) tips.push(`You have ${160 - len} characters left — room for one concrete detail.`);
  else if (len > 150) tips.push("You're near the limit — trim filler so every word earns its place.");

  if (appeals[2].level === 0)
    tips.push("A concrete fact (a year, a number, a place) makes a story instantly more believable.");

  return tips.slice(0, 4);
}

export function analyzeStory(story: string): CoachResult {
  const text = story.trim();
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const len = text.length;

  const hookR = detectHook(text, words);
  const tensionR = detectTension(text, lower);
  const payoffR = detectPayoff(text, words);

  const arc: ArcBeat[] = [
    {
      key: "hook",
      label: "Hook",
      present: hookR.present,
      evidence: hookR.evidence,
      hint: "Open with a question, a bold claim, a quote, or by naming your subject.",
      rule: "Counts when the opening names a specific subject, asks a question, opens with a quote, uses a curiosity opener, or makes a bold claim.",
    },
    {
      key: "tension",
      label: "Tension",
      present: tensionR.present,
      evidence: tensionR.evidence,
      hint: "Hint at movement — a contrast, a journey through time, or the change you bring.",
      rule: "Counts on a contrast/turn word, a 'from … to', a founding date or 'since', or an em-dash turn.",
    },
    {
      key: "payoff",
      label: "Payoff",
      present: payoffR.present,
      evidence: payoffR.evidence,
      hint: "End on the outcome, a nudge to act, or a confident statement of who you are.",
      rule: "Counts on a result/action word near the end, or a short, confident closing identity.",
    },
  ];

  const appeals = detectAppeals(text);
  const tips = buildTips(words, len, arc, appeals);

  const arcPresent = arc.filter((a) => a.present).length;
  const arcComplete = arcPresent === 3;
  const appealAvg = appeals.reduce((s, a) => s + a.score, 0) / 3;
  const lengthBonus = len > 0 && len <= 160 ? 20 : 0;
  const score = Math.min(100, Math.round((arcPresent / 3) * 40 + appealAvg * 0.4 + lengthBonus));

  return { arc, appeals, tips, score, arcComplete };
}
