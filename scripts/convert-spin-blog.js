const fs = require('fs');
const path = require('path');

// Read the markdown file
const markdownContent = fs.readFileSync(
  path.join(__dirname, '../blog/spin-selling-guia-completo.md'),
  'utf-8'
);

// Extract frontmatter
const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
const frontmatterMatch = markdownContent.match(frontmatterRegex);
let metadata = {};

if (frontmatterMatch) {
  const frontmatterLines = frontmatterMatch[1].split('\n');
  frontmatterLines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim().replace(/^["']|["']$/g, '');
      metadata[key.trim()] = value;
    }
  });
}

// Get content without frontmatter
const contentWithoutFrontmatter = markdownContent.replace(frontmatterRegex, '').trim();

// Convert markdown to HTML
let htmlContent = contentWithoutFrontmatter;

// Convert markdown tables to styled HTML tables (including indented tables)
htmlContent = htmlContent.replace(/(\s*\|.+\|[\r\n]+\s*\|[-:\s|]+\|[\r\n]+(?:\s*\|.+\|[\r\n]*)+)/gm, (match) => {
  const lines = match.trim().split('\n');
  const headers = lines[0].split('|').filter(h => h.trim());
  const rows = lines.slice(2).map(row => row.split('|').filter(cell => cell.trim()));

  let tableHTML = `
<div style="overflow-x: auto; margin: 2rem 0; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
  <table style="width: 100%; border-collapse: collapse; background: white; font-size: 0.9375rem;">
    <thead>
      <tr style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);">`;

  headers.forEach(header => {
    tableHTML += `
        <th style="padding: 1rem; text-align: left; color: white; font-weight: 600; border-bottom: 2px solid #1e40af;">${header.trim()}</th>`;
  });

  tableHTML += `
      </tr>
    </thead>
    <tbody>`;

  rows.forEach((row, idx) => {
    const bgColor = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    tableHTML += `
      <tr style="background: ${bgColor}; transition: background 0.2s;" onmouseover="this.style.background='#e0f2fe'" onmouseout="this.style.background='${bgColor}'">`;

    row.forEach(cell => {
      tableHTML += `
        <td style="padding: 1rem; border-bottom: 1px solid #e5e7eb; color: #334155;">${cell.trim()}</td>`;
    });

    tableHTML += `
      </tr>`;
  });

  tableHTML += `
    </tbody>
  </table>
</div>`;

  return tableHTML;
});

// ShareButtons - Convert to styled social media buttons (MUST be before general link conversion)
htmlContent = htmlContent.replace(
  /<ShareButtons>([\s\S]*?)<\/ShareButtons>/g,
  (match, content) => {
    let buttonsHTML = content;

    // Convert LinkedIn link to styled button
    buttonsHTML = buttonsHTML.replace(
      /- 🔗 \[([^\]]+)\]\(([^)]+)\)/g,
      `<a href="$2" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.5rem; background: #0A66C2; color: white; padding: 0.875rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 4px rgba(10, 102, 194, 0.2);" onmouseover="this.style.background='#004182'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(10, 102, 194, 0.3)'" onmouseout="this.style.background='#0A66C2'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(10, 102, 194, 0.2)'">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path></svg>
        $1
      </a>`
    );

    // Convert WhatsApp link to styled button
    buttonsHTML = buttonsHTML.replace(
      /- 💬 \[([^\]]+)\]\(([^)]+)\)/g,
      `<a href="$2" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.5rem; background: #25D366; color: white; padding: 0.875rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 4px rgba(37, 211, 102, 0.2);" onmouseover="this.style.background='#1DA851'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(37, 211, 102, 0.3)'" onmouseout="this.style.background='#25D366'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(37, 211, 102, 0.2)'">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>
        $1
      </a>`
    );

    // Convert Instagram link to styled button
    buttonsHTML = buttonsHTML.replace(
      /- 📸 \[([^\]]+)\]\(([^)]+)\)/g,
      `<a href="$2" target="_blank" rel="noopener" style="display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(45deg, #F58529, #DD2A7B, #8134AF, #515BD4); color: white; padding: 0.875rem 1.5rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 4px rgba(221, 42, 123, 0.2);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(221, 42, 123, 0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(221, 42, 123, 0.2)'">
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"></path></svg>
        $1
      </a>`
    );

    return `<div style="display: flex; flex-wrap: wrap; gap: 1rem; margin: 2rem 0; align-items: center;">${buttonsHTML}</div>`;
  }
);

