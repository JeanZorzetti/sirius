const sharp = require('sharp');
const path = require('path');

async function generatePlaceholder(width, height, text, outputPath) {
  const svg = `
    <svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#2563eb"/>
      <text
        x="50%"
        y="40%"
        font-family="Arial, sans-serif"
        font-size="48"
        fill="white"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        Sirius CRM
      </text>
      <text
        x="50%"
        y="55%"
        font-family="Arial, sans-serif"
        font-size="24"
        fill="rgba(255,255,255,0.8)"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${text}
      </text>
      <text
        x="50%"
        y="65%"
        font-family="Arial, sans-serif"
        font-size="18"
        fill="rgba(255,255,255,0.6)"
        text-anchor="middle"
        dominant-baseline="middle"
      >
        ${width}x${height}
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

async function generateScreenshots() {
  console.log('Gerando screenshots placeholders...\n');

  const publicDir = path.join(__dirname, '../public');

  // Wide screenshot (Desktop)
  await generatePlaceholder(
    1280,
    720,
    'Desktop Dashboard',
    path.join(publicDir, 'screenshot-wide.png')
  );
  console.log('✅ Gerado: screenshot-wide.png (1280x720)');

  // Mobile screenshot
  await generatePlaceholder(
    750,
    1334,
    'Mobile Dashboard',
    path.join(publicDir, 'screenshot-mobile.png')
  );
  console.log('✅ Gerado: screenshot-mobile.png (750x1334)');

  console.log('\n✨ Placeholders gerados com sucesso!');
  console.log('\nⓘ  Estes são screenshots temporários.');
  console.log('   Substitua por screenshots reais seguindo: docs/PWA_SCREENSHOTS.md');
}

generateScreenshots().catch(console.error);
