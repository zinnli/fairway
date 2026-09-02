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
    /* 그냥 하는 말. 내 말풍선(h13)과 카드 없는 AI 답변(h13·h16)이 같은 종류다 */
    | { role: 'user' | 'ai'; kind: 'text'; text: string }
    | { role: 'user'; kind: 'video'; video: VideoRef }
    | { role: 'user'; kind: 'choice'; label: string; forField: FactKey }
    | { role: 'ai'; kind: 'guide' }
    | {
        role: 'ai';
        kind: 'uploading';
        fileName: string;
        sizeBytes: number;
        progress: number;
        /* 올라가는 중에는 그 자리에서 숫자만 바뀌고, 끝나면 video로 갈린다 */
        state: 'uploading' | 'failed' | 'canceled';
        note?: string;
      }
    | { role: 'ai'; kind: 'analyzing'; step: string; done?: boolean }
    | { role: 'ai'; kind: 'error'; code: ErrorCode; hint: string }
    | { role: 'ai'; kind: 'facts'; facts: Fact[] }
    | { role: 'ai'; kind: 'question'; field: FactKey; text: string; chips: Chip[] }
    /* 재판정 결과(h25)는 별도 종류가 아니라 이전 비율이 붙은 판정 카드다 */
    | { role: 'ai'; kind: 'verdict'; verdict: Verdict; previous?: Ratio }
    | { role: 'ai'; kind: 'rejudging'; from: Ratio; reason: string }
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
