# 프론트엔드 기술 제안 — 카-디펜더

2026-08-28 작성 · 프론트 담당(현진) 기준 · 심사 9/7~9/11 (남은 개발 기간 실질 9일)

디자인 핸드오프 `00`~`03` 문서와 `10_디자인.html`(61화면)을 읽고 정리했다.
전제: **백엔드·AI는 스펙만 확정, 구현은 나중.** 최악의 경우 프론트 단독으로 시연까지 가능해야 한다.

---

## 0. 결론 3줄

1. **Vite + React + TypeScript SPA**가 맞다. Next를 뺀 판단은 옳고, 뒤집힐 조건은 4절에 적어 뒀다.
2. **61화면을 61개로 만들면 진다.** 실제로는 라우트 6개 + 레이아웃 3개 + 채팅 카드 ~22종 + 상태머신 1개다.
3. **백엔드가 없어도 시연은 완결된다.** MSW + Dexie(IndexedDB)로 "브라우저별 독립 체험"을 만들면
   기능명세 6.3(심사위원이 주소만 열면 바로 쓸 수 있어야 함 · **P0**)이 로그인 서버 없이 그대로 충족된다.

---

## 1. 기술 스택

| 영역 | 선택 | 이유 |
|---|---|---|
| 빌드 | **Vite 8 + React 19 + TypeScript** | SSR 이득이 없는 도구형 SPA. HMR이 빨라 61화면 이식에 유리 |
| 라우팅 | **React Router v8** (declarative 모드) | 라우트가 6개뿐. 파일 기반 라우팅이 필요 없다 |
| 상태 | **Zustand 5** (사건 도메인 스토어) + `useReducer`(채팅) | 채팅은 append-only 로그라 reducer가 정본. 서버 상태가 아직 없으니 TanStack Query는 보류(6절) |
| 스타일 | **Tailwind 4** (`@theme`로 디자인 토큰) | 5,600개 인라인 스타일을 옮기는 작업이라 유틸리티가 가장 빠르다. 토큰 매핑은 7절 |
| 폼 | **React Hook Form + Zod** | 로그인·회원가입·반박의견서 받는이. 검증 규칙이 명세에 이미 글로 있음 |
| 목 서버 | **MSW 2** + 시나리오 타임라인 | 실서버 교체 지점을 한 곳으로 (6절) |
| 로컬 저장 | **Dexie 4 (IndexedDB)** | 사건·영상·이력 영속화. 새로고침·재방문 플로우(F6)가 진짜로 동작함 |
| 아이콘 | 디자인 파일의 **인라인 SVG 추출** → 자체 `<Icon>` | 20×20 그리드·1.5px·`currentColor` 규격이 이미 고정. 아이콘 라이브러리를 넣으면 규격이 깨진다 |
| 폰트 | **Pretendard 로컬 번들** (`woff2` + `@font-face`) | `00` 문서 6절 지시. CDN이 막히면 심사 중에 글꼴이 통째로 바뀐다 |
| 애니메이션 | **CSS transition만** | 움직임이 "카드 등장 150ms / 아래→위 8px"과 "점 깜빡임" 둘뿐. framer-motion은 과하다 |
| 테스트 | Vitest 최소 + **Playwright 데모 플로우 1개** | 시연 한 줄기가 끊기지 않는지만 자동으로 확인 (12절) |
| 배포 | **Vercel** | 4절 참고 |
| 개발 루프 | **Agentation** (MCP 연동) | 3절 참고 |

### 안 넣는 것
- **framer-motion / GSAP** — 위 참고
- **아이콘 라이브러리(lucide 등)** — 디자인 SVG가 정본
- **UI 킷(shadcn/MUI)** — 디자인이 완결돼 있어 오히려 걷어내는 비용이 든다. 단, **Radix Primitives**는 예외로 검토할 값어치가 있다(9절: 팝업 6종의 포커스 트랩)
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

## 3. Agentation을 쓰는 자리

