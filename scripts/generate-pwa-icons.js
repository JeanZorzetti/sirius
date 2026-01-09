const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, '../public/manifest-icon-512.maskable.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('Gerando ícones PWA...\n');

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);

    try {
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 37, g: 99, b: 235, alpha: 1 } // #2563eb
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Gerado: icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`❌ Erro ao gerar icon-${size}x${size}.png:`, error.message);
    }
  }

  console.log('\n✨ Todos os ícones foram gerados com sucesso!');
}

generateIcons().catch(console.error);
