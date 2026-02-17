'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle, generateRecentUnique } from '@/lib/utils';
import Timer, { formatTime } from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import Scoreboard from '@/components/Scoreboard';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';
import { UNCOMMON_WORD_MEANING_WORDS } from './wordMeaningCommonness';

const WORD_GROUPS: string[][] = [
  // --- EXISTING GROUPS (RETAINED) ---
  ['hammer', 'wrench', 'pliers', 'saw', 'drill'],
  ['lion', 'tiger', 'panther', 'jaguar', 'leopard'],
  ['violin', 'cello', 'viola', 'harp', 'bass'],
  ['winter', 'spring', 'summer', 'autumn', 'monsoon'],
  ['swift', 'rapid', 'quick', 'fast', 'speedy'],
  ['calm', 'quiet', 'peaceful', 'serene', 'still'],
  ['joyful', 'happy', 'cheerful', 'glad', 'elated'],
  ['bitter', 'sour', 'tart', 'acidic', 'sharp'],
  ['oval', 'circle', 'ellipse', 'round', 'orb'],
  ['ship', 'boat', 'ferry', 'yacht', 'canoe'],
  ['ruby', 'sapphire', 'emerald', 'opal', 'topaz'],
  ['sprint', 'jog', 'dash', 'race', 'run'],
  ['speak', 'talk', 'chat', 'converse', 'discuss'],
  ['novel', 'poem', 'essay', 'story', 'drama'],
  ['frost', 'ice', 'snow', 'sleet', 'hail'],
  ['doctor', 'nurse', 'surgeon', 'therapist', 'medic'],
  ['triangle', 'square', 'rectangle', 'polygon', 'rhombus'],
  ['apple', 'orange', 'banana', 'pear', 'grape'],
  ['sandal', 'boot', 'sneaker', 'loafer', 'heel'],
  ['desk', 'chair', 'sofa', 'table', 'stool'],
  ['mercury', 'venus', 'mars', 'jupiter', 'saturn'],
  ['bread', 'rice', 'pasta', 'cereal', 'oats'],
  ['shirt', 'pants', 'jacket', 'dress', 'skirt'],
  ['bicycle', 'car', 'bus', 'train', 'truck'],
  ['pencil', 'pen', 'marker', 'crayon', 'chalk'],
  ['cup', 'mug', 'glass', 'bottle', 'flask'],
  ['fork', 'spoon', 'knife', 'spatula', 'whisk'],
  ['bedroom', 'kitchen', 'bathroom', 'hallway', 'cellar'],
  ['mountain', 'valley', 'plateau', 'canyon', 'cliff'],
  ['ocean', 'river', 'lake', 'pond', 'stream'],
  ['eagle', 'hawk', 'falcon', 'owl', 'vulture'],
  ['oak', 'pine', 'maple', 'birch', 'cedar'],
  ['rose', 'tulip', 'daisy', 'lily', 'orchid'],
  ['gold', 'silver', 'copper', 'iron', 'bronze'],
  ['piano', 'guitar', 'drums', 'flute', 'trumpet'],
  ['football', 'tennis', 'hockey', 'golf', 'cricket'],
  ['paris', 'london', 'tokyo', 'berlin', 'madrid'],
  ['math', 'science', 'history', 'physics', 'biology'],
  ['laptop', 'tablet', 'phone', 'desktop', 'monitor'],
  ['red', 'blue', 'green', 'yellow', 'purple'],

  // --- ANIMALS & NATURE (EXPANDED) ---
  ['shark', 'dolphin', 'whale', 'seal', 'walrus'],
  ['ant', 'bee', 'wasp', 'beetle', 'butterfly'],
  ['spider', 'scorpion', 'tick', 'mite', 'tarantula'],
  ['osprey', 'kestrel', 'condor', 'harrier', 'kite'],
  ['pigeon', 'sparrow', 'robin', 'finch', 'cardinal'],
  ['penguin', 'ostrich', 'emu', 'kiwi', 'cassowary'],
  ['gorilla', 'chimp', 'baboon', 'lemur', 'marmoset'],
  ['python', 'cobra', 'viper', 'mamba', 'anaconda'],
  ['alligator', 'crocodile', 'caiman', 'gharial', 'tortoise'],
  ['cow', 'pig', 'sheep', 'goat', 'donkey'],
  ['deer', 'moose', 'elk', 'antelope', 'gazelle'],
  ['bear', 'wolf', 'coyote', 'fox', 'hyena'],
  ['rabbit', 'hare', 'pika', 'squirrel', 'chipmunk'],
  ['rat', 'mouse', 'gerbil', 'hamster', 'guinea pig'],
  ['crab', 'lobster', 'shrimp', 'prawn', 'crayfish'],
  ['octopus', 'squid', 'cuttlefish', 'nautilus', 'snail'],
  ['jellyfish', 'coral', 'anemone', 'sponge', 'hydra'],
  ['salmon', 'trout', 'tuna', 'cod', 'halibut'],
  ['owl', 'nightjar', 'bat', 'moth', 'firefly'],
  ['swan', 'goose', 'duck', 'heron', 'stork'],
  ['lizard', 'gecko', 'skink', 'chameleon', 'anole'],
  ['toad', 'frog', 'newt', 'salamander', 'caecilian'],
  ['willow', 'elm', 'ash', 'poplar', 'beech'],
  ['cactus', 'succulent', 'aloe', 'agave', 'yucca'],
  ['fern', 'moss', 'lichen', 'fungus', 'mold'],
  ['galaxy', 'nebula', 'star', 'planet', 'comet'],
  ['asteroid', 'meteor', 'quasar', 'pulsar', 'black hole'],
  ['volcano', 'geyser', 'vent', 'crater', 'caldera'],
  ['glacier', 'iceberg', 'floe', 'shelf', 'tundra'],
  ['swamp', 'marsh', 'bog', 'fen', 'mangrove'],

  // --- FOOD & DRINK (EXPANDED) ---
  ['potato', 'carrot', 'onion', 'garlic', 'radish'],
  ['lettuce', 'spinach', 'kale', 'cabbage', 'chard'],
  ['broccoli', 'cauliflower', 'asparagus', 'celery', 'artichoke'],
  ['tomato', 'pepper', 'eggplant', 'cucumber', 'zucchini'],
  ['bean', 'lentil', 'pea', 'chickpea', 'soybean'],
  ['almond', 'walnut', 'cashew', 'pecan', 'pistachio'],
  ['thyme', 'basil', 'oregano', 'rosemary', 'sage'],
  ['cinnamon', 'ginger', 'turmeric', 'clove', 'nutmeg'],
  ['coffee', 'tea', 'cocoa', 'mate', 'chai'],
  ['juice', 'soda', 'water', 'milk', 'lemonade'],
  ['wine', 'beer', 'vodka', 'whiskey', 'rum'],
  ['cheese', 'yogurt', 'butter', 'cream', 'kefir'],
  ['steak', 'chop', 'rib', 'fillet', 'roast'],
  ['bacon', 'ham', 'sausage', 'salami', 'pepperoni'],
  ['cake', 'pie', 'cookie', 'pastry', 'donut'],
  ['honey', 'sugar', 'syrup', 'jam', 'jelly'],
  ['salt', 'pepper', 'vinegar', 'oil', 'mustard'],
  ['pizza', 'burger', 'taco', 'sushi', 'curry'],
  ['baguette', 'croissant', 'bagel', 'muffin', 'scone'],
  ['soup', 'stew', 'broth', 'chowder', 'bisque'],
  ['shrimp', 'prawn', 'scallop', 'mussel', 'clam'],
  ['lemon', 'lime', 'citron', 'orange', 'pomelo'],
  ['peach', 'plum', 'cherry', 'apricot', 'nectarine'],
  ['strawberry', 'raspberry', 'blueberry', 'blackberry', 'cranberry'],
  ['melon', 'watermelon', 'cantaloupe', 'honeydew', 'papaya'],

  // --- PROFESSIONS & ROLES (EXPANDED) ---
  ['teacher', 'professor', 'tutor', 'mentor', 'coach'],
  ['pilot', 'driver', 'captain', 'engineer', 'conductor'],
  ['artist', 'painter', 'sculptor', 'photographer', 'designer'],
  ['writer', 'author', 'editor', 'journalist', 'blogger'],
  ['actor', 'singer', 'dancer', 'musician', 'performer'],
  ['police', 'soldier', 'guard', 'detective', 'officer'],
  ['lawyer', 'judge', 'clerk', 'bailiff', 'notary'],
  ['cook', 'chef', 'baker', 'barista', 'server'],
  ['farmer', 'miner', 'logger', 'fisher', 'rancher'],
  ['plumber', 'electrician', 'mason', 'carpenter', 'welder'],
  ['scientist', 'chemist', 'physicist', 'biologist', 'astronomer'],
  ['architect', 'builder', 'surveyor', 'planner', 'drafter'],
  ['priest', 'monk', 'nun', 'rabbi', 'imam'],
  ['king', 'queen', 'prince', 'duke', 'baron'],
  ['mayor', 'senator', 'governor', 'premier', 'minister'],
  ['clown', 'magician', 'acrobat', 'juggler', 'mime'],
  ['athlete', 'player', 'sprinter', 'cyclist', 'swimmer'],
  ['cashier', 'clerk', 'teller', 'agent', 'receptionist'],
  ['janitor', 'cleaner', 'maid', 'valet', 'butler'],
  ['dentist', 'vet', 'optician', 'pharmacist', 'psychologist'],
  ['mechanic', 'technician', 'operator', 'repairman', 'installer'],
  ['accountant', 'auditor', 'analyst', 'broker', 'banker'],
  ['poet', 'playwright', 'novelist', 'screenwriter', 'essayist'],
  ['boxer', 'wrestler', 'fighter', 'karateka', 'judoka'],
  ['tailor', 'weaver', 'cobbler', 'smith', 'potter'],

  // --- OBJECTS & HOME (EXPANDED) ---
  ['hat', 'cap', 'beanie', 'beret', 'helmet'],
  ['glove', 'mitten', 'scarf', 'tie', 'belt'],
  ['ring', 'necklace', 'bracelet', 'earring', 'brooch'],
  ['watch', 'clock', 'timer', 'stopwatch', 'metronome'],
  ['wallet', 'purse', 'bag', 'backpack', 'suitcase'],
  ['soap', 'shampoo', 'lotion', 'cream', 'gel'],
  ['comb', 'brush', 'razor', 'scissors', 'file'],
  ['mirror', 'lens', 'glass', 'prism', 'window'],
  ['umbrella', 'coat', 'poncho', 'cloak', 'cape'],
  ['socks', 'tights', 'hose', 'stockings', 'leggings'],
  ['lamp', 'bulb', 'torch', 'candle', 'lantern'],
  ['radio', 'stereo', 'speaker', 'amp', 'tuner'],
  ['camera', 'lens', 'tripod', 'flash', 'filter'],
  ['fridge', 'oven', 'stove', 'freezer', 'toaster'],
  ['plate', 'bowl', 'dish', 'platter', 'tray'],
  ['curtain', 'blind', 'shade', 'drapery', 'shutter'],
  ['rug', 'carpet', 'mat', 'tile', 'linoleum'],
  ['pillow', 'blanket', 'sheet', 'quilt', 'duvet'],
  ['towel', 'sponge', 'cloth', 'rag', 'mop'],
  ['door', 'gate', 'hatch', 'portal', 'entrance'],
  ['wall', 'fence', 'barrier', 'screen', 'partition'],
  ['roof', 'ceiling', 'dome', 'canopy', 'awning'],
  ['stair', 'ladder', 'ramp', 'lift', 'elevator'],
  ['pipe', 'tube', 'hose', 'duct', 'conduit'],
  ['wire', 'cable', 'cord', 'string', 'rope'],
  ['nail', 'screw', 'bolt', 'rivet', 'pin'],
  ['glue', 'tape', 'paste', 'cement', 'solder'],
  ['box', 'bin', 'crate', 'chest', 'trunk'],
  ['key', 'lock', 'latch', 'bolt', 'padlock'],
  ['anchor', 'buoy', 'mast', 'sail', 'rudder'],
  ['keyboard', 'mouse', 'joystick', 'gamepad', 'remote'],
  ['microscope', 'telescope', 'binoculars', 'magnifier', 'periscope'],
  ['battery', 'motor', 'engine', 'turbine', 'generator'],
  ['funnel', 'sieve', 'grater', 'peeler', 'press'],

  // --- GEOGRAPHY & PLACES (EXPANDED) ---
  ['city', 'town', 'village', 'hamlet', 'metropolis'],
  ['state', 'province', 'county', 'region', 'territory'],
  ['road', 'street', 'lane', 'avenue', 'highway'],
  ['bridge', 'tunnel', 'viaduct', 'overpass', 'dam'],
  ['park', 'garden', 'yard', 'lawn', 'field'],
  ['beach', 'coast', 'shore', 'bank', 'pier'],
  ['island', 'atoll', 'reef', 'peninsula', 'cape'],
  ['forest', 'woods', 'jungle', 'grove', 'thicket'],
  ['desert', 'dune', 'mesa', 'butte', 'oasis'],
  ['swamp', 'marsh', 'bog', 'fen', 'slough'],
  ['france', 'italy', 'spain', 'greece', 'portugal'],
  ['china', 'japan', 'korea', 'india', 'thailand'],
  ['brazil', 'chile', 'peru', 'mexico', 'cuba'],
  ['egypt', 'kenya', 'ghana', 'morocco', 'nigeria'],
  ['canada', 'usa', 'russia', 'china', 'australia'],
  ['moon', 'titan', 'europa', 'io', 'ganymede'],
  ['north', 'south', 'east', 'west', 'central'],
  ['africa', 'asia', 'europe', 'america', 'oceania'],
  ['temple', 'church', 'mosque', 'shrine', 'chapel'],
  ['school', 'college', 'academy', 'institute', 'university'],
  ['hospital', 'clinic', 'asylum', 'sanatorium', 'dispensary'],
  ['cinema', 'theater', 'gallery', 'museum', 'library'],
  ['market', 'store', 'shop', 'mall', 'bazaar'],
  ['bank', 'office', 'factory', 'plant', 'mill'],
  ['garage', 'shed', 'barn', 'stable', 'kennel'],

  // --- ADJECTIVES & STATES (EXPANDED) ---
  ['angry', 'mad', 'furious', 'irate', 'enraged'],
  ['sad', 'unhappy', 'gloomy', 'miserable', 'depressed'],
  ['scared', 'afraid', 'fearful', 'terrified', 'anxious'],
  ['tired', 'sleepy', 'weary', 'exhausted', 'drowsy'],
  ['brave', 'bold', 'valiant', 'courageous', 'fearless'],
  ['smart', 'wise', 'clever', 'bright', 'intelligent'],
  ['strong', 'tough', 'mighty', 'powerful', 'sturdy'],
  ['weak', 'frail', 'feeble', 'fragile', 'delicate'],
  ['big', 'huge', 'large', 'giant', 'massive'],
  ['small', 'tiny', 'little', 'mini', 'slight'],
  ['hot', 'warm', 'burning', 'fiery', 'scorching'],
  ['cold', 'chilly', 'freezing', 'icy', 'frosty'],
  ['loud', 'noisy', 'deafening', 'booming', 'piercing'],
  ['soft', 'smooth', 'silky', 'velvety', 'fluffy'],
  ['hard', 'solid', 'firm', 'rigid', 'stiff'],
  ['heavy', 'hefty', 'weighty', 'burdensome', 'dense'],
  ['light', 'airy', 'weightless', 'buoyant', 'feathery'],
  ['slow', 'sluggish', 'leisurely', 'gradual', 'plodding'],
  ['new', 'modern', 'recent', 'fresh', 'novel'],
  ['old', 'ancient', 'antique', 'vintage', 'aged'],
  ['rich', 'wealthy', 'affluent', 'prosperous', 'loaded'],
  ['poor', 'needy', 'broke', 'destitute', 'penniless'],
  ['easy', 'simple', 'plain', 'basic', 'effortless'],
  ['difficult', 'complex', 'tricky', 'arduous', 'strenuous'],
  ['clean', 'neat', 'tidy', 'spotless', 'pure'],
  ['dirty', 'filthy', 'grimy', 'soiled', 'messy'],
  ['dry', 'parched', 'arid', 'crisp', 'dehydrated'],
  ['wet', 'damp', 'moist', 'soaked', 'soggy'],
  ['sharp', 'keen', 'acute', 'pointed', 'edged'],
  ['dull', 'blunt', 'flat', 'obtuse', 'faded'],
  ['bright', 'vivid', 'brilliant', 'radiant', 'glowing'],
  ['dark', 'dim', 'shadowy', 'murky', 'somber'],
  ['sweet', 'sugary', 'honeyed', 'cloying', 'syrupy'],
  ['salty', 'briny', 'brackish', 'saline', 'pickled'],

  // --- VERBS & ACTIONS (EXPANDED) ---
  ['walk', 'march', 'stroll', 'pace', 'tread'],
  ['jump', 'leap', 'hop', 'bound', 'spring'],
  ['laugh', 'giggle', 'chuckle', 'snicker', 'titter'],
  ['cry', 'weep', 'sob', 'wail', 'bawl'],
  ['shout', 'yell', 'scream', 'bellow', 'holler'],
  ['whisper', 'mumble', 'murmur', 'mutter', 'hush'],
  ['look', 'stare', 'gaze', 'glance', 'peer'],
  ['listen', 'hear', 'hearken', 'attend', 'heed'],
  ['touch', 'feel', 'handle', 'stroke', 'pat'],
  ['eat', 'dine', 'feast', 'snack', 'nibble'],
  ['drink', 'sip', 'gulp', 'swig', 'quaff'],
  ['sleep', 'nap', 'doze', 'slumber', 'snooze'],
  ['work', 'labor', 'toil', 'drudge', 'strive'],
  ['play', 'frolic', 'romp', 'sport', 'revel'],
  ['think', 'ponder', 'muse', 'reflect', 'cogitate'],
  ['read', 'scan', 'peruse', 'study', 'browse'],
  ['write', 'scribe', 'draft', 'note', 'compose'],
  ['give', 'grant', 'bestow', 'offer', 'provide'],
  ['take', 'seize', 'grab', 'snatch', 'acquire'],
  ['make', 'build', 'create', 'form', 'craft'],
  ['break', 'smash', 'crush', 'wreck', 'shatter'],
  ['pull', 'drag', 'tug', 'heave', 'haul'],
  ['push', 'shove', 'thrust', 'prod', 'drive'],
  ['throw', 'hurl', 'toss', 'pitch', 'fling'],
  ['catch', 'seize', 'grasp', 'snare', 'trap'],
  ['climb', 'ascend', 'mount', 'scale', 'clamber'],
  ['fall', 'drop', 'plummet', 'descend', 'tumble'],
  ['fly', 'soar', 'glide', 'hover', 'wing'],
  ['swim', 'dive', 'float', 'paddle', 'drift'],
  ['spin', 'turn', 'rotate', 'revolve', 'whirl'],
];

