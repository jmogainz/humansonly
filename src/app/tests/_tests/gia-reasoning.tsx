'use client';

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, generateRecentUnique, generateSessionUnique, shuffle } from '@/lib/utils';
import Timer, { formatTime } from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import Scoreboard from '@/components/Scoreboard';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';
import { BASE_SYNONYM_BY_BASE } from './reasoningSynonyms';

const NAMES = [
  // Easter eggs + cool names.
  'Bob', 'Maurice', 'Parker', 'Jacob', 'Drake', 'Braden',
  'Xion', 'Jade', 'Darrow', 'Pax', 'Orion', 'Mustang', 'Cassius', 'Sevro',
  'Ragnar', 'Victra', 'Roque', 'Lyria', 'Kavax', 'Aja', 'Holiday', 'Atlas',
  'Kaladin', 'Adolin', 'Shallan', 'Jasnah', 'Renarin', 'Navani', 'Szeth', 'Teft', 'Lopen', 'Lift',
  'Paul', 'Chani', 'Stilgar', 'Duncan', 'Gurney', 'Irulan', 'Leto', 'Alia', 'Jamis', 'Thufir', 'Feyd',
];
const NAME_POOL = Array.from(new Set(NAMES));

// Each pair: [base adjective, comparative, opposite comparative]
const ADJECTIVE_PAIRS: [string, string, string][] = [
  ['strong', 'stronger', 'weaker'],
  ['fast', 'faster', 'slower'],
  ['tall', 'taller', 'shorter'],
  ['brave', 'braver', 'more fearful'],
  ['calm', 'calmer', 'more anxious'],
  ['friendly', 'friendlier', 'more hostile'],
  ['smart', 'smarter', 'dimmer'],
  ['organized', 'more organized', 'more chaotic'],
  ['patient', 'more patient', 'more impulsive'],
  ['kind', 'kinder', 'crueler'],
  ['creative', 'more creative', 'duller'],
  ['focused', 'more focused', 'more distracted'],
  ['heavy', 'heavier', 'lighter'],
  ['rich', 'richer', 'poorer'],
  ['happy', 'happier', 'sadder'],
  ['loud', 'louder', 'quieter'],
  ['bright', 'brighter', 'dimmer'],
  ['old', 'older', 'younger'],
  ['large', 'larger', 'smaller'],
  ['hard', 'harder', 'softer'],
  ['good', 'better', 'worse'],
  ['wide', 'wider', 'narrower'],
  ['deep', 'deeper', 'shallower'],
  ['sharp', 'sharper', 'blunter'],
  ['smooth', 'smoother', 'rougher'],
  ['thick', 'thicker', 'thinner'],
  ['clean', 'cleaner', 'dirtier'],
  ['hot', 'hotter', 'colder'],
  ['dry', 'drier', 'wetter'],
  ['tough', 'tougher', 'more fragile'],
  ['bold', 'bolder', 'more timid'],
  ['wealthy', 'wealthier', 'needier'],
  ['energetic', 'more energetic', 'more lethargic'],
  ['generous', 'more generous', 'stingier'],
  ['honest', 'more honest', 'more deceitful'],
  ['loyal', 'more loyal', 'more fickle'],
  ['modest', 'more modest', 'vainer'],
  ['polite', 'more polite', 'ruder'],
  ['reliable', 'more reliable', 'more erratic'],
  ['wise', 'wiser', 'more foolish'],
  ['agile', 'more agile', 'clumsier'],
  ['vibrant', 'more vibrant', 'duller'],
  ['steady', 'steadier', 'shakier'],
  ['mature', 'more mature', 'less mature'],
  ['graceful', 'more graceful', 'more awkward'],
  ['ambitious', 'more ambitious', 'lazier'],
  ['talkative', 'more talkative', 'quieter'],
  ['optimistic', 'more optimistic', 'more pessimistic'],
  ['curious', 'more curious', 'more indifferent'],
  ['flexible', 'more flexible', 'more rigid'],
  ['humble', 'more humble', 'more arrogant'],
  ['cautious', 'more cautious', 'more reckless'],
  ['efficient', 'more efficient', 'more wasteful'],
  ['stable', 'more stable', 'shakier'],
  ['clear', 'clearer', 'vaguer'],
  ['simple', 'simpler', 'more complex'],
  ['modern', 'more modern', 'more ancient'],
  ['expensive', 'more expensive', 'cheaper'],
  ['valuable', 'more valuable', 'less valuable'],
  ['rare', 'rarer', 'more common'],
  ['famous', 'more famous', 'more obscure'],
  ['popular', 'more popular', 'more disliked'],
  ['safe', 'safer', 'more dangerous'],
  ['beautiful', 'more beautiful', 'uglier'],
  ['pleasant', 'more pleasant', 'nastier'],
  ['sweet', 'sweeter', 'sourer'],
  ['fresh', 'fresher', 'staler'],
  ['shiny', 'shinier', 'duller'],
  ['near', 'nearer', 'farther'],
  ['early', 'earlier', 'later'],
  ['active', 'more active', 'more passive'],
  ['alert', 'more alert', 'sleepier'],
  ['careful', 'more careful', 'more careless'],
  ['cheerful', 'more cheerful', 'gloomier'],
  ['clever', 'cleverer', 'stupider'],
  ['confident', 'more confident', 'more insecure'],
  ['diligent', 'more diligent', 'lazier'],
  ['distant', 'more distant', 'closer'],
  ['exciting', 'more exciting', 'more boring'],
  ['firm', 'firmer', 'looser'],
  ['funny', 'funnier', 'more serious'],
  ['guilty', 'guiltier', 'more innocent'],
  ['helpful', 'more helpful', 'more helpless'],
  ['important', 'more important', 'more trivial'],
  ['logical', 'more logical', 'more illogical'],
  ['long', 'longer', 'shorter'],
  ['lucky', 'luckier', 'less lucky'],
  ['messy', 'messier', 'neater'],
  ['mighty', 'mightier', 'weaker'],
  ['mild', 'milder', 'harsher'],
  ['moral', 'more moral', 'more immoral'],
  ['mysterious', 'more mysterious', 'more obvious'],
  ['natural', 'more natural', 'more artificial'],
  ['necessary', 'more necessary', 'more optional'],
  ['noble', 'nobler', 'meaner'],
  ['noisy', 'noisier', 'quieter'],
  ['normal', 'more normal', 'more abnormal'],
  ['objective', 'more objective', 'more subjective'],
  ['ordinary', 'more ordinary', 'more special'],
  ['outgoing', 'more outgoing', 'shyer'],
  ['painful', 'more painful', 'less painful'],
  ['pale', 'paler', 'darker'],
  ['perfect', 'more perfect', 'more imperfect'],
  ['permanent', 'more permanent', 'more temporary'],
  ['plain', 'plainer', 'fancier'],
  ['plentiful', 'more plentiful', 'scarcer'],
  ['powerful', 'more powerful', 'weaker'],
  ['precise', 'more precise', 'vaguer'],
  ['pretty', 'prettier', 'uglier'],
  ['primitive', 'more primitive', 'more advanced'],
  ['proud', 'prouder', 'more humble'],
  ['pure', 'purer', 'dirtier'],
  ['quick', 'quicker', 'slower'],
  ['real', 'more real', 'faker'],
  ['relaxed', 'more relaxed', 'more tense'],
  ['resilient', 'more resilient', 'more brittle'],
  ['responsible', 'more responsible', 'more careless'],
  ['risky', 'riskier', 'safer'],
  ['robust', 'more robust', 'weaker'],
  ['sane', 'saner', 'more insane'],
  ['secret', 'more secret', 'more open'],
  ['severe', 'more severe', 'milder'],
  ['silent', 'more silent', 'louder'],
  ['sincere', 'more sincere', 'more insincere'],
  ['skillful', 'more skillful', 'clumsier'],
  ['skinny', 'skinnier', 'fatter'],
  ['sleek', 'sleeker', 'rougher'],
  ['slight', 'slighter', 'more massive'],
  ['slim', 'slimmer', 'fatter'],
  ['sloppy', 'sloppier', 'neater'],
  ['smug', 'smugger', 'more modest'],
  ['sociable', 'more sociable', 'less sociable'],
  ['speedy', 'speedier', 'slower'],
  ['stern', 'sterner', 'kinder'],
  ['stubborn', 'more stubborn', 'more flexible'],
  ['sturdy', 'sturdier', 'weaker'],
  ['submissive', 'more submissive', 'more dominant'],
  ['succinct', 'more succinct', 'wordier'],
  ['sure', 'surer', 'more doubtful'],
  ['suspicious', 'more suspicious', 'more trusting'],
  ['swift', 'swifter', 'slower'],
  ['symmetrical', 'more symmetrical', 'more asymmetrical'],
  ['tame', 'tamer', 'wilder'],
  ['tangible', 'more tangible', 'more abstract'],
  ['tedious', 'more tedious', 'more exciting'],
  ['temporary', 'more temporary', 'more permanent'],
  ['tense', 'more tense', 'more relaxed'],
  ['tentative', 'more tentative', 'more certain'],
  ['terrible', 'more terrible', 'more wonderful'],
  ['terse', 'terser', 'wordier'],
  ['thorough', 'more thorough', 'more careless'],
  ['thrifty', 'thriftier', 'more extravagant'],
  ['thrilling', 'more thrilling', 'more boring'],
  ['tidy', 'tidier', 'messier'],
  ['timely', 'timelier', 'later'],
  ['tolerant', 'more tolerant', 'more narrow-minded'],
  ['traditional', 'more traditional', 'more modern'],
  ['transparent', 'more transparent', 'more opaque'],
  ['treacherous', 'more treacherous', 'more faithful'],
  ['tricky', 'trickier', 'simpler'],
  ['troubled', 'more troubled', 'calmer'],
  ['true', 'truer', 'less true'],
  ['trustworthy', 'more trustworthy', 'more deceitful'],
  ['truthful', 'more truthful', 'more dishonest'],
  ['typical', 'more typical', 'more atypical'],
  ['unique', 'more unique', 'more ordinary'],
  ['upright', 'more upright', 'more dishonest'],
  ['urgent', 'more urgent', 'more trivial'],
  ['useful', 'more useful', 'more useless'],
  ['usual', 'more usual', 'rarer'],
  ['vague', 'vaguer', 'clearer'],
  ['vain', 'vainer', 'more modest'],
  ['valiant', 'more valiant', 'more cowardly'],
  ['valid', 'more valid', 'less valid'],
  ['variable', 'more variable', 'more fixed'],
  ['vast', 'vaster', 'tinier'],
  ['vehement', 'more vehement', 'calmer'],
  ['verbose', 'more verbose', 'terser'],
  ['vicious', 'more vicious', 'kinder'],
  ['victorious', 'more victorious', 'more beaten'],
  ['vigilant', 'more vigilant', 'more careless'],
  ['vigorous', 'more vigorous', 'weaker'],
  ['vile', 'more vile', 'nobler'],
  ['violent', 'more violent', 'more peaceful'],
  ['virtuous', 'more virtuous', 'more wicked'],
  ['visible', 'more visible', 'more hidden'],
  ['visionary', 'more visionary', 'more practical'],
  ['vital', 'more vital', 'more trivial'],
  ['vivacious', 'more vivacious', 'duller'],
  ['vivid', 'more vivid', 'paler'],
  ['vocal', 'more vocal', 'quieter'],
  ['volatile', 'more volatile', 'more stable'],
  ['vulgar', 'more vulgar', 'more refined'],
  ['vulnerable', 'more vulnerable', 'more secure'],
  ['wary', 'warier', 'more trusting'],
  ['wasteful', 'more wasteful', 'thriftier'],
  ['wealthy', 'wealthier', 'poorer'],
  ['weary', 'wearier', 'fresher'],
  ['weighty', 'weightier', 'more trivial'],
  ['weird', 'weirder', 'more normal'],
  ['wicked', 'more wicked', 'holier'],
  ['wild', 'wilder', 'tamer'],
  ['willing', 'more willing', 'more reluctant'],
  ['wily', 'wilier', 'more candid'],
  ['witty', 'wittier', 'duller'],
  ['wonderful', 'more wonderful', 'more awful'],
  ['wordy', 'wordier', 'terser'],
  ['worldly', 'worldlier', 'more spiritual'],
  ['worried', 'more worried', 'calmer'],
  ['youthful', 'more youthful', 'more wizened'],
];

