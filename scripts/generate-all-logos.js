/**
 * Gera todas as variações de logo a partir da nova logo master (public/logos/500x500.png).
 *
 * Uso:
 *   npm install sharp --save-dev
 *   node scripts/generate-all-logos.js
 */

const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'public/logos/500x500.png');

// Cor de fundo para ícones PWA (mantém identidade visual)
const PWA_BG = { r: 37, g: 99, b: 235, alpha: 1 }; // #2563eb

const jobs = [
  // ── Logo principal usada no UI (sidebar, nav, download instructions) ──────
  {
    out: 'public/logo.png',
    size: 500,
    background: null, // transparente
  },

  // ── Variantes inline (usadas via <Image> com width/height explícito) ──────
  { out: 'public/logos/20x20.png',  size: 20,  background: null },
  { out: 'public/logos/35x35.png',  size: 35,  background: null },
  { out: 'public/logos/120x120.png', size: 120, background: null },

  // ── Ícones PWA com fundo azul ─────────────────────────────────────────────
  { out: 'public/icons/icon-72x72.png',   size: 72,  background: PWA_BG },
  { out: 'public/icons/icon-96x96.png',   size: 96,  background: PWA_BG },
  { out: 'public/icons/icon-128x128.png', size: 128, background: PWA_BG },
  { out: 'public/icons/icon-144x144.png', size: 144, background: PWA_BG },
  { out: 'public/icons/icon-152x152.png', size: 152, background: PWA_BG },
  { out: 'public/icons/icon-192x192.png', size: 192, background: PWA_BG },
  { out: 'public/icons/icon-384x384.png', size: 384, background: PWA_BG },
  { out: 'public/icons/icon-512x512.png', size: 512, background: PWA_BG },

  // ── Maskable: logo menor centralizada com safe zone de 40% ───────────────
  // Maskable icons devem ter a logo ocupando ~60% do canvas (safe zone circle)
  { out: 'public/icons/manifest-icon-192.maskable.png', size: 192, background: PWA_BG, maskable: true },
  { out: 'public/icons/manifest-icon-512.maskable.png', size: 512, background: PWA_BG, maskable: true },

  // ── Apple touch icon ──────────────────────────────────────────────────────
  { out: 'public/icons/apple-icon-180.png', size: 180, background: PWA_BG },

  // ── Favicon (usado como /icons/favicon-196.png) ───────────────────────────
  { out: 'public/icons/favicon-196.png', size: 196, background: PWA_BG },
];

async function generateAll() {
  console.log('Gerando logos e ícones a partir de:', SOURCE, '\n');

  for (const job of jobs) {
    const outPath = path.join(ROOT, job.out);

    try {
      let pipeline = sharp(SOURCE);

      if (job.maskable) {
        // Reduz logo para 60% do canvas (safe zone) e centraliza
        const logoSize = Math.round(job.size * 0.6);
        const padding = Math.round((job.size - logoSize) / 2);

        pipeline = sharp(SOURCE).resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } });

        const logoBuffer = await pipeline.png().toBuffer();

        pipeline = sharp({
          create: {
            width: job.size,
            height: job.size,
            channels: 4,
            background: job.background,
          },
        }).composite([{ input: logoBuffer, top: padding, left: padding }]);
      } else if (job.background) {
        pipeline = sharp(SOURCE).resize(job.size, job.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        });

        const logoBuffer = await pipeline.png().toBuffer();

        pipeline = sharp({
          create: {
            width: job.size,
            height: job.size,
            channels: 4,
            background: job.background,
          },
        }).composite([{ input: logoBuffer, top: 0, left: 0 }]);
      } else {
        // Transparente — resize direto
        pipeline = sharp(SOURCE).resize(job.size, job.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        });
      }

      await pipeline.png().toFile(outPath);
      console.log(`✅  ${job.out}`);
    } catch (err) {
      console.error(`❌  ${job.out}:`, err.message);
    }
  }

  console.log('\n✨ Concluído!');
}

generateAll().catch(console.error);
