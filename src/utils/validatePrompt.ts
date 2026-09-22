export const MAX_PROMPT_LENGTH = 500;

export function validatePromptLength(prompt: string): string | null {
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return `프롬프트는 ${MAX_PROMPT_LENGTH}자 이내로 입력해주세요. (현재 ${prompt.length}자)`;
  }
  return null;
}
