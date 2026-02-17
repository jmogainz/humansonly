'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import type { TestGameProps } from '../_shared/types';
import { randomInt, generateRecentUnique } from '@/lib/utils';
import Timer from '@/components/Timer';
import ScoreDisplay from '@/components/ScoreDisplay';
import { useTimer } from '@/hooks/useTimer';
import TestStartScreen from '@/components/TestStartScreen';

const NAMES = [
  'Alex', 'Noah', 'Maya', 'Leah', 'Jamal', 'Priya', 'Owen', 'Ava', 'Dylan', 'Sofia',
  'Ethan', 'Lena', 'Mateo', 'Iris', 'Jonah', 'Nina', 'Leo', 'Nora', 'Milo', 'Ruby',
  'Zane', 'Aria', 'Kian', 'Sara', 'Ravi', 'Elena', 'Kai', 'Jade', 'Aiden', 'Mina',
  'Yara', 'Hugo', 'Layla', 'Isaac', 'Tara', 'Zoya', 'Rohan', 'Liam', 'Cleo', 'Eli',
  'Amara', 'Caleb', 'Elias', 'Hana', 'Jude', 'Kira', 'Luka', 'Mira', 'Nico', 'Sasha',
  'Arjun', 'Beatrice', 'Chen', 'Dante', 'Esme', 'Finn', 'Gia', 'Hiro', 'Ines', 'Jasper',
  'Kenza', 'Lior', 'Malik', 'Noa', 'Oscar', 'Paloma', 'Quinn', 'Remy', 'Soren', 'Talia',
  'Uma', 'Vigo', 'Wren', 'Xander', 'Yuna', 'Zayd', 'Alba', 'Bodhi', 'Cora', 'Dax',
  'Elodie', 'Felix', 'Gwen', 'Ida', 'Jace', 'Kaia', 'Lenz', 'Maia', 'Noel', 'Opal',
  'Pax', 'Rumi', 'Silas', 'Thea', 'Uri', 'Veda', 'Wolf', 'Xena', 'Zion', 'Amos',
  'Anya', 'Bohan', 'Celia', 'Dion', 'Elowen', 'Farrah', 'Gideon', 'Hester', 'Ilya', 'Juno',
  'Kael', 'Lyra', 'Mael', 'Naya', 'Orion', 'Petra', 'Quell', 'Rhys', 'Sia', 'Titus',
  'Uriah', 'Vey', 'Wyatt', 'Xyla', 'Yara', 'Zeno', 'Ansel', 'Bria', 'Cian', 'Della',
  'Enzo', 'Flora', 'Gavin', 'Halle', 'Isla', 'Jett', 'Kaya', 'Lachlan', 'Maive', 'Nash',
  'Oona', 'Pierce', 'Quinn', 'Reed', 'Selene', 'Teagan', 'Ulysses', 'Vania', 'Wells', 'Xion',
  'Yvaine', 'Zora', 'Archer', 'Blaire', 'Callum', 'Daphne', 'Ewan', 'Faye', 'Grant', 'Hazel',
  'Ivan', 'Jade', 'Knox', 'Lumi', 'Miro', 'Nell', 'Otto', 'Pippa', 'Quincy', 'Ria',
  'Stellan', 'Tessa', 'Usher', 'Vesper', 'Willa', 'Xavi', 'Yosef', 'Zosia', 'Abner', 'Blythe',
  'Cassian', 'Dora', 'Emrys', 'Fleur', 'Gaius', 'Hope', 'Ivor', 'Joy', 'Kit', 'Lark',
  'Magnus', 'Nellis', 'Odin', 'Pearl', 'Quill', 'Reeve', 'Saffron', 'Thane', 'Ursa', 'Valen',
];

interface AdjectivePair {
  pos: string;
  posComp: string;
  neg: string;
  negComp: string;
}

