import { useState, useCallback, useEffect } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { addPromptToHistory, parseJSON, reviveComponentDates, STORAGE_KEYS } from '../utils/storage';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  promptHistory: string[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>(() =>
    reviveComponentDates(parseJSON(localStorage.getItem(STORAGE_KEYS.components), []))
  );
  const [promptHistory, setPromptHistory] = useState<string[]>(() =>
    parseJSON(localStorage.getItem(STORAGE_KEYS.promptHistory), [])
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.components, JSON.stringify(components));
    } catch {
      // localStorage 접근 불가(비공개 모드, 용량 초과 등)는 무시하고 계속 진행한다
    }
  }, [components]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.promptHistory, JSON.stringify(promptHistory));
    } catch {
      // localStorage 접근 불가(비공개 모드, 용량 초과 등)는 무시하고 계속 진행한다
    }
  }, [promptHistory]);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate component');
      }

      const newComponent: GeneratedComponent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        prompt,
        code: data.code,
        createdAt: new Date(),
      };

      setComponents((prev) => [newComponent, ...prev]);
      setPromptHistory((prev) => addPromptToHistory(prev, prompt));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, []);

  return { components, promptHistory, isLoading, error, generate, removeComponent, clearAll };
}
