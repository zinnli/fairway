import type { VideoRef } from '@/domain/case';
import { Button } from '@/components/ui/Button';
import type { ChatMessage } from '@/domain/message';
import type { Precedent } from '@/domain/verdict';
import { AiMessage, AiText } from './AiMessage';
import { AnalyzingCard } from './AnalyzingCard';
import { UploadingCard, VideoBubble } from './Attachment';
import { GuideCard } from './GuideCard';
import { UploadActions } from './UploadActions';
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
  showUpload,
}: {
  message: ChatMessage;
  actions: MessageActions;
  /** 참고용 고지는 화면당 한 번(규칙 0.2). 고지를 다는 카드 중 마지막 하나만 참이다 */
  withDisclaimer?: boolean;
  /**
   * [영상 올리기]를 이 카드가 맡았는가. 화면 전체에서 딱 하나만 참이다 —
   * 작업 화면이 `uploadCardId`로 **대화의 맨 끝**을 골라 준다.
   */
  showUpload?: boolean;
}) {
  switch (message.kind) {
    case 'guide':
      return (
        <GuideCard
          onPickVideo={actions.onPickVideo}
          onPickSample={actions.onPickSample}
          sampleLoading={actions.sampleLoading}
          showUpload={showUpload}
        />
      );

    case 'text': {
      /* 같은 kind가 역할에 따라 말풍선이 되기도, 카드 없는 AI 답변이 되기도 한다.
         분석 요약(h18 대체)과 되물음(h20b)도 이 갈래로 온다 */
      if (message.role === 'user') return <UserBubble>{message.text}</UserBubble>;

      /*
        서버가 답에 붙여 주는 단추는 둘이다 — h13 [영상 올리기] · h27 [사건경위서 먼저 만들기].

        영상 단추만 다르게 다룬다. 안내 카드(h12)에도 같은 단추가 있어서 온 대로
        그리면 화면에 둘이 함께 서기 때문이다. 자리는 하나뿐이고 그 자리는
        `showUpload`가 정한다 — 이 답이 맡지 않았으면 아예 안 그린다.
        맡았을 때는 서버가 준 문구를 그대로 단추에 쓴다.

        경위서 단추는 이것과 무관하게 제 자리에 선다.
      */
      const uploadCta = message.cta?.action === 'uploadVideo' ? message.cta : null;
      return (
        <AiMessage>
          <AiText>{message.text}</AiText>
          {showUpload && (
            <UploadActions
              label={uploadCta?.label}
              onPickVideo={actions.onPickVideo}
              onPickSample={actions.onPickSample}
              loading={actions.sampleLoading}
            />
          )}
          {message.cta && !uploadCta && (
            <Button className="mt-1 self-start" onClick={actions.onCreateStatement}>
              {message.cta.label}
            </Button>
          )}
        </AiMessage>
      );
    }

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
