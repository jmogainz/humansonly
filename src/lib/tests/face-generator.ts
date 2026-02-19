/**
 * Deterministic Face Generator for Face Memory Test
 * Produces high-quality, stylized SVG faces with significant variety.
 */

function seeded(seed: number) {
  let value = seed;
  return () => {
    // Standard LCG parameters
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

export function generateFaceSVG(seed: number): string {
  const rand = seeded(seed);

  // 1. Color Palettes
  const skinTones = [
    '#f8d5c2', '#f0c0a0', '#eeb38d', '#e0ac69', '#dcb895', // Light
    '#c68642', '#bb7f50', '#ad6452', '#8d5524', '#704330', // Medium
    '#593423', '#452618', '#381f14', '#2b160c', '#573e35'  // Dark
  ];
  const hairColors = [
    '#090806', '#2C222B', '#3B3024', '#4E433F', '#504444', 
    '#6A4E42', '#A7856A', '#B89778', '#D6C4C2', '#F2E8DC',
    '#E6BE8A', '#9B1B30', '#A52A2A', '#800000', '#B55239'
  ];
  const eyeColors = ['#634e34', '#2e536f', '#3d671d', '#1c7847', '#497665', '#242424', '#5C4033', '#808000'];
  const shirtColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'
  ];
  const bgColors = [
    '#F3F4F6', '#E5E7EB', '#F9FAFB', '#EFF6FF', '#FEF2F2', '#ECFDF5', '#FFFBEB', '#F5F3FF'
  ];

  const skin = skinTones[Math.floor(rand() * skinTones.length)];
  const hairColor = hairColors[Math.floor(rand() * hairColors.length)];
  const eyeColor = eyeColors[Math.floor(rand() * eyeColors.length)];
  const shirtColor = shirtColors[Math.floor(rand() * shirtColors.length)];
  const bgColor = bgColors[Math.floor(rand() * bgColors.length)];

  // 2. Feature Selection
  const faceType = Math.floor(rand() * 5); // 0: Oval, 1: Square, 2: Round, 3: Long, 4: Heart
  const eyeType = Math.floor(rand() * 5); 
  const noseType = Math.floor(rand() * 5); 
  const mouthType = Math.floor(rand() * 6); 
  const hairStyle = Math.floor(rand() * 8); 
  const hasFacialHair = rand() > 0.8;
  const facialHairType = Math.floor(rand() * 4);
  const hasGlasses = rand() > 0.85;
  const glassesType = Math.floor(rand() * 3);
  const hasEarrings = rand() > 0.9;

  // 3. Coordinate System (100x140)
  // Center X = 50
  
  // -- NECK --
  // Neck connects head to body.
  const neckW = 34;
  const neckH = 40;
  const neckX = 50 - neckW/2;
  const neckY = 90; 
  // Darker skin for neck shadow
  // We can simulate shadow with a simple overlay or just drawing it behind.
  const neckSVG = `<rect x="${neckX}" y="${neckY}" width="${neckW}" height="${neckH}" fill="${skin}"/>
    <path d="M${neckX} ${neckY} L${neckX} ${140} L${neckX+neckW} ${140} L${neckX+neckW} ${neckY} Z" fill="rgba(0,0,0,0.1)"/>`;

  // -- SHIRT --
  // Shoulders start around y=120
  const shirtSVG = `<path d="M-5 140 Q-5 115 25 110 L50 120 L75 110 Q105 115 105 140 Z" fill="${shirtColor}"/>
    <path d="M25 110 Q50 130 75 110" fill="none" stroke="rgba(0,0,0,0.1)" stroke-width="2"/>`; // Collar line

  // -- EARS --
  // Ears positioned around y=60-80
  const earY = 65;
  const earSize = 12;
  const earsSVG = `
    <path d="M22 ${earY} Q15 ${earY-5} 15 ${earY+5} Q15 ${earY+15} 25 ${earY+12}" fill="${skin}"/>
    <path d="M78 ${earY} Q85 ${earY-5} 85 ${earY+5} Q85 ${earY+15} 75 ${earY+12}" fill="${skin}"/>
    <!-- Ear details -->
    <path d="M20 ${earY+3} Q18 ${earY+5} 20 ${earY+8}" stroke="rgba(0,0,0,0.1)" stroke-width="1.5" fill="none"/>
    <path d="M80 ${earY+3} Q82 ${earY+5} 80 ${earY+8}" stroke="rgba(0,0,0,0.1)" stroke-width="1.5" fill="none"/>
  `;

  // -- FACE SHAPE --
  let facePath = '';
  // Top of head ~ y=20, Chin ~ y=105
  // Width ~ 60-70 (x=15 to x=85)
  if (faceType === 0) { // Oval
    facePath = `M20 50 C20 20 80 20 80 50 C80 90 65 110 50 110 C35 110 20 90 20 50 Z`;
  } else if (faceType === 1) { // Square
    facePath = `M22 50 C22 25 78 25 78 50 L78 85 Q78 105 50 108 Q22 105 22 85 Z`;
  } else if (faceType === 2) { // Round
    facePath = `M20 60 C20 25 80 25 80 60 C80 95 65 108 50 108 C35 108 20 95 20 60 Z`;
  } else if (faceType === 3) { // Long
    facePath = `M22 50 C22 20 78 20 78 50 L78 90 Q78 115 50 115 Q22 115 22 90 Z`;
  } else { // Heart
    facePath = `M20 50 C20 20 80 20 80 50 C80 80 70 110 50 110 C30 110 20 80 20 50 Z`;
  }
  
  const faceBaseSVG = `<path d="${facePath}" fill="${skin}"/>`;

  // -- EYES --
  const eyeY = 62;
  const eyeGap = 16;
  const eyeWidth = 12;
  const eyeHeight = 8;
  const leftEyeX = 50 - eyeGap/2 - eyeWidth/2; // Center of left eye
  const rightEyeX = 50 + eyeGap/2 + eyeWidth/2;

  let eyesSVG = '';
  // Sclera (White)
  const scleraPath = (cx: number, cy: number) => {
    if (eyeType === 0) return `<ellipse cx="${cx}" cy="${cy}" rx="${eyeWidth/2}" ry="${eyeHeight/2}" fill="#fff"/>`; // Normal
    if (eyeType === 1) return `<circle cx="${cx}" cy="${cy}" r="${eyeHeight/1.8}" fill="#fff"/>`; // Round
    if (eyeType === 2) return `<path d="M${cx-6} ${cy} Q${cx} ${cy-5} ${cx+6} ${cy} Q${cx} ${cy+5} ${cx-6} ${cy} Z" fill="#fff"/>`; // Almond
    if (eyeType === 3) return `<path d="M${cx-6} ${cy+1} Q${cx} ${cy-5} ${cx+6} ${cy-1} Q${cx} ${cy+4} ${cx-6} ${cy+1} Z" fill="#fff"/>`; // Sleepy/Hooded
    return `<ellipse cx="${cx}" cy="${cy}" rx="${eyeWidth/2}" ry="${eyeHeight/2.5}" fill="#fff"/>`; // Narrow
  };

  // Iris + Pupil
  const irisSize = eyeType === 1 ? 3.5 : 2.8;
  const iris = (cx: number, cy: number) => `
    <circle cx="${cx}" cy="${cy}" r="${irisSize}" fill="${eyeColor}"/>
    <circle cx="${cx}" cy="${cy}" r="${irisSize/2}" fill="#111"/>
    <circle cx="${cx + 1}" cy="${cy - 1}" r="1" fill="rgba(255,255,255,0.6)"/>
  `;

  eyesSVG = `
    ${scleraPath(leftEyeX, eyeY)}
    ${iris(leftEyeX, eyeY)}
    ${scleraPath(rightEyeX, eyeY)}
    ${iris(rightEyeX, eyeY)}
  `;

  // -- EYEBROWS --
  const browY = eyeY - 9;
  let browsSVG = '';
  const browW = 12;
  const browLX = leftEyeX;
  const browRX = rightEyeX;
  
  if (eyeType % 2 === 0) {
    browsSVG = `
      <path d="M${browLX-browW/2} ${browY} Q${browLX} ${browY-3} ${browLX+browW/2} ${browY}" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M${browRX-browW/2} ${browY} Q${browRX} ${browY-3} ${browRX+browW/2} ${browY}" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    `;
  } else {
    browsSVG = `
      <path d="M${browLX-browW/2} ${browY+1} L${browLX+browW/2} ${browY-1}" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M${browRX-browW/2} ${browY-1} L${browRX+browW/2} ${browY+1}" stroke="${hairColor}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    `;
  }

  // -- NOSE --
  const noseY = 82;
  let noseSVG = '';
  if (noseType === 0) { // Simple curved
    noseSVG = `<path d="M50 ${noseY-10} Q50 ${noseY} 46 ${noseY+4}" stroke="rgba(0,0,0,0.15)" stroke-width="2" fill="none"/>`;
  } else if (noseType === 1) { // Button
    noseSVG = `<path d="M46 ${noseY+2} Q50 ${noseY+5} 54 ${noseY+2}" stroke="rgba(0,0,0,0.15)" stroke-width="2" fill="none"/>`;
  } else if (noseType === 2) { // Strong
    noseSVG = `<path d="M50 ${noseY-12} L48 ${noseY+4} L54 ${noseY+4}" fill="rgba(0,0,0,0.1)"/>`;
  } else if (noseType === 3) { // Wide
    noseSVG = `<path d="M44 ${noseY+3} Q50 ${noseY-2} 56 ${noseY+3}" stroke="rgba(0,0,0,0.15)" stroke-width="2" fill="none"/>`;
  } else { // Pointy
    noseSVG = `<path d="M50 ${noseY-8} L46 ${noseY+4} L50 ${noseY+2}" fill="rgba(0,0,0,0.08)"/>`;
  }

  // -- MOUTH --
  const mouthY = 98;
  let mouthSVG = '';
  if (mouthType === 0) { // Smile
    mouthSVG = `<path d="M40 ${mouthY} Q50 ${mouthY+8} 60 ${mouthY}" stroke="rgba(0,0,0,0.3)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  } else if (mouthType === 1) { // Flat
    mouthSVG = `<path d="M42 ${mouthY+2} L58 ${mouthY+2}" stroke="rgba(0,0,0,0.3)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  } else if (mouthType === 2) { // Open Smile
    mouthSVG = `<path d="M40 ${mouthY} Q50 ${mouthY+10} 60 ${mouthY} Z" fill="#fff" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>`;
  } else if (mouthType === 3) { // Frown/Serious
    mouthSVG = `<path d="M42 ${mouthY+4} Q50 ${mouthY} 58 ${mouthY+4}" stroke="rgba(0,0,0,0.3)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  } else if (mouthType === 4) { // Small
    mouthSVG = `<circle cx="50" cy="${mouthY+2}" r="3" fill="rgba(0,0,0,0.25)"/>`;
  } else { // Wide
    mouthSVG = `<path d="M38 ${mouthY} Q50 ${mouthY+6} 62 ${mouthY}" stroke="rgba(0,0,0,0.3)" stroke-width="2.5" fill="none" stroke-linecap="round"/>`;
  }

  // -- HAIR --
  // Back Hair (behind head)
  let backHairSVG = '';
  // Front Hair (on top of head)
  let frontHairSVG = '';
  
  if (hairStyle === 0) { // Short/Buzz
    frontHairSVG = `<path d="M20 50 C20 20 80 20 80 50 L80 40 C80 15 20 15 20 40 Z" fill="${hairColor}"/>`;
  } else if (hairStyle === 1) { // Long Straight
    backHairSVG = `<path d="M15 50 L15 130 L85 130 L85 50 Z" fill="${hairColor}"/>`;
    frontHairSVG = `<path d="M20 50 C20 15 80 15 80 50 L70 50 C70 30 30 30 30 50 Z" fill="${hairColor}"/>`;
  } else if (hairStyle === 2) { // Bob
    backHairSVG = `<path d="M15 60 L18 110 L82 110 L85 60 Z" fill="${hairColor}"/>`;
    frontHairSVG = `<path d="M18 50 C18 15 82 15 82 50 L82 60 L18 60 Z" fill="${hairColor}"/>
                    <path d="M82 60 L82 100 L75 100 L75 60 Z" fill="${hairColor}"/>
                    <path d="M18 60 L18 100 L25 100 L25 60 Z" fill="${hairColor}"/>`;
  } else if (hairStyle === 3) { // Afro/Puffy
    backHairSVG = `<circle cx="50" cy="50" r="45" fill="${hairColor}"/>`;
    frontHairSVG = `<path d="M25 45 Q50 35 75 45" stroke="${hairColor}" stroke-width="10" fill="none"/>`; // Hairline texture
  } else if (hairStyle === 4) { // Spiky
    frontHairSVG = `<path d="M20 50 L15 30 L30 40 L40 15 L50 35 L60 15 L70 40 L85 30 L80 50 Z" fill="${hairColor}"/>`;
  } else if (hairStyle === 5) { // Side Part
    frontHairSVG = `<path d="M18 55 C18 15 82 15 82 55 L82 45 C82 20 60 15 60 15 L55 35 L18 45 Z" fill="${hairColor}"/>`;
  } else if (hairStyle === 6) { // Curly Top
    frontHairSVG = `<path d="M20 50 C20 20 80 20 80 50 Q80 40 70 30 Q60 20 50 25 Q40 20 30 30 Q20 40 20 50" fill="${hairColor}"/>`;
  } else { // Balding/Receding
    frontHairSVG = `<path d="M18 60 C18 50 22 40 25 40 L25 60 Z M75 40 C78 40 82 50 82 60 L75 60 Z" fill="${hairColor}"/>`;
  }

  // -- FACIAL HAIR --
  let facialHairSVG = '';
  if (hasFacialHair) {
    if (facialHairType === 0) { // Stubble/Beard
      facialHairSVG = `<path d="M22 80 L25 105 Q50 120 75 105 L78 80 L75 80 Q75 100 50 100 Q25 100 25 80 Z" fill="${hairColor}" opacity="0.3"/>`;
    } else if (facialHairType === 1) { // Mustache
      facialHairSVG = `<path d="M40 94 Q50 88 60 94 Q60 98 50 96 Q40 98 40 94" fill="${hairColor}"/>`;
    } else if (facialHairType === 2) { // Goatee
      facialHairSVG = `<circle cx="50" cy="108" r="5" fill="${hairColor}" opacity="0.8"/>`;
    } else { // Full Beard
      facialHairSVG = `<path d="M22 75 Q22 110 50 115 Q78 110 78 75 L70 75 Q70 100 50 100 Q30 100 30 75 Z" fill="${hairColor}"/>`;
    }
  }

  // -- ACCESSORIES --
  let accessoriesSVG = '';
  // Glasses
  if (hasGlasses) {
    const gY = eyeY;
    const gH = 10;
    const gW = 14;
    if (glassesType === 0) { // Round
      accessoriesSVG += `
        <circle cx="${leftEyeX}" cy="${gY}" r="${gH}" stroke="#333" stroke-width="1.5" fill="rgba(255,255,255,0.1)"/>
        <circle cx="${rightEyeX}" cy="${gY}" r="${gH}" stroke="#333" stroke-width="1.5" fill="rgba(255,255,255,0.1)"/>
        <line x1="${leftEyeX+gH}" y1="${gY}" x2="${rightEyeX-gH}" y2="${gY}" stroke="#333" stroke-width="1.5"/>
      `;
    } else if (glassesType === 1) { // Square
       accessoriesSVG += `
        <rect x="${leftEyeX-gW/2}" y="${gY-gH+2}" width="${gW}" height="${gH*1.5}" rx="2" stroke="#333" stroke-width="1.5" fill="rgba(255,255,255,0.1)"/>
        <rect x="${rightEyeX-gW/2}" y="${gY-gH+2}" width="${gW}" height="${gH*1.5}" rx="2" stroke="#333" stroke-width="1.5" fill="rgba(255,255,255,0.1)"/>
        <line x1="${leftEyeX+gW/2}" y1="${gY}" x2="${rightEyeX-gW/2}" y2="${gY}" stroke="#333" stroke-width="1.5"/>
      `;
    } else { // Rimless/Thin
       accessoriesSVG += `
        <line x1="${leftEyeX-8}" y1="${gY}" x2="${leftEyeX+8}" y2="${gY}" stroke="#333" stroke-width="1"/>
        <line x1="${rightEyeX-8}" y1="${gY}" x2="${rightEyeX+8}" y2="${gY}" stroke="#333" stroke-width="1"/>
        <line x1="${leftEyeX+8}" y1="${gY}" x2="${rightEyeX-8}" y2="${gY}" stroke="#333" stroke-width="1"/>
      `;
    }
  }
  
  // Earrings
  if (hasEarrings) {
      accessoriesSVG += `<circle cx="22" cy="${earY+8}" r="2" fill="#FFD700"/>`;
      accessoriesSVG += `<circle cx="78" cy="${earY+8}" r="2" fill="#FFD700"/>`;
  }

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 140'>
    <defs>
      <clipPath id='avatarClip'>
        <rect width='100' height='140' rx='12'/>
      </clipPath>
      <filter id='shadow' x='-20%' y='-20%' width='140%' height='140%'>
        <feGaussianBlur in='SourceAlpha' stdDeviation='1'/>
        <feOffset dx='0' dy='1' result='offsetblur'/>
        <feComponentTransfer>
          <feFuncA type='linear' slope='0.15'/>
        </feComponentTransfer>
        <feMerge>
          <feMergeNode/>
          <feMergeNode in='SourceGraphic'/>
        </feMerge>
      </filter>
    </defs>
    
    <g clip-path='url(#avatarClip)'>
      <!-- Background -->
      <rect width='100' height='140' fill='${bgColor}'/>
      
      <!-- Back Layer -->
      ${backHairSVG}
      ${neckSVG}
      ${shirtSVG}
      
      <!-- Head Layer -->
      ${earsSVG}
      ${faceBaseSVG}
      
      <!-- Face Features -->
      ${facialHairSVG}
      ${eyesSVG}
      ${browsSVG}
      ${noseSVG}
      ${mouthSVG}
      
      <!-- Front Layer -->
      ${frontHairSVG}
      ${accessoriesSVG}
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
