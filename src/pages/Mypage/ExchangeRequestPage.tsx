import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { NotificationBell } from '@/components/common/NotificationBell';
import { ICONS } from '@/constants/icons';
import { Toast } from '@/components/common/Toast';
import { Tabs } from '@/components/common/Tabs';
import { Modal } from '@/components/common/Modal';
import {
  getReceivedProposals,
  getSentProposal,
  withdrawProposal,
  type ProposalData,
} from '@/api/recommend/proposalApi';

// 탭 메뉴용 아이콘
import ActiveBoxIcon from '@/assets/icons/mypage/box.svg'; // 액티브: 받은 요청
import InactiveBoxIcon from '@/assets/icons/mypage/gray_box.svg'; // 인액티브: 받은 요청
import InactivSendIcon from '@/assets/icons/mypage/blue_send.svg'; // 액티브: 보낸 요청
import ActiveSendIcon from '@/assets/icons/mypage/send.svg'; // 인액티브: 보낸 요청
import movementIcon from '@/assets/icons/mypage/movement.svg';
import requestCommentIcon from '@/assets/icons/mypage/request_comment.svg';
import finalAlertIcon from '@/assets/icons/mypage/final_alert.svg';

// 💡 courseId/name 등 과목 요약 정보 (제안 상세 안의 discardCourse/wantedCourses에서 쓰임)
interface CourseSummary {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
}

interface WantedCourseEntry {
  priority: number;
  course: CourseSummary;
}

interface CounterpartPost {
  postId: number;
  discardCourse: CourseSummary;
  wantedCourses: WantedCourseEntry[];
}

// 💡 서버가 실제로 내려주는 형태 (ProposalData 기본 타입 + 백엔드가 나중에 추가해준 필드들).
// expiresAt은 서버에서 문자열(ISO)로 옴.
type RawProposal = Omit<ProposalData, 'expiresAt'> & {
  expiresAt?: string;
  receiverPostId?: number;
  receivedCount?: number;
  counterpartPost?: CounterpartPost;
};

// 💡 화면에서 실제로 쓰는 형태: expiresAt을 문자열 대신 ms 타임스탬프 숫자로 변환해서 보관
interface EnrichedProposal extends Omit<RawProposal, 'expiresAt'> {
  expiresAt?: number;
}

const parseAsUtcMs = (dateString?: string): number | undefined => {
  if (!dateString) return undefined;
  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(dateString);
  const normalized = hasTimezone ? dateString : `${dateString}`;
  const ms = new Date(normalized).getTime();
  return Number.isNaN(ms) ? undefined : ms;
};

