import type { ComponentType } from 'react';
import type { TestGameProps } from '../_shared/types';
import ReactionTimeTest from './reaction-time';
import ChimpTest from './chimp-test';
import TypingTest from './typing';
import VisualMemoryTest from './visual-memory';
import AimTrainerTest from './aim-trainer';
import NumberMemoryTest from './number-memory';
import VerbalMemoryTest from './verbal-memory';
import SequenceMemoryTest from './sequence-memory';
import SymbolSearchTest from './symbol-search';
import ColorBlindnessTest from './color-blindness';
import FaceMemoryTest from './face-memory';
import HueTest from './hue-test';
import ObjectTrackingTest from './object-tracking';
import GiaReasoningTest from './gia-reasoning';
import GiaPerceptualSpeedTest from './gia-perceptual-speed';
import GiaNumberSpeedTest from './gia-number-speed';
import GiaWordMeaningTest from './gia-word-meaning';
import GiaSpatialTest from './gia-spatial';

export const TEST_COMPONENTS: Record<string, ComponentType<TestGameProps>> = {
  'reaction-time': ReactionTimeTest,
  'chimp-test': ChimpTest,
  typing: TypingTest,
  'visual-memory': VisualMemoryTest,
  'aim-trainer': AimTrainerTest,
  'number-memory': NumberMemoryTest,
  'verbal-memory': VerbalMemoryTest,
  'sequence-memory': SequenceMemoryTest,
  'symbol-search': SymbolSearchTest,
  'color-blindness': ColorBlindnessTest,
  'face-memory': FaceMemoryTest,
  'hue-test': HueTest,
  'object-tracking': ObjectTrackingTest,
  'gia-reasoning': GiaReasoningTest,
  'gia-perceptual-speed': GiaPerceptualSpeedTest,
  'gia-number-speed': GiaNumberSpeedTest,
  'gia-word-meaning': GiaWordMeaningTest,
  'gia-spatial': GiaSpatialTest,
};