const BANNED_REASONING_TERMS = new Set([
  'stupider',
  'faker',
  'more perfect',
  'more unique',
  'more beaten',
]);

function normalizeTerm(value: string): string {
  return value.trim().toLowerCase();
}

function hasMalformedComparative(value: string): boolean {
  const normalized = normalizeTerm(value);
  if (BANNED_REASONING_TERMS.has(normalized)) return true;
  if (normalized.startsWith('more ')) return false;
  if (normalized.startsWith('less ')) return false;
  if (normalized === 'better' || normalized === 'worse') return false;
  return !normalized.endsWith('er');
}

function isHighQualityPair([base, comparative, opposite]: [string, string, string]): boolean {
  const normalizedBase = normalizeTerm(base);
  const normalizedComp = normalizeTerm(comparative);
  const normalizedOpp = normalizeTerm(opposite);

  if (!normalizedBase || !normalizedComp || !normalizedOpp) return false;
  if (normalizedBase === 'perfect' || normalizedBase === 'unique') return false;
  if (hasMalformedComparative(normalizedComp)) return false;
  if (BANNED_REASONING_TERMS.has(normalizedOpp)) return false;
  if (normalizedComp === normalizedOpp) return false;
  if (normalizedComp === normalizedBase || normalizedOpp === normalizedBase) return false;

  return true;
}

