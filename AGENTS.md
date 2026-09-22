# AGENTS.md

## Operational Commands

- Package manager: `bun` 고정. `bun.lock`만 존재하며 `package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`은 없다. npm/yarn/pnpm 명령을 사용하지 마라.
- 의존성 설치: `bun install`
- 개발 서버 (API + 프론트엔드 동시 실행): `bun run dev`
- API 서버만 실행: `bun run server` (`server/index.ts`, 포트 3002)
- 빌드: `bun run build` (`tsc -b && vite build`)
- 테스트 전체 실행: `bun run test` (vitest run)
- 테스트 watch: `bun run test:watch`
- lint: `bun run lint`
- 프론트엔드는 Vite dev 서버(기본 5173)에서 `/api/*` 요청을 `http://localhost:3002`로 프록시한다 (`vite.config.ts:9-13`). API 서버 없이 프론트엔드만 켜면 `/api/generate`, `/api/config` 호출이 실패한다.

## Golden Rules

### Security Boundary — API 키를 클라이언트에 노출하지 마라
- `server/index.ts:147-157`의 `/api/config`는 `ENV_KEYS`의 존재 여부(`!!ENV_KEYS.anthropic`)만 boolean으로 반환한다. 실제 키 문자열은 절대 응답에 포함하지 않는다.
- `resolveApiKey` (`server/index.ts:64-66`)는 클라이언트가 보낸 키(`clientKey`)를 서버 `.env` 키보다 우선한다. 새 엔드포인트를 추가할 때도 이 우선순위와 "boolean만 노출" 원칙을 유지하라.
- Do: 에러 메시지, 로그, 응답 바디 어디에도 `ENV_KEYS` 값 자체를 문자열로 직렬화하지 마라.

### Asymmetry — Google과 Anthropic 경로는 의도적으로 다르게 처리된다
- `callGoogle`은 `GOOGLE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash']` (`server/index.ts:5, 134-136`)를 `withModelFallback`으로 순차 시도하고, `callGoogleModel`은 `finishReason === 'MAX_TOKENS'`를 별도로 감지해 한국어 에러 메시지를 던진다 (`server/index.ts:123-125`). `callAnthropic`(`server/index.ts:68-96`)은 단일 모델만 호출하며 이 두 처리가 없다.
- 이는 실수로 빠진 게 아니라 Gemini 계열이 잘리거나 실패하는 사례가 많아 추가된 방어 로직이다. Anthropic 경로에 동일한 fallback/MAX_TOKENS 처리를 기계적으로 복사하지 말고, 두 프로바이더의 실패 모드가 다르다는 전제를 유지하라.

### Hard Constraint — 생성된 코드는 react-live noInline 규칙을 따라야 한다
- `src/components/LivePreview.tsx:14`가 `<LiveProvider code={code} noInline>`로 렌더링하므로, 코드는 import 문 없이, TypeScript 문법 없이, 마지막에 `render(<Component />)` 호출로 끝나야 한다.
- 이 제약은 `server/index.ts:7-21` SYSTEM_PROMPT에 명시되어 있다. SYSTEM_PROMPT를 수정할 때 이 3가지 요구사항(no import, no TS 문법, render 호출)을 깨면 미리보기가 즉시 깨진다.

### Double Defense — SYSTEM_PROMPT 지침을 코드에서 다시 강제한다
- `server/generator.ts`의 `stripCodeFences`와 `ensureRenderCall`(`server/index.ts:188`에서 순서대로 호출)은 SYSTEM_PROMPT가 요청한 "코드펜스 금지"와 "render 호출 필수"를 LLM이 어겼을 때를 대비한 2차 방어선이다.
- 둘 중 하나라도 제거하면 모델이 지침을 따르지 않는 경우 프리뷰가 깨지는 문제가 재발한다. SYSTEM_PROMPT를 다듬을 때 이 안전장치를 함께 제거하지 마라.

### Test Boundary — 순수 함수만 유닛 테스트 대상이다
- `server/generator.ts`, `server/fallback.ts`는 부수효과가 없는 순수 함수이며 각각 `generator.test.ts`, `fallback.test.ts`로 테스트된다. `server/index.ts`(`Bun.serve`, 실제 fetch 호출)는 테스트가 없다.
- `src/`에서는 `PromptInput.tsx`만 테스트(`PromptInput.test.tsx`)가 있고, `useComponentGenerator.ts`, `LivePreview.tsx`, `ComponentCard.tsx`는 없다.
- 새 로직을 추가할 때 부수효과(네트워크, `Bun.serve`)와 순수 로직을 분리하고, 순수 로직 쪽에 테스트를 추가하는 기존 패턴을 따르라 (`vite.config.ts:20`의 test include가 `server/**/*.test.ts`와 `src/**/*.test.{ts,tsx}`를 함께 포함한다).

## Project Context

React 컴포넌트 생성기: 프롬프트를 입력하면 Anthropic Claude 또는 Google Gemini가 React 컴포넌트 코드를 생성하고, react-live로 즉시 미리보기를 렌더링한다.

Tech Stack: React 19, TypeScript, Vite, Bun (API 서버), react-live, Vitest, Testing Library, ESLint.

## Standards & References

- 프로젝트 소개, 설치, 실행 방법은 `README.md` 참고.
- 커밋 메시지, 브랜치 전략에 대한 별도 문서 없음 — 저장소의 기존 커밋 스타일을 따르라 (`git log` 확인).
- Maintenance Policy: 코드를 변경하며 위 Golden Rules의 근거(파일·라인)가 더 이상 맞지 않는다고 판단되면, 그 사실을 사용자에게 알리고 이 문서 업데이트를 제안하라.

## Context Map

- **[AI 프록시 서버 (server/)](./server/AGENTS.md)** — API 키 처리, 프로바이더 폴백, SYSTEM_PROMPT 수정 시.
