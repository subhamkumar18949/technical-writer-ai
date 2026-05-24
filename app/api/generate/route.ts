import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434'

export async function POST(req: NextRequest) {
  let model: string
  let prompt: string

  try {
    const body = await req.json()
    model = body.model
    prompt = body.prompt
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!model || !prompt) {
    return NextResponse.json({ error: 'model and prompt are required' }, { status: 400 })
  }

  try {
    const ollamaRes = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: true }),
    })

    if (!ollamaRes.ok) {
      const errorText = await ollamaRes.text()
      return NextResponse.json(
        { error: `Ollama error (${ollamaRes.status}): ${errorText}` },
        { status: ollamaRes.status }
      )
    }

    if (!ollamaRes.body) {
      return NextResponse.json({ error: 'No response body from Ollama' }, { status: 500 })
    }

    const encoder = new TextEncoder()
    let buffer = ''

    // Stream Ollama NDJSON → plain text chunks back to the browser
    const stream = new ReadableStream({
      async start(controller) {
        const reader = ollamaRes.body!.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Ollama sends newline-delimited JSON; process complete lines only
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.trim()) continue
              try {
                const parsed = JSON.parse(line)
                if (parsed.response) {
                  controller.enqueue(encoder.encode(parsed.response))
                }
                if (parsed.done) {
                  controller.close()
                  return
                }
              } catch {
                // skip malformed lines
              }
            }
          }

          // flush remaining buffer
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer)
              if (parsed.response) {
                controller.enqueue(encoder.encode(parsed.response))
              }
            } catch {}
          }
        } catch (err) {
          controller.error(err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    const isConnRefused =
      message.includes('ECONNREFUSED') ||
      message.includes('fetch failed') ||
      message.includes('connect')

    return NextResponse.json(
      {
        error: isConnRefused
          ? `Cannot reach Ollama at ${OLLAMA_URL}. Check your OLLAMA_URL environment variable.`
          : message,
      },
      { status: 503 }
    )
  }
}