const PAIRS: AdjectivePair[] = [
  { pos: 'strong', posComp: 'stronger', neg: 'weak', negComp: 'weaker' },
  { pos: 'fast', posComp: 'faster', neg: 'slow', negComp: 'slower' },
  { pos: 'tall', posComp: 'taller', neg: 'short', negComp: 'shorter' },
  { pos: 'brave', posComp: 'braver', neg: 'fearful', negComp: 'more fearful' },
  { pos: 'calm', posComp: 'calmer', neg: 'anxious', negComp: 'more anxious' },
  { pos: 'friendly', posComp: 'friendlier', neg: 'hostile', negComp: 'more hostile' },
  { pos: 'smart', posComp: 'smarter', neg: 'unwise', negComp: 'more unwise' },
  { pos: 'organized', posComp: 'more organized', neg: 'chaotic', negComp: 'more chaotic' },
  { pos: 'patient', posComp: 'more patient', neg: 'impulsive', negComp: 'more impulsive' },
  { pos: 'kind', posComp: 'kinder', neg: 'cruel', negComp: 'crueler' },
  { pos: 'creative', posComp: 'more creative', neg: 'uncreative', negComp: 'more uncreative' },
  { pos: 'focused', posComp: 'more focused', neg: 'distracted', negComp: 'more distracted' },
  { pos: 'heavy', posComp: 'heavier', neg: 'light', negComp: 'lighter' },
  { pos: 'rich', posComp: 'richer', neg: 'poor', negComp: 'poorer' },
  { pos: 'happy', posComp: 'happier', neg: 'sad', negComp: 'sadder' },
  { pos: 'loud', posComp: 'louder', neg: 'quiet', negComp: 'quieter' },
  { pos: 'bright', posComp: 'brighter', neg: 'dim', negComp: 'dimmer' },
  { pos: 'old', posComp: 'older', neg: 'young', negComp: 'younger' },
  { pos: 'large', posComp: 'larger', neg: 'small', negComp: 'smaller' },
  { pos: 'hard', posComp: 'harder', neg: 'soft', negComp: 'softer' },
  { pos: 'good', posComp: 'better', neg: 'bad', negComp: 'worse' },
  { pos: 'wide', posComp: 'wider', neg: 'narrow', negComp: 'narrower' },
  { pos: 'deep', posComp: 'deeper', neg: 'shallow', negComp: 'shallower' },
  { pos: 'sharp', posComp: 'sharper', neg: 'blunt', negComp: 'blunter' },
  { pos: 'smooth', posComp: 'smoother', neg: 'rough', negComp: 'rougher' },
  { pos: 'thick', posComp: 'thicker', neg: 'thin', negComp: 'thinner' },
  { pos: 'full', posComp: 'fuller', neg: 'empty', negComp: 'emptier' },
  { pos: 'clean', posComp: 'cleaner', neg: 'dirty', negComp: 'dirtier' },
  { pos: 'hot', posComp: 'hotter', neg: 'cold', negComp: 'colder' },
  { pos: 'dry', posComp: 'drier', neg: 'wet', negComp: 'wetter' },
  { pos: 'tough', posComp: 'tougher', neg: 'fragile', negComp: 'more fragile' },
  { pos: 'bold', posComp: 'bolder', neg: 'timid', negComp: 'more timid' },
  { pos: 'wealthy', posComp: 'wealthier', neg: 'needy', negComp: 'needier' },
  { pos: 'energetic', posComp: 'more energetic', neg: 'lethargic', negComp: 'more lethargic' },
  { pos: 'generous', posComp: 'more generous', neg: 'stingy', negComp: 'stingier' },
  { pos: 'honest', posComp: 'more honest', neg: 'deceitful', negComp: 'more deceitful' },
  { pos: 'loyal', posComp: 'more loyal', neg: 'fickle', negComp: 'more fickle' },
  { pos: 'modest', posComp: 'more modest', neg: 'vain', negComp: 'vainer' },
  { pos: 'polite', posComp: 'more polite', neg: 'rude', negComp: 'ruder' },
  { pos: 'reliable', posComp: 'more reliable', neg: 'erratic', negComp: 'more erratic' },
  { pos: 'wise', posComp: 'wiser', neg: 'foolish', negComp: 'more foolish' },
  { pos: 'agile', posComp: 'more agile', neg: 'clumsy', negComp: 'clumsier' },
  { pos: 'vibrant', posComp: 'more vibrant', neg: 'dull', negComp: 'duller' },
  { pos: 'steady', posComp: 'steadier', neg: 'shaky', negComp: 'shakier' },
  { pos: 'mature', posComp: 'more mature', neg: 'unripe', negComp: 'more unripe' },
  { pos: 'graceful', posComp: 'more graceful', neg: 'awkward', negComp: 'more awkward' },
  { pos: 'ambitious', posComp: 'more ambitious', neg: 'lazy', negComp: 'lazier' },
  { pos: 'talkative', posComp: 'more talkative', neg: 'quiet', negComp: 'quieter' },
  { pos: 'optimistic', posComp: 'more optimistic', neg: 'pessimistic', negComp: 'more pessimistic' },
  { pos: 'curious', posComp: 'more curious', neg: 'indifferent', negComp: 'more indifferent' },
  { pos: 'flexible', posComp: 'more flexible', neg: 'rigid', negComp: 'more rigid' },
  { pos: 'humble', posComp: 'more humble', neg: 'arrogant', negComp: 'more arrogant' },
  { pos: 'cautious', posComp: 'more cautious', neg: 'reckless', negComp: 'more reckless' },
  { pos: 'efficient', posComp: 'more efficient', neg: 'wasteful', negComp: 'more wasteful' },
  { pos: 'productive', posComp: 'more productive', neg: 'unproductive', negComp: 'more unproductive' },
  { pos: 'stable', posComp: 'more stable', neg: 'unstable', negComp: 'more unstable' },
  { pos: 'clear', posComp: 'clearer', neg: 'vague', negComp: 'vaguer' },
  { pos: 'simple', posComp: 'simpler', neg: 'complex', negComp: 'more complex' },
  { pos: 'modern', posComp: 'more modern', neg: 'ancient', negComp: 'more ancient' },
  { pos: 'expensive', posComp: 'more expensive', neg: 'cheap', negComp: 'cheaper' },
  { pos: 'valuable', posComp: 'more valuable', neg: 'worthless', negComp: 'more worthless' },
  { pos: 'rare', posComp: 'rarer', neg: 'common', negComp: 'more common' },
  { pos: 'famous', posComp: 'more famous', neg: 'unknown', negComp: 'more unknown' },
  { pos: 'popular', posComp: 'more popular', neg: 'unpopular', negComp: 'more unpopular' },
  { pos: 'safe', posComp: 'safer', neg: 'dangerous', negComp: 'more dangerous' },
  { pos: 'beautiful', posComp: 'more beautiful', neg: 'ugly', negComp: 'uglier' },
  { pos: 'pleasant', posComp: 'more pleasant', neg: 'unpleasant', negComp: 'more unpleasant' },
  { pos: 'sweet', posComp: 'sweeter', neg: 'sour', negComp: 'sourer' },
  { pos: 'fresh', posComp: 'fresher', neg: 'stale', negComp: 'staler' },
  { pos: 'shiny', posComp: 'shinier', neg: 'dull', negComp: 'duller' },
  { pos: 'dense', posComp: 'denser', neg: 'sparse', negComp: 'sparser' },
  { pos: 'steep', posComp: 'steeper', neg: 'flat', negComp: 'flatter' },
  { pos: 'near', posComp: 'nearer', neg: 'far', negComp: 'farther' },
  { pos: 'early', posComp: 'earlier', neg: 'late', negComp: 'later' },
  { pos: 'active', posComp: 'more active', neg: 'passive', negComp: 'more passive' },
  { pos: 'alert', posComp: 'more alert', neg: 'sleepy', negComp: 'sleepier' },
  { pos: 'careful', posComp: 'more careful', neg: 'careless', negComp: 'more careless' },
  { pos: 'cheerful', posComp: 'more cheerful', neg: 'gloomy', negComp: 'gloomier' },
  { pos: 'clever', posComp: 'cleverer', neg: 'stupid', negComp: 'stupider' },
  { pos: 'confident', posComp: 'more confident', neg: 'insecure', negComp: 'more insecure' },
  { pos: 'diligent', posComp: 'more diligent', neg: 'lazy', negComp: 'lazier' },
  { pos: 'distant', posComp: 'more distant', neg: 'close', negComp: 'closer' },
  { pos: 'exciting', posComp: 'more exciting', neg: 'boring', negComp: 'more boring' },
  { pos: 'firm', posComp: 'firmer', neg: 'loose', negComp: 'looser' },
  { pos: 'funny', posComp: 'funnier', neg: 'serious', negComp: 'more serious' },
  { pos: 'huge', posComp: 'huger', neg: 'tiny', negComp: 'tinier' },
  { pos: 'guilty', posComp: 'more guilty', neg: 'innocent', negComp: 'more innocent' },
  { pos: 'helpful', posComp: 'more helpful', neg: 'helpless', negComp: 'more helpless' },
  { pos: 'hollow', posComp: 'more hollow', neg: 'solid', negComp: 'more solid' },
  { pos: 'important', posComp: 'more important', neg: 'trivial', negComp: 'more trivial' },
  { pos: 'legal', posComp: 'more legal', neg: 'illegal', negComp: 'more illegal' },
  { pos: 'logical', posComp: 'more logical', neg: 'illogical', negComp: 'more illogical' },
  { pos: 'long', posComp: 'longer', neg: 'short', negComp: 'shorter' },
  { pos: 'loose', posComp: 'looser', neg: 'tight', negComp: 'tighter' },
  { pos: 'lucky', posComp: 'luckier', neg: 'unlucky', negComp: 'more unlucky' },
  { pos: 'massive', posComp: 'more massive', neg: 'slight', negComp: 'slighter' },
  { pos: 'messy', posComp: 'messier', neg: 'neat', negComp: 'neater' },
  { pos: 'mighty', posComp: 'mightier', neg: 'weak', negComp: 'weaker' },
  { pos: 'mild', posComp: 'milder', neg: 'harsh', negComp: 'harsher' },
  { pos: 'moral', posComp: 'more moral', neg: 'immoral', negComp: 'more immoral' },
  { pos: 'mysterious', posComp: 'more mysterious', neg: 'obvious', negComp: 'more obvious' },
  { pos: 'natural', posComp: 'more natural', neg: 'artificial', negComp: 'more artificial' },
  { pos: 'necessary', posComp: 'more necessary', neg: 'optional', negComp: 'more optional' },
  { pos: 'noble', posComp: 'nobler', neg: 'mean', negComp: 'meaner' },
  { pos: 'noisy', posComp: 'noisier', neg: 'quiet', negComp: 'quieter' },
  { pos: 'normal', posComp: 'more normal', neg: 'abnormal', negComp: 'more abnormal' },
  { pos: 'objective', posComp: 'more objective', neg: 'subjective', negComp: 'more subjective' },
  { pos: 'ordinary', posComp: 'more ordinary', neg: 'special', negComp: 'more special' },
  { pos: 'outgoing', posComp: 'more outgoing', neg: 'shy', negComp: 'shyer' },
  { pos: 'painful', posComp: 'more painful', neg: 'painless', negComp: 'more painless' },
  { pos: 'pale', posComp: 'paler', neg: 'dark', negComp: 'darker' },
  { pos: 'perfect', posComp: 'more perfect', neg: 'imperfect', negComp: 'more imperfect' },
  { pos: 'permanent', posComp: 'more permanent', neg: 'temporary', negComp: 'more temporary' },
  { pos: 'plain', posComp: 'plainer', neg: 'fancy', negComp: 'fancier' },
  { pos: 'plentiful', posComp: 'more plentiful', neg: 'scarce', negComp: 'scarcer' },
  { pos: 'powerful', posComp: 'more powerful', neg: 'weak', negComp: 'weaker' },
  { pos: 'precise', posComp: 'more precise', neg: 'vague', negComp: 'vaguer' },
  { pos: 'pretty', posComp: 'prettier', neg: 'ugly', negComp: 'uglier' },
  { pos: 'primitive', posComp: 'more primitive', neg: 'advanced', negComp: 'more advanced' },
  { pos: 'proud', posComp: 'prouder', neg: 'humble', negComp: 'more humble' },
  { pos: 'pure', posComp: 'purer', neg: 'dirty', negComp: 'dirtier' },
  { pos: 'quick', posComp: 'quicker', neg: 'slow', negComp: 'slower' },
  { pos: 'raw', posComp: 'rawer', neg: 'cooked', negComp: 'more cooked' },
  { pos: 'real', posComp: 'more real', neg: 'fake', negComp: 'faker' },
  { pos: 'relaxed', posComp: 'more relaxed', neg: 'tense', negComp: 'more tense' },
  { pos: 'resilient', posComp: 'more resilient', neg: 'brittle', negComp: 'more brittle' },
  { pos: 'responsible', posComp: 'more responsible', neg: 'careless', negComp: 'more careless' },
  { pos: 'ripe', posComp: 'riper', neg: 'unripe', negComp: 'more unripe' },
  { pos: 'risky', posComp: 'riskier', neg: 'safe', negComp: 'safer' },
  { pos: 'robust', posComp: 'more robust', neg: 'weak', negComp: 'weaker' },
  { pos: 'sane', posComp: 'saner', neg: 'insane', negComp: 'more insane' },
  { pos: 'savory', posComp: 'more savory', neg: 'bland', negComp: 'blander' },
  { pos: 'secret', posComp: 'more secret', neg: 'open', negComp: 'more open' },
  { pos: 'severe', posComp: 'more severe', neg: 'mild', negComp: 'milder' },
  { pos: 'silent', posComp: 'more silent', neg: 'loud', negComp: 'louder' },
  { pos: 'sincere', posComp: 'more sincere', neg: 'insincere', negComp: 'more insincere' },
  { pos: 'skillful', posComp: 'more skillful', neg: 'clumsy', negComp: 'clumsier' },
  { pos: 'skinny', posComp: 'skinnier', neg: 'fat', negComp: 'fatter' },
  { pos: 'sleek', posComp: 'sleeker', neg: 'rough', negComp: 'rougher' },
  { pos: 'slight', posComp: 'slighter', neg: 'massive', negComp: 'more massive' },
  { pos: 'slim', posComp: 'slimmer', neg: 'fat', negComp: 'fatter' },
  { pos: 'sloppy', posComp: 'sloppier', neg: 'neat', negComp: 'neater' },
  { pos: 'smug', posComp: 'smugger', neg: 'modest', negComp: 'more modest' },
  { pos: 'sociable', posComp: 'more sociable', neg: 'unsociable', negComp: 'more unsociable' },
  { pos: 'solid', posComp: 'more solid', neg: 'hollow', negComp: 'more hollow' },
  { pos: 'sour', posComp: 'sourer', neg: 'sweet', negComp: 'sweeter' },
  { pos: 'spacious', posComp: 'more spacious', neg: 'cramped', negComp: 'more cramped' },
  { pos: 'speedy', posComp: 'speedier', neg: 'slow', negComp: 'slower' },
  { pos: 'spicy', posComp: 'spicier', neg: 'bland', negComp: 'blander' },
  { pos: 'stale', posComp: 'staler', neg: 'fresh', negComp: 'fresher' },
  { pos: 'stark', posComp: 'starker', neg: 'ornate', negComp: 'more ornate' },
  { pos: 'static', posComp: 'more static', neg: 'dynamic', negComp: 'more dynamic' },
  { pos: 'sterile', posComp: 'more sterile', neg: 'fertile', negComp: 'more fertile' },
  { pos: 'stern', posComp: 'sterner', neg: 'kind', negComp: 'kinder' },
  { pos: 'stiff', posComp: 'stiffer', neg: 'flexible', negComp: 'more flexible' },
  { pos: 'stubborn', posComp: 'more stubborn', neg: 'flexible', negComp: 'more flexible' },
  { pos: 'sturdy', posComp: 'sturdier', neg: 'weak', negComp: 'weaker' },
  { pos: 'submissive', posComp: 'more submissive', neg: 'dominant', negComp: 'more dominant' },
  { pos: 'succinct', posComp: 'more succinct', neg: 'wordy', negComp: 'wordier' },
  { pos: 'sunny', posComp: 'sunnier', neg: 'cloudy', negComp: 'cloudier' },
  { pos: 'superior', posComp: 'more superior', neg: 'inferior', negComp: 'more inferior' },
  { pos: 'sure', posComp: 'surer', neg: 'doubtful', negComp: 'more doubtful' },
  { pos: 'suspicious', posComp: 'more suspicious', neg: 'trusting', negComp: 'more trusting' },
  { pos: 'swift', posComp: 'swifter', neg: 'slow', negComp: 'slower' },
  { pos: 'symmetrical', posComp: 'more symmetrical', neg: 'asymmetrical', negComp: 'more asymmetrical' },
  { pos: 'tame', posComp: 'tamer', neg: 'wild', negComp: 'wilder' },
  { pos: 'tangible', posComp: 'more tangible', neg: 'abstract', negComp: 'more abstract' },
  { pos: 'tasty', posComp: 'tastier', neg: 'bland', negComp: 'blander' },
  { pos: 'taut', posComp: 'tauter', neg: 'slack', negComp: 'slacker' },
  { pos: 'tedious', posComp: 'more tedious', neg: 'exciting', negComp: 'more exciting' },
  { pos: 'temporary', posComp: 'more temporary', neg: 'permanent', negComp: 'more permanent' },
  { pos: 'tense', posComp: 'more tense', neg: 'relaxed', negComp: 'more relaxed' },
  { pos: 'tentative', posComp: 'more tentative', neg: 'certain', negComp: 'more certain' },
  { pos: 'terrible', posComp: 'more terrible', neg: 'wonderful', negComp: 'more wonderful' },
  { pos: 'terse', posComp: 'terser', neg: 'wordy', negComp: 'wordier' },
  { pos: 'thorough', posComp: 'more thorough', neg: 'careless', negComp: 'more careless' },
  { pos: 'thrifty', posComp: 'thriftier', neg: 'extravagant', negComp: 'more extravagant' },
  { pos: 'thrilling', posComp: 'more thrilling', neg: 'boring', negComp: 'more boring' },
  { pos: 'tidy', posComp: 'tidier', neg: 'messy', negComp: 'messier' },
  { pos: 'timely', posComp: 'more timely', neg: 'late', negComp: 'later' },
  { pos: 'tiny', posComp: 'tinier', neg: 'huge', negComp: 'huger' },
  { pos: 'tolerant', posComp: 'more tolerant', neg: 'narrow-minded', negComp: 'more narrow-minded' },
  { pos: 'traditional', posComp: 'more traditional', neg: 'modern', negComp: 'more modern' },
  { pos: 'tragic', posComp: 'more tragic', neg: 'comic', negComp: 'more comic' },
  { pos: 'transparent', posComp: 'more transparent', neg: 'opaque', negComp: 'more opaque' },
  { pos: 'treacherous', posComp: 'more treacherous', neg: 'faithful', negComp: 'more faithful' },
  { pos: 'tricky', posComp: 'trickier', neg: 'simple', negComp: 'simpler' },
  { pos: 'trivial', posComp: 'more trivial', neg: 'major', negComp: 'more major' },
  { pos: 'troubled', posComp: 'more troubled', neg: 'calm', negComp: 'calmer' },
  { pos: 'true', posComp: 'truer', neg: 'false', negComp: 'falser' },
  { pos: 'trustworthy', posComp: 'more trustworthy', neg: 'deceitful', negComp: 'more deceitful' },
  { pos: 'truthful', posComp: 'more truthful', neg: 'dishonest', negComp: 'more dishonest' },
  { pos: 'typical', posComp: 'more typical', neg: 'unusual', negComp: 'more unusual' },
  { pos: 'uncertain', posComp: 'more uncertain', neg: 'sure', negComp: 'surer' },
  { pos: 'uncommon', posComp: 'more uncommon', neg: 'common', negComp: 'more common' },
  { pos: 'unconscious', posComp: 'more unconscious', neg: 'aware', negComp: 'more aware' },
  { pos: 'uneasy', posComp: 'more uneasy', neg: 'comfortable', negComp: 'more comfortable' },
  { pos: 'uneven', posComp: 'more uneven', neg: 'smooth', negComp: 'smoother' },
  { pos: 'unfair', posComp: 'more unfair', neg: 'just', negComp: 'more just' },
  { pos: 'unfortunate', posComp: 'more unfortunate', neg: 'lucky', negComp: 'luckier' },
  { pos: 'unhealthy', posComp: 'more unhealthy', neg: 'fit', negComp: 'fitter' },
  { pos: 'unique', posComp: 'more unique', neg: 'common', negComp: 'more common' },
  { pos: 'unjust', posComp: 'more unjust', neg: 'fair', negComp: 'fairer' },
  { pos: 'unlikely', posComp: 'more unlikely', neg: 'probable', negComp: 'more probable' },
  { pos: 'unlucky', posComp: 'more unlucky', neg: 'fortunate', negComp: 'more fortunate' },
  { pos: 'unnatural', posComp: 'more unnatural', neg: 'normal', negComp: 'more normal' },
  { pos: 'unpleasant', posComp: 'more unpleasant', neg: 'nice', negComp: 'nicer' },
  { pos: 'unpopular', posComp: 'more unpopular', neg: 'liked', negComp: 'more liked' },
  { pos: 'unreliable', posComp: 'more unreliable', neg: 'steady', negComp: 'steadier' },
  { pos: 'unripe', posComp: 'more unripe', neg: 'mature', negComp: 'more mature' },
  { pos: 'unruly', posComp: 'more unruly', neg: 'orderly', negComp: 'more orderly' },
  { pos: 'unsafe', posComp: 'more unsafe', neg: 'secure', negComp: 'more secure' },
  { pos: 'unsavory', posComp: 'more unsavory', neg: 'pleasant', negComp: 'more pleasant' },
  { pos: 'unselfish', posComp: 'more unselfish', neg: 'greedy', negComp: 'greedier' },
  { pos: 'unstable', posComp: 'more unstable', neg: 'firm', negComp: 'firmer' },
  { pos: 'unsteady', posComp: 'more unsteady', neg: 'firm', negComp: 'firmer' },
  { pos: 'unsuccessful', posComp: 'more unsuccessful', neg: 'lucky', negComp: 'luckier' },
  { pos: 'unsure', posComp: 'more unsure', neg: 'certain', negComp: 'more certain' },
  { pos: 'untidy', posComp: 'untidier', neg: 'neat', negComp: 'neater' },
  { pos: 'unusual', posComp: 'more unusual', neg: 'common', negComp: 'more common' },
  { pos: 'unwary', posComp: 'more unwary', neg: 'cautious', negComp: 'more cautious' },
  { pos: 'unwilling', posComp: 'more unwilling', neg: 'eager', negComp: 'more eager' },
  { pos: 'unwise', posComp: 'more unwise', neg: 'smart', negComp: 'smarter' },
  { pos: 'upright', posComp: 'more upright', neg: 'dishonest', negComp: 'more dishonest' },
  { pos: 'urgent', posComp: 'more urgent', neg: 'trivial', negComp: 'more trivial' },
  { pos: 'useful', posComp: 'more useful', neg: 'useless', negComp: 'more useless' },
  { pos: 'usual', posComp: 'more usual', neg: 'rare', negComp: 'rarer' },
  { pos: 'vacant', posComp: 'more vacant', neg: 'full', negComp: 'fuller' },
  { pos: 'vague', posComp: 'vaguer', neg: 'clear', negComp: 'clearer' },
  { pos: 'vain', posComp: 'vainer', neg: 'modest', negComp: 'more modest' },
  { pos: 'valiant', posComp: 'more valiant', neg: 'cowardly', negComp: 'more cowardly' },
  { pos: 'valid', posComp: 'more valid', neg: 'false', negComp: 'falser' },
  { pos: 'variable', posComp: 'more variable', neg: 'fixed', negComp: 'more fixed' },
  { pos: 'vast', posComp: 'vaster', neg: 'tiny', negComp: 'tinier' },
  { pos: 'vehement', posComp: 'more vehement', neg: 'calm', negComp: 'calmer' },
  { pos: 'verbose', posComp: 'more verbose', neg: 'terse', negComp: 'terser' },
  { pos: 'vicious', posComp: 'more vicious', neg: 'kind', negComp: 'kinder' },
  { pos: 'victorious', posComp: 'more victorious', neg: 'beaten', negComp: 'more beaten' },
  { pos: 'vigilant', posComp: 'more vigilant', neg: 'careless', negComp: 'more careless' },
  { pos: 'vigorous', posComp: 'more vigorous', neg: 'weak', negComp: 'weaker' },
  { pos: 'vile', posComp: 'more vile', neg: 'noble', negComp: 'nobler' },
  { pos: 'violent', posComp: 'more violent', neg: 'peaceful', negComp: 'more peaceful' },
  { pos: 'virtuous', posComp: 'more virtuous', neg: 'wicked', negComp: 'more wicked' },
  { pos: 'visible', posComp: 'more visible', neg: 'hidden', negComp: 'more hidden' },
  { pos: 'visionary', posComp: 'more visionary', neg: 'practical', negComp: 'more practical' },
  { pos: 'vital', posComp: 'more vital', neg: 'trivial', negComp: 'more trivial' },
  { pos: 'vivacious', posComp: 'more vivacious', neg: 'dull', negComp: 'duller' },
  { pos: 'vivid', posComp: 'more vivid', neg: 'pale', negComp: 'paler' },
  { pos: 'vocal', posComp: 'more vocal', neg: 'quiet', negComp: 'quieter' },
  { pos: 'volatile', posComp: 'more volatile', neg: 'stable', negComp: 'more stable' },
  { pos: 'vulgar', posComp: 'more vulgar', neg: 'refined', negComp: 'more refined' },
  { pos: 'vulnerable', posComp: 'more vulnerable', neg: 'secure', negComp: 'more secure' },
  { pos: 'wary', posComp: 'more wary', neg: 'trusting', negComp: 'more trusting' },
  { pos: 'wasteful', posComp: 'more wasteful', neg: 'thrifty', negComp: 'thriftier' },
  { pos: 'wealthy', posComp: 'wealthier', neg: 'poor', negComp: 'poorer' },
  { pos: 'weary', posComp: 'wearier', neg: 'fresh', negComp: 'fresher' },
  { pos: 'weighty', posComp: 'more weighty', neg: 'trivial', negComp: 'more trivial' },
  { pos: 'weird', posComp: 'weirder', neg: 'normal', negComp: 'more normal' },
  { pos: 'whole', posComp: 'more whole', neg: 'partial', negComp: 'more partial' },
  { pos: 'wicked', posComp: 'more wicked', neg: 'holy', negComp: 'more holy' },
  { pos: 'wild', posComp: 'wilder', neg: 'tame', negComp: 'tamer' },
  { pos: 'willing', posComp: 'more willing', neg: 'reluctant', negComp: 'more reluctant' },
  { pos: 'wily', posComp: 'wilier', neg: 'candid', negComp: 'more candid' },
  { pos: 'wintry', posComp: 'more wintry', neg: 'summery', negComp: 'more summery' },
  { pos: 'witty', posComp: 'wittier', neg: 'dull', negComp: 'duller' },
  { pos: 'wonderful', posComp: 'more wonderful', neg: 'awful', negComp: 'more awful' },
  { pos: 'wordy', posComp: 'wordier', neg: 'terse', negComp: 'terser' },
  { pos: 'worldly', posComp: 'more worldly', neg: 'spiritual', negComp: 'more spiritual' },
  { pos: 'worried', posComp: 'more worried', neg: 'calm', negComp: 'calmer' },
  { pos: 'youthful', posComp: 'more youthful', neg: 'wizened', negComp: 'more wizened' },
];


