const CHUNK_SIZE = 400  // approximate word count per chunk
const OVERLAP = 50     // words of overlap between chunks

export function chunkText(text: string): string[] {
  const words = text.trim().split(/\s+/)
  if (words.length <= CHUNK_SIZE) return [text.trim()]

  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length)
    chunks.push(words.slice(start, end).join(' '))
    start += CHUNK_SIZE - OVERLAP
  }

  return chunks
}
