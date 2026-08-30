import type { Fact, FactKey } from './fact';
import type { Ratio, Verdict } from './verdict';
import type { VideoRef } from './case';
import type { Rebuttal, Statement } from './document';

/**
 * 채팅은 추가만, 삭제 없음 (00 문서 6절).
 * 화면 61장은 대부분 "이 로그가 한 칸 더 늘어난 상태"다.
 * kind 하나당 카드 컴포넌트 하나 — 그래서 실제로 만들 카드는 15종이다.
 */

/** 오류 문구 — 규칙 0.7. 무엇이 안 됐나 + 어떻게 하면 되나 + [다시 시도] */
export type ErrorCode =
  | 'upload/format' | 'upload/size' | 'upload/network' | 'upload/canceled'
  | 'analyze/failed' | 'pdf/failed' | 'send/failed';

export interface Chip {
  label: string;
  value: string;
  /** [잘 모르겠어요] · [기억 안 나요] — 고르면 그 항목은 [확인 필요]로 남는다 */
  isUnknown?: boolean;
}

type Base = { id: string; at: string };

export type ChatMessage = Base &
  (
    | { role: 'user'; kind: 'text'; text: string }
    | { role: 'user'; kind: 'video'; video: VideoRef }
    | { role: 'user'; kind: 'choice'; label: string; forField: FactKey }
    | { role: 'ai'; kind: 'guide' }
    | { role: 'ai'; kind: 'uploading'; progress: number; fileName: string }
    | { role: 'ai'; kind: 'analyzing'; step: string }
    | { role: 'ai'; kind: 'error'; code: ErrorCode; hint: string }
    | { role: 'ai'; kind: 'facts'; facts: Fact[] }
    | { role: 'ai'; kind: 'question'; field: FactKey; text: string; chips: Chip[] }
    | { role: 'ai'; kind: 'verdict'; verdict: Verdict }
    | { role: 'ai'; kind: 'rejudging'; from: Ratio; reason: string }
    | { role: 'ai'; kind: 'statementDraft'; doc: Statement }
    | { role: 'ai'; kind: 'rebuttalDraft'; doc: Rebuttal }
    | { role: 'ai'; kind: 'sent'; at: string; to: string }
    | { role: 'ai'; kind: 'nextSteps' }
  );

export type MessageKind = ChatMessage['kind'];
