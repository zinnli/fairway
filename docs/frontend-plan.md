# 프론트엔드 기술 제안 — 카-디펜더

2026-08-28 작성 · 프론트 담당(현진) 기준 · 심사 9/7~9/11 (남은 개발 기간 실질 9일)

디자인 핸드오프 `00`~`03` 문서와 `10_디자인.html`(61화면)을 읽고 정리했다.
전제: **백엔드·AI는 스펙만 확정, 구현은 나중.** 최악의 경우 프론트 단독으로 시연까지 가능해야 한다.

> **2026-09-03 범위 축소.** 이 문서는 8/28 시점의 판단 근거다. 스택·구조·반응형 결론은 그대로 유효하지만,
> **만들 기능의 목록은 `docs/handoff/04_기획축소_0903.md`가 정본이다.** 아래에서 축소분이 닿는 곳에는
> `9/3` 표시를 달아 뒀다. 표시가 없는 절(1~4·7·9)은 바뀌지 않았다.

---

## 0. 결론 3줄

1. **Vite + React + TypeScript SPA**가 맞다. Next를 뺀 판단은 옳고, 뒤집힐 조건은 4절에 적어 뒀다.
2. **61화면을 61개로 만들면 진다.** 실제로는 라우트 5개 + 레이아웃 3개 + 채팅 카드 10종(9/3 축소 뒤) + 상태머신 1개다.
3. **백엔드가 없어도 시연은 완결된다.** 목이 서버와 같은 계약을 브라우저 안에서 구현한다 —
   화면은 둘을 구분하지 못한다. 사건을 보려면 **반드시 로그인**하고(9/5 확정),
   목은 자격을 보지 않지만 로그인은 거쳐야 한다.

> **9/5 — 이 문서의 6절은 백엔드 명세(`docs/handoff/05_API_명세서.md`)를 받고 다시 썼다.**
> MSW·Dexie는 쓰지 않는다. 계약도 이벤트 구동으로 바뀌었다.

---

## 1. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 빌드 | **Vite 8 + React 19 + TypeScript** | SSR 이득이 없는 도구형 SPA. HMR이 빨라 61화면 이식에 유리 |
| 라우팅 | **React Router v8** (declarative 모드) | 라우트가 5개뿐. 파일 기반 라우팅이 필요 없다 |
| 상태 | **Zustand 5** (사건 도메인 스토어) + `useReducer`(채팅) | 채팅은 append-only 로그라 reducer가 정본. 서버 상태가 아직 없으니 TanStack Query는 보류(6절) |
| 스타일 | **Tailwind 4** (`@theme`로 디자인 토큰) | 5,600개 인라인 스타일을 옮기는 작업이라 유틸리티가 가장 빠르다. 토큰 매핑은 7절 |
| 폼 | **React Hook Form + Zod** | 로그인·회원가입·반박의견서 받는이. 검증 규칙이 명세에 이미 글로 있음 |
| 목 | **`src/api/mock/`** — 서버와 같은 계약을 브라우저 안에서 구현 | 네트워크를 가로채는 대신 계약을 구현한다. MSW가 필요 없다 (6절) |
| 로컬 저장 | **없음 (메모리)** | 목 데이터는 새로고침하면 시드로 돌아간다. 영속화가 필요해지면 그때 넣는다 |
| 아이콘 | 디자인 파일의 **인라인 SVG 추출** → 자체 `<Icon>` | 20×20 그리드·1.5px·`currentColor` 규격이 이미 고정. 아이콘 라이브러리를 넣으면 규격이 깨진다 |
| 폰트 | **Pretendard 로컬 번들** (`woff2` + `@font-face`) | `00` 문서 6절 지시. CDN이 막히면 심사 중에 글꼴이 통째로 바뀐다 |
| 애니메이션 | **CSS transition만** | 움직임이 "카드 등장 150ms / 아래→위 8px"과 "점 깜빡임" 둘뿐. framer-motion은 과하다 |
| 테스트 | ~~Vitest + Playwright~~ **미도입 (9/6)** | 계획했지만 시간이 없어 넣지 못했다. 시연 한 줄기는 손으로 확인한다 (12절) |
| 배포 | **Vercel** | 4절 참고 |
| 개발 루프 | ~~Agentation~~ **미도입** | 3절 — 시험해 보고 넣지 않았다. `10_디자인.html`을 직접 대조했다 |