type Round = {
  statement: string;
  question: string;
  answer: string;
  options: [string, string];
  signature: string;
};

function makeRoundRaw(): Round {
  const name1 = NAMES[randomInt(0, NAMES.length - 1)];
  let name2 = NAMES[randomInt(0, NAMES.length - 1)];
  while (name2 === name1) {
    name2 = NAMES[randomInt(0, NAMES.length - 1)];
  }

  const pairIndex = randomInt(0, PAIRS.length - 1);
  const pair = PAIRS[pairIndex];
  
  const isName1Positive = Math.random() > 0.5;
  const p = isName1Positive ? name1 : name2;
  const n = isName1Positive ? name2 : name1;

  const statementTemplates = [
    // Direct
    () => `${p} is ${pair.posComp} than ${n}.`,
    () => `${n} is ${pair.negComp} than ${p}.`,
    // Negation
    () => `${n} is not as ${pair.pos} as ${p}.`,
    () => `${p} is not as ${pair.neg} as ${n}.`,
    // Synonym
    () => `${p} is less ${pair.neg} than ${n}.`,
    () => `${n} is less ${pair.pos} than ${p}.`,
  ];

  const statementIndex = randomInt(0, statementTemplates.length - 1);
  const statement = statementTemplates[statementIndex]();

  const questionTemplates = [
    // Direct
    { text: `Who is ${pair.posComp}?`, answer: p },
    { text: `Who is ${pair.negComp}?`, answer: n },
    { text: `Which one is ${pair.posComp}?`, answer: p },
    { text: `Which one is ${pair.negComp}?`, answer: n },
    // Synonym
    { text: `Who is less ${pair.pos}?`, answer: n },
    { text: `Who is less ${pair.neg}?`, answer: p },
    { text: `Which one is less ${pair.pos}?`, answer: n },
    { text: `Which one is less ${pair.neg}?`, answer: p },
  ];

  const questionObj = questionTemplates[randomInt(0, questionTemplates.length - 1)];
  const question = questionObj.text;
  const answer = questionObj.answer;
  const options = Math.random() > 0.5 ? [name1, name2] : [name2, name1];

  return {
    statement,
    question,
    answer,
    options: [options[0], options[1]],
    signature: `${pair.pos}-${statementIndex}-${question}-${name1}-${name2}`,
  };
}

