import React from 'react';

const GiaReasoningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M3.34 7.05l1.657 1.657m14.01 14.01l-1.66-1.657m-9.9 0l1.66 1.657m8.485-9.9l1.657-1.657M12 21v-1" />
  </svg>
);

const GiaPerceptualSpeedIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
);

const GiaNumberSpeedIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
    <line x1="5" y1="5" x2="19" y2="19" opacity="0.5" />
    <line x1="5" y1="19" x2="19" y2="5" opacity="0.5" />
  </svg>
);

const GiaWordMeaningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const GiaSpatialIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const GiaCombinedIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <path d="M12 12l5-5" />
  </svg>
);

const GenericIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

export function TestIcon({ slug }: { slug: string }) {
  switch (slug) {
    case 'gia-reasoning': return <GiaReasoningIcon />;
    case 'gia-perceptual-speed': return <GiaPerceptualSpeedIcon />;
    case 'gia-number-speed': return <GiaNumberSpeedIcon />;
    case 'gia-word-meaning': return <GiaWordMeaningIcon />;
    case 'gia-spatial': return <GiaSpatialIcon />;
    case 'gia-combined': return <GiaCombinedIcon />;
    default: return <GenericIcon />;
  }
}
