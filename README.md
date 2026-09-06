# FAIRWAY 프론트엔드

교통사고 과실비율 분석 서비스. 금융 AI 챌린지 해커톤 출품작. **심사 9/7~9/11.**

> 서비스 이름은 **FAIRWAY**(9/6 확정). 화면에 박지 않고 `src/config.ts`의 `APP_NAME`에서 나온다.

## 실행

```bash
pnpm install     # 처음 한 번
pnpm dev         # http://localhost:5173 — 첫 화면(S0)이 뜬다
                 # 부품 확인 페이지는 /design-system (개발 서버에서만 열린다)
pnpm dev:api     # 개발 서버 + 목 백엔드. 진짜 HTTP로 답해 네트워크 탭에 다 찍힌다
pnpm build       # tsc -b && vite build
pnpm lint        # oxlint
pnpm fonts:sync  # Pretendard를 node_modules에서 public/으로 다시 복사할 때만
```

패키지 매니저는 **pnpm**. `package.json`의 `packageManager` 필드로 버전이 고정돼 있어
corepack이 켜져 있으면 자동으로 맞는 버전이 쓰인다.

## 문서

전부 저장소 안에 있다. 값이 어긋나면 이 순서로 믿는다.

0. `docs/handoff/04_기획변경.md` — **범위 정본.** 무엇을 만들고 무엇을 안 만드는지는 이것만 본다 (9/3 축소 · 9/6 되살림)
1. `docs/handoff/10_디자인.html` — **UI 원본.** 브라우저로 열고 주소 끝에 `#h21`처럼 화면 id를 붙이면 그 화면으로 간다
2. `docs/handoff/11_DesignSystem.html` — 토큰·부품·상태·반응형 규격
3. `docs/handoff/02_기능명세서.md` · `03_유저플로우.md` — 동작 규칙

- `docs/handoff/00_프론트_읽어주세요.md` — 디자인팀 주의사항. 화면 작업 전 확인
- `docs/handoff/01_화면색인.md` — 화면 id ↔ 기능 번호
- 렌더 이미지(`png/`)는 9/4에 삭제 — 축소 전 화면이라 `10_디자인.html`만 본다
- `docs/frontend-plan.md` — 아키텍처 근거와 9일 일정
- `CLAUDE.md` — 에이전트용 규칙 요약 (사람이 읽어도 좋다)

디자인팀이 갱신본을 주면 `docs/handoff/`를 통째로 덮어쓴다. 사본을 따로 두지 않는다.

## 지금까지 된 것

- Vite 8 + React 19 + TS + Tailwind 4
- **디자인 토큰** `src/styles/theme.css` — 색·반경·간격·초점·스크롤 정본. 값은 여기 말고 어디에도 적지 않는다
- **Pretendard 로컬 번들** `public/fonts/pretendard/` — CDN을 쓰지 않는다 (00 문서 6절)
- **아이콘 26종** `src/components/ui/Icon.tsx` — `10_디자인.html`에서 추출. 아이콘 라이브러리 금지
- **기본 부품** Button / StatusBadge / RatioBar / StepDots / StageIcon / Dialog / ConfirmDialog / Drawer / Field / Disclaimer / BrandMark / Dots
- **도메인 타입** `src/domain/` — Verdict · Case · Statement · Rebuttal · ChatMessage 유니온(10종)
- **API 계약** `src/api/service.ts` — 전송은 `src/api/http/`, 목은 `src/api/mock/`. 교체 지점은 `src/api/index.ts` 한 줄 (`VITE_API=http`)
- **미확정 값 모음** `src/config.ts` — 서비스명 · 접수번호 필수 여부 · 영상 제한 · 메일 모드

## 백엔드 연동

`.env.local`에 아래를 넣으면 서버로 붙는다. 개발 서버에서는 상대 주소로 두고
`DEV_API_PROXY`로 중계한다 — 같은 출처여야 refresh 쿠키가 따라온다.

```bash
VITE_API=http
VITE_API_BASE=/api/v1                      # 개발 서버. 배포에는 https://<api 주소>/api/v1
DEV_API_PROXY=https://<api 주소>            # 개발 서버가 중계할 곳 (배포에는 없다)
```

> **`VITE_API`를 안 넣으면 아무 소리 없이 목으로 돈다** (`src/api/index.ts`).
> 화면은 목과 서버를 구분하지 못하므로 겉으로는 멀쩡해 보인다. 서버에 붙었는지 확인하는 법:
> 아무 이메일에 8자 비밀번호로 로그인이 되면 아직 목, `AUTH_INVALID_CREDENTIALS`가 뜨면 서버다.
>
> **환경변수는 빌드할 때 코드에 박힌다.** 값을 바꾸면 개발 서버를 다시 띄우고,
> Vercel에서는 변수를 저장한 뒤 **반드시 재배포**해야 한다 — 저장만으로는 이미 만들어진 번들이 그대로다.
> 재배포됐는지는 `dist/assets/index-*.js` **파일 이름이 바뀌었는지**로 확인한다.

- 전송은 `src/api/http/` — 401이면 refresh 한 번 뒤 재시도, 업로드는 진행률 때문에 XHR, 결과 카드는 SSE로 받는다
- 목은 같은 계약을 브라우저 안에서 구현한다. **메모리라 새로고침하면 시드로 돌아간다**
- **로그인 필수** — `/cases` 아래는 `RequireSession`이 지킨다. 목은 자격을 보지 않지만 로그인은 거쳐야 한다

## 규칙 (어기면 검수에서 되돌아온다)

- 간격은 **4의 배수만**. 스케일 유틸리티(`p-3`, `gap-2`)만 쓰고 임의값(`p-[13px]`)은 쓰지 않는다.
  예외는 6px 색점 · 비율 막대 h8/h10 · 1px 선뿐.
- 스크롤 컨테이너에 **`min-h-0`** 필수. 빼면 입력 바가 화면 밖으로 밀려난다.
- 잠금은 **`opacity`가 아니라 색 교체** (`disabled:bg-bg-2 disabled:text-disabled`).
- 비율은 항상 **"나 ○ : 상대 ○"** — `formatRatio()`를 거친다.
- 정보 글자는 `muted`(#667085)까지. `disabled`(#98A2B3)는 잠금 전용.
- 터치 영역 **모바일 44×44 예외 없음 / PC 32×32**.

## 범위 (2026-09-03 축소)

시안 61화면 중 **12장을 만들지 않는다** — h17 h19 h20 h21b h22 h23 h24 h25 h31 h32 h38 h39
(+ f02 h15 m10). 사실 확인 카드·선택 칩 질문·재판정·상대 주장 비교·변경 이력·판정 카드의
파란 강조 박스·분석 단계 표시·실패 경로(발송 실패만 남김)가 함께 빠졌다.
영상 분석 결과는 항목 카드가 아니라 **요약 텍스트**로 보여 준다.

이유와 전체 목록은 `docs/handoff/04_기획변경.md`.
