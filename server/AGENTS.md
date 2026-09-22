# server/AGENTS.md

## Module Context

Bun 단일 프로세스로 동작하는 AI 프록시 서버. 프론트엔드 대신 Anthropic/Google API를 호출해 API 키를 서버 쪽에 두고, 응답을 react-live가 실행 가능한 코드로 정규화해 반환한다. 별도 `package.json` 없이 루트 의존성을 공유한다.

## Tech Stack & Constraints

- `Bun.serve`만 사용한다 (`index.ts:138`). Express/Fastify 등 별도 HTTP 프레임워크를 추가하지 마라.
- 외부 호출은 전역 `fetch`만 사용한다 (`index.ts:69, 101`). axios 등 HTTP 클라이언트 라이브러리를 추가하지 마라.
- 포트는 3002 고정 (`index.ts:139`)이며 `vite.config.ts`의 프록시 대상과 짝을 이룬다. 포트를 바꾸려면 두 파일을 함께 수정하라.

## Implementation Patterns

- 프로바이더별 호출 함수는 `call<Provider>`, `call<Provider>Model` 네이밍을 따른다 (`callAnthropic`, `callGoogle`, `callGoogleModel`).
- 부수효과 없는 변환 로직(코드 정규화, 폴백 순회)은 `generator.ts`/`fallback.ts`처럼 별 파일로 분리하고 `index.ts`에서 import해서 쓴다. `index.ts`에 순수 함수 로직을 직접 넣지 마라.
- 에러 응답은 항상 `CORS_HEADERS`를 포함한 `Response.json(..., { status, headers: CORS_HEADERS })` 형태로 반환한다 (`index.ts:170-211`).

## Testing Strategy

- 테스트 명령: `bun run test` (루트에서 실행, `server/**/*.test.ts` 포함).
- `index.ts`(네트워크 호출, `Bun.serve`)는 테스트하지 않는다. 새 로직을 추가할 때 네트워크/서버 바인딩과 분리 가능한 부분은 `generator.ts`/`fallback.ts`처럼 순수 함수로 뽑아 `*.test.ts`를 작성하라.

## Local Golden Rules

- **Security Boundary**: `ENV_KEYS`(`index.ts:59-62`)와 `resolveApiKey`(`index.ts:64-66`)가 다루는 실제 키 값은 응답(`Response.json`)에 절대 담지 마라. `/api/config`처럼 boolean 존재 여부만 노출하는 패턴을 유지하라.
- **Asymmetry**: `GOOGLE_MODELS` 폴백 배열(`index.ts:5`)과 `MAX_TOKENS` 체크(`index.ts:123-125`)는 Google 전용이다. Anthropic 경로(`callAnthropic`)에 동일한 로직을 무조건 이식하지 마라 — 실패 모드가 다르다는 근거로 의도적으로 분리되어 있다.
- **Hard Constraint**: `SYSTEM_PROMPT`(`index.ts:7-49`)의 "no import / no TS 문법 / render() 호출" 규칙은 `src/components/LivePreview.tsx`의 `noInline` 렌더링 방식과 직접 연결되어 있다. 이 셋 중 하나라도 완화하면 프리뷰가 깨진다.
- **Double Defense**: `stripCodeFences` → `ensureRenderCall` 순서(`index.ts:188`)는 SYSTEM_PROMPT 위반에 대한 2차 방어선이다. SYSTEM_PROMPT를 강화해도 이 두 함수는 유지하라.
