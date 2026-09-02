import type { VideoRef } from '@/domain/case';
import type { FactKey } from '@/domain/fact';
import type { Chip, ChatMessage } from '@/domain/message';
import type { Precedent, Ratio } from '@/domain/verdict';
import { AiMessage, AiText } from './AiMessage';
import { AnalyzingCard } from './AnalyzingCard';
import { UploadingCard, VideoBubble } from './Attachment';
import { ErrorCard } from './ErrorCard';
import { FactsCard } from './FactsCard';
import { GuideCard } from './GuideCard';
import { QuestionCard } from './QuestionCard';
import { RejudgingCard } from './RejudgingCard';
import { NextStepsCard, RebuttalDraftCard, SentCard, StatementDraftCard } from './DocumentCards';
import { UserBubble } from './UserBubble';
import { VerdictCard } from './VerdictCard';

/**
 * kind 하나당 카드 하나 (총 15종). 새 kind를 domain/message.ts에 넣으면 여기에도 한 줄 는다.
 * 아직 만들지 않은 종류는 null이다 — 순서대로 채운다.
 */
export interface MessageActions {
  onPickVideo: () => void;
  onCancelUpload: () => void;
  onStopAnalyze: () => void;
  onRetryAnalyze: () => void;
  onFixFact: (key: FactKey, value: string | null) => void;
  onConfirmFacts: () => void;
  onAnswerQuestion: (field: FactKey, chip: Chip) => void;
  onOpenChart: () => void;
  onOpenPrecedent: (precedent: Precedent) => void;
  onCreateStatement: () => void;
  onOpponentClaim: (ratio: Ratio) => void;
  onOpenStatement: () => void;
  onPrintStatement: () => void;
  onCreateRebuttal: () => void;
  onOpenRebuttal: () => void;
  onOpenProcess: () => void;
  onOpenVideo: (video: VideoRef) => void;
  /** 아직 확인되지 않은 항목 안내 — 경위서 카드가 쓴다 */
  unknownNote: string | null;
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
      return <GuideCard onPickVideo={actions.onPickVideo} />;

    case 'text':
      // 같은 kind가 역할에 따라 말풍선이 되기도, 카드 없는 AI 답변이 되기도 한다
      return message.role === 'user' ? (
        <UserBubble>{message.text}</UserBubble>
      ) : (
        <AiMessage>
          <AiText>{message.text}</AiText>
        </AiMessage>
      );

    case 'choice':
      return <UserBubble>{message.label}</UserBubble>;

    case 'video':
      return <VideoBubble video={message.video} onOpen={() => actions.onOpenVideo(message.video)} />;

    case 'uploading':
      return (
        <UploadingCard
          fileName={message.fileName}
          sizeBytes={message.sizeBytes}
          progress={message.progress}
          state={message.state}
          note={message.note}
          onCancel={actions.onCancelUpload}
        />
      );

    case 'analyzing':
      return (
        <AnalyzingCard step={message.step} done={message.done} onStop={actions.onStopAnalyze} />
      );

    case 'error':
      return (
        <ErrorCard
          code={message.code}
          hint={message.hint}
          onRetryAnalyze={actions.onRetryAnalyze}
          onPickVideo={actions.onPickVideo}
        />
      );

    case 'facts':
      return (
        <FactsCard
          facts={message.facts}
          onFix={actions.onFixFact}
          onConfirm={actions.onConfirmFacts}
        />
      );

    case 'question':
      return <QuestionCard message={message} onAnswer={actions.onAnswerQuestion} />;

    case 'verdict':
      return (
        <VerdictCard
          verdict={message.verdict}
          previous={message.previous}
          onOpenChart={actions.onOpenChart}
          onOpenPrecedent={actions.onOpenPrecedent}
          onCreateStatement={actions.onCreateStatement}
          onOpponentClaim={actions.onOpponentClaim}
          withDisclaimer={withDisclaimer}
        />
      );

    case 'rejudging':
      return <RejudgingCard from={message.from} reason={message.reason} />;

    case 'statementDraft':
      return (
        <StatementDraftCard
          doc={message.doc}
          unknownNote={actions.unknownNote}
          onOpen={actions.onOpenStatement}
          onPrint={actions.onPrintStatement}
          onCreateRebuttal={actions.onCreateRebuttal}
          withDisclaimer={withDisclaimer}
        />
      );

    case 'rebuttalDraft':
      return <RebuttalDraftCard doc={message.doc} onOpen={actions.onOpenRebuttal} />;

    case 'sent':
      return <SentCard at={message.at} to={message.to} />;

    case 'nextSteps':
      return <NextStepsCard onOpenProcess={actions.onOpenProcess} />;
  }
}
