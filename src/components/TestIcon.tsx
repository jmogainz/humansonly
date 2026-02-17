import React from 'react';

const s = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const icons: Record<string, React.ReactNode> = {
  'reaction-time': (
    <svg {...s}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
  ),
  'chimp-test': (
    <svg {...s}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
  ),
  'typing': (
    <svg {...s}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M9 16h6" /></svg>
  ),
  'visual-memory': (
    <svg {...s}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  'aim-trainer': (
    <svg {...s}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
  ),
  'number-memory': (
    <svg {...s}><path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" /></svg>
  ),
  'verbal-memory': (
    <svg {...s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M8 7h8M8 11h6" /></svg>
  ),
  'sequence-memory': (
    <svg {...s}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h3v3H7zM14 7h3v3h-3zM7 14h3v3H7zM14 14h3v3h-3z" /></svg>
  ),
  'symbol-search': (
    <svg {...s}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /><path d="M8 11h6M11 8v6" /></svg>
  ),
  'color-blindness': (
    <svg {...s}><circle cx="12" cy="12" r="10" /><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20" opacity="0.5" /><path d="M2 12h20" opacity="0.3" /></svg>
  ),
  'face-memory': (
    <svg {...s}><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 1 0-16 0" /></svg>
  ),
  'hue-test': (
    <svg {...s}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
  ),
  'object-tracking': (
    <svg {...s}><circle cx="12" cy="12" r="3" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2" /><circle cx="12" cy="12" r="9" opacity="0.3" /></svg>
  ),
  'gia-reasoning': (
    <svg {...s}>
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.48z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.48z" />
    </svg>
  ),
  'gia-perceptual-speed': (
    <svg {...s}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
  ),
  'gia-number-speed': (
    <svg {...s}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /><line x1="5" y1="5" x2="19" y2="19" opacity="0.5" /><line x1="5" y1="19" x2="19" y2="5" opacity="0.5" /></svg>
  ),
  'gia-word-meaning': (
    <svg {...s}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
  ),
  'gia-spatial': (
    <svg {...s}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  ),
  'gia-combined': (
    <svg {...s}><circle cx="12" cy="12" r="10" /><path d="M12 2v20" /><path d="M2 12h20" /><path d="M12 12l5-5" /></svg>
  ),
};

export function TestIcon({ slug }: { slug: string }) {
  return <>{icons[slug] ?? icons['reaction-time']}</>;
}
