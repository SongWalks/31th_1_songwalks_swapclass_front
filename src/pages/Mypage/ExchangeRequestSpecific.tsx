import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { Toast } from '@/components/common/Toast';
import { Avatar } from '@/components/common/Avatar';
import { ICONS } from '@/constants/icons';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';

// API 함수 임포트
import {
  getProposalDetail,
  acceptProposal,
  rejectProposal,
  type ProposalData,
} from '@/api/proposalApi';

// SVG 파일
import throwArrow from '@/assets/icons/throw_arrow.svg';
import blueCheck from '@/assets/icons/blue_check.svg';

const ExchangeRequestSpecific: React.FC = () => {
  const navigate = useNavigate();
  const { proposalId } = useParams<{ proposalId: string }>();

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [modalType, setModalType] = useState<'reject' | 'accept' | null>(null);

  const [proposalDetail, setProposalDetail] = useState<ProposalData | null>(
    null,
  );

  useEffect(() => {
    const fetchDetail = async () => {
      if (!proposalId) return;
      try {
        const response = await getProposalDetail(Number(proposalId));
        if (response.success) {
          setProposalDetail(response.data);
        }
      } catch (error) {
        console.error('상세 정보를 불러오는데 실패했습니다.', error);
      }
    };

    fetchDetail();
  }, [proposalId]);

  const handleConfirmReject = async () => {
    if (!proposalId) return;
    try {
      const response = await rejectProposal(Number(proposalId));
      if (response.success) {
        setModalType(null);
        setToastMessage('교환을 거절했습니다.');
        setShowToast(true);
        setTimeout(() => {
          navigate('/my/request');
        }, 1000);
      }
    } catch (error) {
      console.error('교환 거절 실패:', error);
    }
  };

  const handleConfirmAccept = async () => {
    if (!proposalId) return;
    try {
      const response = await acceptProposal(Number(proposalId));
      if (response.success) {
        setModalType(null);
        setToastMessage('교환을 수락했습니다.');
        setShowToast(true);

        const chatRoomId = response.data?.chatRoomId;
        setTimeout(() => {
          if (chatRoomId) {
            navigate(`/chat/${chatRoomId}`);
          } else {
            navigate('/chat');
          }
        }, 1000);
      }
    } catch (error) {
      console.error('교환 수락 실패:', error);
    }
  };

  if (!proposalDetail) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-neutral-50 text-neutral-400">
        불러오는 중...
      </div>
    );
  }

  // Swagger 구조에서 데이터 추출
  const sender = proposalDetail.senderPost; // 상대방 게시글
  const receiver = proposalDetail.receiverPost; // 내 게시글

  return (
    <div className="w-full min-h-screen flex flex-col font-['Pretendard'] bg-neutral-50 relative pb-44">
      {/* 1. 고정 헤더 */}
      <div className="sticky top-0 z-50 bg-neutral-50">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={
            <div className="text-black/70 text-[17px] font-semibold tracking-wide">
              게시글 상세
            </div>
          }
          rightNode={
            <IconButton icon={ICONS.MORE_VERTICAL} className="text-black/40" />
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2">
        {/* 2. 프로필 영역 */}
        <div className="flex items-center gap-3.5 py-4 px-2 border-b border-gray-200 mb-6">
          <Avatar size="md" />
          <div className="flex flex-col gap-0.5">
            <div className="text-zinc-900 text-base font-semibold leading-tight tracking-wide">
              {sender?.authorNickname || '너송'}
            </div>
            <div className="text-neutral-500 text-[12px] font-light leading-tight">
              받은 요청 3개
            </div>
          </div>
        </div>

        {/* 3. 상대방 버릴 과목 */}
        <section className="mb-8">
          <h2 className="text-rose-500 text-[15px] font-bold px-1 mb-3 tracking-wide">
            상대방 버릴 과목
          </h2>

          <div className="relative w-full bg-red-600/5 rounded-lg border border-zinc-300 p-5 min-h-[112px] flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="relative w-7 h-7 shrink-0 flex items-center justify-center mt-0.5">
                <div className="size-6 bg-red-100 rounded-full" />
                <img
                  src={throwArrow}
                  alt="throw"
                  className="absolute w-4 h-4 object-contain"
                />
              </div>

              <div className="flex flex-col pt-0.5">
                <div className="text-zinc-900 text-base font-semibold mb-1 tracking-tight">
                  {sender?.discardCourse?.name || '과목명 없음'}
                </div>
                <div className="text-neutral-500 text-sm font-light leading-[1.4] tracking-wide">
                  교수 : {sender?.discardCourse?.professor || '정보 없음'}
                  <br />
                  시간 : {sender?.discardCourse?.classTime || '정보 없음'}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end h-full min-h-[72px]">
              <div className="px-2.5 py-1 bg-red-100 rounded-lg border-[0.5px] border-neutral-400 flex justify-center items-center">
                <span className="text-zinc-900 text-xs font-normal tracking-wide">
                  {sender?.discardCourse?.courseType || '교양필수'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 요청받은 내 게시글 */}
        <section className="mb-6">
          <h2 className="text-brand-lightBlue text-[15px] font-bold px-1 mb-3 tracking-wide">
            요청받은 내 게시글
          </h2>
          <div className="w-full bg-blue-100/25 rounded-lg border border-brand-lightBlue p-5 flex flex-col">
            <div className="inline-flex w-fit px-2.5 py-1 bg-sky-100 rounded-lg border-[0.5px] border-brand-lightBlue justify-center items-center mb-3">
              <span className="text-cyan-900 text-xs font-light tracking-wide">
                버릴 과목
              </span>
            </div>

            <div className="text-zinc-900 text-base font-semibold mb-1 tracking-tight">
              {receiver?.discardCourse?.name || '내 과목명'}
            </div>
            <div className="text-neutral-500 text-sm font-normal leading-[1.4] tracking-wide mb-3">
              교수 : {receiver?.discardCourse?.professor || '정보 없음'}
              <br />
              시간 : {receiver?.discardCourse?.classTime || '정보 없음'}
            </div>

            <div className="flex flex-row gap-2 mb-4">
              <Badge variant="outlineBlue">
                {receiver?.discardCourse?.courseType || '전공필수'}
              </Badge>
              <Badge variant="outlineBlue">
                {receiver?.discardCourse?.department || '학과'}
              </Badge>
            </div>

            <div className="w-full border-t border-gray-200 mb-4" />

            <div className="text-zinc-900 text-sm font-normal mb-1 tracking-wide">
              원하는 과목
            </div>

            {/* Swagger의 wantedCourses 배열을 순회하며 매칭 순위에 따라 파란색 강조 */}
            <div className="flex flex-col gap-1">
              {receiver?.wantedCourses?.map((item) => {
                const rank = item.priority;
                const isMatched = rank === proposalDetail.matchRank;

                return (
                  <div
                    key={rank}
                    className={`flex items-center gap-1.5 text-sm font-normal tracking-wide ${
                      isMatched ? 'text-brand-lightBlue' : 'text-neutral-500'
                    }`}
                  >
                    <span>
                      {rank}순위 : {item.course.name}
                    </span>
                    {isMatched && (
                      <img
                        src={blueCheck}
                        alt="matched"
                        className="w-4 h-4 object-contain ml-0.5"
                      />
                    )}
                  </div>
                );
              }) || (
                <span className="text-sm text-neutral-400">
                  목록이 없습니다.
                </span>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 5. 노란색 경고창 & 하단 버튼 영역 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-white border-t border-zinc-200 shadow-lg">
        <div className="w-full bg-yellow-50 px-4 py-3 flex items-start gap-1">
          <span className="text-yellow-500 text-sm mt-[1px]">⚠</span>
          <p className="text-yellow-700 text-sm font-medium leading-[1.4] tracking-tight break-keep">
            본인의 일방적인 파기가 확인되는 경우 페널티를 받을 수 있으니 실제로
            교환을 할 의사가 있을 경우에만 수락을 눌러주세요
          </p>
        </div>

        <div className="flex items-center h-20 gap-3 p-4 bg-white">
          <button
            onClick={() => setModalType('reject')}
            className="flex-1 py-3.5 bg-white text-zinc-400 text-lg font-semibold tracking-wide rounded-2xl border border-zinc-300 transition-colors active:bg-gray-50 cursor-pointer"
          >
            거절
          </button>
          <button
            onClick={() => setModalType('accept')}
            className="flex-1 py-3.5 bg-brand-lightBlue text-white text-lg font-semibold tracking-wide rounded-2xl transition-colors hover:opacity-90 active:opacity-80 cursor-pointer"
          >
            수락
          </button>
        </div>
      </div>

      {/* 6. 거절 모달 */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={() => setModalType(null)}
        icon={
          <div className="size-7 flex items-center justify-center">
            <Icon
              icon="ph:warning-duotone"
              className="text-rose-500 text-2xl"
            />
          </div>
        }
        title="정말 거절하시겠습니까?"
        footer={
          <>
            <button
              onClick={() => setModalType(null)}
              className="flex-1 py-3 bg-white text-zinc-700 text-base font-semibold rounded-2xl border border-zinc-300 transition-colors active:bg-gray-50 cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleConfirmReject}
              className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white text-base font-semibold rounded-2xl transition-colors cursor-pointer"
            >
              거절
            </button>
          </>
        }
      >
        <p className="text-center justify-center text-slate-500 text-sm font-light font-['Pretendard'] leading-4 tracking-wide my-1">
          거절 후에는 동일한 게시글로부터
          <br />
          다시 요청을 받을 수 없습니다.
        </p>
      </Modal>

      {/* 7. 수락 모달 */}
      <Modal
        isOpen={modalType === 'accept'}
        onClose={() => setModalType(null)}
        icon={
          <div className="size-7 flex items-center justify-center">
            <img
              src={blueCheck}
              alt="check"
              className="w-6 h-6 object-contain"
            />
          </div>
        }
        title="교환을 수락합니다"
        footer={
          <>
            <button
              onClick={() => setModalType(null)}
              className="flex-1 py-3 bg-white text-zinc-700 text-base font-semibold rounded-2xl border border-zinc-300 transition-colors active:bg-gray-50 cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={handleConfirmAccept}
              className="flex-1 py-3 bg-brand-lightBlue hover:bg-blue-500 text-white text-base font-semibold rounded-2xl transition-colors cursor-pointer"
            >
              확인
            </button>
          </>
        }
      >
        <p className="text-center justify-center text-slate-500 text-sm font-light font-['Pretendard'] leading-4 tracking-wide my-1">
          수락 후 교환 채팅방이 생성됩니다!
          <br />
          동일 게시글의 다른 대기 중 요청은 자동으로
          <br />
          거절됩니다.
        </p>
      </Modal>

      {/* 8. 공통 Toast */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default ExchangeRequestSpecific;
