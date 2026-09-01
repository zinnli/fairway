import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '@/api';
import { VIDEO_LIMITS } from '@/config';
import type { Case } from '@/domain/case';
import { Sidebar } from '@/features/cases/Sidebar';
import { ChatHeader } from '@/features/workspace/ChatHeader';
import { Composer } from '@/features/workspace/Composer';
import { StatusPanel } from '@/features/workspace/StatusPanel';
import { MessageItem } from '@/features/workspace/messages/MessageItem';
import { chatReducer, emptyChat } from '@/store/chatReducer';

/**
 * S4 작업 화면 — 라우트 하나가 h12~h39 + f01~f04 + m05~m13을 흡수한다.
 * 화면이 40장인 게 아니라, 같은 셸 안에서 대화에 카드가 하나씩 더 붙는 것뿐이다.
 *
 * 왼쪽 HiSidebar(26화면 공유) · 가운데 대화 · 오른쪽 HiStatus(25화면 공유).
 * 좁아지면 양옆은 서랍으로 접힌다.
 */
let seq = 0;
const nextId = () => `m${++seq}`;
const now = () => new Date().toISOString();

export function CaseWorkspacePage() {
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  /* 불러온 결과는 어느 사건 것인지까지 같이 들고 있는다. 사건을 바꾸는 순간
     이전 사건의 화면이 잠깐 비치거나 "없는 사건" 문구가 스치는 걸 막는다 */
  const [loaded, setLoaded] = useState<{ id: string; item: Case | null } | null>(null);
  const [chat, dispatch] = useReducer(chatReducer, emptyChat);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickVideo = () => fileRef.current?.click();

  useEffect(() => {
    let alive = true;
    api
      .getCase(caseId)
      .then((c) => {
        if (!alive) return;
        setLoaded({ id: caseId, item: c });
        // 접수 안내는 사건을 열 때마다 로그 맨 앞에 깔린다 (h12)
        dispatch({
          type: 'reset',
          messages: [{ id: nextId(), at: now(), role: 'ai', kind: 'guide' }],
        });
      })
      .catch(() => {
        if (alive) setLoaded({ id: caseId, item: null });
      });
    return () => {
      alive = false;
    };
  }, [caseId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [chat.messages.length]);

  const item = loaded?.id === caseId ? loaded.item : null;
  const notFound = loaded?.id === caseId && loaded.item === null;

  if (notFound) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-bg-3 p-6">
        <p className="text-[15px] text-ink-3">사건을 찾지 못했어요.</p>
        <button
          type="button"
          onClick={() => navigate('/cases')}
          className="min-h-11 rounded-md px-4 text-[14px] font-medium text-brand hover:bg-bg-2"
        >
          사건 목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-dvh bg-bg-3">
      <div className="hidden h-full lg:block">
        <Sidebar selectedId={caseId} />
      </div>

      {/* 파일 선택창은 여기 한 벌만 둔다. 입력 바의 [+]와 h12의 [영상 올리기]가 같이 쓴다 */}
      <input
        ref={fileRef}
        type="file"
        accept={VIDEO_LIMITS.accept.join(',')}
        className="hidden"
        onChange={(e) => {
          e.target.value = '';
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="chat-scroll flex flex-1 flex-col items-start gap-7 p-6">
          {item && <ChatHeader item={item} />}
          {chat.messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              actions={{ onPickVideo: pickVideo }}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        <Composer
          onSend={(text) =>
            dispatch({
              type: 'append',
              message: { id: nextId(), at: now(), role: 'user', kind: 'text', text },
            })
          }
          onPickVideo={pickVideo}
        />
      </div>

      {item && (
        <div className="hidden h-full xl:block">
          <StatusPanel
            item={item}
            onOpenStatement={() => {}}
            onOpenRebuttal={() => {}}
            onOpenHistory={() => {}}
          />
        </div>
      )}
    </div>
  );
}
