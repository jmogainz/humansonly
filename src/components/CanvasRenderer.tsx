'use client';

import type { CSSProperties, MouseEvent } from 'react';
import { useRef, useEffect } from 'react';

type CanvasRendererProps = {
  width?: number;
  height?: number;
  className?: string;
  style?: CSSProperties;
  onReady?: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => void;
  onPointerDown?: (event: MouseEvent<HTMLCanvasElement>) => void;
};

export default function CanvasRenderer({
  width = 800,
  height = 500,
  className,
  style,
  onReady,
  onPointerDown,
}: CanvasRendererProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    onReady?.(canvas, context);
  }, [onReady]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={className}
      style={style}
      onMouseDown={onPointerDown}
    />
  );
}
