import type { VideoRef } from '@/domain/case';
import { Button } from '@/components/ui/Button';
import type { ChatMessage } from '@/domain/message';
import type { Precedent } from '@/domain/verdict';
import { AiMessage, AiText } from './AiMessage';
import { AnalyzingCard } from './AnalyzingCard';
import { UploadingCard, VideoBubble } from './Attachment';
import { GuideCard } from './GuideCard';
import { NextStepsCard, RebuttalDraftCard, SentCard, StatementDraftCard } from './DocumentCards';
import { UserBubble } from './UserBubble';
import { VerdictCard } from './VerdictCard';

/**
 * kind 하나당 카드 하나 (9/3 축소 뒤 10종).
 * 새 kind를 domain/message.ts에 넣으면 여기에도 한 줄 는다.
 */
export interface MessageActions {
  onPickVideo: () => void;
  onPickSample: (file: string) => void;
  /** 예시 영상을 받아 오는 중 */
  sampleLoading?: boolean;
  onOpenPrecedent: (precedent: Precedent) => void;
  onCreateStatement: () => void;
  /** 경위서가 이미 있는가 — 판정 카드의 단추가 [만들기]/[보기]로 갈린다 */
  statementExists?: boolean;
  onOpenStatement: () => void;
  onPrintStatement: () => void;
  onRewriteStatement: () => void;
  /** 다시 쓰는 중인가 (h31 진행 화면이 없어서 단추로만 알린다) */
  statementRewriting?: boolean;
  onCreateRebuttal: () => void;
  onOpenRebuttal: () => void;
  onOpenProcess: () => void;
  onOpenVideo: (video: VideoRef) => void;
}

export function MessageItem({
  message,
  actions,
  withDisclaimer,
}: {
  message: ChatMessage;
  actions: MessageActions;
  /** 참고용 고지는 화면당 한 번(규칙 0.2). 고지를 다는 카드 중 마지막 하나만 참이다 */
  withDisclaimer?: boolean;
}) {
  switch (message.kind) {
    case 'guide':
      return <GuideCard
          onPickVideo={actions.onPickVideo}
          onPickSample={actions.onPickSample}
          sampleLoading={actions.sampleLoading}
        />;

    case 'text':
      /* 같은 kind가 역할에 따라 말풍선이 되기도, 카드 없는 AI 답변이 되기도 한다.
         분석 요약(h18 대체)과 되물음(h20b)도 이 갈래로 온다 */
      return message.role === 'user' ? (
        <UserBubble>{message.text}</UserBubble>
      ) : (
        <AiMessage>
          <AiText>{message.text}</AiText>
          {/* 서버가 붙여 준 단추 — h13 [영상 올리기] · h27 [사건경위서 먼저 만들기] */}
          {message.cta && (
            <Button
              className="mt-1 self-start"
              onClick={
                message.cta.action === 'uploadVideo'
                  ? actions.onPickVideo
                  : actions.onCreateStatement
              }
            >
              {message.cta.label}
            </Button>
          )}
        </AiMessage>
      );

    case 'video':
      return <VideoBubble video={message.video} onOpen={() => actions.onOpenVideo(message.video)} />;

    case 'uploading':
      return (
        <UploadingCard
          fileName={message.fileName}
          sizeBytes={message.sizeBytes}
          progress={message.progress}
        />
      );

    case 'analyzing':
      return <AnalyzingCard phase={message.phase} done={message.done} />;

    case 'verdict':
      return (
        <VerdictCard
          verdict={message.verdict}
          onOpenPrecedent={actions.onOpenPrecedent}
          onCreateStatement={actions.onCreateStatement}
          statementExists={actions.statementExists}
          statementBusy={actions.statementRewriting}
          withDisclaimer={withDisclaimer}
        />
      );

    case 'statementDraft':
      return (
        <StatementDraftCard
          doc={message.doc}
          onOpen={actions.onOpenStatement}
          onPrint={actions.onPrintStatement}
          onRewrite={actions.onRewriteStatement}
          rewriting={actions.statementRewriting}
          onCreateRebuttal={actions.onCreateRebuttal}
          withDisclaimer={withDisclaimer}
        />
      );

    case 'rebuttalDraft':
      return <RebuttalDraftCard doc={message.doc} onOpen={actions.onOpenRebuttal} />;

    case 'sent':
      return <SentCard at={message.at} to={message.to} />;

    case 'nextSteps':
      return <NextStepsCard steps={message.steps} onOpenProcess={actions.onOpenProcess} />;
  }
}
