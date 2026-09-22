import type { GeneratedComponent } from '../types';

export const MAX_PROMPT_HISTORY = 20;

export const STORAGE_KEYS = {
  apiKey: 'rcg:apiKey',
  provider: 'rcg:provider',
  promptHistory: 'rcg:promptHistory',
  components: 'rcg:components',
} as const;

export function parseJSON<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

type StoredComponent = Omit<GeneratedComponent, 'createdAt'> & { createdAt: string };

export function reviveComponentDates(components: StoredComponent[]): GeneratedComponent[] {
  return components.map((component) => ({
    ...component,
    createdAt: new Date(component.createdAt),
  }));
}

export function addPromptToHistory(
  history: string[],
  prompt: string,
  maxLength: number = MAX_PROMPT_HISTORY
): string[] {
  const deduped = history.filter((item) => item !== prompt);
  return [prompt, ...deduped].slice(0, maxLength);
}
