const CHUNK_SIZE = 500  // target word count per chunk
const OVERLAP = 80     // words of overlap between consecutive chunks

// Split on paragraph breaks first, then sentences, then words
function splitByParagraphs(text: string): string[] {
  return text.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean)
}

function splitBySentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, '\n').trim()

  if (wordCount(normalized) <= CHUNK_SIZE) return [normalized]

  // Build chunks by accumulating paragraphs up to CHUNK_SIZE words
  const paragraphs = splitByParagraphs(normalized)
  const chunks: string[] = []
  let current: string[] = []
  let currentWords = 0

  for (const para of paragraphs) {
    const paraWords = wordCount(para)

    // Single paragraph exceeds limit — split by sentence
    if (paraWords > CHUNK_SIZE) {
      if (current.length > 0) {
        chunks.push(current.join('\n\n'))
        current = []
        currentWords = 0
      }
      const sentences = splitBySentences(para)
      let sentBuf: string[] = []
      let sentWords = 0
      for (const sent of sentences) {
        const sw = wordCount(sent)
        if (sentWords + sw > CHUNK_SIZE && sentBuf.length > 0) {
          chunks.push(sentBuf.join(' '))
          // overlap: keep last few sentences
          const overlap = sentBuf.slice(-2)
          sentBuf = overlap
          sentWords = overlap.reduce((s, t) => s + wordCount(t), 0)
        }
        sentBuf.push(sent)
        sentWords += sw
      }
      if (sentBuf.length > 0) chunks.push(sentBuf.join(' '))
      continue
    }

    if (currentWords + paraWords > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.join('\n\n'))
      // overlap: carry last paragraph into next chunk
      const lastPara = current[current.length - 1]
      const lastWords = wordCount(lastPara)
      if (lastWords < OVERLAP) {
        current = [lastPara]
        currentWords = lastWords
      } else {
        current = []
        currentWords = 0
      }
    }

    current.push(para)
    currentWords += paraWords
  }

  if (current.length > 0) chunks.push(current.join('\n\n'))

  return chunks.filter(c => c.trim().length > 0)
}
