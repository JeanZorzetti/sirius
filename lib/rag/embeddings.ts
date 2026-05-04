import OpenAI from 'openai'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}

export async function embedText(text: string): Promise<number[]> {
  const response = await getClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: text.trim(),
  })
  return response.data[0].embedding
}

export function vectorToSql(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
