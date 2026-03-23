import os
from PyPDF2 import PdfReader

def read_pdfs():
    dir_path = r'C:\Users\jeanz\OneDrive\Desktop\ROI Labs\CRM\crm-project\docs\Estrategia_SEO_Cliques\Relatorios'
    files = [
        'SEO Command Center - Admin.pdf',
        'Ultimate Funnel Command Center _ Sirius Admin.pdf'
    ]
    
    for file in files:
        full_path = os.path.join(dir_path, file)
        try:
            reader = PdfReader(full_path)
            text = ''
            for page in reader.pages:
                text += page.extract_text() + '\n'
            print(f'\n\n--- CONTENT OF {file} ---\n\n')
            print(text)
        except Exception as e:
            print(f'Failed to read {file}: {e}')

read_pdfs()
