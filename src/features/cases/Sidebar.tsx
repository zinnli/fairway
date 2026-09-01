import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Icon } from '@/components/ui/Icon';
import { useCaseStore } from '@/store/caseStore';
import { CaseRow } from './CaseRow';

/**
 * HiSidebar — 원본에 data-sc-name="HiSidebar"로 표시된 부품. 26화면이 이것을 공유한다.
 * h08(빈 상태) · h09(목록·메뉴) · h10(이름 바꾸기) · h11(삭제 확인) · f05(로그아웃 확인).
 *
 * 폭 260 고정. 1024 미만에서는 왼쪽 서랍으로 접히는데, 그 껍데기는 작업 화면이 씌운다.
 */
export function Sidebar({ selectedId }: { selectedId?: string }) {
  const navigate = useNavigate();
  const { list, loaded, load, create, rename, remove } = useCaseStore();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  useEffect(() => {
    if (!loaded) void load();
  }, [loaded, load]);

  const deleting = list.find((c) => c.id === deleteTarget);

  return (
    <aside className="flex h-full w-65 shrink-0 flex-col border-r border-line bg-bg">
      <div className="flex h-14 flex-none items-center gap-2 px-4">
        <BrandMark />
      </div>

      <div className="flex-none px-3 pt-1 pb-4">
        <Button
          variant="secondary"
          className="w-full"
          onClick={async () => navigate(`/cases/${await create()}`)}
        >
          <Icon name="plus" size={15} strokeWidth={2} />새 사건
        </Button>
      </div>

      <p className="mb-2 flex-none px-4 text-[12px] font-semibold tracking-[0.6px] text-muted">
        내 사건
      </p>

      {loaded && list.length === 0 ? (
        <p className="mx-3 rounded-md border border-dashed border-line px-3 py-5 text-center text-[13.5px] leading-[1.5] text-muted">
          아직 사건이 없어요.
          <br />첫 사건을 만들어 보세요.
        </p>
      ) : (
        <div className="panel-scroll flex flex-1 flex-col gap-1 px-3">
          {list.map((item) => (
            <CaseRow
              key={item.id}
              item={item}
              selected={item.id === selectedId}
              onRename={(title) => void rename(item.id, title)}
              onDelete={() => setDeleteTarget(item.id)}
              onHistory={() => navigate(`/cases/${item.id}?panel=history`)}
            />
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-none items-center gap-2 border-t border-line px-4 py-3">
        <span
          className="box-border flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-[12px] leading-[1.35] font-medium text-ink-2"
          aria-hidden
        >
          현
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">
          demo@cardefender.kr
        </span>
        <button
          type="button"
          onClick={() => setLogoutOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm px-2 text-[12.5px] text-muted hover:bg-bg-2 sm:min-h-8"
        >
          <Icon name="logout" size={13} />
          나가기
        </button>
      </div>

      <ConfirmDialog
        open={deleting !== undefined}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void remove(deleteTarget);
          setDeleteTarget(null);
          if (deleteTarget === selectedId) navigate('/cases');
        }}
        title="사건을 삭제할까요?"
        description={`"${deleting?.title ?? '이름 없는 사건'}"의 영상과 대화, 서류가 함께 지워지고 되돌릴 수 없어요.`}
        confirmLabel="삭제"
        confirmVariant="danger"
      />

      <ConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={() => {
          setLogoutOpen(false);
          navigate('/');
        }}
        title="로그아웃할까요?"
        description="사건과 영상, 서류는 계정에 안전하게 보관돼요. 다시 로그인하면 이어서 볼 수 있어요."
        confirmLabel="로그아웃"
      />
    </aside>
  );
}