function normalizeWord(value: string): string {
  return value.trim().toLowerCase();
}

function sanitizeWordGroups(rawGroups: string[][]): string[][] {
  return rawGroups
    .map((group) => {
      const seen = new Set<string>();
      const cleaned: string[] = [];
      for (const word of group) {
        const normalized = normalizeWord(word);
        if (!normalized) continue;
        // Keep simple single-word alphabetic tokens (allowing apostrophes/hyphens).
        if (!/^[a-z][a-z'-]*$/.test(normalized)) continue;
        if (UNCOMMON_WORD_MEANING_WORDS.has(normalized)) continue;
        if (seen.has(normalized)) continue;
        seen.add(normalized);
        cleaned.push(normalized);
      }
      return cleaned;
    })
    .filter((group) => group.length >= 3);
}

type WordMeaningDifficulty = 'easy' | 'medium' | 'hard' | 'tricky';

const WORD_MEANING_DIFFICULTIES: WordMeaningDifficulty[] = ['easy', 'medium', 'hard', 'tricky'];

const CLEAN_WORD_GROUPS = sanitizeWordGroups(WORD_GROUPS);

const WORD_FREQUENCY = (() => {
  const counts = new Map<string, number>();
  for (const group of CLEAN_WORD_GROUPS) {
    for (const word of group) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return counts;
})();

type WordGroupMeta = {
  words: string[];
  uniqueWords: string[];
  signature: string;
};

const QUALITY_WORD_GROUPS: WordGroupMeta[] = CLEAN_WORD_GROUPS
  .map((words) => {
    const uniqueWords = words.filter((word) => (WORD_FREQUENCY.get(word) ?? 0) === 1);
    return {
      words,
      uniqueWords,
      signature: words.join('|'),
    };
  })
  .filter((group) => group.uniqueWords.length >= 3);

function pickWordMeaningDifficulty(): WordMeaningDifficulty {
  return generateRecentUnique(
    'gia-word-meaning-difficulty',
    3,
    () => WORD_MEANING_DIFFICULTIES[randomInt(0, WORD_MEANING_DIFFICULTIES.length - 1)],
    (d) => d
  );
}

function pickFrom<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function wordComplexity(word: string): number {
  let score = word.length;
  if (word.includes(' ')) score += 2;
  if (word.includes('-') || word.includes('\'')) score += 1;
  if (/[qxzj]/.test(word)) score += 1;
  return score;
}

function wordSimilarity(a: string, b: string): number {
  let score = 0;
  if (a[0] === b[0]) score += 2;
  if (a.slice(-1) === b.slice(-1)) score += 1;
  if (Math.abs(a.length - b.length) <= 1) score += 1;
  if (a.slice(0, 2) === b.slice(0, 2)) score += 1;
  if (a.slice(-2) === b.slice(-2)) score += 1;
  return score;
}

function pairAverageComplexity(pair: [string, string]): number {
  return (wordComplexity(pair[0]) + wordComplexity(pair[1])) / 2;
}

function pairScore(pair: [string, string]): number {
  return pairAverageComplexity(pair) * 0.35 + wordSimilarity(pair[0], pair[1]) * 2;
}

function buildPairCandidates(words: string[]): Array<{ pair: [string, string]; score: number }> {
  const candidates: Array<{ pair: [string, string]; score: number }> = [];
  for (let i = 0; i < words.length; i += 1) {
    for (let j = i + 1; j < words.length; j += 1) {
      const pair: [string, string] = [words[i], words[j]];
      candidates.push({ pair, score: pairScore(pair) });
    }
  }
  return candidates.sort((a, b) => a.score - b.score);
}

function pickPairForDifficulty(group: WordGroupMeta, difficulty: WordMeaningDifficulty): [string, string] | null {
  const candidates = buildPairCandidates(group.uniqueWords);
  if (candidates.length === 0) return null;

  const n = candidates.length;
  const easyEnd = Math.max(1, Math.floor(n * 0.4));
  const hardStart = Math.max(0, Math.floor(n * 0.6));
  const trickyStart = Math.max(0, Math.floor(n * 0.8));

  let bucket = candidates;
  if (difficulty === 'easy') {
    bucket = candidates.slice(0, easyEnd);
  } else if (difficulty === 'medium') {
    bucket = candidates.slice(Math.floor(n * 0.3), Math.max(Math.floor(n * 0.7), Math.floor(n * 0.3) + 1));
  } else if (difficulty === 'hard') {
    bucket = candidates.slice(hardStart);
  } else {
    bucket = candidates.slice(trickyStart);
  }

  if (bucket.length === 0) return pickFrom(candidates).pair;
  return pickFrom(bucket).pair;
}

function maxSimilarityToPair(word: string, pair: [string, string]): number {
  return Math.max(wordSimilarity(word, pair[0]), wordSimilarity(word, pair[1]));
}

function acceptsOddCandidate(
  difficulty: WordMeaningDifficulty,
  maxSimilarity: number,
  complexityDiff: number,
  relaxLevel: number
): boolean {
  if (difficulty === 'easy') {
    if (relaxLevel === 0) return maxSimilarity <= 1 && complexityDiff >= 2;
    if (relaxLevel === 1) return maxSimilarity <= 2 && complexityDiff >= 1;
    return maxSimilarity <= 2;
  }

  if (difficulty === 'medium') {
    if (relaxLevel === 0) return maxSimilarity <= 2;
    return maxSimilarity <= 3;
  }

  if (difficulty === 'hard') {
    if (relaxLevel === 0) return maxSimilarity >= 2 && maxSimilarity <= 4 && complexityDiff <= 2.5;
    if (relaxLevel === 1) return maxSimilarity >= 2 && complexityDiff <= 3;
    return maxSimilarity >= 1;
  }

  // tricky
  if (relaxLevel === 0) return maxSimilarity >= 3 && complexityDiff <= 1.5;
  if (relaxLevel === 1) return maxSimilarity >= 2 && complexityDiff <= 2.5;
  return maxSimilarity >= 2;
}

function oddCandidateRank(
  difficulty: WordMeaningDifficulty,
  maxSimilarity: number,
  complexityDiff: number
): number {
  const targetSimilarity =
    difficulty === 'easy' ? 0.5 :
      difficulty === 'medium' ? 1.5 :
        difficulty === 'hard' ? 2.8 : 3.8;
  const targetComplexityDiff =
    difficulty === 'easy' ? 2.5 :
      difficulty === 'medium' ? 1.2 :
        difficulty === 'hard' ? 1.0 : 0.5;
  return Math.abs(maxSimilarity - targetSimilarity) * 2 + Math.abs(complexityDiff - targetComplexityDiff);
}

function pickOddForDifficulty(
  pair: [string, string],
  pairGroup: WordGroupMeta,
  difficulty: WordMeaningDifficulty
): string | null {
  const blocked = new Set(pairGroup.words.map(normalizeWord));
  const pairComplexity = pairAverageComplexity(pair);

  for (let relaxLevel = 0; relaxLevel <= 2; relaxLevel += 1) {
    const candidates: Array<{ word: string; rank: number }> = [];
    for (const group of shuffle(QUALITY_WORD_GROUPS)) {
      if (group.signature === pairGroup.signature) continue;
      if (group.words.some((word) => blocked.has(normalizeWord(word)))) continue;

      for (const odd of group.uniqueWords) {
        if (blocked.has(odd)) continue;
        const maxSimilarity = maxSimilarityToPair(odd, pair);
        const complexityDiff = Math.abs(wordComplexity(odd) - pairComplexity);
        if (!acceptsOddCandidate(difficulty, maxSimilarity, complexityDiff, relaxLevel)) continue;
        candidates.push({
          word: odd,
          rank: oddCandidateRank(difficulty, maxSimilarity, complexityDiff),
        });
      }
    }

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.rank - b.rank);
      const topCandidates = candidates.slice(0, Math.min(50, candidates.length));
      return pickFrom(topCandidates).word;
    }
  }

  return null;
}

type Round = {
  options: string[];
  answer: string;
  signature: string;
};

function makeRoundRaw(): Round {
  const difficulty = pickWordMeaningDifficulty();

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const pairGroup = pickFrom(QUALITY_WORD_GROUPS);
    const pair = pickPairForDifficulty(pairGroup, difficulty);
    if (!pair) continue;

    const odd = pickOddForDifficulty(pair, pairGroup, difficulty);
    if (!odd) continue;

    const options = shuffle([pair[0], pair[1], odd]);
    if (new Set(options.map(normalizeWord)).size !== 3) continue;

    return {
      options,
      answer: odd,
      signature: `${[...pair].sort().join('|')}:${odd}|${difficulty}`,
    };
  }

  // Quality-preserving fallback: medium-style round with globally unique vocabulary.
  const pairGroup = pickFrom(QUALITY_WORD_GROUPS);
  const pair = pickPairForDifficulty(pairGroup, 'medium') ?? [pairGroup.uniqueWords[0], pairGroup.uniqueWords[1]];
  const blocked = new Set(pair);
  const fallbackOddPool =
    QUALITY_WORD_GROUPS
      .find((group) => group.signature !== pairGroup.signature)
      ?.uniqueWords.filter((word) => !blocked.has(word)) ?? [];
  const odd = pickOddForDifficulty(pair, pairGroup, 'medium') ??
    (fallbackOddPool.length > 0 ? pickFrom(fallbackOddPool) : pairGroup.uniqueWords.find((word) => !blocked.has(word)) ?? pair[0]);
  return {
    options: shuffle([pair[0], pair[1], odd]),
    answer: odd,
    signature: `${[...pair].sort().join('|')}:${odd}|fallback`,
  };
}

