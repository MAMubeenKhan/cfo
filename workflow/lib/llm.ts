import type {SanityClient} from '@sanity/client'

/**
 * One function every agent uses to ask a model for JSON.
 *
 *   provider "sanity"    (default) Sanity Agent Actions: client.agent.action.prompt
 *   provider "anthropic" (fallback) Anthropic Messages API, needs ANTHROPIC_API_KEY
 *
 * Both providers receive identical inputs. The reply is always run through `validate`;
 * one retry on invalid output, then it throws and the caller decides how to degrade.
 */
export interface LlmOptions {
  content: SanityClient
  provider?: 'sanity' | 'anthropic'
  anthropicKey?: string
  anthropicModel?: string
  timeoutMs?: number
}

export interface LlmResult<T> {
  value: T
  model: string
}

export async function askJson<T>(
  opts: LlmOptions,
  instruction: string,
  params: Record<string, string>,
  validate: (raw: unknown) => T,
): Promise<LlmResult<T>> {
  const provider = opts.provider ?? 'sanity'
  const timeoutMs = opts.timeoutMs ?? 45_000
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await withTimeout(
        provider === 'anthropic' ? callAnthropic(opts, instruction, params) : callSanity(opts, instruction, params),
        timeoutMs,
      )
      return {value: validate(raw), model: provider === 'anthropic' ? opts.anthropicModel ?? 'claude-haiku-4-5' : 'sanity-agent-actions'}
    } catch (error) {
      lastError = error
    }
  }
  throw new Error(`LLM call failed after 2 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`)
}

async function callSanity(opts: LlmOptions, instruction: string, params: Record<string, string>): Promise<unknown> {
  // instructionParams accept plain string constants; the case JSON is passed as one.
  const result = await (opts.content as any).agent.action.prompt({
    instruction,
    instructionParams: params,
    format: 'json',
  })
  return typeof result === 'string' ? JSON.parse(result) : result
}

async function callAnthropic(opts: LlmOptions, instruction: string, params: Record<string, string>): Promise<unknown> {
  if (!opts.anthropicKey) throw new Error('ANTHROPIC_API_KEY is not set')
  const {default: Anthropic} = await import('@anthropic-ai/sdk')
  const client = new Anthropic({apiKey: opts.anthropicKey})
  let prompt = instruction
  for (const [k, v] of Object.entries(params)) prompt = prompt.split(`$${k}`).join(v)
  const message = await client.messages.create({
    model: opts.anthropicModel ?? 'claude-haiku-4-5',
    max_tokens: 1400,
    system: 'You are a records officer at a government bureau. Reply with one JSON object only, no prose, no code fences.',
    messages: [{role: 'user', content: prompt}],
  })
  const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim()
  return JSON.parse(text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim())
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timed out after ${ms} ms`)), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}
