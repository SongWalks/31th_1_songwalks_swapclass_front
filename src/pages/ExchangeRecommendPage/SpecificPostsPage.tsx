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

// SVG 파일
import throwArrow from '@/assets/icons/throw_arrow.svg';
import wantArrow from '@/assets/icons/want_arrow.svg';

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

// 💡 GET /api/posts/me 응답 항목 (BoardPage와 동일)
interface MyPostResponse {
  postId: number;
  status: 'MATCHABLE' | 'IN_EXCHANGE' | 'COMPLETED' | 'DELETED' | string;
}

// 💡 게시글 상태값 -> 화면 표시 문구/스타일 매핑
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
  const [loading, setLoading] = useState(true);

  // 💡 내 게시글 ID: BoardPage와 동일하게 /api/posts/me로 직접 조회
  const [myPostId, setMyPostId] = useState<number | null>(null);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 💡 SelectMyPostPage에서 제안 성공하고 돌아왔을 때 띄우는 완료 모달
  const [showProposeSuccessModal, setShowProposeSuccessModal] = useState(false);
  // 💡 제안을 이미 보냈는지 (보냈으면 "교환 요청하기" 버튼을 숨김)
  const [hasProposed, setHasProposed] = useState(false);

  // 💡 내 게시글이 없는 상태에서 교환 요청 시도했을 때 안내 모달
  const [showNoPostModal, setShowNoPostModal] = useState(false);

  // 💡 게시글 삭제 확인 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 💡 상대방 글일 때: 찜하기/공유하기/신고하기
  const [isLiked, setIsLiked] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  useEffect(() => {
    const fetchMyPostId = async () => {
      try {
        const response = await axiosInstance.get('/api/posts/me');
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

  // 💡 SelectMyPostPage에서 제안 성공 후 돌아왔을 때 완료 모달 표시
  useEffect(() => {
    const state = location.state as { justProposed?: boolean } | null;
    if (state?.justProposed) {
      setShowProposeSuccessModal(true);
      setHasProposed(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleRequestExchange = () => {
    if (!postId) return;

    if (!myPostId) {
      setShowNoPostModal(true);
      return;
    }

    // 💡 내 게시글이 있으면 어떤 게시글로 제안할지 고르는 화면으로 이동
    navigate(`/board/${postId}/select-my-post`);
  };

  // 💡 내 게시글 수정
  const handleEditPost = () => {
    if (!postId) return;
    navigate(`/board/${postId}/edit`);
  };

  // 💡 내 게시글 삭제 (DELETE /api/posts/{postId})
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

  // 💡 찜하기 토글 (POST/DELETE /api/posts/{postId}/likes)
  const handleToggleLike = async () => {
    if (!postId || isTogglingLike) return;

    try {
      setIsTogglingLike(true);
      if (isLiked) {
        await axiosInstance.delete(`/api/posts/${postId}/likes`);
        setIsLiked(false);
      } else {
        await axiosInstance.post(`/api/posts/${postId}/likes`);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('찜하기 처리 실패:', error);
      alert('찜하기 처리 중 오류가 발생했습니다.');
    } finally {
      setIsTogglingLike(false);
    }
  };

  // 💡 공유하기: 링크 복사
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToastMessage('링크가 복사되었습니다.');
      setShowToast(true);
    } catch (error) {
      console.error('링크 복사 실패:', error);
    }
  };

  // 💡 신고하기 (POST /api/reports 스키마 확인 전까지 확인창만)
  const handleReport = () => {
    if (!window.confirm('이 게시글을 신고하시겠습니까?')) return;
    // TODO: POST /api/reports 스키마 확인되면 실제 연동
    console.log('신고 대상 postId:', postId);
    alert('신고가 접수되었습니다.');
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
              {/* 💡 TODO: "받은 요청 수"는 현재 API 응답에 없어 임시로 숨김/0 처리 */}
              <div className="text-black/60 text-[12px] font-light leading-tight">
                받은 요청 0개
              </div>
            </div>
          </div>

          {/* 💡 내 게시글일 때만: 현재 교환 상태 뱃지 */}
          {post.mine && (
            <Badge
              variant="outlineGray"
              className="!bg-zinc-300 !border-neutral-400 !text-zinc-900 !rounded-lg shrink-0"
            >
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
            className="!bg-[#FFF0F0] !border-0 outline outline-[0.25px] outline-offset-[-0.25px] !outline-gray-200 !rounded-xl min-h-[112px] flex items-center"
            leftNode={
              <div className="relative w-7 h-7 shrink-0 mb-12 flex items-center justify-center">
                <div className="size-6 bg-rose-200 rounded-full" />
                <img src={throwArrow} alt="throw" className="absolute size-6" />
              </div>
            }
            rightNode={
              // 💡 버릴 과목은 등록 후 수정 불가라, 내 글이어도 여기선 삭제 아이콘 없음
              // (게시글 전체 삭제는 하단 "게시글 삭제하기"에서 처리)
              <Badge
                variant="lightRed"
                className="!border !border-neutral-400 !text-zinc-900 !font-normal !rounded-lg"
              >
                {post.discardCourse.courseType}
              </Badge>
            }
            badges={undefined}
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
                  className="!bg-[#F4F8FB] !border-0 outline outline-[0.25px] outline-offset-[-0.25px] !outline-gray-200 !rounded-xl min-h-[112px]"
                  leftNode={
                    <div className="relative w-7 h-6 shrink-0 mb-14 flex items-center justify-center">
                      <div className="size-6 bg-sky-200 rounded-full" />
                      <img
                        src={wantArrow}
                        alt="want"
                        className="absolute size-5"
                      />
                    </div>
                  }
                  rightNode={
                    <div className="flex flex-col items-end justify-end h-[80px]">
                      <div className="flex flex-row gap-1.5">
                        <Badge
                          variant="lightBlue"
                          className="!border !border-neutral-400 !bg-sky-100 !text-zinc-900 !font-normal !text-[10px] !rounded-lg"
                        >
                          {item.course.department}
                        </Badge>
                        <Badge
                          variant="lightBlue"
                          className="!border !border-neutral-400 !bg-sky-100 !text-zinc-900 !font-normal !rounded-lg"
                        >
                          {item.course.courseType}
                        </Badge>
                      </div>
                    </div>
                  }
                  badges={undefined}
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
            <div className="w-full bg-[#F1F5F9] rounded-xl border border-[#BFDBFE] p-5">
              <h3 className="text-gray-900 text-[15px] font-semibold mb-3">
                안내사항
              </h3>
              <p className="text-gray-700 text-[12px] font-light leading-relaxed">
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

      {/* 하단 고정 영역: 남의 글일 때만 교환 요청하기 (내 글일 때는 위에서 스크롤 콘텐츠 안에 수정/삭제로 처리) */}
      {!post.mine && !hasProposed && (
        <div className="sticky bottom-0 left-0 right-0 z-10 pointer-events-none mt-auto">
          <div className="bg-gradient-to-t from-neutral-50 via-neutral-50/90 to-transparent pt-5 pb-6 px-4 pointer-events-auto flex flex-col gap-3">
            <p className="text-center text-gray-500 text-[11px] font-light">
              교환 요청 시 상대방이 30분 내에 수락해야 매칭이 성사됩니다.
            </p>

            <Button
              size="lg"
              variant="primary"
              fullWidth={true}
              onClick={handleRequestExchange}
              className="text-white text-lg !font-semibold font-['Pretendard'] leading-5 tracking-wide"
            >
              교환 요청하기
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
    </div>
  );
};

export default SpecificPostsPage;
