const sharp = require('sharp');

const source = 'public/logos/500x500.png';
const BG = { r: 37, g: 99, b: 235, alpha: 1 };

async function run() {
  // app/icon.png — 32px transparente (aba do browser)
  await sharp(source)
    .resize(32, 32, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png().toFile('app/icon.png');
  console.log('OK app/icon.png');

  // app/apple-icon.png — 180px com fundo azul
  const logo = await sharp(source)
    .resize(108, 108, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png().toBuffer();
  await sharp({ create: { width:180, height:180, channels:4, background:BG } })
    .composite([{ input: logo, top: 36, left: 36 }])
    .png().toFile('app/apple-icon.png');
  console.log('OK app/apple-icon.png');

  // app/favicon.ico — 32px PNG (browsers modernos aceitam)
  await sharp(source)
    .resize(32, 32, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png().toFile('app/favicon.ico');
  console.log('OK app/favicon.ico');

  console.log('Concluido!');
}
run().catch(console.error);