// Convert headers
htmlContent = htmlContent.replace(/^### (.+)$/gm, '<h3>$1</h3>');
htmlContent = htmlContent.replace(/^## (.+)$/gm, '<h2>$1</h2>');
htmlContent = htmlContent.replace(/^# (.+)$/gm, '<h1>$1</h1>');

// Convert images with alt text (MUST be before links!)
htmlContent = htmlContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 2rem 0; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />');

// Convert bold
htmlContent = htmlContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

// Convert italic
htmlContent = htmlContent.replace(/\*(.+?)\*/g, '<em>$1</em>');

// Convert links with modern styling
htmlContent = htmlContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color: #2563eb; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; transition: all 0.2s;" onmouseover="this.style.color=\'#1e40af\'; this.style.textDecorationThickness=\'2px\'" onmouseout="this.style.color=\'#2563eb\'; this.style.textDecorationThickness=\'1px\'">$1</a>');

// Convert bullet lists
htmlContent = htmlContent.replace(/^- (.+)$/gm, '<li>$1</li>');
htmlContent = htmlContent.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

// Convert numbered lists
htmlContent = htmlContent.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

// Convert code blocks
htmlContent = htmlContent.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

// Convert inline code
htmlContent = htmlContent.replace(/`([^`]+)`/g, '<code>$1</code>');

// Convert horizontal rules
htmlContent = htmlContent.replace(/^---$/gm, '<hr style="margin: 3rem 0; border: none; border-top: 1px solid #e5e7eb;" />');

// Convert paragraphs (lines that are not HTML tags)
htmlContent = htmlContent.split('\n\n').map(para => {
  para = para.trim();
  if (!para) return '';
  if (para.startsWith('<')) return para;
  if (para.includes('<!--')) return para;
  return `<p>${para}</p>`;
}).join('\n\n');

// Convert custom components to styled HTML
// AudioPlayer
htmlContent = htmlContent.replace(
  /<AudioPlayer[\s\S]*?src="([^"]*)"[\s\S]*?duration="([^"]*)"[\s\S]*?label="([^"]*)"[\s\S]*?\/>/g,
  `<div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0284c7; padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0;">
    <p style="font-size: 1.125rem; font-weight: 600; color: #0c4a6e; margin-bottom: 0.5rem;">$3</p>
    <audio controls style="width: 100%; margin-top: 0.75rem;">
      <source src="$1" type="audio/mpeg">
      Seu navegador não suporta o elemento de áudio.
    </audio>
  </div>`
);

// ResourceBox
htmlContent = htmlContent.replace(
  /<ResourceBox>([\s\S]*?)<\/ResourceBox>/g,
  `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin: 2rem 0;">$1</div>`
);

// Resource
htmlContent = htmlContent.replace(
  /<Resource[\s\S]*?icon="([^"]*)"[\s\S]*?title="([^"]*)"[\s\S]*?description="([^"]*)"[\s\S]*?downloadUrl="([^"]*)"[\s\S]*?cta="([^"]*)"[\s\S]*?\/>/g,
  `<div style="background: white; border: 1px solid #e5e7eb; padding: 1.5rem; border-radius: 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="font-size: 2rem; margin-bottom: 1rem;">$1</div>
    <h3 style="font-size: 1.125rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem;">$2</h3>
    <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 1rem;">$3</p>
    <a href="$4" style="display: inline-block; background: #2563eb; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; text-decoration: none; font-weight: 600;">$5</a>
  </div>`
);

// HighlightBox
htmlContent = htmlContent.replace(
  /<HighlightBox type="([^"]*)">([\s\S]*?)<\/HighlightBox>/g,
  (match, type, content) => {
    const colors = {
      warning: { bg: '#fef3c7', border: '#f59e0b', text: '#78350f' },
      info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
      success: { bg: '#d1fae5', border: '#10b981', text: '#064e3b' },
      definition: { bg: '#e0e7ff', border: '#6366f1', text: '#312e81' }
    };
    const color = colors[type] || colors.info;
    return `<div style="background: ${color.bg}; border-left: 4px solid ${color.border}; padding: 1.5rem; border-radius: 0.5rem; margin: 2rem 0; color: ${color.text};">${content}</div>`;
  }
);

