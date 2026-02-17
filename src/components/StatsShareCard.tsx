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

  const giaBests = bests.filter(b => {
    const test = TEST_REGISTRY_BY_SLUG.get(b.testSlug);
    return test && test.category === 'gia';
  });

  const handleShare = async () => {
    if (giaBests.length === 0) return;
    setIsGenerating(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

      // Portrait orientation
      canvas.width = 800;
      canvas.height = 1000;

      // Theme detection
      const isDark = document.documentElement.dataset.theme === 'dark';
      const accentColor = isDark ? '#22d3ee' : '#06b6d4';
      const textColor = isDark ? '#ededf0' : '#111113';
      const mutedTextColor = isDark ? '#8b8b96' : '#6b6b76';
      
      // Background
      ctx.fillStyle = isDark ? '#0a0a0c' : '#f9fafb';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle Grid Pattern
      ctx.strokeStyle = isDark ? '#1a1a20' : '#f0f0f5';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Gradient background subtle
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, isDark ? 'rgba(20, 20, 24, 0.4)' : 'rgba(255, 255, 255, 0.4)');
      grad.addColorStop(1, isDark ? 'rgba(10, 10, 12, 0.8)' : 'rgba(249, 249, 251, 0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Accent bar
      ctx.fillStyle = accentColor;
      ctx.fillRect(0, 0, canvas.width, 10);

      // Logo and Branding
      const logoImg = await loadImage(isDark ? '/favicon-dark.svg' : '/favicon-light.svg').catch(() => null);
      if (logoImg) {
        ctx.drawImage(logoImg, 60, 80, 40, 40);
      }

      ctx.fillStyle = textColor;
      ctx.font = '700 36px Outfit, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.fillText('HumansOnly', logoImg ? 115 : 60, 102);

      ctx.font = 'bold 52px Outfit, sans-serif';
      ctx.fillText('Cognitive Atlas', 60, 180);

      ctx.fillStyle = mutedTextColor;
      ctx.font = '28px Outfit, sans-serif';
      ctx.fillText(`Analysis for ${displayName}`, 60, 235);

      // Divider
      ctx.strokeStyle = isDark ? '#2a2a32' : '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 280);
      ctx.lineTo(740, 280);
      ctx.stroke();

      // Stats Grid
      const sortedGiaTests = [...giaBests]
        .sort((a, b) => {
          if (a.testSlug === 'gia-combined') return -1;
          if (b.testSlug === 'gia-combined') return 1;
          return a.testSlug.localeCompare(b.testSlug);
        });

      let y = 360;
      for (const best of sortedGiaTests) {
        if (y > 920) break;

        const test = TEST_REGISTRY_BY_SLUG.get(best.testSlug);
        const isCombined = best.testSlug === 'gia-combined';
        const name = test?.name.replace('GIA ', '') ?? best.testSlug;
        
        // Row background for highlights
        if (isCombined) {
          ctx.fillStyle = `${accentColor}15`;
          ctx.beginPath();
          ctx.roundRect(40, y - 50, 720, 100, 16);
          ctx.fill();
        }

        // Indicator
        ctx.fillStyle = isCombined ? accentColor : mutedTextColor;
        ctx.beginPath();
        if (isCombined) {
          ctx.arc(75, y, 12, 0, Math.PI * 2);
        } else {
          ctx.roundRect(72, y - 12, 6, 24, 3);
        }
        ctx.fill();

        // Test name
        ctx.fillStyle = isCombined ? textColor : textColor;
        ctx.font = isCombined ? '700 38px Outfit, sans-serif' : '500 30px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(name, 110, y);

        // Score
        ctx.fillStyle = isCombined ? accentColor : textColor;
        ctx.font = isCombined ? 'bold 44px JetBrains Mono, monospace' : '600 34px JetBrains Mono, monospace';
        ctx.textAlign = 'right';
        const scoreStr = `${formatNumber(best.bestScore, best.bestScore % 1 === 0 ? 0 : 2)}${isCombined ? '' : ' ' + best.scoreUnit}`;
        ctx.fillText(scoreStr, 725, y);

        // Subtle row line
        if (!isCombined) {
          ctx.strokeStyle = isDark ? '#1a1a20' : '#f0f0f5';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(60, y + 45);
          ctx.lineTo(740, y + 45);
          ctx.stroke();
        }

        y += isCombined ? 120 : 85;
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
          title: 'HumansOnly GIA Profile',
          text: 'Check out my GIA cognitive profile on tryhumansonly.com',
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
      disabled={isGenerating || giaBests.length === 0}
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
