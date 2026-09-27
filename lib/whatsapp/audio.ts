import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

const execAsync = promisify(exec)

/**
 * Convert WebM/Opus audio (what the browser records) to OGG/Opus using ffmpeg.
 * WhatsApp plays voice notes as audio/ogg, not audio/webm.
 */
export async function convertWebmToOgg(inputBuffer: Buffer): Promise<Buffer> {
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const inputPath = join(tmpdir(), `wa_in_${id}.webm`)
  const outputPath = join(tmpdir(), `wa_out_${id}.ogg`)
  try {
    await writeFile(inputPath, inputBuffer)
    await execAsync(`ffmpeg -y -i "${inputPath}" -c:a libopus -b:a 64k "${outputPath}"`)
    return await readFile(outputPath)
  } finally {
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})
  }
}
