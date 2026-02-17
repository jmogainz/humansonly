'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, shuffle, generateRecentUnique } from '@/lib/utils';
import Timer, { formatTime } from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import Scoreboard from '@/components/Scoreboard';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';

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

type Round = {
  options: string[];
  answer: string;
  signature: string;
};

function makeRoundRaw(): Round {
  const firstIndex = randomInt(0, WORD_GROUPS.length - 1);
  let secondIndex = randomInt(0, WORD_GROUPS.length - 1);
  while (secondIndex === firstIndex) {
    secondIndex = randomInt(0, WORD_GROUPS.length - 1);
  }

  const groupA = shuffle([...WORD_GROUPS[firstIndex]]);
  const groupB = shuffle([...WORD_GROUPS[secondIndex]]);
  const pair = groupA.slice(0, 2);
  const odd = groupB[0];
  
  const options = shuffle([...pair, odd]);
  
  return {
    options,
    answer: odd,
    signature: `${pair.sort().join('|')}:${odd}`,
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
        {!started ? (
          <div className="game-content">
            <TestStartScreen
              description="Find the word that doesn&apos;t belong with the others. You have 2 minutes."
              onStart={handleStart}
            />
          </div>
        ) : (
          <>
                      {!finished && (
                        <Scoreboard>
                          <ScoreDisplay label="Time" value={formatTime(timer.remainingMs)} />
                          <ScoreDisplay label="Correct" value={correct} status="success" />
                          <ScoreDisplay label="Incorrect" value={incorrect} status="danger" />
                          <ScoreDisplay label="Net" value={score.toFixed(2)} status={netStatus} />
                        </Scoreboard>
                      )}
            
                      <Timer progress={1 - timer.progress} />  
            <div className="game-content">
              <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', textAlign: 'center' }}>Which word doesn&apos;t belong?</h2>
  
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', 
                  gap: 'clamp(0.6rem, 2vw, 1rem)',
                  width: '100%',
                  maxWidth: '400px',
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
                      padding: '1.25rem',
                      fontSize: 'clamp(1.1rem, 5vw, 1.4rem)',
                      borderRadius: '12px'
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