const QUALITY_ADJECTIVE_PAIRS: [string, string, string][] = (() => {
  const seenBases = new Set<string>();
  const output: [string, string, string][] = [];
  for (const pair of ADJECTIVE_PAIRS) {
    const baseKey = normalizeTerm(pair[0]);
    if (seenBases.has(baseKey)) continue;
    if (!isHighQualityPair(pair)) continue;
    seenBases.add(baseKey);
    output.push(pair);
  }
  return output;
})();

type ReasoningDifficulty = 'easy' | 'hard';

const REASONING_DIFFICULTIES: ReasoningDifficulty[] = ['easy', 'hard'];

const ADVANCED_REASONING_BASES = new Set([
  'treacherous',
  'vivacious',
  'vehement',
  'mysterious',
  'transparent',
  'symmetrical',
  'tentative',
  'succinct',
  'resilient',
  'volatile',
  'vulnerable',
  'objective',
  'primitive',
  'visionary',
  'vigorous',
  'vigilant',
  'tolerant',
  'thrifty',
  'terse',
  'typical',
  'valiant',
  'variable',
  'victorious',
]);

function pickFrom<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

const IRREGULAR_COMPARATIVES: Record<string, string> = {
  bad: 'worse',
  far: 'farther',
  good: 'better',
  ill: 'worse',
  little: 'less',
  many: 'more',
  much: 'more',
  well: 'better',
};

