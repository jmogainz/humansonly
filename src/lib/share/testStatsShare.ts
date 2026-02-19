import type { TestDefinition } from '@/lib/tests/types';
import { formatNumber } from '@/lib/utils';

export type RunResultShareOptions = {
  displayName: string;
  test: TestDefinition;
  scoreValue: number;
  breakdown?: { correct: number; incorrect: number; penalty?: number };
};

export async function shareRunResultCard(options: RunResultShareOptions): Promise<void> {
  const { displayName, test, scoreValue, breakdown } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  canvas.width = 800;
  canvas.height = 1000;

  const isDark = document.documentElement.dataset.theme === 'dark';
  const accentColor = isDark ? '#22d3ee' : '#06b6d4';
  const textColor = isDark ? '#ededf0' : '#111113';
  const mutedTextColor = isDark ? '#8b8b96' : '#6b6b76';
  const successColor = isDark ? '#4ade80' : '#16a34a';
  const dangerColor = isDark ? '#f87171' : '#dc2626';

  // Background
  ctx.fillStyle = isDark ? '#0a0a0c' : '#f9fafb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid
  ctx.strokeStyle = isDark ? '#1a1a20' : '#f0f0f5';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += 50) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
  }

  // Gradient overlay
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, isDark ? 'rgba(20, 20, 24, 0.4)' : 'rgba(255, 255, 255, 0.4)');
  grad.addColorStop(1, isDark ? 'rgba(10, 10, 12, 0.8)' : 'rgba(249, 249, 251, 0.8)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Accent bar
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, canvas.width, 10);

  // Logo + branding
  const logoImg = await loadImage(isDark ? '/favicon-dark.svg' : '/favicon-light.svg').catch(() => null);
  if (logoImg) ctx.drawImage(logoImg, 60, 80, 40, 40);
  ctx.fillStyle = textColor;
  ctx.font = '700 36px Outfit, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('HumansOnly', logoImg ? 115 : 60, 102);

  // Test name
  ctx.font = 'bold 52px Outfit, sans-serif';
  ctx.fillText(test.name.replace('GIA ', ''), 60, 180);

  ctx.fillStyle = mutedTextColor;
  ctx.font = '28px Outfit, sans-serif';
  ctx.fillText(`Run Result for ${displayName}`, 60, 235);

  // Divider
  ctx.strokeStyle = isDark ? '#2a2a32' : '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(60, 280); ctx.lineTo(740, 280); ctx.stroke();

  // Build rows — same structure as shareTestStatsCard
  const hasBreakdown = breakdown != null;
  const scoreStr = Number.isInteger(scoreValue)
    ? formatNumber(scoreValue, 0)
    : formatNumber(scoreValue, 2);

  type Row = { label: string; value: string; valueColor: string };
  const rows: Row[] = [
    { label: hasBreakdown ? 'Net Score' : test.scoreUnit, value: scoreStr, valueColor: textColor },
  ];

  if (hasBreakdown) {
    rows.push({ label: 'Correct',   value: `+${breakdown!.correct}`,   valueColor: successColor });
    rows.push({ label: 'Incorrect', value: `-${breakdown!.incorrect}`, valueColor: dangerColor });
    if (test.timeLimitSeconds) {
      const total = breakdown!.correct + breakdown!.incorrect;
      const rate = total > 0 ? test.timeLimitSeconds / total : null;
      if (rate !== null) {
        rows.push({ label: 'Rate', value: `${rate.toFixed(2)} s/q`, valueColor: accentColor });
      }
    }
  }

  const baseY = rows.length <= 4 ? 380 : 350;
  const rowSpacing = rows.length <= 4 ? 130 : 118;
  let y = baseY;
  for (const row of rows) {
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
    ctx.beginPath();
    ctx.roundRect(40, y - 50, 720, 100, 16);
    ctx.fill();

    ctx.fillStyle = mutedTextColor;
    ctx.font = '500 28px Outfit, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(row.label, 80, y);

    ctx.fillStyle = row.valueColor;
    ctx.font = 'bold 38px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(row.value, 720, y);

    y += rowSpacing;
  }

  // Footer
  ctx.fillStyle = isDark ? '#444444' : '#aaaaaa';
  ctx.textAlign = 'center';
  ctx.font = '24px Outfit, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('tryhumansonly.com', canvas.width / 2, 940);

  await new Promise((resolve) => setTimeout(resolve, 100));

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
  if (!blob) throw new Error('Failed to create share image');

  const fileName = `humansonly-${test.slug}-result.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `HumansOnly - ${test.name}`,
      text: `My ${test.name} result on tryhumansonly.com`,
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export type TestShareStats = {
  runs: number;
  best: number | null;
  avg: number | null;
  trend: number | null;
  bestRate?: number | null;
};

function formatScore(value: number | null): string {
  if (value === null) return 'NA';
  const digits = Number.isInteger(value) ? 0 : 2;
  return formatNumber(value, digits);
}

export async function shareTestStatsCard(options: {
  displayName: string;
  test: TestDefinition;
  stats: TestShareStats;
}): Promise<void> {
  const { displayName, test, stats } = options;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
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
  const successColor = isDark ? '#4ade80' : '#16a34a';
  const dangerColor = isDark ? '#f87171' : '#dc2626';

  // Background
  ctx.fillStyle = isDark ? '#0a0a0c' : '#f9fafb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid pattern
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

  // Subtle gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, isDark ? 'rgba(20, 20, 24, 0.4)' : 'rgba(255, 255, 255, 0.4)');
  grad.addColorStop(1, isDark ? 'rgba(10, 10, 12, 0.8)' : 'rgba(249, 249, 251, 0.8)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Accent bar
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 0, canvas.width, 10);

  // Logo + branding
  const logoImg = await loadImage(isDark ? '/favicon-dark.svg' : '/favicon-light.svg').catch(() => null);
  if (logoImg) {
    ctx.drawImage(logoImg, 60, 80, 40, 40);
  }

  ctx.fillStyle = textColor;
  ctx.font = '700 36px Outfit, sans-serif';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('HumansOnly', logoImg ? 115 : 60, 102);

  // Title
  ctx.font = 'bold 52px Outfit, sans-serif';
  ctx.fillText(test.name.replace('GIA ', ''), 60, 180);

  ctx.fillStyle = mutedTextColor;
  ctx.font = '28px Outfit, sans-serif';
  ctx.fillText(`Performance for ${displayName}`, 60, 235);

  // Divider
  ctx.strokeStyle = isDark ? '#2a2a32' : '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(60, 280);
  ctx.lineTo(740, 280);
  ctx.stroke();

  const rows: Array<{ label: string; value: string; isTrend?: boolean; isAccent?: boolean }> = [
    { label: 'Total Runs', value: stats.runs.toString() },
    { label: 'Best Score', value: `${formatScore(stats.best)} ${test.scoreUnit}` },
    { label: 'Average Score', value: `${formatScore(stats.avg)} ${test.scoreUnit}` },
    {
      label: 'Trend',
      value: stats.trend === null ? 'NA' : `${stats.trend > 0 ? '+' : '-'}${formatScore(Math.abs(stats.trend))}`,
      isTrend: true,
    },
  ];

  if (stats.bestRate != null) {
    rows.push({ label: 'Best Rate', value: `${stats.bestRate.toFixed(2)} s/q`, isAccent: true });
  }

  const baseY = rows.length <= 4 ? 380 : 350;
  const rowSpacing = rows.length <= 4 ? 130 : 118;
  let y = baseY;
  for (const row of rows) {
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)';
    ctx.beginPath();
    ctx.roundRect(40, y - 50, 720, 100, 16);
    ctx.fill();

    ctx.fillStyle = mutedTextColor;
    ctx.font = '500 28px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(row.label, 80, y);

    let valueColor = textColor;
    if (row.isTrend && stats.trend !== null) {
      valueColor = stats.trend > 0 ? successColor : dangerColor;
    } else if (row.isAccent) {
      valueColor = accentColor;
    }
    ctx.fillStyle = valueColor;
    ctx.font = 'bold 38px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(row.value, 720, y);

    y += rowSpacing;
  }

  // Footer
  ctx.fillStyle = isDark ? '#444444' : '#aaaaaa';
  ctx.textAlign = 'center';
  ctx.font = '24px Outfit, sans-serif';
  ctx.fillText('tryhumansonly.com', canvas.width / 2, 940);

  // Give webfonts a moment to settle
  await new Promise((resolve) => setTimeout(resolve, 100));

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
  if (!blob) {
    throw new Error('Failed to create share image');
  }

  const fileName = `humansonly-${test.slug}-stats.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `HumansOnly - ${test.name}`,
      text: `Check out my ${test.name} stats on tryhumansonly.com`,
    });
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
