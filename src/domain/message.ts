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

/**
 * 말풍선 아래 붙는 단추. 서버가 붙여 준다 —
 * h13의 [영상 올리기], h27 잠김 안내의 [사건경위서 먼저 만들기]가 이것이다.
 * 종류를 늘리지 않고 text 하나로 받는다 (04 문서의 10종을 지킨다).
 */
export interface TextCta {
  label: string;
  action: 'uploadVideo' | 'createStatement';
}

export type ChatMessage = Base &
  (
    /* 그냥 하는 말. 내 말풍선(h13)과 카드 없는 AI 답변이 같은 종류다.
       영상 분석 요약(h18 대체)과 되물음(h20b)도 여기로 온다 */
    | { role: 'user' | 'ai'; kind: 'text'; text: string; cta?: TextCta }
    | { role: 'user'; kind: 'video'; video: VideoRef }
    | { role: 'ai'; kind: 'guide' }
    /* 올라가는 중에는 그 자리에서 숫자만 바뀌고, 끝나면 video로 갈린다.
       취소·실패는 범위 밖이라 상태가 하나뿐이다 (04 문서 C4) */
    | { role: 'ai'; kind: 'uploading'; fileName: string; sizeBytes: number; progress: number }
    /* 단계 시각화 없이 로딩 하나 (04 문서 C6). 무슨 일을 기다리는지만 갈린다.
       'reply'는 Job이 없는 기다림이다 — 되물음·답변은 서버가 Job 없이 SSE로 보낸다.
       'report'·'rebuttal'은 서류를 만드는 동안이다 — 단추만 잠그던 것을 카드로도 알린다 */
    | {
        role: 'ai';
        kind: 'analyzing';
        phase?: 'analysis' | 'verdict' | 'reply' | 'report' | 'rebuttal';
      }
    | { role: 'ai'; kind: 'verdict'; verdict: Verdict }
    | { role: 'ai'; kind: 'statementDraft'; doc: Statement }
    | { role: 'ai'; kind: 'rebuttalDraft'; doc: Rebuttal }
    /* 첨부 개수는 서버가 센 값이다 (명세 §4.10 attachmentCount).
       25MB를 넘겨 영상이 빠지면 여기 숫자가 줄어든다 — 0도 그대로 보여 준다 */
    | { role: 'ai'; kind: 'sent'; to: string; attachmentCount: number }
    /* steps는 서버가 준다. 없으면 화면이 아는 기본 문구를 쓴다 */
    | { role: 'ai'; kind: 'nextSteps'; steps?: string[] }
  );

/**
 * id·at 없이 알맹이만. 로그를 만들 때 쓴다.
 * 유니온이라 그냥 Omit을 걸면 갈래가 뭉개진다 — 배분형으로 써야 한다.
 */
export type MessageBody<T = ChatMessage> = T extends unknown ? Omit<T, 'id' | 'at'> : never;