const SYNONYM_COMPARATIVE_OVERRIDES: Record<string, string> = {
  brave: 'braver',
  bright: 'brighter',
  brief: 'briefer',
  broad: 'broader',
  calm: 'calmer',
  clean: 'cleaner',
  clever: 'more clever',
  clear: 'clearer',
  close: 'closer',
  cool: 'cooler',
  costly: 'costlier',
  crisp: 'crisper',
  crude: 'cruder',
  cruel: 'crueler',
  dense: 'denser',
  dirty: 'dirtier',
  fast: 'faster',
  fierce: 'fiercer',
  frail: 'frailer',
  friendly: 'friendlier',
  gentle: 'gentler',
  glossy: 'glossier',
  harsh: 'harsher',
  hefty: 'heftier',
  keen: 'keener',
  kind: 'kinder',
  lengthy: 'lengthier',
  lively: 'livelier',
  lofty: 'loftier',
  loud: 'louder',
  long: 'longer',
  nasty: 'nastier',
  neat: 'neater',
  nimble: 'nimbler',
  noisy: 'noisier',
  old: 'older',
  plain: 'plainer',
  proud: 'prouder',
  quiet: 'quieter',
  rough: 'rougher',
  short: 'shorter',
  sleek: 'sleeker',
  simple: 'simpler',
  smooth: 'smoother',
  sore: 'sorer',
  steady: 'steadier',
  strong: 'stronger',
  strange: 'stranger',
  strict: 'stricter',
  thin: 'thinner',
  tough: 'tougher',
  warm: 'warmer',
  weak: 'weaker',
  wealthy: 'wealthier',
  young: 'younger',
};

