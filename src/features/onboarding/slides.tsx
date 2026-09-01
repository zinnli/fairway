import type { ReactNode } from 'react';
import { ChatMock, Pill, StatementMock, VerdictMock } from './mocks';

/**
 * 온보딩 3장 — h06 · h06b · h07 (모바일 m03).
 * 문구는 시안 그대로다. 그림은 mocks.tsx에 있다.
 */

export interface Slide {
  title: ReactNode;
  desc: ReactNode;
  art: ReactNode;
  /** 왼쪽 위 배지 — h06b의 [예시] */
  artBadge?: ReactNode;
  /** 규칙 0.2 — 판정·서류가 보이는 장에만 붙는다 */
  disclaimer: boolean;
}

export const SLIDES: Slide[] = [
  {
    title: '사고를 설명하고 영상만 올리면 돼요',
    desc: (
      <>
        채팅에 사고 상황을 말하고 블랙박스 영상을 올리면,
        <br />
        버튼 없이 분석이 자동으로 시작돼요.
      </>
    ),
    art: <ChatMock />,
    disclaimer: false,
  },
  {
    title: '숫자마다 근거를 붙여 드려요',
    desc: (
      <>
        인정기준 도표와 뒤집힌 심의사례를 나란히 보여요.
        <br />
        상대 보험사 주장과도 비교해 드려요.
      </>
    ),
    art: <VerdictMock />,
    artBadge: <Pill>예시</Pill>,
    disclaimer: true,
  },
  {
    title: '사건경위서와 반박의견서까지 써 드려요',
    desc: (
      <>
        결과만 주고 끝나지 않아요. 서류를 만들고
        <br />
        담당자에게 이메일로 보내는 것까지 도와드려요.
      </>
    ),
    art: <StatementMock />,
    disclaimer: true,
  },
];
