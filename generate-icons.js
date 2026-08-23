import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const publicDir = path.resolve('public');

// Standard icon SVG (for home screen, tabs, install prompts)
const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
    <linearGradient id="primaryGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="xGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
    <linearGradient id="oGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Base Card Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="12" y="12" width="488" height="488" rx="100" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="6"/>

  <!-- Glowing Game Grid Lines -->
  <g stroke="rgba(255, 255, 255, 0.16)" stroke-width="14" stroke-linecap="round">
    <line x1="184" y1="96" x2="184" y2="416"/>
    <line x1="328" y1="96" x2="328" y2="416"/>
    <line x1="96" y1="184" x2="416" y2="184"/>
    <line x1="96" y1="328" x2="416" y2="328"/>
  </g>

  <!-- X Symbol (Glowing Indigo) -->
  <g filter="url(#glow)">
    <line x1="116" y1="116" x2="164" y2="164" stroke="url(#xGrad)" stroke-width="18" stroke-linecap="round"/>
    <line x1="164" y1="116" x2="116" y2="164" stroke="url(#xGrad)" stroke-width="18" stroke-linecap="round"/>
  </g>

  <!-- O Symbol (Glowing Rose) -->
  <circle cx="372" cy="140" r="26" fill="none" stroke="url(#oGrad)" stroke-width="16" filter="url(#glow)"/>

  <!-- Center KM Logo Badge -->
  <g transform="translate(256, 256)">
    <circle r="48" fill="#18153d" stroke="url(#primaryGlow)" stroke-width="7" filter="url(#glow)"/>
    <text x="0" y="13" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="34" fill="#ffffff" text-anchor="middle" letter-spacing="1">KM</text>
  </g>

  <!-- Bottom Cross & Circle Symbols -->
  <circle cx="140" cy="372" r="26" fill="none" stroke="url(#oGrad)" stroke-width="16" filter="url(#glow)"/>
  <g filter="url(#glow)">
    <line x1="348" y1="348" x2="396" y2="396" stroke="url(#xGrad)" stroke-width="18" stroke-linecap="round"/>
    <line x1="396" y1="348" x2="348" y2="396" stroke="url(#xGrad)" stroke-width="18" stroke-linecap="round"/>
  </g>
</svg>
`;

// Maskable icon SVG with full background (safe zone within inner 80%)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16"/>
      <stop offset="50%" stop-color="#1e1b4b"/>
      <stop offset="100%" stop-color="#312e81"/>
    </linearGradient>
    <linearGradient id="primaryGlowMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="50%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#ec4899"/>
    </linearGradient>
    <linearGradient id="xGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
    <linearGradient id="oGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f43f5e"/>
      <stop offset="100%" stop-color="#fb7185"/>
    </linearGradient>
    <filter id="glowMask" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Full Bleed Background for Adaptive/Maskable Android Icons -->
  <rect width="512" height="512" fill="url(#bgGradMask)"/>

  <!-- Centered Safe Zone Graphic (Scale 0.75) -->
  <g transform="translate(64, 64) scale(0.75)">
    <!-- Grid -->
    <g stroke="rgba(255, 255, 255, 0.2)" stroke-width="16" stroke-linecap="round">
      <line x1="184" y1="96" x2="184" y2="416"/>
      <line x1="328" y1="96" x2="328" y2="416"/>
      <line x1="96" y1="184" x2="416" y2="184"/>
      <line x1="96" y1="328" x2="416" y2="328"/>
    </g>

    <!-- X & O elements -->
    <g filter="url(#glowMask)">
      <line x1="116" y1="116" x2="164" y2="164" stroke="url(#xGradMask)" stroke-width="20" stroke-linecap="round"/>
      <line x1="164" y1="116" x2="116" y2="164" stroke="url(#xGradMask)" stroke-width="20" stroke-linecap="round"/>
    </g>
    <circle cx="372" cy="140" r="28" fill="none" stroke="url(#oGradMask)" stroke-width="18" filter="url(#glowMask)"/>
    <circle cx="140" cy="372" r="28" fill="none" stroke="url(#oGradMask)" stroke-width="18" filter="url(#glowMask)"/>
    <g filter="url(#glowMask)">
      <line x1="348" y1="348" x2="396" y2="396" stroke="url(#xGradMask)" stroke-width="20" stroke-linecap="round"/>
      <line x1="396" y1="348" x2="348" y2="396" stroke="url(#xGradMask)" stroke-width="20" stroke-linecap="round"/>
    </g>

    <!-- Center Badge -->
    <g transform="translate(256, 256)">
      <circle r="52" fill="#18153d" stroke="url(#primaryGlowMask)" stroke-width="8" filter="url(#glowMask)"/>
      <text x="0" y="14" font-family="'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif" font-weight="900" font-size="38" fill="#ffffff" text-anchor="middle" letter-spacing="1">KM</text>
    </g>
  </g>
</svg>
`;

async function run() {
  console.log('Generating PNG and SVG icons for KM PWA...');

  // Save SVG files
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-192.svg'), standardSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-512.svg'), standardSvg);
  fs.writeFileSync(path.join(publicDir, 'icon-maskable.svg'), maskableSvg);

  const standardBuffer = Buffer.from(standardSvg);
  const maskableBuffer = Buffer.from(maskableSvg);

  // Generate PNG 512x512
  await sharp(standardBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // Generate PNG 192x192
  await sharp(standardBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // Generate Maskable PNG 512x512
  await sharp(maskableBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-maskable.png'));

  // Generate Apple Touch Icon 180x180
  await sharp(standardBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // Generate Favicon PNG 32x32 & 64x64
  await sharp(standardBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('Successfully generated all PWA icons in /public!');
}

run().catch(console.error);