function shouldUseYComparativeFallback(word: string): boolean {
  if (word.length > 6 || !word.endsWith('y')) return false;
  const previous = word[word.length - 2];
  return !'aeiou'.includes(previous);
}

function inflectErComparative(word: string): string {
  if (word.endsWith('y') && word.length > 2 && !'aeiou'.includes(word[word.length - 2])) {
    return `${word.slice(0, -1)}ier`;
  }
  if (word.endsWith('e')) return `${word}r`;
  if (/[^aeiou][aeiou][^aeiouywx]$/.test(word) && word.length <= 5) {
    return `${word}${word[word.length - 1]}er`;
  }
  return `${word}er`;
}

function comparativeForAdjective(word: string): string {
  const normalized = normalizeTerm(word);
  const irregular = IRREGULAR_COMPARATIVES[normalized];
  if (irregular) return irregular;
  const override = SYNONYM_COMPARATIVE_OVERRIDES[normalized];
  if (override) return override;
  if (shouldUseYComparativeFallback(normalized)) return inflectErComparative(normalized);
  return `more ${normalized}`;
}

type BaseVariant = {
  word: string;
  usedSynonym: boolean;
  key: string;
};

function synonymProbabilityForDifficulty(difficulty: ReasoningDifficulty): number {
  if (difficulty === 'easy') return 0.35;
  return 0.8;
}

function getBaseVariants(base: string): string[] {
  const normalized = normalizeTerm(base);
  const synonym = BASE_SYNONYM_BY_BASE[normalized];
  if (!synonym || synonym === normalized) return [normalized];
  return [normalized, synonym];
}

function pickBaseVariant(base: string, difficulty: ReasoningDifficulty, preferSynonym = false): BaseVariant {
  const variants = getBaseVariants(base);
  const baseWord = normalizeTerm(base);
  if (variants.length <= 1) {
    return { word: baseWord, usedSynonym: false, key: baseWord };
  }

  const synonym = variants.find((v) => v !== baseWord) ?? baseWord;
  const baseChance = synonymProbabilityForDifficulty(difficulty);
  const synonymChance = Math.min(0.97, baseChance + (preferSynonym ? 0.18 : 0));
  const useSynonym = Math.random() < synonymChance;
  if (useSynonym) {
    return { word: synonym, usedSynonym: true, key: synonym };
  }
  return { word: baseWord, usedSynonym: false, key: baseWord };
}

function buildPositiveDescriptor(
  base: string,
  canonicalComparative: string,
  difficulty: ReasoningDifficulty,
  preferSynonym = false
): { text: string; key: string } {
  const variant = pickBaseVariant(base, difficulty, preferSynonym);
  if (!variant.usedSynonym) {
    return { text: canonicalComparative, key: canonicalComparative };
  }
  const text = comparativeForAdjective(variant.word);
  return { text, key: text };
}