### 안 넣는 것
- **framer-motion / GSAP** — 위 참고
- **아이콘 라이브러리(lucide 등)** — 디자인 SVG가 정본
- **UI 킷(shadcn/MUI)** — 디자인이 완결돼 있어 오히려 걷어내는 비용이 든다. **Radix Primitives**도 검토했지만 넣지 않았다 — `components/ui/Dialog.tsx`에 포커스 트랩·Esc·스크롤 잠금을 직접 넣었다(9절)
- **상태관리 대작(Redux Toolkit)** — 스토어 하나로 끝난다

---

## 2. 스타일링: Tailwind로 가되, 토큰부터 심는다

디자인 파일은 순수 인라인 스타일이다(`style=` 5,603곳 / `class=` 1,006곳). 즉 **Tailwind로 간다 = 인라인 스타일을 유틸리티로 옮긴다**는 뜻이고, 이건 기계적인 작업이라 AI 에이전트가 잘하는 영역이다. 다만 **토큰을 먼저 심어야** 에이전트가 `#4D33DF` 같은 날 hex를 뿌리지 않는다.

`src/styles/theme.css`:

```css
@import "tailwindcss";

@theme {
  /* 색 — 11_DesignSystem.html 정본 */
  --color-brand:        #4D33DF;   /* 주 행동·상대 몫 */
  --color-brand-press:  #3D28B8;   /* 호버·눌림 */
  --color-brand-tint:   #EEEBFC;   /* 내 말풍선·초점 링 */
  --color-brand-line:   #CFC7F7;   /* 보조 버튼 호버 테두리·비율 막대 */
  --color-ink:          #191D26;   /* 본문 */
  --color-ink-2:        #344054;
  --color-ink-3:        #475467;
  --color-muted:        #667085;   /* 정보 글자 — 여기까지만 */
  --color-disabled:     #98A2B3;   /* 잠금 전용. 정보 글자에 쓰지 말 것 */
  --color-line:         #E4E7EC;
  --color-line-2:       #EFF1F4;
  --color-surface:      #FFFFFF;
  --color-bg:           #F6F7F9;
  --color-bg-2:         #F0F2F5;   /* 잠금 배경·아이콘 호버 */
  --color-teal:         #0D9488;   /* [내가 말한 것] */
  --color-sand:         #B98A2E;   /* [확인 필요] */
  --color-sand-text:    #8F5B0B;

  /* 반경 */
  --radius-sm: 8px;  --radius-md: 12px;  --radius-lg: 16px;

  /* 폰트 */
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, sans-serif;
}

/* 간격 — Tailwind 4의 기본 --spacing이 0.25rem(=4px)이라 p-3=12px, gap-2=8px으로
   스케일 유틸리티만 쓰면 4의 배수가 자동으로 지켜진다. 명시해 두면 rem 환경 변화에도 안전 */
@theme { --spacing: 4px; }

@layer base {
  html { word-break: keep-all; }              /* 00 문서 6절: 전역으로 */
  .tnum { font-variant-numeric: tabular-nums; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
  }
}
```

스케일 유틸리티(`p-3`=12px, `gap-2`=8px)만 쓰면 **4의 배수 규칙이 자동으로 지켜진다.** 검수에서 1,383곳을 고쳤다는 그 규칙이 도구 차원에서 강제되는 셈이고, 이게 이번 프로젝트에서 Tailwind를 쓰는 가장 큰 실익이다.

**대신 임의값(`p-[13px]`, `gap-[6px]`)을 금지해야 한다.** ESLint 규칙 하나로 막거나, 최소한 팀 규칙으로 못 박아 둔다. 예외는 `00` 문서가 인정한 셋뿐 — 6px 색점 · 비율 막대 h8/h10 · 1px 선.

### 상호작용 상태(`scp0`~`scp5`)는 유틸리티가 아니라 **컴포넌트 변형**으로
`00` 문서 3-1의 표는 이미 완성된 정본이다. 클래스 이름은 버리되 **값은 그대로** 옮긴다.

```tsx
// src/components/ui/Button.tsx
const styles = {
  primary:   'bg-brand text-white hover:bg-brand-press active:bg-brand-press ' +
             'active:shadow-[inset_0_2px_4px_rgba(0,0,0,.18)]',            // scp1
  secondary: 'bg-white border border-line hover:bg-bg hover:border-brand-line ' +
             'active:bg-brand-tint',                                        // scp0
  icon:      'hover:bg-bg-2 rounded-lg min-h-8 min-w-8',                    // scp3
} as const;

// 전역 base에 초점 정본 1회
// :focus-visible { outline: 2px solid var(--color-brand); outline-offset: 2px }
// 입력칸만 예외: border 1.5px brand + ring 3px brand-tint
```