function makeRound(): Round {
  return generateRecentUnique(
    'gia-reasoning',
    15,
    makeRoundRaw,
    (r) => r.signature
  );
}

export default function GiaReasoningTest({ definition, onComplete }: TestGameProps) {
  const [round, setRound] = useState<Round>(() => makeRound());
  const [phase, setPhase] = useState<'statement' | 'question'>('statement');
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [netStatus, setNetStatus] = useState<'success' | 'danger' | 'neutral'>('neutral');
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const submittedRef = useRef(false);
  const statsRef = useRef({ correct: 0, incorrect: 0 });

  const score = useMemo(() => correct - incorrect, [correct, incorrect]);

  const complete = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setFinished(true);
    const finalCorrect = statsRef.current.correct;
    const finalIncorrect = statsRef.current.incorrect;
    const finalScore = finalCorrect - finalIncorrect;
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
    setRound(makeRound());
    setPhase('statement');
  };

  return (
    <div className="game-container">
      <Timer label="Remaining" milliseconds={timer.remainingMs} progress={1 - timer.progress} />

      <div style={{ display: 'flex', gap: 'clamp(0.5rem, 2vw, 1.5rem)', flexWrap: 'wrap', flexShrink: 0 }}>
        <ScoreDisplay label="Correct" value={correct} status="success" />
        <ScoreDisplay label="Incorrect" value={incorrect} status="danger" />
        <ScoreDisplay label="Net" value={score} status={netStatus} />
      </div>

      {!started ? (
        <TestStartScreen
          description="Read each statement, then answer the question. You have 2 minutes."
          onStart={handleStart}
        />
      ) : (
        <div
          className="game-grid-container"
          style={{
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: 'clamp(1rem, 5vw, 1.5rem)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 'clamp(1rem, 4vh, 2rem)',
            background: 'var(--surface-raised)',
          }}
        >
          {phase === 'statement' ? (
            <div style={{ textAlign: 'center', display: 'grid', gap: '1rem', width: '100%' }}>
              <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statement</small>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 5vw, 2.2rem)' }}>{round.statement}</h2>
              <button 
                type="button" 
                className="button" 
                onClick={() => setPhase('question')}
                style={{ padding: '0.8rem 2rem', fontSize: '1rem', marginInline: 'auto' }}
              >
                Show Question
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', display: 'grid', gap: '1rem', width: '100%' }}>
              <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question</small>
              <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 5vw, 2.2rem)' }}>{round.question}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'clamp(0.5rem, 2vw, 1rem)', maxWidth: '500px', marginInline: 'auto', width: '100%' }}>
                {round.options.map((name) => (
                  <button 
                    key={name} 
                    type="button" 
                    className="button" 
                    onClick={() => answer(name)}
                    style={{ padding: '0.8rem 1rem', fontSize: '1rem' }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