function buildBaseDescriptor(
  mode: 'plain' | 'less',
  base: string,
  difficulty: ReasoningDifficulty,
  preferSynonym = false
): { text: string; key: string } {
  const variant = pickBaseVariant(base, difficulty, preferSynonym);
  if (mode === 'plain') {
    return { text: variant.word, key: variant.key };
  }
  return { text: `less ${variant.word}`, key: `less ${variant.key}` };
}

function pairComplexityScore([base, comparative, opposite]: [string, string, string]): number {
  let score = 0;
  if (comparative.startsWith('more ')) score += 1;
  if (opposite.startsWith('more ') || opposite.startsWith('less ')) score += 1;
  if (base.length >= 8) score += 1;
  if (base.includes('-') || opposite.includes('-') || opposite.includes(' ')) score += 1;
  if (base.startsWith('un') || opposite.startsWith('more un')) score += 1;
  if (ADVANCED_REASONING_BASES.has(base)) score += 1;
  return score;
}

function classifyPairDifficulty(pair: [string, string, string]): ReasoningDifficulty {
  const score = pairComplexityScore(pair);
  if (score <= 2) return 'easy';
  return 'hard';
}

const PAIRS_BY_DIFFICULTY: Record<ReasoningDifficulty, [string, string, string][]> = {
  easy: [],
  hard: [],
};

for (const pair of QUALITY_ADJECTIVE_PAIRS) {
  PAIRS_BY_DIFFICULTY[classifyPairDifficulty(pair)].push(pair);
}

function statementFormsForDifficulty(difficulty: ReasoningDifficulty): number[] {
  if (difficulty === 'easy') return [0];
  return [1, 2];
}

function questionFormsForDifficulty(difficulty: ReasoningDifficulty): number[] {
  if (difficulty === 'easy') return [0, 1];
  return [1, 2];
}

type Round = {
  statement: string;
  question: string;
  names: string[];
  options: string[];
  answer: string;
  signature: string;
};

function makeRoundRaw(difficulty: ReasoningDifficulty): Round {
  const nameA = generateRecentUnique(
    'gia-reasoning-names',
    20,
    () => NAME_POOL[randomInt(0, NAME_POOL.length - 1)],
    (n) => n
  );
  let nameB = NAME_POOL[randomInt(0, NAME_POOL.length - 1)];
  while (nameB === nameA) {
    nameB = NAME_POOL[randomInt(0, NAME_POOL.length - 1)];
  }
  const difficultyPool = PAIRS_BY_DIFFICULTY[difficulty];
  const fallbackPool = difficulty === 'easy' ? PAIRS_BY_DIFFICULTY.hard : PAIRS_BY_DIFFICULTY.easy;
  const pairPool =
    difficultyPool.length > 0
      ? difficultyPool
      : fallbackPool.length > 0
        ? fallbackPool
        : QUALITY_ADJECTIVE_PAIRS;
  const [base, comparative, oppositeComp] = pickFrom(pairPool);

  // Statement forms:
  // 1. "A is taller than B"        → A is superior
  // 2. "A is not as tall as B"     → B is superior
  // 3. "A is less tall than B"     → B is superior
  const statementForm = pickFrom(statementFormsForDifficulty(difficulty));

  let superior: string;
  let inferior: string;
  let statement: string;
  let statementKey: string;

  if (statementForm === 0) {
    // "A is taller than B" / "A is more tranquil than B" → A is superior
    const descriptor = buildPositiveDescriptor(base, comparative, difficulty, difficulty !== 'easy');
    statement = `${nameA} is ${descriptor.text} than ${nameB}.`;
    statementKey = `s0:${descriptor.key}`;
    superior = nameA;
    inferior = nameB;
  } else if (statementForm === 1) {
    // "A is not as tall/tranquil as B" → B is superior
    const descriptor = buildBaseDescriptor('plain', base, difficulty, difficulty !== 'easy');
    statement = `${nameA} is not as ${descriptor.text} as ${nameB}.`;
    statementKey = `s1:${descriptor.key}`;
    superior = nameB;
    inferior = nameA;
  } else {
    // "A is less tall/tranquil than B" → B is superior
    const descriptor = buildBaseDescriptor('less', base, difficulty, true);
    statement = `${nameA} is ${descriptor.text} than ${nameB}.`;
    statementKey = `s2:${descriptor.key}`;
    superior = nameB;
    inferior = nameA;
  }

  // Question forms:
  // 1. "Who is taller?"       → superior
  // 2. "Who is shorter?"      → inferior
  // 3. "Who is less tall?"    → inferior
  const questionForm = pickFrom(questionFormsForDifficulty(difficulty));

  let questionAdj: string;
  let answer: string;
  let questionKey: string;

  if (questionForm === 0) {
    const descriptor = buildPositiveDescriptor(
      base,
      comparative,
      difficulty,
      difficulty === 'hard'
    );
    questionAdj = descriptor.text;
    questionKey = `q0:${descriptor.key}`;
    answer = superior;
  } else if (questionForm === 1) {
    const useSynonymInversePrompt = difficulty === 'hard' && Math.random() < 0.72;
    if (useSynonymInversePrompt) {
      const descriptor = buildBaseDescriptor('less', base, difficulty, true);
      questionAdj = descriptor.text;
      questionKey = `q1:${descriptor.key}`;
    } else {
      questionAdj = oppositeComp;
      questionKey = `q1:${oppositeComp}`;
    }
    answer = inferior;
  } else {
    const descriptor = buildBaseDescriptor('less', base, difficulty, true);
    questionAdj = descriptor.text;
    questionKey = `q2:${descriptor.key}`;
    answer = inferior;
  }

  const question = `Who is ${questionAdj}?`;

  return {
    statement,
    question,
    names: [nameA, nameB],
    options: shuffle([nameA, nameB]),
    answer,
    signature: `${nameA}|${nameB}|${base}|${statementForm}|${questionForm}|${difficulty}|${statementKey}|${questionKey}`,
  };
}