> **잠금은 `opacity`가 아니라 색 교체다.** `disabled:bg-bg-2 disabled:text-disabled`.
> `opacity-40`을 쓰면 정의에 없는 연보라가 생긴다(검수에서 31곳 고친 항목).

---

## 3. ~~Agentation을 쓰는 자리~~ — 넣지 않았다 (9/6)

> 아래는 8/28 시점의 검토 기록이다. 실제로는 도입하지 않았고, `png/`도 9/4에 지웠다.

[Agentation](https://www.agentation.com/)은 브라우저 오버레이로 요소를 클릭해 코멘트를 달면, **CSS 셀렉터 + 파일 경로 + 컴포넌트 계층**을 묶은 컨텍스트로 만들어 AI 에이전트(Claude Code / Cursor)에 넘겨 주는 도구다. MCP 연동이 되면 복붙 없이 실시간으로 넘어간다. 무료이고 `pnpm add -D agentation`으로 붙인다.

**쓸 자리는 "초안 이식"이 아니라 "픽셀 맞추기"다.**

- 잘 맞는 곳: 61화면을 1차로 옮긴 뒤 `png/` 렌더 이미지와 대조하며 "이 여백 4px 더", "이 배지 색이 muted가 아니라 ink-2" 같은 **잔손질을 한 번에 모아 던질 때.** 이 단계가 실제로 가장 오래 걸리는 구간이라 효과가 크다.
- 안 맞는 곳: 도메인 상태·타입 설계. 여긴 화면을 클릭해서 지시할 수 있는 일이 아니다.
- 주의: 해커톤 중에 처음 쓰는 도구를 도입하는 위험이 있으니 **D1에 5분만 붙여 보고, 안 되면 미련 없이 버린다.** → **버렸다.**

---

## 4. Next.js를 빼는 판단 — 맞다. 단, 뒤집히는 조건 3가지

**맞는 이유**
- 로그인 뒤에서 쓰는 도구다. SEO·OG·초기 렌더 속도가 평가 항목이 아니다.
- 화면이 전부 채팅형 클라이언트 상태다. 서버 컴포넌트로 얻을 게 없고, 오히려 `'use client'` 경계를 관리하는 비용만 는다.
- 심사 기준은 "주소를 열면 동작한다"이고, SPA로 충분하다.

**뒤집히는 조건 (하나라도 걸리면 Next 또는 서버리스 함수 1개가 필요)**

| 조건 | 왜 | 대안 |
|---|---|---|
| AI API 키를 프론트에서 직접 부른다 | 키가 번들에 노출됨. 심사에서 지적당하기 딱 좋다 | 백엔드가 프록시하거나, Vercel Functions 1개만 두기 |
| 반박의견서를 **진짜로** 메일 발송한다 (4.3 ★) | SMTP는 브라우저에서 못 한다 | EmailJS(클라이언트 가능) 또는 함수 1개. 시연은 **모의 발송 권장** |
| 영상을 S3에 직접 올린다 | presigned URL 발급에 서버가 필요 | 목 시연은 브라우저 로컬(`URL.createObjectURL`), 서버는 멀티파트 1단계(명세 §8.2) |

→ **권고:** 지금은 Vite로 간다. 위 조건이 생기면 Vercel Functions 파일 하나를 추가하면 되고, 그때도 프레임워크를 갈아엎을 필요는 없다.

**배포는 Vercel.** 이유: 무료, `git push` 한 번, 프리뷰 URL로 팀 공유, 심사 기간(9/7~9/11) 내내 켜 두기 가장 안전. 백엔드가 AWS로 확정돼도 프론트만 Vercel에 두고 CORS로 붙이면 된다. **9/6까지 프로덕션 배포를 고정하고, 그 뒤엔 핫픽스만.**

---

## 5. 아키텍처 — 61화면을 61개로 만들지 않는 법

`01_화면색인.md`의 61화면을 훑어보면 **대부분이 "같은 셸 안에서 채팅에 카드가 하나 더 붙은 상태"**다. H16(분석 중) → 분석 요약 → 되묻기 → H21(판정)은 서로 다른 화면이 아니라 **같은 화면의 시간축 위 네 지점**이다. `00` 문서 6절도 못 박아 뒀다: **"대화는 추가만, 삭제 없음."**

### 라우트는 5개

```
/                     S0 첫 화면              h01
/login                S1                     h02 h03
/signup               S2 (+ P-6 팝업)         h04 h05 h40
/cases                S3 사건 목록           h08 h09 h10 h11 f05
/cases/:caseId        S4 작업 화면 ★          나머지 40여 화면 전부
```

`/cases/:caseId` 하나가 h12~h37 + f01·f03·f04 + m05~m13을 전부 흡수한다.
(**9/3** — h17 h19 h20 h21b h22 h23 h24 h25 h31 h32 h38 h39와 f02·m10은 범위에서 빠졌다.)

온보딩 3단(h06 h06b h07)은 처음에 `/onboarding` 라우트로 뒀다가 **모달로 옮겼다.**
라우트로 두면 뒤에 사이드바를 가짜로 그려 넣어야 했고, 사건이 0개일 때만 뜨는 것이라
"어디에 있는가"보다 "언제 뜨는가"가 본질이었다. 지금은 사건 목록이 비면 그 위에 뜬다.

S5(경위서 전문 h30)·S6(반박의견서 h33·h34)도 라우트가 아니라 **가운데 모달**이다
(시안의 딤 + `width:760/640` 패널). 좁은 화면에서 사이드바(m04)와 현황판(m09)만 서랍·시트로 나온다.

### 채팅 메시지 = 판별 유니온 (이 프로젝트의 심장)

```ts
// src/domain/message.ts — 9/3 축소 반영 (15종 → 10종). id·at은 Base가 갖는다
export type ChatMessage = Base & (
  | { role: 'user' | 'ai'; kind: 'text'; text: string; cta?: TextCta }  // 분석 요약·질문·답이 전부 여기로
  | { role: 'user'; kind: 'video'; video: VideoRef }
  | { role: 'ai'; kind: 'guide' }                                       // h12 안내 카드
  | { role: 'ai'; kind: 'uploading'; fileName: string; sizeBytes: number; progress: number }  // h14
  | { role: 'ai'; kind: 'analyzing'; phase?: 'analysis' | 'verdict'; done?: boolean }         // h16
  | { role: 'ai'; kind: 'verdict'; verdict: Verdict }                   // h21
  | { role: 'ai'; kind: 'statementDraft'; doc: Statement }              // h26
  | { role: 'ai'; kind: 'rebuttalDraft'; doc: Rebuttal }                // h28
  | { role: 'ai'; kind: 'sent'; to: string }                            // h29
  | { role: 'ai'; kind: 'nextSteps'; steps?: string[] }                 // f04
);
```

**9/3에 빠진 kind** — `choice`(선택 칩) · `facts`(h18) · `question`(칩 질문) · `rejudging`(h24) · `error`(발송 실패는 팝업으로만).

`kind`마다 카드 컴포넌트 하나 → **10종.** 여기에 팝업 4종(P-1 · P-3 · P-5 발송 실패 · P-6)과 서류 모달 2종을 더하면 **실제로 만들 UI는 16개 남짓**이다. 61이 아니라.

```tsx
// 채팅 렌더링은 이 한 줄로 끝난다
{messages.map(m => <MessageCard key={m.id} message={m} />)}
```

### 폴더 구조

> 아래는 **9/6 기준 실제 구조**다. 계획 당시 잡았던 `app/`·`mocks/`·`domain/fact.ts`는 쓰지 않았다
> (라우터는 `App.tsx` 하나로 충분했고, 목은 MSW 대신 계약 구현이며, `Fact`는 9/3에 빠졌다).

```
src/
  App.tsx         라우트 5개 + 세션 배선
  domain/         타입 정본 — case.ts message.ts verdict.ts document.ts
  store/          caseStore.ts (zustand) · chatReducer.ts · sessionStore.ts
  api/            service.ts (계약) · index.ts (교체 지점) · mock/ · http/     ← 6절
  pages/          HomePage LoginPage SignupPage CasesPage CaseWorkspacePage
                  DesignSystemPage (개발 서버에서만)
  features/
    auth/         AuthCard AgreementRow TermsDialog PasswordResetDialog
                  NewPasswordForm RequireSession terms.ts
    cases/        Sidebar CaseRow
    onboarding/   OnboardingModal slides mocks
    workspace/    ChatHeader Composer StatusPanel MobileBar SampleVideoPicker
      messages/   MessageItem GuideCard AnalyzingCard VerdictCard DocumentCards
                  AiMessage UserBubble Attachment (kind 10종 · 9/3)
      dialogs/    GroundDialogs(P-1) AlertDialogs(P-3·P-5) VideoDialog(f01)
    documents/    StatementDialog(S5) RebuttalDialog(S6)
  components/ui/  Button Badge RatioBar StepDots StageIcon Drawer Dialog
                  ConfirmDialog Field Icon Disclaimer BrandMark
  lib/            cn format(formatRatio) document zodResolver
  styles/         theme.css
  config.ts       팀 미확정 값
```

### 현황판·사이드바는 이미 컴포넌트로 표시돼 있다
`10_디자인.html`에 `data-sc-name="HiSidebar"`(26회) / `data-sc-name="HiStatus"`(25회)가 붙어 있다.
**이 두 개를 가장 먼저, 가장 정확하게 만들면 26·25화면이 동시에 끝난다.** `12_컴포넌트_시트.html`의 사이드바 12상태 / 현황판 18상태가 그대로 이 두 컴포넌트의 props 조합이다.

---

## 6. 계약과 목 (9/5 — 백엔드 명세 반영)

### 화면이 아는 것은 `src/api/service.ts` 하나뿐이다

`docs/handoff/05_API_명세서.md`를 받고 계약을 다시 그렸다. 예전 `Api`와 두 군데가 **근본적으로** 다르다.

1. **분석·판정을 부르지 않는다.** 영상을 올리거나 글을 보내면 서버가 알아서 Job을 돌리고
   결과는 SSE로만 온다. `analyze()`·`answerQuestion()`·`judge()`가 사라지고 `subscribe()`가 들어왔다.
2. **카드를 화면이 만들지 않는다.** 서버가 만들어 밀어 준다.
   화면이 세우는 것은 **업로드 중·분석 중 두 장**뿐이고 로그에 남지 않는다.

```ts
// src/api/service.ts — 화면은 이 인터페이스만 안다 (도메인 타입만 오간다)
uploadVideo(caseId, file, onProgress): Promise<UploadResult>;
sendMessage(caseId, text): Promise<ChatMessage>;      // 내가 친 글 한 장만 돌아온다
subscribe(caseId, { message, caseUpdated, ... }): () => void;
```

### 층을 둘로 가른다

```
src/api/
  service.ts          계약 — 화면이 아는 유일한 인터페이스
  http/
    client·dto·endpoints·sse   전송(api 로직). 도메인을 모른다
    map.ts                      ★ 경계 — DTO↔도메인을 아는 유일한 파일
    index.ts                    service 구현
  mock/               같은 계약의 브라우저 구현
  index.ts            교체 지점 한 줄 (VITE_API=http)
```

`endpoints/`는 도메인 타입을 import하지 않고, 화면은 DTO를 볼 수 없으며, 경로 문자열은 `endpoints/`에만 있다.

### MSW도 Dexie도 쓰지 않는다

계획 단계에서는 네트워크를 가로채는 목(MSW)과 영속화(Dexie)를 잡아 뒀는데, 실제로는 둘 다 넣지 않았다.

- **MSW 대신 계약 구현** — 목이 `CaseService`를 그대로 구현한다. 가로챌 네트워크가 없으니
  레이어가 하나 줄고, 화면은 목과 서버를 구분하지 못한다.
  `package.json`의 msw는 **테스트용으로 남겨 둔다**(9/5 결정) — 지금은 핸들러가 없고 패키지만 있다.
  서버가 붙은 뒤 http 계층을 시험할 때 네트워크를 가로채는 쪽이 필요해질 수 있다.
- **Dexie 대신 메모리** — 목 데이터는 새로고침하면 시드로 돌아간다.
  재방문 플로우(F6)를 목에서 끝까지 보려면 한 번에 이어서 봐야 한다. 서버가 붙으면 저절로 해결된다.

### 로그인은 필수다 (9/5 확정)

한동안 "심사위원이 주소만 열면 로그인 없이 쓸 수 있어야 한다"를 전제로 잡고 있었는데,
**요강에서 그런 요건을 확인하지 못해 뺐다.** 지금은 단순하다 — 사건을 보려면 로그인한다.
심사위원에게는 안내에 계정을 함께 적어 준다.

- `/cases` 아래는 `RequireSession`이 지킨다. 확인하는 동안(`checking`)은 아무것도 그리지 않는다 —
  확인 전에 보내면 새로고침할 때마다 로그인 화면으로 한 번 튕겼다 돌아온다.
- 나가는 방식에 따라 가는 곳이 다르다: **눌러서 나가면 첫 화면(F05), 쓰다가 풀리면 로그인 화면.**
  길을 옮기는 쪽과 세션을 내리는 쪽이 경쟁하지 않게 가드 한 곳에서만 정한다.
- 로그인 화면으로 보낼 때는 원래 가려던 곳을 들려 보낸다.
- **목도 로그인을 거치게 한다.** 자격은 보지 않지만(아무 이메일·8자 비밀번호) 거치기는 거쳐야 한다 —
  그러지 않으면 목으로 도는 동안 가드가 아무것도 막지 못한다. 세션은 브라우저에 적어 둬서 새로고침해도 남는다.

> `VITE_API=mock`으로 배포하면 백엔드 없이도 전 구간이 돈다. 실서버가 붙으면 환경변수만 바꾼다.

---

## 7. 반응형 4구간 — 서랍 하나를 돌려쓴다

| 폭 | 사이드바 | 현황판 | 시안 |
|---|---|---|---|
| 1920~1280 | 고정 `flex 0 0 260px` | 고정 `flex 0 0 340px` | 있음 (1440 기준) |
| 1280~1024 | 고정 260 | **오른쪽 서랍** + 머리글 [현황] | 없음 ★ |
| 1023~768 | **왼쪽 서랍** + [사건] | 오른쪽 서랍 + [현황] | 없음 ★ |
| ~767 | 서랍 | **바텀시트** (m09) | m01~m13 |

```tsx
// 셸 하나로 네 구간을 다 받는다
<div className="flex h-dvh">
  <Panel side="left"  breakpoint="lg" className="w-65">  <Sidebar /></Panel>
  <main className="flex-1 flex flex-col min-w-0">        <ChatColumn /></main>
  <Panel side="right" breakpoint="xl" className="w-85">  <StatusPanel /></Panel>
</div>
```

`<Panel>`이 `breakpoint` 이상에서는 그냥 `<aside>`, 미만에서는 서랍(모바일에서는 바텀시트)으로 바뀐다. **컴포넌트 하나로 3개 구간의 접힘을 다 처리**한다.

### 반드시 지킬 것 (`00` 문서 3-2 — 여기서 제일 많이 터진다)
```css
/* 스크롤 컨테이너 3종 — min-height:0 이 없으면 입력바가 화면 밖으로 밀려난다 */
.chat-scroll, .panel-scroll, .doc-scroll { min-height: 0; overflow-y: auto; }
```
Tailwind로는 `min-h-0 overflow-y-auto`. **flex 자식마다 `min-w-0`도 같이** — 말풍선 `max-w-[560px] min-w-0`이 정본이다.
그리고 판정 화면은 900px에 여유가 **0px**이다. 문장 한 줄만 길어져도 스크롤이 걸리니, 목 데이터 문구를 함부로 늘리지 말 것.

`h-screen` 대신 **`h-dvh`** — 모바일 주소창 때문에 반드시.

---

## 8. 도메인 모델 — 먼저 확정할 타입

화면보다 이걸 먼저 잡아야 한다. `02_기능명세서.md` 2.x가 이미 분모 정의까지 못 박아 뒀다.

**9/3 —** `Fact` 계열(`FactSource` `FactKey` `Fact`)은 전부 빠졌다. 분석 결과는 글 한 덩이다.

```ts
export interface Ratio { mine: number; opponent: number }     // 규칙 0.1 — 항상 "나 : 상대"

export interface Verdict {
  ratio: Ratio;
  chartName: string; chartNo: string | null;                  // ★ 번호 미확정 (00 문서 5절)
  baseRatio: Ratio;
  adjustments: { label: string; delta: number }[];
  conclusion: string;
  precedents: Precedent[];                                    // 2~3건, 뒤집힌 사례 우선 (일치도 없음 · 9/3)
}                                                             // disputes · opponentClaim 제거 (9/3)

export type CaseStatus = '접수중' | '분석중' | '확인 필요' | '판정 완료' | '발송 완료' | '종결';
export type StageState = '대기' | '진행중' | '완료';
export interface Stages { analysis: StageState; verdict: StageState; statement: StageState; rebuttal: StageState }
```

~~**확정된 사실 카운트는 저장하지 말고 파생하라.**~~ → **9/3 폐기.** 사실을 세지 않는다.

**인정기준 도표 번호는 `null`로 두고 화면에서 조건부로 숨긴다.** 미확정 항목(`00` 문서 5절)이라 지어내면 안 된다. 도표 팝업(h38)은 9/3에 빠졌고, 근거 목록의 글 한 줄만 남는다.

---

## 9. 마크업·접근성 — 이식하면서 같이 해야 하는 일

디자인 파일은 **전부 `<div>`**다. `<button>` `<input>` `<a>`도, `aria-*` `role` `alt`도 없다. 나중에 하려고 미루면 61화면을 두 번 만지게 된다.

- `scp1`/`scp0`/`scp3` 자리 → `<button type="button">`. 사건 목록 행(`scp5`) → `<button>` 안에 제목, `⋯`는 **형제 버튼**(중첩 금지).
- 팝업 6종(P-1~P-6) → **포커스 트랩·Esc·스크롤 잠금**이 필요하다. Radix를 쓸까 했지만 결국 `components/ui/Dialog.tsx` 하나에 직접 넣고 전부 그걸 돌려썼다.
- 진행 띠 → `role="progressbar"` + `aria-valuenow/valuemin/valuemax`. `m05`·`m06`에 이미 `data-step`/`data-steps`/`aria-label`이 들어 있으니 **그 규칙을 나머지에 복사**하면 된다.
- 분석 중 표시 → `aria-live="polite"`. 채팅에 카드가 붙는 것도 마찬가지. (재판정 배너는 9/3에 빠졌다)
- 아이콘 버튼 → `aria-label` 필수(이름이 없는 버튼이 된다).
- 터치 영역 **모바일 44×44 예외 없음 / PC 32×32**. 보이는 아이콘 크기는 두고 감싼 상자만 키운다 → `min-h-11 min-w-11` (44px).

---

## 10. PDF와 메일 — 서버 없이 처리하는 법

**경위서 PDF (3.3, P0)**
- **1안(권장): 인쇄 CSS + `window.print()`.** 경위서 전문(`h30`, 560×900)이 이미 한 장짜리 문서 레이아웃이라 전용 `@media print` 시트를 붙이면 사용자가 "PDF로 저장"을 고를 수 있다. 한글이 폰트 그대로, 텍스트로 살아 있는 PDF가 나온다. 구현 반나절.
- **2안: `pdfmake` + Pretendard 임베딩.** 파일명(`사건경위서_사건제목_날짜.pdf`)까지 제어되지만 폰트 base64가 커지고 레이아웃을 다시 짜야 한다.
- **`html2canvas` + `jsPDF`는 쓰지 말 것.** 한글이 이미지로 뭉개지고 용량이 커진다. 심사에서 바로 티가 난다.
- ~~어느 쪽이든 실패 경로(`h32` P-5)는 만들어야 한다~~ → **9/3 제외.** PDF 실패 화면은 만들지 않는다.

**메일 발송 (4.3 ★ 팀 결정)**
- 시연은 **모의 발송 권장**: 1.5초 지연 후 성공, `h35` 확인 팝업 → `h29` 발송 완료. 실패 경로(`h36`)는 **9/3 축소 뒤 유일하게 남은 오류 화면**이므로 이것만은 만든다.
- 진짜로 보내야 한다면 **EmailJS**(브라우저에서 가능, 무료 티어)로 팀 메일함에 보낸다. 단 첨부 용량 제한이 있어 영상 첨부는 링크로 대체해야 한다.

---

## 11. 9일 일정 (8/28 금 ~ 9/6 일, **9/6 프로덕션 배포 고정** · 9/7부터 핫픽스만)

| 날짜 | 할 일 | 끝났다는 기준 |
|---|---|---|
| **8/28 (금)** | Vite+TS 세팅 · Tailwind `@theme` 토큰 · Pretendard 로컬 번들 · `<Icon>` 추출 · Button/Badge/Dialog · Agentation 5분 시험 | `11_DesignSystem.html`을 우리 컴포넌트로 재현한 페이지가 뜬다 |
| **8/29 (토)** | `domain/` 타입 전부 · `api/` 계약 · 목 뼈대 · 시드 데이터 | `listCases()`가 시드를 돌려준다 |
| **8/30 (일)** | **Sidebar(12상태) + StatusPanel(18상태)** · WorkspaceLayout · `<Panel>` 서랍 | 1920/1280/1024/768/375에서 셸이 안 깨진다 |
| **8/31 (월)** | 채팅 카드 1차 8종 — guide/uploading/analyzing/error/facts/question/video/text | h12~h20b가 화면에 뜬다 |
| **9/1 (화)** | 채팅 카드 2차 7종 — verdict/rejudging/statementDraft/rebuttalDraft/sent/nextSteps · 팝업 P-1·P-2 | h21·h25·h37·h38이 뜬다 |
| **9/2 (수)** | **상태머신 연결** — 업로드→분석→질문→판정→재판정 자동 진행 · 이력 기록 | 영상을 올리면 아무것도 안 눌러도 판정까지 간다 |
| **9/3 (목)** | 경위서(S5) · 반박의견서(S6) · PDF · 발송 확인/완료/실패 · 잠금 규칙(4.1) | 발송 완료까지 한 줄기가 끊기지 않는다 |
| **9/4 (금)** | 첫 화면·로그인·회원가입·약관 팝업·온보딩·사건 목록/빈 상태/이름 바꾸기/삭제 | 라우트 5개가 다 채워진다 |
| **9/5 (토)** | **모바일 m01~m13** · 바텀시트 · 진행 띠 · 접근성(포커스·aria·44px) | 아이폰 실기기에서 전 구간 통과 |
| **9/6 (일)** | `10_디자인.html`과 대조 · 문구 검수 · 시연 타이밍 조절 · **프로덕션 배포 고정** | 심사용 URL이 살아 있다 |
| 9/7~ | 핫픽스만. 새 기능 금지 | |

**우선순위가 밀리면 버리는 순서**: `h39` 변경 이력 팝업(P1) → `f01` 영상 뷰어 → `h10/h11` 이름 바꾸기·삭제 → `h03/h05` 로그인 오류 → 모바일 세부.
**절대 못 버리는 것**: F1→F5 한 줄기 · 규칙 0.1(나 : 상대) · 0.2(참고용 고지).

---

## 12. 리스크와 대비

| 리스크 | 대비 |
|---|---|
| **시연 중 플로우가 끊긴다** | Playwright로 "새 사건→영상→분석→질문 2개→판정→경위서→발송" 1개만 E2E로 짜 둔다. 배포 전마다 돌린다. 30분 투자로 가장 큰 보험 |
| **인정기준 도표 번호 미정** (`00` 5절) | `chartNo: null`이면 번호 칸을 숨기는 UI. 5화면 동시 대응. 확정되면 시드 한 줄 |
| **1280·1024·768 시안 없음** | 8/30에 만들고 **바로 디자인 담당(현)에게 스크린샷 확인**. 나중에 발견하면 재작업 |
| **접수번호 필수 여부 미확정** (4.1 ★) | 상수 `REQUIRE_CLAIM_NO`로 빼 둔다. 팀 결정이 뒤집혀도 한 줄 |
| **서비스 이름 미확정** | "카-디펜더"를 `APP_NAME` 상수로. 로고·머리글·메일 제목이 다 여기서 나오게 |
| **CDN 폰트가 막힌다** | D1에 로컬 번들. 이건 미루면 안 된다 |
| ~~**Agentation이 안 맞는다**~~ | **해소** — 안 맞아서 넣지 않았다 (3절) |

---

## 13. 팀에 지금 물어봐야 할 것

1. **AI API 키를 프론트가 직접 쓰는가?** (예 → Vercel Functions 프록시 1개 필요, 4절)
2. **메일은 진짜 발송인가 모의인가?** (4.3 ★ — 모의를 권함)
3. ~~**로그인 범위**~~ — **9/5 해소.** 로그인 필수로 정했다. 심사위원에게는 계정을 알린다
4. **접수번호 필수** 여부 (4.1 ★)
5. **서비스 이름** — 9/4 전에는 확정 필요 (메일 제목·로고에 박힌다)
6. **인정기준 도표 번호** — 9/2 전에 받으면 재작업 없이 들어간다

---

작성: 프론트 담당. 값이 어긋나면 `10_디자인.html` → `11_DesignSystem.html` → `02`/`03` 순으로 믿는다(`00` 문서 2절).