// 💡 남은 시간 표시 헬퍼: 30~20분 파랑 / 19~10분 주황 / 9~0분 빨강
const formatRemaining = (totalSeconds: number) => {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}m${String(s).padStart(2, '0')}s`;
};

const getRemainingColorClass = (totalSeconds: number) => {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  if (minutes >= 20) return 'text-brand-lightBlue';
  if (minutes >= 10) return 'text-[#F98E15]';
  return 'text-rose-500';
};

const ExchangeRequestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [activeTabId, setActiveTabId] = useState<string>(
    (location.state as { initialTab?: string } | null)?.initialTab ??
      'received',
  );
  const [openSections, setOpenSections] = useState<
    Record<number | string, boolean>
  >({
    1: true,
    2: false,
    3: false,
    unranked: false,
  });

  const hasClearedLocationStateRef = useRef(false);
  useEffect(() => {
    if (hasClearedLocationStateRef.current) return;
    if (!location.state) return;
    hasClearedLocationStateRef.current = true;
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate]);

  // 2. 데이터 상태 관리 — React Query (useEffect + setState 없이 훅이 알아서 로딩/데이터 관리)
  const { data: receivedProposals = [] } = useQuery({
    queryKey: ['receivedProposals'],
    queryFn: async (): Promise<EnrichedProposal[]> => {
      const receivedRes = await getReceivedProposals();
      if (!receivedRes.success) return [];
      return (receivedRes.data || []).map((item) => {
        const raw = item as unknown as RawProposal;
        return { ...raw, expiresAt: parseAsUtcMs(raw.expiresAt) };
      });
    },
  });

  const { data: sentProposal = null } = useQuery({
    queryKey: ['sentProposal'],
    queryFn: async (): Promise<EnrichedProposal | null> => {
      const sentRes = await getSentProposal();
      if (!sentRes.success || !sentRes.data) return null;
      const raw = sentRes.data as unknown as RawProposal;
      return { ...raw, expiresAt: parseAsUtcMs(raw.expiresAt) };
    },
  });

  const isSentProposalActive = sentProposal?.status === 'PENDING';

  // 💡 받은 요청 카드마다 남은 시간을 실시간으로 보여주기 위한 공용 틱(1초마다 갱신).
  // setInterval '콜백' 안에서 setState 하는 거라 안전한 패턴(effect 본문에서 직접 호출 아님).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. UI 상태 관리 (토스트, 모달)
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // 빨간 점(알림) 표시 여부를 위한 변수 (받은 요청이 1개라도 있으면 true)
  const hasReceivedRequests = receivedProposals.length > 0;

  // 5. 핸들러: 아코디언 토글
  const toggleSection = (priority: number | string) => {
    setOpenSections((prev) => ({
      ...prev,
      [priority]: !prev[priority],
    }));
  };

  // 6. 핸들러: 요청 철회 API 호출
  const withdrawMutation = useMutation({
    mutationFn: async (proposalId: number) => {
      const response = await withdrawProposal(proposalId);
      return response.success;
    },
    onSuccess: (success) => {
      if (!success) return;
      setIsWithdrawModalOpen(false);
      queryClient.setQueryData(['sentProposal'], null);
      setTimeout(() => setIsToastVisible(true), 150);
    },
    onError: (error) => {
      console.error('요청 철회 실패:', error);
    },
  });

  const handleWithdrawRequest = () => {
    if (!isSentProposalActive || !sentProposal) return;
    withdrawMutation.mutate(sentProposal.id);
  };

  // 7. Tabs 컴포넌트 아이템 구성
  const tabItems = [
    {
      id: 'received',
      label: (
        <div className="relative inline-flex items-center justify-center gap-1">
          <img
            src={activeTabId === 'received' ? ActiveBoxIcon : InactiveBoxIcon}
            alt="받은 요청"
            className="w-5 h-4"
          />
          <span>받은 요청</span>
          {hasReceivedRequests && (
            <span className="absolute -top-1 -right-2 size-[3.7px] bg-rose-500 rounded-full" />
          )}
        </div>
      ) as unknown as string,
    },
    {
      id: 'sent',
      label: (
        <div className="inline-flex items-center justify-center gap-1">
          <img
            src={activeTabId === 'sent' ? InactivSendIcon : ActiveSendIcon}
            alt="보낸 요청"
            className="w-5 h-5"
          />
          <span>보낸 요청</span>
        </div>
      ) as unknown as string,
    },
  ];

  return (
    <div className="w-full h-full min-h-0 flex flex-col font-['Pretendard'] relative bg-[#FBFBFB]">
      <div className="sticky top-0 z-50 bg-[#FBFBFB]">
        {/* 상단 헤더 */}
        <div className="[&>*]:!border-none">
          <Header
            leftNode={
              <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
            }
            title={<div>교환 요청함</div>}
            rightNode={<NotificationBell />}
          />
        </div>

        {/* 공통 Tabs 컴포넌트 */}
        <div className="relative border-b border-gray-200">
          <Tabs
            tabs={tabItems}
            activeTabId={activeTabId}
            onTabChange={(id) => setActiveTabId(id)}
            variant="line"
          />
        </div>
      </div>

      {/* 3. 본문 영역 (내부에서만 스크롤되게 함 — min-h-screen이 DefaultLayout의 남는 공간보다
          커서 EmptyState만 있어도 페이지 자체가 스크롤되던 문제 수정) */}
      <div className="flex-1 min-h-0 overflow-y-auto pb-28">
        {activeTabId === 'received' ? (
          /* --- [받은 요청] 탭 내용 --- */
          <div className="px-5 pt-6 flex flex-col gap-4">
            {([1, 2, 3, 'unranked'] as const).map((priority) => {
              const isOpen = openSections[priority];
              const isUnranked = priority === 'unranked';

              const rankProposals = receivedProposals.filter((item) =>
                isUnranked
                  ? item.matchRank === null || item.matchRank === undefined
                  : item.matchRank === priority,
              );

              const hasRequest = rankProposals.length > 0;
              const isInactiveWithRequest = !isOpen && hasRequest;
              const sectionLabel = isUnranked
                ? '순위에 없는 과목'
                : `${priority}순위 과목`;

              return (
                <div
                  key={priority}
                  className={`w-full flex flex-col transition-all duration-300 ${
                    isOpen ? 'shadow-sm rounded-lg' : ''
                  }`}
                >
                  {/* 아코디언 헤더 */}
                  <div
                    onClick={() => toggleSection(priority)}
                    className={`w-full cursor-pointer flex items-center justify-between transition-all duration-200 select-none ${
                      isOpen
                        ? 'h-11 px-4 bg-blue-50 border border-brand-lightBlue rounded-t-lg z-10'
                        : `h-12 px-5 bg-white rounded-full shadow-sm border ${
                            isInactiveWithRequest
                              ? 'border-rose-500'
                              : 'border-gray-200'
                          }`
                    }`}
                  >
                    <div className="flex items-center gap-1 relative">
                      <span
                        className={`text-sm font-medium tracking-tight ${
                          isOpen
                            ? 'text-cyan-950'
                            : isInactiveWithRequest
                              ? 'text-rose-500'
                              : 'text-slate-500'
                        }`}
                      >
                        {sectionLabel}
                      </span>
                      {isInactiveWithRequest && (
                        <span className="size-[3.7px] bg-rose-500 rounded-full mb-2" />
                      )}
                    </div>

                    <Icon
                      icon={
                        isOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'
                      }
                      className={`w-5 h-5 transition-transform duration-200 ${
                        isOpen
                          ? 'text-brand-lightBlue'
                          : isInactiveWithRequest
                            ? 'text-rose-500'
                            : 'text-gray-300'
                      }`}
                    />
                  </div>

                  {/* 아코디언 바디 */}
                  {isOpen && (
                    <div className="min-h-[250px] bg-white border border-t-0 border-gray-300 rounded-b-lg flex flex-col overflow-hidden animate-fade-in-up">
                      {rankProposals.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
                          <Icon
                            icon={ICONS.WARNING}
                            className="w-10 h-10 mb-4 text-brand-lightBlue"
                          />
                          <span className="text-black text-sm font-medium leading-5 tracking-wide mb-1">
                            아직 {sectionLabel}의 교환 요청이 없어요!
                          </span>
                          <span className="text-neutral-500 text-sm font-light leading-5 tracking-wide">
                            교환 요청이 도착하면 이곳에서 확인할 수 있습니다
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col divide-y divide-gray-100">
                          {rankProposals.map((req) => {
                            const remainSeconds =
                              req.expiresAt !== undefined
                                ? Math.max(
                                    0,
                                    Math.round((req.expiresAt - now) / 1000),
                                  )
                                : undefined;

                            const counterpartWanted = [
                              ...(req.counterpartPost?.wantedCourses || []),
                            ].sort((a, b) => a.priority - b.priority);

                            return (
                              <div
                                key={req.id}
                                onClick={() =>
                                  navigate(`/proposal/${req.id}`, {
                                    state: {
                                      receivedCount: req.receivedCount,
                                    },
                                  })
                                }
                                className="p-5 flex flex-col relative cursor-pointer hover:bg-neutral-50/80 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-black text-xl font-medium leading-5 tracking-wide">
                                    {req.counterpartPost?.discardCourse?.name}
                                  </span>
                                  <div className="flex items-center gap-2 ">
                                    {remainSeconds !== undefined && (
                                      <span
                                        className={`flex items-center gap-1 text-xs font-bold tracking-wide ${getRemainingColorClass(
                                          remainSeconds,
                                        )}`}
                                      >
                                        <Icon
                                          icon="lucide:clock"
                                          className="w-3 h-3"
                                        />
                                        {formatRemaining(remainSeconds)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {counterpartWanted.length > 0 && (
                                  <div className="flex flex-col gap-1.5 pl-1">
                                    {counterpartWanted.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-2"
                                      >
                                        <div className="w-3.5 h-3.5 bg-blue-100 rounded-full flex items-center justify-center text-[8px] text-black/60 font-light shrink-0">
                                          {idx + 1}
                                        </div>
                                        <span className="text-black/70 text-sm font-light leading-5 tracking-wide">
                                          {item.course?.name}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/proposal/${req.id}`, {
                                      state: {
                                        receivedCount: req.receivedCount,
                                      },
                                    });
                                  }}
                                  className="absolute right-5 bottom-4 flex items-center text-neutral-500 text-xs font-light tracking-tight cursor-pointer gap-1"
                                >
                                  <img
                                    src={requestCommentIcon}
                                    alt="받은 요청"
                                    className="w-3.5 h-3.5"
                                  />
                                  받은 요청 {req.receivedCount}개
                                  <img
                                    src={movementIcon}
                                    alt="이동"
                                    className="w-3.5 h-3.5"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* --- [보낸 요청] 탭 내용 --- */
          <div className="flex-1 flex flex-col px-6 pt-6">
            {!isSentProposalActive ? (
              /* 1. 보낸 요청 데이터가 없을 때 (비어있을 때) */
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-center">
                <Icon
                  icon={ICONS.WARNING}
                  className="w-10 h-10 mb-4 text-brand-lightBlue opacity-50"
                />

                <span className="text-black text-sm font-medium leading-5 tracking-wide mb-1">
                  아직 보낸 교환 게시글이 없어요.
                </span>
                <span className="text-neutral-500 text-sm font-light leading-5 tracking-wide mb-6">
                  교환 매칭 추천함에서 조건에 맞는 강의를 찾아 <br />
                  교환을 제안해 보세요!
                </span>

                <button
                  onClick={() => navigate('/my/exchange-recommend')}
                  className="flex items-center justify-center gap-1 text-brand-lightBlue text-base font-medium underline tracking-wide cursor-pointer hover:opacity-80 transition-opacity mx-auto"
                >
                  <span>교환 매칭 추천함 가기 &gt; </span>
                </button>
              </div>
            ) : (
              /* 2. 보낸 요청 데이터가 존재할 때 */
              <div
                onClick={() =>
                  navigate(`/board/${sentProposal.receiverPostId}`)
                }
                className="w-full flex flex-col px-1 relative cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-black text-xl font-medium leading-5 tracking-wide">
                    {sentProposal.counterpartPost?.discardCourse?.name}
                  </span>
                  {(() => {
                    const sentRemainSeconds =
                      sentProposal.expiresAt !== undefined
                        ? Math.max(
                            0,
                            Math.round((sentProposal.expiresAt - now) / 1000),
                          )
                        : undefined;

                    if (sentRemainSeconds === undefined) {
                      return (
                        <span className="flex items-center gap-1 text-xs font-bold tracking-wide text-zinc-400">
                          <Icon icon="lucide:clock" className="w-3 h-3" />-
                        </span>
                      );
                    }

                    return (
                      <span
                        className={`flex items-center gap-1 text-xs font-bold tracking-wide ${getRemainingColorClass(
                          sentRemainSeconds,
                        )}`}
                      >
                        <Icon icon="lucide:clock" className="w-3 h-3" />
                        {formatRemaining(sentRemainSeconds)}
                      </span>
                    );
                  })()}
                </div>

                <div className="flex flex-col gap-1.5 pl-1 mb-5">
                  {[...(sentProposal.counterpartPost?.wantedCourses || [])]
                    .sort((a, b) => a.priority - b.priority)
                    .map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 bg-blue-100 rounded-full flex items-center justify-center text-[8px] text-black/60 font-light shrink-0">
                          {idx + 1}
                        </div>
                        <span className="text-black/70 text-sm font-light leading-5 tracking-wide">
                          {item.course?.name}
                        </span>
                      </div>
                    ))}
                </div>

                <div className="flex items-center justify-end text-zinc-400 text-xs font-normal gap-2.5 mb-5">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <img
                      src={requestCommentIcon}
                      alt="받은 요청"
                      className="w-3.5 h-3.5"
                    />
                    <span>받은 요청 {sentProposal.receivedCount}개</span>
                    <img src={movementIcon} alt="이동" className="w-3 h-3" />
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsWithdrawModalOpen(true);
                  }}
                  className="w-full h-11 bg-brand-lightBlue text-white text-sm font-medium rounded-2xl flex items-center justify-center tracking-wide hover:opacity-90 transition-opacity cursor-pointer"
                >
                  요청 철회
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. 하단 고정 안내 박스 */}
      {activeTabId === 'sent' && isSentProposalActive && (
        <div className="fixed left-1/2 -translate-x-1/2 w-full relative bg-yellow-50 px-6 py-3.5 border-t border-yellow-100 flex items-center justify-start text-left z-40 shadow-lg">
          <span className="text-yellow-700 text-sm font-normal leading-5 tracking-wide whitespace-pre-line">
            {`진행 중인 교환 요청이 있습니다.\n새 요청은 철회 후 보낼 수 있습니다.`}
          </span>
        </div>
      )}

      <Modal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        icon={
          <div className="flex items-center justify-center">
            <img src={finalAlertIcon} alt="" className="w-[34px] h-[34px]" />
          </div>
        }
        title="요청을 철회하시겠습니까?"
        footer={
          <>
            <button
              onClick={() => setIsWithdrawModalOpen(false)}
              className="flex-1 h-11 rounded-2xl border border-gray-300 text-sm font-medium"
            >
              취소
            </button>

            <button
              onClick={handleWithdrawRequest}
              className="flex-1 h-11 rounded-2xl bg-rose-500 text-white text-sm font-medium"
            >
              철회
            </button>
          </>
        }
      >
        <p className="text-center justify-center text-slate-500 text-sm font-light font-['Pretendard'] leading-4 tracking-wide">
          요청을 철회하면
          <br />
          상대방에게는 더 이상 표시되지 않으며,
          <br />
          다른 게시글에 새로운 교환 요청을
          <br />
          보낼 수 있습니다.
        </p>
      </Modal>

      {/* 5. 공통 Toast 컴포넌트 연결 */}
      <Toast
        message="요청이 철회되었습니다."
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />
    </div>
  );
};

export default ExchangeRequestPage;
