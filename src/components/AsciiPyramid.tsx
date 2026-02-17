"use client";

import { useEffect, useRef } from 'react';
import styles from './AsciiPyramid.module.css';

// Truly massive dimensions
const WIDTH = 240;
const HEIGHT = 120;

export default function AsciiPyramid() {
  const preRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    let frameId: number;
    let angle = 0;

    const render = () => {
      const buffer = new Array(HEIGHT).fill(null).map(() => new Array(WIDTH).fill(' '));
      const zBuffer = new Array(HEIGHT).fill(null).map(() => new Array(WIDTH).fill(-1000));
      
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      const scale = 100; // Even bigger scale

      // Vertices
      const apex = { x: 0, y: -1.2, z: 0 };
      const base = [
        { x: -1, y: 0.8, z: -1 },
        { x: 1, y: 0.8, z: -1 },
        { x: 1, y: 0.8, z: 1 },
        { x: -1, y: 0.8, z: 1 },
      ];

      const rotate = (v: { x: number, y: number, z: number }) => {
        // Slower rotation
        const s = Math.sin(angle);
        const c = Math.cos(angle);
        
        // Rotate Y
        let x = v.x * c - v.z * s;
        let z = v.x * s + v.z * c;
        
        // Tilt X slightly for better 3D view
        const ty = v.y * Math.cos(0.4) - z * Math.sin(0.4);
        const tz = v.y * Math.sin(0.4) + z * Math.cos(0.4);

        return { x, y: ty, z: tz };
      };

      const project = (v: { x: number, y: number, z: number }) => {
        const d = 5;
        const Z = v.z + d;
        return {
          x: cx + (v.x * scale * 2.2) / Z,
          y: cy + (v.y * scale) / Z,
          z: v.z
        };
      };

      const drawTriangle = (p1: any, p2: any, p3: any, char: string) => {
        // Simple bounding box fill
        const minX = Math.floor(Math.max(0, Math.min(p1.x, p2.x, p3.x)));
        const maxX = Math.ceil(Math.min(WIDTH - 1, Math.max(p1.x, p2.x, p3.x)));
        const minY = Math.floor(Math.max(0, Math.min(p1.y, p2.y, p3.y)));
        const maxY = Math.ceil(Math.min(HEIGHT - 1, Math.max(p1.y, p2.y, p3.y)));

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const w1 = ((p2.y - p3.y) * (x - p3.x) + (p3.x - p2.x) * (y - p3.y)) /
                       ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
            const w2 = ((p3.y - p1.y) * (x - p3.x) + (p1.x - p3.x) * (y - p3.y)) /
                       ((p2.y - p3.y) * (p1.x - p3.x) + (p3.x - p2.x) * (p1.y - p3.y));
            const w3 = 1 - w1 - w2;

            if (w1 >= 0 && w2 >= 0 && w3 >= 0) {
              const z = w1 * p1.z + w2 * p2.z + w3 * p3.z;
              if (z > zBuffer[y][x]) {
                zBuffer[y][x] = z;
                buffer[y][x] = char;
              }
            }
          }
        }
      };

      const drawLine = (p1: any, p2: any) => {
        let x0 = Math.floor(p1.x);
        let y0 = Math.floor(p1.y);
        let x1 = Math.floor(p2.x);
        let y1 = Math.floor(p2.y);
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = (x0 < x1) ? 1 : -1;
        const sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
          if (x0 >= 0 && x0 < WIDTH && y0 >= 0 && y0 < HEIGHT) {
            // Lines are slightly in front to avoid z-fighting
            if (100 > zBuffer[y0][x0]) {
               buffer[y0][x0] = '+'; 
            }
          }
          if (x0 === x1 && y0 === y1) break;
          const e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x0 += sx; }
          if (e2 < dx) { err += dx; y0 += sy; }
        }
      };

      const rApex = rotate(apex);
      const rBase = base.map(rotate);
      const pApex = project(rApex);
      const pBase = rBase.map(project);

      // Shading based on "face index" and rotation to simulate light
      const chars = [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'];
      
      const getShade = (faceIdx: number) => {
        // Face normals (pointing out)
        const normals = [
          { x: 0, y: -0.4, z: -1 }, // Face 0
          { x: 1, y: -0.4, z: 0 },  // Face 1
          { x: 0, y: -0.4, z: 1 },  // Face 2
          { x: -1, y: -0.4, z: 0 }, // Face 3
        ];
        
        const n = rotate(normals[faceIdx]);
        // Light source fixed in world space
        const l = { x: 0.8, y: -1.0, z: -0.5 };
        const mag = Math.sqrt(l.x*l.x + l.y*l.y + l.z*l.z);
        const ln = { x: l.x/mag, y: l.y/mag, z: l.z/mag };
        
        const dot = n.x * ln.x + n.y * ln.y + n.z * ln.z;
        const intensity = Math.floor((dot + 1) * 0.5 * (chars.length - 1));
        return chars[Math.max(0, Math.min(chars.length - 1, intensity))];
      };

      // 4 Faces
      drawTriangle(pApex, pBase[0], pBase[1], getShade(0));
      drawTriangle(pApex, pBase[1], pBase[2], getShade(1));
      drawTriangle(pApex, pBase[2], pBase[3], getShade(2));
      drawTriangle(pApex, pBase[3], pBase[0], getShade(3));
      
      // Wireframe Outlines
      drawLine(pApex, pBase[0]);
      drawLine(pApex, pBase[1]);
      drawLine(pApex, pBase[2]);
      drawLine(pApex, pBase[3]);
      drawLine(pBase[0], pBase[1]);
      drawLine(pBase[1], pBase[2]);
      drawLine(pBase[2], pBase[3]);
      drawLine(pBase[3], pBase[0]);

      if (preRef.current) {
        preRef.current.textContent = buffer.map(row => row.join('')).join('\n');
      }

      angle += 0.005; // Slower rotation
      frameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div className={styles.container} aria-hidden="true">
      <pre ref={preRef} className={styles.canvas}></pre>
    </div>
  );
}
