import { describe, it, expect } from 'vitest';
import { parseJSON, reviveComponentDates, addPromptToHistory, MAX_PROMPT_HISTORY } from './storage';

describe('parseJSON', () => {
  it('raw가 null이면 fallback을 반환한다', () => {
    expect(parseJSON(null, 'fallback')).toBe('fallback');
  });

  it('유효한 JSON 문자열이면 파싱한 값을 반환한다', () => {
    expect(parseJSON(JSON.stringify({ a: 1 }), null)).toEqual({ a: 1 });
  });

  it('손상된 JSON이면 fallback을 반환한다', () => {
    expect(parseJSON('{invalid', 'fallback')).toBe('fallback');
  });
});

describe('reviveComponentDates', () => {
  it('createdAt 문자열을 Date 인스턴스로 되살린다', () => {
    const stored = [
      { id: '1', prompt: 'p', code: 'c', createdAt: '2024-01-01T00:00:00.000Z' },
    ];

    const result = reviveComponentDates(stored);

    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('나머지 필드는 그대로 유지한다', () => {
    const stored = [{ id: '1', prompt: 'p', code: 'c', createdAt: '2024-01-01T00:00:00.000Z' }];

    const result = reviveComponentDates(stored);

    expect(result[0].id).toBe('1');
    expect(result[0].prompt).toBe('p');
    expect(result[0].code).toBe('c');
  });
});

describe('addPromptToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addPromptToHistory(['old'], 'new')).toEqual(['new', 'old']);
  });

  it('이미 있는 프롬프트는 중복 제거 후 맨 앞으로 옮긴다', () => {
    expect(addPromptToHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('최대 개수를 초과하면 오래된 항목을 잘라낸다', () => {
    const history = Array.from({ length: MAX_PROMPT_HISTORY }, (_, i) => `p${i}`);
    const result = addPromptToHistory(history, 'new');

    expect(result).toHaveLength(MAX_PROMPT_HISTORY);
    expect(result[0]).toBe('new');
    expect(result).not.toContain(`p${MAX_PROMPT_HISTORY - 1}`);
  });
});
