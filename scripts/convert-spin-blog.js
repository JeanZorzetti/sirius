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

// Convert headers
htmlContent = htmlContent.replace(/^### (.+)$/gm, '<h3>$1</h3>');
htmlContent = htmlContent.replace(/^## (.+)$/gm, '<h2>$1</h2>');
htmlContent = htmlContent.replace(/^# (.+)$/gm, '<h1>$1</h1>');

// Convert bold
htmlContent = htmlContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

// Convert italic
htmlContent = htmlContent.replace(/\*(.+?)\*/g, '<em>$1</em>');

// Convert links
htmlContent = htmlContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

// Convert images with alt text
htmlContent = htmlContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 2rem 0; border-radius: 0.5rem;" />');

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

// ShareButtons
htmlContent = htmlContent.replace(
  /<ShareButtons>([\s\S]*?)<\/ShareButtons>/g,
  `<div style="display: flex; gap: 1rem; margin: 2rem 0;">$1</div>`
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

const output = `,
  {
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
