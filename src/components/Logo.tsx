import React from 'react';
import Image from 'next/image';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
       <Image src="/favicon.svg" alt="HumansOnly" width={28} height={28} style={{ display: 'block' }} />
       <span style={{ 
         fontWeight: 600, 
         fontSize: '1.25rem', 
         letterSpacing: '-0.03em', 
         color: 'var(--text-primary)',
         fontFamily: 'var(--font-heading)'
       }}>
         HumansOnly
       </span>
    </div>
  );
}
