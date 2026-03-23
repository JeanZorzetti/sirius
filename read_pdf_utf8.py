import os
from PyPDF2 import PdfReader

def read_pdfs():
    dir_path = r'C:\Users\jeanz\OneDrive\Desktop\ROI Labs\CRM\crm-project\docs\Estrategia_SEO_Cliques\Relatorios'
    files = [
        'SEO Command Center - Admin.pdf',
        'Ultimate Funnel Command Center _ Sirius Admin.pdf'
    ]
    
    with open('out_utf8.txt', 'w', encoding='utf-8') as f:
        for file in files:
            full_path = os.path.join(dir_path, file)
            try:
                reader = PdfReader(full_path)
                text = ''
                for page in reader.pages:
                    text += page.extract_text() + '\n'
                f.write(f'\n\n--- CONTENT OF {file} ---\n\n')
                f.write(text)
            except Exception as e:
                f.write(f'Failed to read {file}: {e}\n')

read_pdfs()
