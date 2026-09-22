import { describe, it, expect } from 'vitest';
import { validatePromptLength, MAX_PROMPT_LENGTH } from './validatePrompt';

describe('validatePromptLength', () => {
  it('500자 이하 프롬프트는 유효하다 (null 반환)', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH);
    expect(validatePromptLength(prompt)).toBeNull();
  });

  it('500자를 초과하면 에러 메시지를 반환한다', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH + 1);
    expect(validatePromptLength(prompt)).not.toBeNull();
  });

  it('에러 메시지는 제한 글자 수를 포함한다', () => {
    const prompt = 'a'.repeat(MAX_PROMPT_LENGTH + 1);
    expect(validatePromptLength(prompt)).toContain('500');
  });

  it('빈 문자열은 길이 제한을 통과한다', () => {
    expect(validatePromptLength('')).toBeNull();
  });
});
