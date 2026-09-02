import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '@/api';
import { Drawer } from '@/components/ui/Drawer';
import { VIDEO_LIMITS } from '@/config';
import type { Case } from '@/domain/case';
import { Sidebar } from '@/features/cases/Sidebar';
import { ChatHeader } from '@/features/workspace/ChatHeader';
import { Composer } from '@/features/workspace/Composer';
import { MobileBar } from '@/features/workspace/MobileBar';
import { StatusPanel } from '@/features/workspace/StatusPanel';
import { MessageItem } from '@/features/workspace/messages/MessageItem';
import { chatReducer, emptyChat } from '@/store/chatReducer';

/**
 * S4 작업 화면 — 라우트 하나가 h12~h39 + f01~f04 + m05~m13을 흡수한다.
 * 화면이 40장인 게 아니라, 같은 셸 안에서 대화에 카드가 하나씩 더 붙는 것뿐이다.
 *
 * 왼쪽 HiSidebar(26화면 공유) · 가운데 대화 · 오른쪽 HiStatus(25화면 공유).
 * 폭 규칙은 시안 h09 주석 그대로다 — 1280 이상 둘 다 고정 / 1024~1280 현황판만 서랍 /
 * 1024 미만 둘 다 서랍. 서랍을 여는 단추는 대화 위 띠에 둔다.
 * (시안은 "머리글에" 두라고 하지만, 우리 머리글은 대화와 같이 스크롤돼서 밀려 올라간다)
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
  /* 어느 사건에서 연 서랍인지까지 들고 있는다. 사건이 바뀌면 저절로 닫힌 셈이 되어
     effect로 닫을 필요가 없다 */
  const [drawer, setDrawer] = useState<{ id: string; which: 'cases' | 'status' } | null>(null);
  const openDrawer = drawer?.id === caseId ? drawer.which : null;
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pickVideo = () => fileRef.current?.click();

  useEffect(() => {
    let alive = true;
    Promise.all([api.getCase(caseId), api.listMessages(caseId)])
      .then(([c, past]) => {
        if (!alive) return;
        setLoaded({ id: caseId, item: c });
        /* 지난 대화를 그대로 되살린다. 아직 아무 말도 오가지 않은 사건은
           접수 안내 한 장으로 시작한다 (h12) */
        dispatch({
          type: 'reset',
          messages: past.length
            ? past
            : [{ id: nextId(), at: now(), role: 'ai', kind: 'guide' }],
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
      {/* 1024 이상에서만 붙박이. 그 아래는 아래쪽 서랍이 같은 부품을 쓴다 */}
      <div className="hidden h-full md:block">
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
        <MobileBar
          item={item}
          onOpenCases={() => setDrawer({ id: caseId, which: 'cases' })}
          onOpenStatus={() => setDrawer({ id: caseId, which: 'status' })}
        />

        <div className="chat-scroll flex flex-1 flex-col px-4 py-4 md:px-6 md:py-6">
          {/* 1024 미만에서는 대화 열을 가운데로 모은다 (h09 주석의 태블릿·모바일 규칙) */}
          <div className="mx-auto flex w-full max-w-140 flex-col items-start gap-5 md:mx-0 md:max-w-none md:gap-7">
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

      {/* 1280 이상에서만 붙박이 */}
      {item && (
        <div className="hidden h-full lg:block">
          <StatusPanel
            item={item}
            onOpenStatement={() => {}}
            onOpenRebuttal={() => {}}
            onOpenHistory={() => {}}
          />
        </div>
      )}

      <Drawer
        open={openDrawer === 'cases'}
        onClose={() => setDrawer(null)}
        side="left"
        label="내 사건"
      >
        <Sidebar selectedId={caseId} />
      </Drawer>

      <Drawer
        open={openDrawer === 'status'}
        onClose={() => setDrawer(null)}
        side="right"
        label="사건 현황판"
      >
        {item && (
          <StatusPanel
            item={item}
            onOpenStatement={() => {}}
            onOpenRebuttal={() => {}}
            onOpenHistory={() => {}}
          />
        )}
      </Drawer>
    </div>
  );
}
