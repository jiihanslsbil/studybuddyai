import groq from './groq.js';

// Model fallback list — dicoba urut dari atas jika model sebelumnya gagal
const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama3-8b-8192',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
];

/**
 * Panggil Groq dengan fallback otomatis ke model lain jika gagal.
 * @param {Array} messages - array pesan { role, content }
 * @param {number} maxTokens - default 2048
 * @returns {Promise<string>} - teks respons AI
 */
export async function callGroq(messages, maxTokens = 2048) {
  let lastError;
  for (const model of GROQ_MODELS) {
    try {
      console.log(`[Groq] Trying model: ${model}`);
      const completion = await groq.chat.completions.create({
        messages,
        model,
        temperature: 0.3,
        max_tokens: maxTokens,
      });
      const text = completion.choices[0]?.message?.content || '';
      console.log(`[Groq] Success with ${model}, response length: ${text.length}`);
      return text;
    } catch (err) {
      console.warn(`[Groq] Model ${model} failed: ${err.message}`);
      lastError = err;
    }
  }
  throw new Error(`All Groq models failed. Last error: ${lastError?.message}`);
}

/**
 * Parse JSON dari respons AI secara robust.
 * Menangani kasus: JSON murni, JSON dalam ```json...```, atau JSON di tengah teks.
 */
export function parseAIJson(text, fallback = {}) {
  if (!text) return fallback;

  // 1. Coba parse langsung
  try {
    return JSON.parse(text.trim());
  } catch {}

  // 2. Coba strip markdown code block ```json ... ``` atau ``` ... ```
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    try {
      return JSON.parse(codeBlock[1].trim());
    } catch {}
  }

  // 3. Coba ambil substring { ... } terluar
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }

  console.warn('[parseAIJson] Could not parse JSON, using fallback. Raw:', text.slice(0, 200));
  return fallback;
}