[Agentation](https://www.agentation.com/)은 브라우저 오버레이로 요소를 클릭해 코멘트를 달면, **CSS 셀렉터 + 파일 경로 + 컴포넌트 계층**을 묶은 컨텍스트로 만들어 AI 에이전트(Claude Code / Cursor)에 넘겨 주는 도구다. MCP 연동이 되면 복붙 없이 실시간으로 넘어간다. 무료이고 `pnpm add -D agentation`으로 붙인다.

**쓸 자리는 "초안 이식"이 아니라 "픽셀 맞추기"다.**

- 잘 맞는 곳: 61화면을 1차로 옮긴 뒤 `png/` 렌더 이미지와 대조하며 "이 여백 4px 더", "이 배지 색이 muted가 아니라 ink-2" 같은 **잔손질을 한 번에 모아 던질 때.** 이 단계가 실제로 가장 오래 걸리는 구간이라 효과가 크다.
- 안 맞는 곳: 도메인 상태·타입 설계. 여긴 화면을 클릭해서 지시할 수 있는 일이 아니다.
- 주의: 해커톤 중에 처음 쓰는 도구를 도입하는 위험이 있으니 **D1에 5분만 붙여 보고, 안 되면 미련 없이 버린다.** 대안은 `png/` 이미지를 그냥 에이전트에 첨부하는 것으로 충분하다.

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
| 영상을 S3에 직접 올린다 | presigned URL 발급에 서버가 필요 | 시연은 브라우저 로컬 보관(`URL.createObjectURL` + Dexie)으로 충분 |

→ **권고:** 지금은 Vite로 간다. 위 조건이 생기면 Vercel Functions 파일 하나를 추가하면 되고, 그때도 프레임워크를 갈아엎을 필요는 없다.

**배포는 Vercel.** 이유: 무료, `git push` 한 번, 프리뷰 URL로 팀 공유, 심사 기간(9/7~9/11) 내내 켜 두기 가장 안전. 백엔드가 AWS로 확정돼도 프론트만 Vercel에 두고 CORS로 붙이면 된다. **9/6까지 프로덕션 배포를 고정하고, 그 뒤엔 핫픽스만.**

---

## 5. 아키텍처 — 61화면을 61개로 만들지 않는 법

`01_화면색인.md`의 61화면을 훑어보면 **대부분이 "같은 셸 안에서 채팅에 카드가 하나 더 붙은 상태"**다. H16(분석 중) → H18(사실 확인) → H20(질문) → H21(판정)은 서로 다른 화면이 아니라 **같은 화면의 시간축 위 네 지점**이다. `00` 문서 6절도 못 박아 뒀다: **"대화는 추가만, 삭제 없음."**

### 라우트는 6개

```
/                     S0 첫 화면              h01
/login                S1                     h02 h03
/signup               S2 (+ P-6 팝업)         h04 h05 h40
/onboarding           온보딩 3단             h06 h06b h07
/cases                S3 사건 목록           h08 h09 h10 h11 f05
/cases/:caseId        S4 작업 화면 ★          나머지 40여 화면 전부
```

`/cases/:caseId` 하나가 h12~h39 + f01~f04 + m05~m13을 전부 흡수한다.
S5(경위서 전문)·S6(반박의견서)는 라우트가 아니라 **오른쪽 서랍/모달**이다(`?doc=statement` 같은 검색 파라미터로 열면 뒤로가기까지 공짜로 얻는다).

### 채팅 메시지 = 판별 유니온 (이 프로젝트의 심장)

```ts
// src/domain/message.ts
export type ChatMessage =
  | { id: string; role: 'user';  kind: 'text';      text: string }
  | { id: string; role: 'user';  kind: 'video';     file: VideoRef }
  | { id: string; role: 'user';  kind: 'choice';    label: string; forField: FactKey }
  | { id: string; role: 'ai';    kind: 'guide' }                       // h12 안내 카드
  | { id: string; role: 'ai';    kind: 'uploading'; progress: number } // h14
  | { id: string; role: 'ai';    kind: 'analyzing'; step: string }     // h16
  | { id: string; role: 'ai';    kind: 'error';     code: ErrorCode; retry: RetryAction } // 0.7
  | { id: string; role: 'ai';    kind: 'facts';     facts: Fact[] }    // h18
  | { id: string; role: 'ai';    kind: 'question';  field: FactKey; chips: Chip[] } // h20 h20b
  | { id: string; role: 'ai';    kind: 'verdict';   verdict: Verdict } // h21 h25
  | { id: string; role: 'ai';    kind: 'rejudging'; from: Ratio }      // h24
  | { id: string; role: 'ai';    kind: 'statementDraft';  doc: Statement }  // h26
  | { id: string; role: 'ai';    kind: 'rebuttalDraft';   doc: Rebuttal }   // h28
  | { id: string; role: 'ai';    kind: 'sent';      at: string; to: string } // h29
  | { id: string; role: 'ai';    kind: 'nextSteps' };                  // f04
```

`kind`마다 카드 컴포넌트 하나 → **약 15종.** 여기에 팝업 6종(P-1~P-6)과 서류 화면 2종을 더하면 **실제로 만들 UI는 25개 남짓**이다. 61이 아니라.

```tsx
// 채팅 렌더링은 이 한 줄로 끝난다
{messages.map(m => <MessageCard key={m.id} message={m} />)}
```

### 폴더 구조

```
src/
  app/            router.tsx, providers.tsx
  domain/         타입 정본 — case.ts message.ts fact.ts verdict.ts document.ts
  store/          caseStore.ts (zustand)  ·  chatReducer.ts
  api/            index.ts (계약)  ·  mock/  ·  http/     ← 교체 지점 (6절)
  features/
    auth/         LoginPage SignupPage TermsDialog
    cases/        CaseListPage CaseCard RenameDialog DeleteDialog
    workspace/    WorkspaceLayout  Sidebar  StatusPanel  ChatColumn  Composer
      messages/   GuideCard UploadingCard AnalyzingCard FactsCard QuestionCard
                  VerdictCard RejudgingCard ErrorCard ... (15종)
      dialogs/    ChartDialog CaseDialog SendConfirmDialog HistoryDialog FailDialog
    documents/    StatementView RebuttalView PdfButton
  components/ui/  Button Chip Badge ProgressBar Drawer Dialog Icon ScrollArea
  styles/         theme.css  fonts/
  mocks/          handlers.ts  scenario.ts  seed.ts
```

### 현황판·사이드바는 이미 컴포넌트로 표시돼 있다
`10_디자인.html`에 `data-sc-name="HiSidebar"`(26회) / `data-sc-name="HiStatus"`(25회)가 붙어 있다.
**이 두 개를 가장 먼저, 가장 정확하게 만들면 26·25화면이 동시에 끝난다.** `12_컴포넌트_시트.html`의 사이드바 12상태 / 현황판 18상태가 그대로 이 두 컴포넌트의 props 조합이다.

---

## 6. 백엔드가 없는 동안: MSW + Dexie

### 계약을 먼저 못 박는다
`02_기능명세서.md` 맨 아래 "주고받는 데이터 요약"이 사실상 API 계약이다. 이걸 `src/domain/`에 타입으로 옮기고, `src/api/index.ts`에 **평범한 async 함수 묶음**으로 선언한다.

```ts
// src/api/index.ts — 화면은 이 모듈만 안다
export interface Api {
  createCase(): Promise<Case>;
  listCases(): Promise<CaseSummary[]>;
  sendMessage(caseId: string, text: string): Promise<void>;
  uploadVideo(caseId: string, file: File, onProgress: (p: number) => void): Promise<VideoRef>;
  analyze(caseId: string): AsyncIterable<AnalyzeEvent>;   // 진행 → 사실 또는 실패
  patchFact(caseId: string, key: FactKey, value: string): Promise<Verdict | null>; // 재판정 트리거
  setOpponentClaim(caseId: string, ratio: Ratio): Promise<void>;
  createStatement(caseId: string): Promise<Statement>;
  rewriteStatement(caseId: string, note: string): Promise<Statement>;
  createRebuttal(caseId: string): Promise<Rebuttal>;
  sendRebuttal(caseId: string, draft: Rebuttal): Promise<SentReceipt>;
  listHistory(caseId: string): Promise<HistoryEntry[]>;
}

export const api: Api = import.meta.env.VITE_API === 'http' ? httpApi : mockApi;
```

백엔드가 붙는 날 **바꾸는 파일은 이 한 줄과 `http/` 폴더뿐이다.**

### 시연 시나리오를 데이터로 쓴다
`03_유저플로우.md`의 시연 사례(교차로 신호위반, 나 0 : 상대 100, 질문 2개)를 **타임라인 배열**로 만든다.

```ts
// src/mocks/scenario.ts
export const analyzeTimeline: AnalyzeEvent[] = [
  { after:  600, type: 'step', label: '영상을 읽고 있어요' },
  { after: 1400, type: 'step', label: '신호등을 확인하고 있어요' },
  { after: 1200, type: 'step', label: '충돌 시점을 찾고 있어요' },
  { after:  900, type: 'facts', facts: SEED_FACTS },   // 5/6 확정, 1개는 [확인 필요]
];
```

이러면 **시연 리허설에서 타이밍을 초 단위로 조절**할 수 있다. 실서버가 붙어도 이 타임라인은 `analyzing` 카드의 문구 소스로 그대로 쓰인다.

### Dexie로 "심사위원 접속"을 해결한다 (기능명세 6.3 · **P0**)
6.3은 방법을 ★택1로 남겨 뒀다: *체험 계정 자동 로그인* vs *로그인 없이 브라우저별 분리*.
백엔드가 없으니 **후자가 자연스럽게 답이 된다.**

- 첫 방문 시 Dexie에 데모 사용자·시드 사건("주차장 후진 접촉 · 07-14", 목록이 비어 보이지 않게)을 심는다.
- 심사위원 A와 B가 각자 브라우저에서 독립적으로 처음부터 체험한다. 서로 간섭 없음.
- 새로고침·재방문(F6)이 진짜로 동작한다 — 채팅 마지막 위치, 현황판 최신 상태, 변경 이력까지.
- `/login`·`/signup` 화면은 **만들되 통과 가능하게** 둔다(6.1·6.2는 P1). 첫 화면 [시작하기]는 곧장 `/cases`로.
- 우상단에 조용한 **[데모 초기화]**를 하나 둔다. 리허설과 심사에서 반드시 쓰게 된다.

> MSW를 프로덕션 빌드에 포함하는 건 보통 피하지만, **이번엔 그게 제품이다.** `VITE_API=mock`으로 배포하고, 실서버가 붙으면 환경변수만 바꾼다.

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

```ts
export type FactSource = 'video' | 'statement' | 'unknown';   // [영상] [내가 말한 것] [확인 필요]
export type FactKey =
  | 'myLane' | 'opponentEntry' | 'opponentSignal'
  | 'mySpeed' | 'impactPoint' | 'stopLineTiming';             // 필수 6 = 분모

export interface Fact {
  key: FactKey; label: string; value: string | null;
  source: FactSource; confidence?: number; isDisputed?: boolean;
}

export interface Ratio { mine: number; opponent: number }     // 규칙 0.1 — 항상 "나 : 상대"

export interface Verdict {
  ratio: Ratio;
  chartName: string; chartNo: string | null;                  // ★ 번호 미확정 (00 문서 5절)
  baseRatio: Ratio;
  adjustments: { label: string; delta: number }[];
  conclusion: string;
  precedents: Precedent[];                                    // 2~3건, 뒤집힌 사례 우선
  disputes: string[];
  opponentClaim?: Ratio;
}

export type CaseStatus = '접수중' | '분석중' | '확인 필요' | '판정 완료' | '재판정중' | '발송 완료' | '종결';
export type StageState = '대기' | '진행중' | '완료';
export interface Stages { analysis: StageState; verdict: StageState; statement: StageState; rebuttal: StageState }
```

**확정된 사실 카운트는 저장하지 말고 파생하라.**
```ts
const confirmed = facts.filter(f => f.source !== 'unknown').length;  // 분자
const total = FACT_KEYS.length;                                      // 항상 6
// → "확인된 사실 5 / 6 · 남은 1개는 쟁점이에요"
```
분모를 상태로 들고 있으면 재판정 때 반드시 어긋난다.

**인정기준 도표 번호는 `null`로 두고 화면에서 조건부로 숨긴다.** 미확정 항목(`00` 문서 5절)이라 지어내면 안 되고, AI 담당이 확정하면 `chartNo` 한 필드만 채우면 5화면이 동시에 살아난다.

---

## 9. 마크업·접근성 — 이식하면서 같이 해야 하는 일

디자인 파일은 **전부 `<div>`**다. `<button>` `<input>` `<a>`도, `aria-*` `role` `alt`도 없다. 나중에 하려고 미루면 61화면을 두 번 만지게 된다.

- `scp1`/`scp0`/`scp3` 자리 → `<button type="button">`. 사건 목록 행(`scp5`) → `<button>` 안에 제목, `⋯`는 **형제 버튼**(중첩 금지).
- 팝업 6종(P-1~P-6) → `<dialog>` 또는 Radix `Dialog`. **포커스 트랩·Esc·스크롤 잠금**을 직접 짜면 시간을 잡아먹는다. 여기 하나만 Radix를 쓰는 게 이득이다.
- 진행 띠 → `role="progressbar"` + `aria-valuenow/valuemin/valuemax`. `m05`·`m06`에 이미 `data-step`/`data-steps`/`aria-label`이 들어 있으니 **그 규칙을 나머지에 복사**하면 된다.
- 분석 중·재판정 배너 → `aria-live="polite"`. 채팅에 카드가 붙는 것도 마찬가지.
- 아이콘 버튼 → `aria-label` 필수(이름이 없는 버튼이 된다).
- 터치 영역 **모바일 44×44 예외 없음 / PC 32×32**. 보이는 아이콘 크기는 두고 감싼 상자만 키운다 → `min-h-11 min-w-11` (44px).

---

## 10. PDF와 메일 — 서버 없이 처리하는 법

**경위서 PDF (3.3, P0)**
- **1안(권장): 인쇄 CSS + `window.print()`.** 경위서 전문(`h30`, 560×900)이 이미 한 장짜리 문서 레이아웃이라 전용 `@media print` 시트를 붙이면 사용자가 "PDF로 저장"을 고를 수 있다. 한글이 폰트 그대로, 텍스트로 살아 있는 PDF가 나온다. 구현 반나절.
- **2안: `pdfmake` + Pretendard 임베딩.** 파일명(`사건경위서_사건제목_날짜.pdf`)까지 제어되지만 폰트 base64가 커지고 레이아웃을 다시 짜야 한다.
- **`html2canvas` + `jsPDF`는 쓰지 말 것.** 한글이 이미지로 뭉개지고 용량이 커진다. 심사에서 바로 티가 난다.
- 어느 쪽이든 실패 경로(`h32` P-5)는 만들어야 한다 — 규칙 0.7(무엇이 안 됐나 + 어떻게 하나 + [다시 시도]).

**메일 발송 (4.3 ★ 팀 결정)**
- 시연은 **모의 발송 권장**: 1.5초 지연 후 성공, `h35` 확인 팝업 → `h29` 발송 완료. 실패 경로(`h36`)는 데모 초기화 옵션으로 강제 발동할 수 있게 해 두면 심사 때 오류 처리를 보여 줄 수 있다.
- 진짜로 보내야 한다면 **EmailJS**(브라우저에서 가능, 무료 티어)로 팀 메일함에 보낸다. 단 첨부 용량 제한이 있어 영상 첨부는 링크로 대체해야 한다.

---

## 11. 9일 일정 (8/28 금 ~ 9/6 일, 9/7 배포 고정)

| 날짜 | 할 일 | 끝났다는 기준 |
|---|---|---|
| **8/28 (금)** | Vite+TS 세팅 · Tailwind `@theme` 토큰 · Pretendard 로컬 번들 · `<Icon>` 추출 · Button/Chip/Badge/Dialog · Agentation 5분 시험 | `11_DesignSystem.html`을 우리 컴포넌트로 재현한 페이지가 뜬다 |
| **8/29 (토)** | `domain/` 타입 전부 · `api/` 계약 · Dexie 스키마 · MSW 뼈대 · 시드 데이터 | `api.listCases()`가 시드 2건을 돌려준다 |
| **8/30 (일)** | **Sidebar(12상태) + StatusPanel(18상태)** · WorkspaceLayout · `<Panel>` 서랍 | 1920/1280/1024/768/375에서 셸이 안 깨진다 |
| **8/31 (월)** | 채팅 카드 1차 8종 — guide/uploading/analyzing/error/facts/question/video/text | h12~h20b가 화면에 뜬다 |
| **9/1 (화)** | 채팅 카드 2차 7종 — verdict/rejudging/statementDraft/rebuttalDraft/sent/nextSteps · 팝업 P-1·P-2 | h21·h25·h37·h38이 뜬다 |
| **9/2 (수)** | **상태머신 연결** — 업로드→분석→질문→판정→재판정 자동 진행 · 이력 기록 | 영상을 올리면 아무것도 안 눌러도 판정까지 간다 |
| **9/3 (목)** | 경위서(S5) · 반박의견서(S6) · PDF · 발송 확인/완료/실패 · 잠금 규칙(4.1) | 발송 완료까지 한 줄기가 끊기지 않는다 |
| **9/4 (금)** | 첫 화면·로그인·회원가입·약관 팝업·온보딩·사건 목록/빈 상태/이름 바꾸기/삭제 | 라우트 6개가 다 채워진다 |
| **9/5 (토)** | **모바일 m01~m13** · 바텀시트 · 진행 띠 · 접근성(포커스·aria·44px) | 아이폰 실기기에서 전 구간 통과 |
| **9/6 (일)** | `png/` 61장과 대조(Agentation) · 문구 검수 · 시연 타이밍 조절 · **프로덕션 배포 고정** | 심사용 URL이 살아 있다 |
| 9/7~ | 핫픽스만. 새 기능 금지 | |

**우선순위가 밀리면 버리는 순서**: `h39` 변경 이력 팝업(P1) → `f01` 영상 뷰어 → `h10/h11` 이름 바꾸기·삭제 → `h03/h05` 로그인 오류 → 모바일 세부.
**절대 못 버리는 것**: 6.3(주소 열면 동작) · F1→F5 한 줄기 · 규칙 0.1(나 : 상대) · 0.2(참고용 고지).

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
| **Agentation이 안 맞는다** | D1에 5분만 시험. 안 되면 `png/` 첨부로 대체 |

---

## 13. 팀에 지금 물어봐야 할 것

1. **AI API 키를 프론트가 직접 쓰는가?** (예 → Vercel Functions 프록시 1개 필요, 4절)
2. **메일은 진짜 발송인가 모의인가?** (4.3 ★ — 모의를 권함)
3. **로그인 범위** — 6.3을 "브라우저별 분리"로 확정해도 되는지 (권함. 서버가 없어도 P0가 충족됨)
4. **접수번호 필수** 여부 (4.1 ★)
5. **서비스 이름** — 9/4 전에는 확정 필요 (메일 제목·로고에 박힌다)
6. **인정기준 도표 번호** — 9/2 전에 받으면 재작업 없이 들어간다

---

작성: 프론트 담당. 값이 어긋나면 `10_디자인.html` → `11_DesignSystem.html` → `02`/`03` 순으로 믿는다(`00` 문서 2절).
