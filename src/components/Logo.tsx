import React from 'react';
import Image from 'next/image';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
       <Image src="/favicon.svg" alt="HumansOnly" width={26} height={26} style={{ display: 'block' }} />
       <span style={{
         fontWeight: 700,
         fontSize: '1.1rem',
         letterSpacing: '-0.03em',
         color: 'var(--text-primary)',
         fontFamily: 'var(--font-heading)'
       }}>
         HumansOnly
       </span>
    </div>
  );
}