type ReasoningDifficultyCounts = Record<ReasoningDifficulty, number>;

function pickBalancedReasoningDifficulty(counts: ReasoningDifficultyCounts): ReasoningDifficulty {
  if (counts.easy < counts.hard) return 'easy';
  if (counts.hard < counts.easy) return 'hard';
  return REASONING_DIFFICULTIES[randomInt(0, REASONING_DIFFICULTIES.length - 1)];
}

function reserveNextReasoningDifficulty(counts: ReasoningDifficultyCounts): ReasoningDifficulty {
  const next = pickBalancedReasoningDifficulty(counts);
  counts[next] += 1;
  return next;
}

function makeRound(seenSignatures: Set<string>, difficulty: ReasoningDifficulty): Round {
  return generateSessionUnique(
    seenSignatures,
    () =>
      generateRecentUnique(
        'gia-reasoning',
        15,
        () => makeRoundRaw(difficulty),
        (r) => r.signature
      ),
    (r) => r.signature
  );
}

// Worst-case reference strings — font size is always derived from these,
// never from the current question text, so sizing stays constant across rounds.
const LONGEST_STATEMENT = "Beatrice is not as self-satisfied as Lachlan.";

function FitText({ text, sizeText }: { text: string; sizeText: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    const ruler = rulerRef.current;
    const parent = el?.parentElement;
    if (!el || !ruler || !parent) return;

    const fit = () => {
      ruler.style.fontSize = '36px';
      const available = parent.clientWidth;
      if (available <= 0) return;
      const textWidth = ruler.scrollWidth;
      el.style.fontSize = textWidth > available
        ? `${(36 * available / textWidth).toFixed(1)}px`
        : '36px';
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  return (
    <>
      <span
        ref={rulerRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          fontWeight: 600,
          pointerEvents: 'none',
          top: '-9999px',
          left: '-9999px',
        }}
      >
        {sizeText}
      </span>
      <h2
        ref={ref}
        style={{ margin: 0, fontWeight: 600, lineHeight: 1.3, whiteSpace: 'nowrap' }}
      >
        {text}
      </h2>
    </>
  );
}

export default function GiaReasoningTest({ definition, onComplete }: TestGameProps) {
  const seenRoundSignaturesRef = useRef<Set<string>>(new Set());
  const difficultyCountsRef = useRef<ReasoningDifficultyCounts>({ easy: 0, hard: 0 });
  const [round, setRound] = useState<Round>(() => {
    const initialDifficulty = reserveNextReasoningDifficulty(difficultyCountsRef.current);
    return makeRound(seenRoundSignaturesRef.current, initialDifficulty);
  });
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [netStatus, setNetStatus] = useState<'success' | 'danger' | 'neutral'>('neutral');
  const [phase, setPhase] = useState<'statement' | 'question'>('statement');
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const submittedRef = useRef(false);
  const statsRef = useRef({ correct: 0, incorrect: 0 });

  const score = useMemo(() => {
    const s = correct - incorrect * 1;
    return s < 0 ? 0 : s;
  }, [correct, incorrect]);

  const complete = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setFinished(true);
    const finalCorrect = statsRef.current.correct;
    const finalIncorrect = statsRef.current.incorrect;
    const finalScore = Math.max(0, finalCorrect - finalIncorrect * 1);
    onComplete({
      score: finalScore,
      unit: 'net',
      metadata: {
        correct: finalCorrect,
        incorrect: finalIncorrect,
        penalty: 1,
      },
      label: `Net ${finalScore}`,
    });
  }, [onComplete]);

  const timer = useTimer({
    mode: 'down',
    durationMs: 120_000,
    autoStart: false,
    onExpire: complete,
  });

  const handleStart = () => {
    setStarted(true);
    timer.start();
  };

  const answer = (picked: string) => {
    if (finished || submittedRef.current) return;
    if (picked === round.answer) {
      statsRef.current.correct += 1;
      setNetStatus('success');
    } else {
      statsRef.current.incorrect += 1;
      setNetStatus('danger');
    }
    setCorrect(statsRef.current.correct);
    setIncorrect(statsRef.current.incorrect);
    const nextDifficulty = reserveNextReasoningDifficulty(difficultyCountsRef.current);
    setRound(makeRound(seenRoundSignaturesRef.current, nextDifficulty));
    setPhase('statement');
  };

  return (
    <div className="game-container">
      <Scoreboard>
        <ScoreDisplay label="Time" value={formatTime(timer.remainingMs)} />
        <ScoreDisplay label="Correct" value={correct} status="success" />
        <ScoreDisplay label="Incorrect" value={incorrect} status="danger" />
        <ScoreDisplay label="Net" value={score} status={netStatus} />
      </Scoreboard>
      
      <Timer progress={1 - timer.progress} />

      <div className="game-content">
        {!started ? (
          <TestStartScreen
            description="Read each statement, then answer the question. You have 2 minutes."
            onStart={handleStart}
          />
        ) : (
          <div
            style={{
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: 'clamp(1.5rem, 6vw, 3rem)',
              display: 'grid',
              gap: 'clamp(1.5rem, 5vh, 2.5rem)',
              background: 'var(--surface-raised)',
              width: '100%',
              maxWidth: '640px',
              marginInline: 'auto',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'grid', gap: '0.4rem', width: '100%', overflow: 'hidden' }}>
              <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                {phase === 'statement' ? 'Statement' : 'Question'}
              </small>
              <FitText
                text={phase === 'statement' ? round.statement : round.question}
                sizeText={LONGEST_STATEMENT}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '440px', marginInline: 'auto', width: '100%' }}>
              {phase === 'statement' ? (
                <button
                  type="button"
                  className="button"
                  onClick={() => setPhase('question')}
                  style={{ gridColumn: '1 / -1', padding: '0.8rem 1rem', fontSize: '1rem' }}
                >
                  Show Question
                </button>
              ) : (
                round.options.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="button"
                    onClick={() => answer(name)}
                    style={{ padding: '0.8rem 1rem', fontSize: '1rem' }}
                  >
                    {name}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
