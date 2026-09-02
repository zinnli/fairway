# 카-디펜더 프론트엔드 — 에이전트 지침

교통사고 과실비율 분석 서비스. 채팅형 단일 페이지 앱. 금융 AI 챌린지 해커톤 출품작.
**심사 9/7~9/11. 프로덕션 배포는 9/6에 고정하고 그 뒤엔 핫픽스만.** 프론트는 1인.

서비스 이름은 미확정이다("카-디펜더"는 가칭). 이름을 코드에 박지 말고 `src/config.ts`의 `APP_NAME`을 쓴다.

## 명령어

```bash
pnpm dev      # 개발 서버
pnpm build    # tsc -b && vite build
pnpm lint     # oxlint
```

패키지 매니저는 **pnpm**. npm/yarn 명령을 쓰지 말 것.

## 문서 — 값이 어긋나면 이 순서로 믿는다

1. `docs/handoff/10_디자인.html` — **UI 원본. 61화면이 한 파일에 있고, 눈에 보이는 값이 최종이다.**
   브라우저로 열고 주소 끝에 `#h21`을 붙이면 그 화면으로 바로 간다.
   `h09 h20b h26 h27 h28 h29 h30 h31 h33 h40`에는 HTML 주석으로 핸드오프 노트가 들어 있다.
2. `docs/handoff/11_DesignSystem.html` — 토큰·부품·상태·반응형 규격
3. `docs/handoff/02_기능명세서.md` · `03_유저플로우.md` — 동작 규칙
4. 그 밖의 문서

- `docs/handoff/00_프론트_읽어주세요.md` — 디자인팀이 남긴 주의사항. 화면 작업 전 반드시 확인
- `docs/handoff/01_화면색인.md` — 화면 id ↔ 기능 번호 대응표
- `docs/handoff/png/<id>.png` — 61화면 렌더 이미지. **HTML을 파싱하기 전에 이 이미지를 먼저 볼 것**
- `docs/frontend-plan.md` — 아키텍처 근거와 일정

## 절대 규칙 (외부 검수에서 306건이 나왔고, 아래는 그중 반복해서 틀리는 것들)

- **간격은 4의 배수만.** Tailwind 스케일 유틸리티(`p-3`=12px, `gap-2`=8px)만 쓴다.
  임의값(`p-[13px]`, `gap-[6px]`) 금지. 예외는 6px 색점 · 비율 막대 h8/h10 · 1px 선뿐.
- **스크롤 컨테이너에 `min-h-0` 필수** (`.chat-scroll` `.panel-scroll` `.doc-scroll`).
  빼면 flex 자식이 줄어들지 못해 입력 바가 화면 밖으로 밀려난다.
  flex 자식에는 `min-w-0`도 같이. 말풍선은 `max-w-[560px] min-w-0`이 정본.
- **잠금은 `opacity`가 아니라 색 교체.** `disabled:bg-bg-2 disabled:text-disabled`.
  `opacity-40`을 쓰면 정의에 없는 연보라가 생긴다.
- **비율은 항상 "나 ○ : 상대 ○".** 숫자만 쓰지 말고 `formatRatio()`를 거친다.
- **정보 글자는 `muted`(#667085)까지.** `disabled`(#98A2B3)는 잠금 전용이다.
- **터치 영역 — 모바일 44×44 예외 없음 / PC 32×32.** 보이는 아이콘 크기는 두고 감싼 상자만 키운다.
- **확인된 사실 개수는 저장하지 말고 파생한다** (`countConfirmed()`). 상태로 들면 재판정 때 어긋난다.
- **참고용 고지**(`<Disclaimer />`)는 판정·서류가 보이는 화면 하단에 **화면당 한 번만**.
- **색·간격 값을 컴포넌트에 직접 적지 않는다.** 전부 `src/styles/theme.css`의 토큰에서 나온다.
- **`h-screen` 대신 `h-dvh`.** 모바일 주소창 때문에.

## 하지 말 것

- 아이콘 라이브러리(lucide 등) 도입 — `src/components/ui/Icon.tsx`가 정본이다 (20×20 · 1.5px · currentColor)
- Pretendard를 CDN에서 불러오기 — `public/fonts/`에 번들돼 있다. CDN이 막히면 심사 중 글꼴이 통째로 바뀐다
- 경위서 PDF를 `html2canvas` + `jsPDF`로 만들기 — 한글이 이미지로 뭉개진다. 인쇄 CSS + `window.print()`를 쓴다
- 다크 모드 — 이번 범위가 아니다
- 카드 등장(150ms, 아래→위 8px)과 분석 중 점 깜빡임 외의 애니메이션
- 인정기준 도표 번호를 지어내기 — 미확정이다. `chartNo`가 `null`이면 번호 칸을 숨긴다

## 아키텍처 — 61화면을 61개 컴포넌트로 만들지 않는다

화면 61장은 대부분 **같은 셸 안에서 채팅에 카드가 하나 더 붙은 상태**다.
H16(분석 중) → H18(사실 확인) → H20(질문) → H21(판정)은 다른 화면이 아니라 같은 화면의 시간축 위 네 지점이다.
**대화는 추가만, 삭제 없음.**

라우트는 5개뿐이고 `/cases/:caseId` 하나가 h12~h39 + f01~f04 + m05~m13을 흡수한다.
온보딩(h06~h07)은 라우트가 아니라 사건이 0개일 때 뜨는 모달이다.
S5(경위서 전문)·S6(반박의견서)도 라우트가 아니라 모달이고, 좁은 화면의 사이드바·현황판은 서랍이다.

```
src/
  domain/         타입 정본 — 새 개념은 여기 먼저 추가한다
                  ChatMessage는 판별 유니온. kind 하나당 카드 컴포넌트 하나 (총 15종)
  api/            계약. 화면은 api/types.ts의 Api 인터페이스만 안다
                  백엔드 교체 지점은 api/index.ts 한 줄
  store/          caseStore(zustand) · chatReducer
  features/       auth · cases · workspace(messages/ dialogs/) · documents
  components/ui/  Button Chip Badge RatioBar StepDots StageIcon Dialog Icon Disclaimer
  styles/theme.css  토큰 정본
  config.ts       팀 미확정 값 전부 (APP_NAME · REQUIRE_CLAIM_NO · VIDEO_LIMITS · EMAIL_MODE)
```

`data-sc-name="HiSidebar"`(26화면) / `"HiStatus"`(25화면)가 원본에 표시돼 있다.
이 둘을 정확히 만들면 화면 대부분이 함께 끝난다.

## 백엔드

**스펙만 확정, 구현은 나중.** 최악의 경우 프론트 단독으로 시연까지 가야 한다.
MSW + Dexie로 브라우저별 독립 체험을 만든다 — 이러면 기능명세 6.3(심사위원이 주소만 열면 바로 쓸 수 있어야 함, **P0**)이 로그인 서버 없이 충족된다.
API 키를 프론트에 두지 않는다.

## 팀 미확정 (지어내지 말 것)

서비스 이름 · 인정기준 도표 번호 · 접수번호 필수 여부 · 영상 제한 수치 · 메일 실제 발송 여부.
전부 `src/config.ts`에 상수로 빠져 있다. 값이 필요하면 상수를 쓰고, 없으면 화면에서 숨긴다.
