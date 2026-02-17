'use client';

import { useState } from 'react';
import { TEST_REGISTRY_BY_SLUG } from '@/lib/tests/registry';
import { formatNumber } from '@/lib/utils';
import { Spinner } from './Spinner';

type StatsShareCardProps = {
  displayName: string;
  bests: Array<{ testSlug: string; bestScore: number; scoreUnit: string }>;
};

export default function StatsShareCard({ displayName, bests }: StatsShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (bests.length === 0) return;
    setIsGenerating(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Portrait orientation
      canvas.width = 800;
      canvas.height = 1000;

      // Theme detection
      const isDark = document.documentElement.dataset.theme === 'dark';
      
      // Background
      ctx.fillStyle = isDark ? '#0a0a0a' : '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Gradient background subtle
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, isDark ? '#111111' : '#f9f9f9');
      grad.addColorStop(1, isDark ? '#0a0a0a' : '#ffffff');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Accent bar
      ctx.fillStyle = '#0070f3'; // HumansOnly blue
      ctx.fillRect(0, 0, canvas.width, 10);

      // Title
      ctx.fillStyle = isDark ? '#ffffff' : '#000000';
      ctx.font = 'bold 52px Outfit, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText('Performance Atlas', 60, 80);

      ctx.fillStyle = isDark ? '#888888' : '#666666';
      ctx.font = '28px Outfit, sans-serif';
      ctx.fillText(displayName, 60, 145);

      // Decorative dots
      ctx.fillStyle = '#0070f3';
      ctx.beginPath();
      ctx.arc(45, 108, 6, 0, Math.PI * 2);
      ctx.fill();

      // Divider
      ctx.strokeStyle = isDark ? '#222222' : '#eeeeee';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 200);
      ctx.lineTo(740, 200);
      ctx.stroke();

      // Stats Grid
      let y = 260;
      const sortedBests = [...bests]
        .filter(b => TEST_REGISTRY_BY_SLUG.has(b.testSlug))
        .sort((a, b) => a.testSlug.localeCompare(b.testSlug));

      for (const best of sortedBests) {
        if (y > 900) break;

        const test = TEST_REGISTRY_BY_SLUG.get(best.testSlug);
        const name = test?.name.replace('GIA ', '') ?? best.testSlug;
        
        // Test name
        ctx.fillStyle = isDark ? '#ffffff' : '#000000';
        ctx.font = '500 28px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(name, 60, y);

        // Score
        ctx.fillStyle = '#0070f3';
        ctx.font = 'bold 30px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        const scoreStr = `${formatNumber(best.bestScore, best.bestScore % 1 === 0 ? 0 : 2)} ${best.scoreUnit}`;
        ctx.fillText(scoreStr, 740, y);

        // Subtle row line
        ctx.strokeStyle = isDark ? '#1a1a1a' : '#f5f5f5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(60, y + 45);
        ctx.lineTo(740, y + 45);
        ctx.stroke();

        y += 65;
      }

      // Footer
      ctx.fillStyle = isDark ? '#444444' : '#aaaaaa';
      ctx.textAlign = 'center';
      ctx.font = '24px Outfit, sans-serif';
      ctx.fillText('tryhumansonly.com', canvas.width / 2, 940);

      // Wait a tiny bit for fonts to potentially settle (not perfect but helps)
      await new Promise(r => setTimeout(r, 100));

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
      if (!blob) throw new Error('Failed to create blob');

      const file = new File([blob], 'humansonly-atlas.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'HumansOnly Performance Atlas',
          text: `My cognitive performance on HumansOnly! Check out my stats.`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'humansonly-atlas.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Share failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      className="button buttonGhost"
      onClick={handleShare}
      disabled={isGenerating || bests.length === 0}
      title="Share your performance atlas"
      style={{ 
        padding: '0.5rem 0.85rem',
        fontSize: '0.85rem',
        height: 'auto',
        border: '1px solid var(--border)',
        background: 'var(--surface-raised)',
        boxShadow: 'var(--card-shadow)'
      }}
    >
      {isGenerating ? <Spinner size={16} /> : (
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ marginRight: '0.5rem' }}
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      )}
      {isGenerating ? 'Generating...' : 'Share Atlas'}
    </button>
  );
}
