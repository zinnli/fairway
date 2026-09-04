import type { Verdict } from './verdict';
import type { VideoRef } from './case';
import type { Rebuttal, Statement } from './document';

/**
 * 채팅은 추가만, 삭제 없음 (00 문서 6절).
 * 화면 대부분은 "이 로그가 한 칸 더 늘어난 상태"다.
 * kind 하나당 카드 컴포넌트 하나 — 9/3 축소 뒤 10종이다 (04 문서 6절).
 *
 * 사실 카드(facts)·칩 질문(question)·내 선택(choice)·재판정(rejudging)·
 * 오류 카드(error)는 범위에서 빠졌다. 분석 요약도 질문도 답도 전부 text로 온다.
 */
type Base = { id: string; at: string };

export type ChatMessage = Base &
  (
    /* 그냥 하는 말. 내 말풍선(h13)과 카드 없는 AI 답변이 같은 종류다.
       영상 분석 요약(h18 대체)과 되물음(h20b)도 여기로 온다 */
    | { role: 'user' | 'ai'; kind: 'text'; text: string }
    | { role: 'user'; kind: 'video'; video: VideoRef }
    | { role: 'ai'; kind: 'guide' }
    /* 올라가는 중에는 그 자리에서 숫자만 바뀌고, 끝나면 video로 갈린다.
       취소·실패는 범위 밖이라 상태가 하나뿐이다 (04 문서 C4) */
    | { role: 'ai'; kind: 'uploading'; fileName: string; sizeBytes: number; progress: number }
    /* 단계 시각화 없이 로딩 하나 (04 문서 C6) */
    | { role: 'ai'; kind: 'analyzing'; done?: boolean }
    | { role: 'ai'; kind: 'verdict'; verdict: Verdict }
    | { role: 'ai'; kind: 'statementDraft'; doc: Statement }
    | { role: 'ai'; kind: 'rebuttalDraft'; doc: Rebuttal }
    | { role: 'ai'; kind: 'sent'; to: string }
    | { role: 'ai'; kind: 'nextSteps' }
  );

export type MessageKind = ChatMessage['kind'];

/**
 * id·at 없이 알맹이만. 로그를 만들 때 쓴다.
 * 유니온이라 그냥 Omit을 걸면 갈래가 뭉개진다 — 배분형으로 써야 한다.
 */
export type MessageBody<T = ChatMessage> = T extends unknown ? Omit<T, 'id' | 'at'> : never;
