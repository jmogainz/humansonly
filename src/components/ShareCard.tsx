'use client';

import { useState } from 'react';

type ShareCardProps = {
  title: string;
  scoreText: string;
};

export default function ShareCard({ title, scoreText }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="button buttonGhost"
      onClick={async () => {
        const text = `${title}\n${scoreText}\ntryhumansonly.com`;
        if (navigator.share) {
          await navigator.share({ text, title: 'HumansOnly' });
          return;
        }
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
