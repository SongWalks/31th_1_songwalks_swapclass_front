import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { Modal } from '@/components/common/Modal';
import { Avatar } from '@/components/common/Avatar';
import { ICONS } from '@/constants/icons';
import axiosInstance from '@/api/axiosInstance';
import {
  getSentProposal,
  withdrawProposal,
  type ProposalData,
} from '@/api/mypage/proposalApi';

// SVG 파일
import throwArrow from '@/assets/icons/recommend/throw_arrow.svg';
import wantArrow from '@/assets/icons/recommend/want_arrow.svg';

interface CourseDetail {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
}

interface WantedCourseItem {
  priority: number;
  course: CourseDetail;
}

interface PostDetailResponse {
  postId: number;
  status: 'MATCHABLE' | 'IN_EXCHANGE' | 'COMPLETED' | string;
  authorId: number;
  authorNickname: string;
  discardCourse: CourseDetail;
  wantedCourses: WantedCourseItem[];
  createdAt: string;
  mine: boolean;
}

interface MyPostResponse {
  postId: number;
  status: 'MATCHABLE' | 'IN_EXCHANGE' | 'COMPLETED' | 'DELETED' | string;
}

const STATUS_LABEL: Record<string, string> = {
  MATCHABLE: '교환 전',
  IN_EXCHANGE: '교환 중',
  COMPLETED: '교환 완료',
};

const SpecificPostsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { postId } = useParams<{ postId: string }>();

  const [post, setPost] = useState<PostDetailResponse | null>(null);
  const [receivedRequestCount, setReceivedRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [myPostId, setMyPostId] = useState<number | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [showProposeSuccessModal, setShowProposeSuccessModal] = useState(false);

  const [sentProposal, setSentProposal] = useState<ProposalData | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [showNoPostModal, setShowNoPostModal] = useState(false);

  // 💡 게시글 삭제 확인 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 💡 상대방 글일 때: 찜하기/공유하기/신고하기
  const [isLiked, setIsLiked] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  useEffect(() => {
    if (!postId) return;

    const syncLikedState = async () => {
      try {
        const response = await axiosInstance.get('/api/me/likes');
        const likedPosts: { postId: number }[] = response.data?.data || [];
        setIsLiked(likedPosts.some((p) => p.postId === Number(postId)));
      } catch (error) {
        console.error('찜 상태 확인 실패:', error);
      }
    };

    syncLikedState();
  }, [postId]);

  useEffect(() => {
    const fetchMyPostId = async () => {
      try {
        const response = await axiosInstance.get('/api/posts/me', {
          params: { status: 'MATCHABLE' },
        });
        const myPosts: MyPostResponse[] = response.data?.data || [];
        const activePost = myPosts.find((p) => p.status === 'MATCHABLE');
        setMyPostId(activePost ? activePost.postId : null);
      } catch (error) {
        console.error('내 게시글 조회 실패:', error);
        setMyPostId(null);
      }
    };

    fetchMyPostId();
  }, []);

  const fetchSentProposal = useCallback(async () => {
    try {
      const response = await getSentProposal();
      if (response.success && response.data) {
        setSentProposal(response.data as ProposalData);
      } else {
        setSentProposal(null);
      }
    } catch (error) {
      console.error('보낸 요청 조회 실패:', error);
      setSentProposal(null);
    }
  }, []);

  useEffect(() => {
    fetchSentProposal();
  }, [fetchSentProposal]);

  const fetchPostDetail = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/posts/${postId}`);
      if (response.data?.success) {
        setPost(response.data.data as PostDetailResponse);
      }
    } catch (error) {
      console.error('게시글 상세 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  useEffect(() => {
    if (!post?.mine || !postId) return;

    const fetchReceivedRequestCount = async () => {
      try {
        const response = await axiosInstance.get('/api/proposals/received');
        const received: any[] = response.data?.data || [];
        const forThisPost = received.filter(
          (item) => item.receiverPostId === Number(postId),
        );
        setReceivedRequestCount(forThisPost.length);
      } catch (error) {
        console.error('받은 요청 개수 조회 실패:', error);
      }
    };

    fetchReceivedRequestCount();
  }, [post?.mine, postId]);

  useEffect(() => {
    const state = location.state as { justProposed?: boolean } | null;
    if (state?.justProposed) {
      setShowProposeSuccessModal(true);
      fetchSentProposal();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  const handleRequestExchange = () => {
    if (!postId) return;

    if (!myPostId) {
      setShowNoPostModal(true);
      return;
    }

    navigate(`/board/${postId}/select-my-post`);
  };

  // 💡 이 게시글로 보낸 교환 요청 철회
  const handleWithdrawExchange = () => {
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdraw = async () => {
    if (!sentProposal) return;

    try {
      setIsWithdrawing(true);
      const response = await withdrawProposal(sentProposal.id);
      if (response.success) {
        setSentProposal(null);
        setShowWithdrawModal(false);
        setToastMessage('요청이 철회되었습니다.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('요청 철회 실패:', error);
      alert('요청 철회 중 오류가 발생했습니다.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  // 💡 내 게시글 수정
  const handleEditPost = () => {
    if (!postId) return;
    navigate(`/board/${postId}/edit`);
  };

  const handleDeletePost = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!postId) return;

    try {
      setIsDeleting(true);
      const response = await axiosInstance.delete(`/api/posts/${postId}`);
      if (response.data?.success) {
        navigate('/board');
      }
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleToggleLike = async () => {
    if (!postId || isTogglingLike) return;

    try {
      setIsTogglingLike(true);
      if (isLiked) {
        await axiosInstance.delete(`/api/posts/${postId}/likes`);
        setIsLiked(false);
        setToastMessage('찜 목록에서 삭제되었습니다.');
        setShowToast(true);
      } else {
        await axiosInstance.post(`/api/posts/${postId}/likes`);
        setIsLiked(true);
        setToastMessage('찜 목록에 등록되었습니다.');
        setShowToast(true);
      }
    } catch (error) {
      console.error('찜하기 처리 실패:', error);
      alert('찜하기 처리 중 오류가 발생했습니다.');
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToastMessage('링크가 복사되었습니다.');
      setShowToast(true);
    } catch (error) {
      console.error('링크 복사 실패:', error);
    }
  };

  const handleReport = () => {
    if (!post) return;
    navigate('/report', {
      state: {
        reportedUserId: post.authorId,
        reportedUserNickname: post.authorNickname,
      },
    });
  };

  if (loading || !post) {
    return (
      <div className="relative w-full h-full flex flex-col font-['Pretendard'] bg-neutral-50">
        <div className="relative sticky top-0 z-50 bg-neutral-50">
          <Header
            leftNode={
              <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
            }
            rightNode={
              <IconButton
                icon={ICONS.MORE_VERTICAL}
                className="text-black/40"
              />
            }
          />
          <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
            <span className="text-black/70 text-[17px] font-semibold pointer-events-auto">
              게시글 상세
            </span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          불러오는 중입니다...
        </div>
      </div>
    );
  }

  const sortedWantedCourses = [...post.wantedCourses].sort(
    (a, b) => a.priority - b.priority,
  );

  // 💡 백엔드에서 receiverPostId 필드를 추가해줘서, 이제 실제 API 값으로 정확히 판단 가능
  const isProposedToThisPost =
    sentProposal?.status === 'PENDING' &&
    (sentProposal as any).receiverPostId === Number(postId);

  return (
    <div className="relative w-full h-full flex flex-col font-['Pretendard'] bg-neutral-50">
      {/* 고정 헤더 */}
      <div className="relative sticky top-0 z-50 bg-neutral-50">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          rightNode={
            <IconButton icon={ICONS.MORE_VERTICAL} className="text-black/40" />
          }
        />
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <span className="text-black/70 text-[17px] font-semibold pointer-events-auto">
            게시글 상세
          </span>
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto px-4 pt-2 relative ${
          post.mine ? 'pb-4' : 'pb-32'
        }`}
      >
        {/* 프로필 영역 */}
        <div className="flex items-center justify-between gap-3.5 py-2 px-6 border-b border-gray-200/60 mb-2">
          <div className="flex items-center gap-3.5">
            <Avatar size="md" />
            <div className="flex flex-col gap-0.5">
              <div className="text-black text-[16px] font-medium leading-tight">
                {post.authorNickname}
              </div>
              {/* 💡 남의 글일 땐 GET /api/proposals/received로 알 방법이 없어 0 고정, 내 글이면 실제 값 */}
              <div className="text-black/60 text-[12px] font-light leading-tight">
                받은 요청 {receivedRequestCount}개
              </div>
            </div>
          </div>

          {/* 💡 내 게시글일 때만: 현재 교환 상태 뱃지 */}
          {post.mine && (
            <Badge variant="outlineGray" className="shrink-0">
              {STATUS_LABEL[post.status] ?? post.status}
            </Badge>
          )}
        </div>

        {/* 버릴 과목 영역 */}
        <section className="mb-9">
          <h2 className="text-point-red text-[15px] font-bold px-3 mb-1">
            버릴 과목
          </h2>

          <CourseCard
            title={post.discardCourse.name}
            professor={post.discardCourse.professor}
            time={post.discardCourse.classTime}
            className="!bg-[#FFF0F0] !border-0 outline outline-[0.25px] outline-offset-[-0.25px] !outline-gray-200 !rounded-xl"
            leftNode={
              <div className="relative w-7 h-7 shrink-0 mt-0.5 flex items-center justify-center">
                <div className="size-6 bg-rose-200 rounded-full" />
                <img src={throwArrow} alt="throw" className="absolute size-6" />
              </div>
            }
            badges={
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="lightRed" className="!font-normal !rounded-lg">
                  {post.discardCourse.courseType}
                </Badge>
                {post.discardCourse.department && (
                  <Badge
                    variant="lightRed"
                    className="!font-normal !rounded-lg"
                  >
                    {post.discardCourse.department}
                  </Badge>
                )}
              </div>
            }
          />
        </section>

        {/* 원하는 과목 영역 */}
        <section className="mt-4 mb-10">
          <div className="mb-4 flex flex-col gap-1 px-3">
            <h2 className="text-brand-lightBlue text-[15px] font-bold">
              원하는 과목
            </h2>
            <p className="text-gray-400 text-[11px] font-normal">
              최소 1개 이상 선택해주세요
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {sortedWantedCourses.map((item) => (
              <div key={item.priority}>
                <div className="text-gray-800 text-[13px] font-medium mb-1.5 ml-1">
                  {item.priority}순위
                </div>
                <CourseCard
                  title={item.course.name}
                  professor={item.course.professor}
                  time={item.course.classTime}
                  className="!bg-[#F4F8FB] !border-0 outline outline-[0.25px] outline-offset-[-0.25px] !outline-gray-200 !rounded-xl"
                  leftNode={
                    <div className="relative w-7 h-6 shrink-0 mt-0.5 flex items-center justify-center">
                      <div className="size-6 bg-sky-200 rounded-full" />
                      <img
                        src={wantArrow}
                        alt="want"
                        className="absolute size-5"
                      />
                    </div>
                  }
                  badges={
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant="lightBlueOutline"
                        className="!font-normal !rounded-lg"
                      >
                        {item.course.courseType}
                      </Badge>
                      {item.course.department && (
                        <Badge
                          variant="lightBlueOutline"
                          className="!font-normal !rounded-lg"
                        >
                          {item.course.department}
                        </Badge>
                      )}
                    </div>
                  }
                />
              </div>
            ))}
          </div>
        </section>

        {/* 💡 상대방 글일 때만: 찜하기 / 공유하기 / 신고하기 */}
        {!post.mine && (
          <div className="flex items-center justify-center gap-6 py-3 border-y border-gray-200 mb-6">
            <button
              onClick={handleToggleLike}
              disabled={isTogglingLike}
              className="flex items-center gap-1.5 text-slate-500 text-sm font-light"
            >
              <Icon
                icon={isLiked ? 'mdi:heart' : 'mdi:heart-outline'}
                className={`w-5 h-5 ${isLiked ? 'text-rose-500' : ''}`}
              />
              찜하기
            </button>
            <div className="w-px h-4 bg-slate-500" />
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-slate-500 text-sm font-light"
            >
              <Icon icon="mdi:share-outline" className="w-5 h-5" />
              공유하기
            </button>
            <div className="w-px h-4 bg-slate-500" />
            <button
              onClick={handleReport}
              className="flex items-center gap-1.5 text-slate-500 text-sm font-light"
            >
              <Icon icon="mdi:flag-outline" className="w-5 h-5" />
              신고하기
            </button>
          </div>
        )}

        {/* 안내사항 */}
        <section className="mb-6">
          {post.mine && (
            <div className="w-full bg-[#E6EFF5] rounded-xl border border-brand-lightBlue p-5">
              <h3 className="text-zinc-900 text-lg font-semibold mb-3">
                안내사항
              </h3>
              <p className="text-zinc-900 text-xs font-light leading-relaxed">
                버릴 과목은 등록 후 수정할 수 없습니다
                <br />
                원하는 과목은 수정이 가능합니다
                <br />
                매칭 전 상태에서만 게시글 삭제가 가능합니다
                <br />
                같은 과목으로 여러 개의 게시글을 작성할 수 없습니다
              </p>
            </div>
          )}
        </section>

        {/* 💡 내 게시글일 때: 수정/삭제 - 스크롤 맨 끝에 위치 (하단 고정 아님) */}
        {post.mine && (
          <div className="flex items-center justify-center gap-6 py-3 border-y border-gray-200 mb-6">
            <button
              onClick={handleEditPost}
              className="flex items-center gap-1.5 text-zinc-900 text-xs"
            >
              <Icon
                icon="mdi:pencil-outline"
                className="size-5 text-neutral-500"
              />
              <p className="justify-center text-zinc-900 text-xs font-light font-['Work_Sans'] leading-5 tracking-tight">
                게시글 수정하기
              </p>
            </button>
            <div className="w-px h-4 bg-slate-500" />
            <button
              onClick={handleDeletePost}
              className="flex items-center gap-1.5 text-zinc-900 text-xs"
            >
              <Icon icon={ICONS.CLOSE} className="size-5 text-neutral-500" />
              <p className="justify-center text-zinc-900 text-xs font-light font-['Work_Sans'] leading-5 tracking-tight">
                게시글 삭제하기
              </p>
            </button>
          </div>
        )}
      </div>

      {/* 하단 고정 영역: 남의 글일 때만 교환 요청하기/철회하기 (내 글일 때는 위에서 스크롤 콘텐츠 안에 수정/삭제로 처리) */}
      {!post.mine && (
        <div className="sticky bottom-0 left-0 right-0 z-10 pointer-events-none mt-auto">
          <div className="bg-gradient-to-t from-neutral-50 via-neutral-50/90 to-transparent pt-5 pb-6 px-4 pointer-events-auto flex flex-col gap-3">
            <p className="text-center text-gray-500 text-[11px] font-light">
              {isProposedToThisPost
                ? '요청을 철회하면 다른 게시글에 새로운 교환 요청을 보낼 수 있습니다.'
                : '교환 요청 시 상대방이 30분 내에 수락해야 매칭이 성사됩니다.'}
            </p>

            <Button
              size="lg"
              variant={isProposedToThisPost ? 'danger' : 'primary'}
              fullWidth={true}
              onClick={
                isProposedToThisPost
                  ? handleWithdrawExchange
                  : handleRequestExchange
              }
              className="text-white text-lg !font-semibold font-['Pretendard'] leading-5 tracking-wide"
            >
              {isProposedToThisPost ? '교환 철회하기' : '교환 요청하기'}
            </Button>
          </div>
        </div>
      )}

      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      {/* 내 게시글이 없을 때 안내 모달 */}
      <Modal
        isOpen={showNoPostModal}
        onClose={() => setShowNoPostModal(false)}
        footer={
          <div className="flex flex-col w-full gap-2">
            <button
              onClick={() => {
                setShowNoPostModal(false);
                navigate('/board/write');
              }}
              className="w-full h-10 bg-brand-lightBlue rounded-2xl text-white text-base font-semibold tracking-tight hover:opacity-90 transition-opacity"
            >
              게시글 등록하기
            </button>
            <button
              onClick={() => setShowNoPostModal(false)}
              className="w-full h-10 rounded-2xl outline outline-1 outline-offset-[-1px] outline-zinc-400 text-cyan-900 text-base font-semibold tracking-tight"
            >
              확인
            </button>
          </div>
        }
      >
        등록된 교환 게시글이 없습니다.
        <br />
        먼저 글을 작성해주세요!
      </Modal>

      {/* 교환 요청 완료 모달 */}
      <Modal
        isOpen={showProposeSuccessModal}
        onClose={() => setShowProposeSuccessModal(false)}
        footer={
          <button
            onClick={() => setShowProposeSuccessModal(false)}
            className="w-full h-10 bg-brand-lightBlue rounded-2xl text-white text-base font-semibold tracking-tight hover:opacity-90 transition-opacity"
          >
            확인
          </button>
        }
      >
        <div className="flex flex-col items-center text-center w-full">
          <div className="size-9 rounded-full bg-sky-200 border-[0.5px] border-blue-400 flex items-center justify-center mb-3">
            <Icon icon="mdi:check" className="w-5 h-5 text-brand-lightBlue" />
          </div>

          <p className="text-black text-lg font-semibold mb-2">
            요청이 완료되었습니다!
          </p>
          <p className="text-slate-500 text-xs leading-5 mb-4">
            요청 내역은 [마이페이지]&gt;[교환 요청]에서
            <br />
            확인하실 수 있습니다
          </p>

          <div className="w-full bg-slate-100 rounded-3xl border-[0.5px] border-brand-lightBlue p-4 text-left">
            <p className="text-black text-xs font-medium mb-3">알아두세요</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <div className="size-6 rounded-full bg-sky-200 border-[0.5px] border-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon
                    icon="mdi:file-document-outline"
                    className="w-3.5 h-3.5 text-brand-lightBlue"
                  />
                </div>
                <p className="text-slate-500 text-xs leading-5">
                  한 게시글에는 한 번에 하나의 교환 요청만 보낼 수 있습니다
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="size-6 rounded-full bg-sky-200 border-[0.5px] border-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon
                    icon="mdi:lock-outline"
                    className="w-3 h-3 text-brand-lightBlue"
                  />
                </div>
                <p className="text-slate-500 text-xs leading-5">
                  교환요청을 보낸 후에는 다른 게시글에 추가요청을 보낼 수
                  없습니다
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="size-6 rounded-full bg-sky-200 border-[0.5px] border-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon
                    icon="mdi:clock-outline"
                    className="w-3.5 h-3.5 text-brand-lightBlue"
                  />
                </div>
                <p className="text-slate-500 text-xs leading-5">
                  다른 게시글에 요청하려면 현재 요청을 철회하거나 자동 만료될
                  때까지 기다려야합니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* 게시글 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        icon={<Icon icon={ICONS.WARNING} className="w-10 h-10 text-rose-500" />}
        title="게시글 삭제"
        footer={
          <div className="flex w-full gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="flex-1 h-11 rounded-full outline outline-1 outline-offset-[-1px] outline-gray-300 bg-white text-black text-sm font-medium tracking-tight"
            >
              취소
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 h-11 rounded-full bg-rose-500 text-white text-sm font-medium tracking-tight hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </button>
          </div>
        }
      >
        삭제 시 복구할 수 없습니다
      </Modal>

      {/* 교환 요청 철회 확인 모달 */}
      <Modal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        icon={<Icon icon={ICONS.WARNING} className="w-10 h-10 text-rose-500" />}
        title="요청을 철회하시겠습니까?"
        footer={
          <div className="flex w-full gap-2">
            <button
              onClick={() => setShowWithdrawModal(false)}
              disabled={isWithdrawing}
              className="flex-1 h-11 rounded-full outline outline-1 outline-offset-[-1px] outline-gray-300 bg-white text-black text-sm font-medium tracking-tight"
            >
              취소
            </button>
            <button
              onClick={handleConfirmWithdraw}
              disabled={isWithdrawing}
              className="flex-1 h-11 rounded-full bg-rose-500 text-white text-sm font-medium tracking-tight hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isWithdrawing ? '철회 중...' : '철회'}
            </button>
          </div>
        }
      >
        요청을 철회하면 상대방에게는 더 이상 표시되지 않으며,
        <br />
        다른 게시글에 새로운 교환 요청을 보낼 수 있습니다.
      </Modal>
    </div>
  );
};

export default SpecificPostsPage;