// ExpertQuote
htmlContent = htmlContent.replace(
  /<ExpertQuote[\s\S]*?author="([^"]*)"[\s\S]*?title="([^"]*)"[\s\S]*?>([\s\S]*?)<\/ExpertQuote>/g,
  `<blockquote style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 1.5rem; margin: 2rem 0; border-radius: 0.5rem;">
    <p style="font-style: italic; color: #334155; font-size: 1.125rem; line-height: 1.7;">$3</p>
    <footer style="margin-top: 1rem; font-weight: 600; color: #1e293b;">— $1, <span style="font-weight: 400; color: #64748b;">$2</span></footer>
  </blockquote>`
);

// WarningBox
htmlContent = htmlContent.replace(
  /<WarningBox>([\s\S]*?)<\/WarningBox>/g,
  `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1.5rem; border-radius: 0.5rem; margin: 2rem 0; color: #78350f;">$1</div>`
);

// ChecklistBox
htmlContent = htmlContent.replace(
  /<ChecklistBox>([\s\S]*?)<\/ChecklistBox>/g,
  `<div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 1.5rem; border-radius: 0.5rem; margin: 2rem 0; color: #064e3b;">$1</div>`
);

// ErrorBox
htmlContent = htmlContent.replace(
  /<ErrorBox[\s\S]*?number="([^"]*)"[\s\S]*?title="([^"]*)"[\s\S]*?>([\s\S]*?)<\/ErrorBox>/g,
  (match, number, title, content) => {
    return `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 1.5rem; border-radius: 0.75rem; margin: 2rem 0; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);">
    <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
      <span style="background: #ef4444; color: white; width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem;">❌</span>
      <h4 style="font-size: 1.125rem; font-weight: 700; color: #991b1b; margin: 0;">Erro #${number}: ${title}</h4>
    </div>
    <div style="color: #7f1d1d;">${content}</div>
  </div>`;
  }
);

// ExitIntentPopup - just remove it for now as it's a JS component
htmlContent = htmlContent.replace(/<ExitIntentPopup[\s\S]*?\/>/g, '');

// Remove comments
htmlContent = htmlContent.replace(/<!--[\s\S]*?-->/g, '');

// Clean up extra newlines
htmlContent = htmlContent.replace(/\n{3,}/g, '\n\n');

// Create the blog post object
const blogPost = {
  slug: metadata.slug || 'spin-selling-guia-completo',
  title: metadata.title || 'SPIN Selling: Guia Completo',
  excerpt: metadata.description || '',
  content: htmlContent,
  date: metadata.date || '2026-01-10',
  category: metadata.category || 'Vendas',
  image: metadata.featured_image || '/images/blog/spin-selling-hero.jpg',
  author: metadata.author || 'Equipe Sirius CRM'
};

// Create proper JavaScript object notation (not JSON)
// Escape backticks and ${} in content for template literal
const escapedContent = htmlContent
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$\{/g, '\\${');

const output = `  {
    slug: '${blogPost.slug}',
    title: '${blogPost.title.replace(/'/g, "\\'")}',
    excerpt: \`${blogPost.excerpt.replace(/`/g, '\\`')}\`,
    content: \`${escapedContent}\`,
    date: '${blogPost.date}',
    category: '${blogPost.category}',
    image: '${blogPost.image}',
    author: '${blogPost.author}'
  }
]`;

// Write to a temporary file
fs.writeFileSync(
  path.join(__dirname, '../blog-post-converted.txt'),
  output,
  'utf-8'
);

console.log('✅ Blog post converted successfully!');
console.log('📝 Output saved to: blog-post-converted.txt');
console.log('\nNext steps:');
console.log('1. Review the converted content in blog-post-converted.txt');
console.log('2. Add it to lib/blog-data.ts by replacing the closing ] with the content');
