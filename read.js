const fs = require('fs');
const pdf = require('C:\\tmp\\pdf_reader\\node_modules\\pdf-parse');

async function readPdfs() {
  const dir = 'C:\\Users\\jeanz\\OneDrive\\Desktop\\ROI Labs\\CRM\\crm-project\\docs\\Estrategia_SEO_Cliques\\Relatorios';
  const files = [
    'SEO Command Center - Admin.pdf',
    'Ultimate Funnel Command Center _ Sirius Admin.pdf'
  ];

  for(const file of files) {
    try {
      const dataBuffer = fs.readFileSync(`${dir}\\${file}`);
      const data = await pdf(dataBuffer);
      console.log(`\n\n--- CONTENT OF ${file} ---\n\n`);
      console.log(data.text);
    } catch(e) {
      console.error(`Failed to read ${file}:`, e);
    }
  }
}

readPdfs();