function makeRound(): Round {
  return generateRecentUnique(
    'gia-word-meaning',
    15,
    makeRoundRaw,
    (r) => r.signature
  );
}

export default function GiaWordMeaningTest({ definition, onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [netStatus, setNetStatus] = useState<'success' | 'danger' | 'neutral'>('neutral');
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const submittedRef = useRef(false);
  const statsRef = useRef({ correct: 0, incorrect: 0 });

  const score = useMemo(() => correct - incorrect * 0.5, [correct, incorrect]);

  const complete = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setFinished(true);
    const finalCorrect = statsRef.current.correct;
    const finalIncorrect = statsRef.current.incorrect;
    const finalScore = finalCorrect - finalIncorrect * 0.5;
    onComplete({
      score: finalScore,
      unit: 'net',
      metadata: {
        correct: finalCorrect,
        incorrect: finalIncorrect,
        penalty: 0.5,
      },
      label: `Net ${finalScore.toFixed(2)}`,
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

  const answer = (word: string) => {
    if (finished || submittedRef.current) return;
    if (word === round.answer) {
      statsRef.current.correct += 1;
      setNetStatus('success');
    } else {
      statsRef.current.incorrect += 1;
      setNetStatus('danger');
    }
    setCorrect(statsRef.current.correct);
    setIncorrect(statsRef.current.incorrect);
    setRound(makeRound());
  };

  return (
    <div className="game-container">
      <Scoreboard>
        <ScoreDisplay label="Time" value={formatTime(timer.remainingMs)} />
        <ScoreDisplay label="Correct" value={correct} status="success" />
        <ScoreDisplay label="Incorrect" value={incorrect} status="danger" />
        <ScoreDisplay label="Net" value={score.toFixed(2)} status={netStatus} />
      </Scoreboard>

      <Timer progress={1 - timer.progress} />

      <div className="game-content">
        {!started ? (
          <TestStartScreen
            description="Find the word that doesn&apos;t belong with the others. You have 2 minutes."
            onStart={handleStart}
          />
        ) : (
          <>
            <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', textAlign: 'center' }}>Which word doesn&apos;t belong?</h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                gap: 'clamp(0.4rem, 2vw, 0.75rem)',
                width: '100%',
                maxWidth: '560px',
                marginInline: 'auto'
              }}
            >
              {round.options.map((word) => (
                <button
                  key={word}
                  type="button"
                  className="game-tile"
                  onClick={() => answer(word)}
                  style={{
                    textTransform: 'capitalize',
                    padding: 'clamp(0.75rem, 3vw, 1.25rem) clamp(0.25rem, 1.5vw, 0.75rem)',
                    fontSize: 'clamp(0.8rem, 3.5vw, 1.2rem)',
                    borderRadius: '12px',
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
