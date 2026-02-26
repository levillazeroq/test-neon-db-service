import OpenAI from "openai";
import type { CustomField } from "@/src/types";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

/**
 * Concatenates the values of selected embedding fields into a single string.
 * Format: "FieldName: value\nFieldName: value"
 */
export function buildEmbeddingText(
  embeddingFieldIds: string[],
  fields: CustomField[],
  data: Record<string, unknown>,
): string {
  const fieldMap = new Map(fields.map((f) => [f.id, f]));
  const parts: string[] = [];

  for (const fieldId of embeddingFieldIds) {
    const field = fieldMap.get(fieldId);
    const value = data[fieldId];
    if (!field || value === null || value === undefined || value === "") continue;

    const text = Array.isArray(value) ? value.join(", ") : String(value);
    if (text.trim()) parts.push(`${field.name}: ${text}`);
  }

  return parts.join("\n");
}

/**
 * Generates a single embedding vector.
 * Returns null if text is empty or OPENAI_API_KEY is not set.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!text.trim() || !process.env.OPENAI_API_KEY) return null;

  const response = await getClient().embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0]?.embedding ?? null;
}

/**
 * Generates embeddings for multiple texts in batched API calls (100 per call).
 * Returns null for empty strings or when OPENAI_API_KEY is not set.
 */
export async function generateEmbeddingsBatch(
  texts: string[],
): Promise<(number[] | null)[]> {
  if (!process.env.OPENAI_API_KEY) return texts.map(() => null);

  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  const openai = getClient();
  const chunkSize = 100;

  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);

    // Only send non-empty texts to the API
    const nonEmptyIndices: number[] = [];
    const nonEmptyTexts: string[] = [];
    chunk.forEach((text, idx) => {
      if (text.trim()) {
        nonEmptyIndices.push(i + idx);
        nonEmptyTexts.push(text);
      }
    });

    if (nonEmptyTexts.length === 0) continue;

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: nonEmptyTexts,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    response.data.forEach((item) => {
      const originalIdx = nonEmptyIndices[item.index];
      if (originalIdx !== undefined) {
        results[originalIdx] = item.embedding;
      }
    });
  }

  return results;
}
