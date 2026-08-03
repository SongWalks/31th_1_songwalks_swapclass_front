import { useState, useEffect, useRef, useMemo } from 'react'; // 🚀 useMemo 추가
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { Badge } from '@/components/common/Badge';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import { Avatar } from '@/components/common/Avatar';
import { Input } from '@/components/common/Input';
import { Toast } from '@/components/common/Toast';
import { Modal } from '@/components/common/Modal';
import { Spinner } from '@/components/common/Spinner';
import SendIcon from '@iconify-react/material-symbols-light/send';

import {
  getPostDetail,
  toggleLike,
  toggleBookmark,
  deletePost,
  createComment,
  deleteComment,
} from '@/api/lounge/lounge';
import type { LocalComment, PostDetailResponse } from '@/types/lounge/lounge';

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

export const PostDetailPage = () => {
  const navigate = useNavigate();
  const { postId } = useParams<{ postId: string }>();
  const queryClient = useQueryClient();

  // --- 상태 관리 ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 삭제 지연(Undo) 처리를 위한 상태 및 Ref
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const deleteTimerRef = useRef<number | null>(null);

  const [toastConfig, setToastConfig] = useState({
    isVisible: false,
    message: '',
    showUndo: false,
  });

  // --- API 연동 (Queries & Mutations) ---
  const {
    data: postResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => getPostDetail(Number(postId)),
    enabled: !!postId,
  });

  const postData = postResponse?.data;
  const isMyPost = postData?.mine || false;

  // 🚀 서버 데이터 기반 파생 상태 (Derived State)
  // 렌더링 시점에 postData를 기반으로 바로 계산해서 사용합니다.
  const isLiked = postData?.liked || false;
  const likeCount = postData?.likeCount || 0;
  const isScraped = postData?.bookmarked || false;
  const scrapCount = isScraped ? 1 : 0; // 본인이 스크랩한 경우 1, 아니면 0

  // 🚀 comments 포맷팅 로직을 useMemo로 감싸 불필요한 재연산을 방지합니다.
  const comments: LocalComment[] = useMemo(() => {
    if (!postData) return [];
    return postData.comments.map((c) => ({
      ...c,
      author: `송이`,
      time: formatDate(c.createdAt),
      isMine: c.mine,
    }));
  }, [postData]);

  // 화면에 실제로 보여질 댓글 (삭제 대기 중인 항목 제외)
  const visibleComments = comments.filter((c) => c.id !== pendingDeleteId);

  const { mutate: mutateLike } = useMutation({
    mutationFn: () => toggleLike(Number(postId)),
    onSuccess: (res) => {
      // 💡 제네릭 <PostDetailResponse>를 추가하여 oldData의 타입을 안전하게 추론하게 합니다.
      queryClient.setQueryData<PostDetailResponse>(
        ['post', postId],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              liked: res.data.liked,
              likeCount: res.data.likeCount,
            },
          };
        },
      );
    },
  });

  const { mutate: mutateBookmark } = useMutation({
    mutationFn: () => toggleBookmark(Number(postId)),
    onSuccess: (res) => {
      const isNowBookmarked = res.data.bookmarked;

      // 💡 여기도 마찬가지로 제네릭을 추가해 줍니다.
      queryClient.setQueryData<PostDetailResponse>(
        ['post', postId],
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              bookmarked: isNowBookmarked,
            },
          };
        },
      );

      if (isNowBookmarked) {
        showToast('북마크 되었습니다.');
      }
    },
  });

  const { mutate: mutateDelete, isPending: isDeletePending } = useMutation({
    mutationFn: () => deletePost(Number(postId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loungePosts'] });
      setIsDeleteModalOpen(false);
      navigate(-1);
    },
  });

  const { mutate: mutateCreateComment, isPending: isCommentPending } =
    useMutation({
      mutationFn: (content: string) =>
        createComment(Number(postId), { content }),
      onSuccess: () => {
        setCommentInput('');
        queryClient.invalidateQueries({ queryKey: ['post', postId] });
      },
      onError: () => {
        alert('댓글 작성에 실패했습니다.');
      },
    });

  const { mutate: mutateDeleteComment } = useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
    onError: () => {
      alert('댓글 삭제에 실패했습니다.');
    },
  });

  // 🚀 삭제: 상태 복사 용도였던 문제의 useEffect를 완전히 제거했습니다.

  // 페이지 이탈 시 지연된 삭제 요청 처리
  useEffect(() => {
    return () => {
      if (deleteTimerRef.current && pendingDeleteId) {
        mutateDeleteComment(pendingDeleteId);
      }
    };
  }, [pendingDeleteId, mutateDeleteComment]);

  // --- 핸들러 함수들 ---
  const showToast = (message: string, showUndo = false) => {
    setToastConfig({ isVisible: true, message, showUndo });
  };

  const handleCommentSubmit = () => {
    if (!commentInput.trim() || isCommentPending) return;
    mutateCreateComment(commentInput);
  };

  const handleDeleteClick = (commentId: number) => {
    if (pendingDeleteId && pendingDeleteId !== commentId) {
      mutateDeleteComment(pendingDeleteId);
    }

    setPendingDeleteId(commentId);
    showToast('댓글이 삭제되었습니다.', true);

    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
    }

    deleteTimerRef.current = window.setTimeout(() => {
      mutateDeleteComment(commentId);
      setPendingDeleteId(null);
      deleteTimerRef.current = null;
    }, 3000);
  };

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setPendingDeleteId(null);
    setToastConfig({ isVisible: false, message: '', showUndo: false });
  };

  // --- 렌더링 방어 로직 ---
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !postData) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-gray-500 gap-2">
        <p>게시글을 찾을 수 없거나 삭제되었습니다.</p>
      </div>
    );
  }

  // --- UI 렌더링 ---
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* 1. 상단 헤더 영역 */}
      <div className="shrink-0 w-full z-30 relative">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title="게시글 상세"
          rightNode={
            isMyPost ? (
              <div className="relative">
                <IconButton
                  icon={ICONS.MORE_VERTICAL}
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                />
                {isMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute top-full right-2 mt-1 w-[160px] bg-white border border-gray-200 shadow-sm z-50 flex flex-col text-[14px] text-gray-700">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-left"
                      >
                        <Icon
                          icon={ICONS.CLOSE}
                          className="text-[16px] text-gray-400"
                        />
                        삭제하기
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          navigate(`/lounge/${postId}/edit`);
                        }}
                        className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50 text-left"
                      >
                        <Icon
                          icon="ph:pencil-simple"
                          className="text-[16px] text-gray-400"
                        />
                        게시글 수정하기
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null
          }
        />
      </div>

      {/* 2. 스크롤 가능한 본문 및 댓글 영역 */}
      <div className="flex-1 flex flex-col overflow-y-auto pb-[90px]">
        {/* 본문 컨텐츠 */}
        <div className="px-5 pt-4 pb-6">
          <div className="flex gap-2 mb-4">
            <Badge
              variant={postData.type === 'TIP' ? 'primary' : 'lightYellow'}
            >
              {postData.type === 'TIP' ? '강의꿀팁' : '폐강과목'}
            </Badge>
            <Badge variant="secondary">{postData.courseName}</Badge>
          </div>
          <div className="flex items-center gap-3 mb-5">
            <Avatar size="md" className="!rounded-xl" />
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 text-[15px]">송이</span>
              <span className="text-[13px] text-gray-500">
                {formatDate(postData.createdAt)}
              </span>
            </div>
          </div>
          <h1 className="text-[18px] font-bold text-gray-900 mb-3">
            {postData.title}
          </h1>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-6 whitespace-pre-wrap">
            {postData.content}
          </p>
          <div className="flex items-center justify-end gap-1 text-[13px] text-gray-400">
            <Icon
              icon="ph:clock-fill"
              className="text-[14px] -translate-y-[1px]"
            />
            <span>{formatDate(postData.updatedAt)}</span>
          </div>
        </div>

        {/* 액션 바 */}
        <div className="flex border-y border-gray-100 py-3 mx-4 text-[14px] text-gray-400">
          <button
            onClick={() => mutateLike()}
            className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
              isLiked ? 'text-red-500' : 'hover:text-gray-600'
            }`}
          >
            <Icon
              icon={isLiked ? 'ph:heart-fill' : 'ph:heart'}
              className="text-[18px]"
            />
            공감 {likeCount}
          </button>
          <div className="w-[1px] bg-gray-200" />
          <button className="flex-1 flex items-center justify-center gap-1.5 hover:text-gray-600 transition-colors">
            <Icon icon="ph:chat-circle" className="text-[18px]" />
            댓글 {visibleComments.length}{' '}
          </button>
          <div className="w-[1px] bg-gray-200" />
          <button
            onClick={() => mutateBookmark()}
            className={`flex-1 flex items-center justify-center gap-1.5 transition-colors ${
              isScraped ? 'text-yellow-500' : 'hover:text-gray-600'
            }`}
          >
            <Icon
              icon={isScraped ? 'ph:bookmark-fill' : 'ph:bookmark-simple'}
              className="text-[18px]"
            />
            스크랩 {scrapCount}
          </button>
        </div>

        {/* 댓글 목록 */}
        <div className="px-5 py-6 bg-gray-50 flex-1">
          <div className="flex items-center gap-1.5 font-bold text-[#004786] mb-3">
            <Icon icon="ph:chat-circle" className="text-[18px]" />
            <span>댓글 {visibleComments.length}</span>{' '}
          </div>
          <div className="space-y-2">
            {visibleComments.map((comment) => (
              <div key={comment.id} className="bg-white p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" className="!rounded-xl" />
                    <span className="font-semibold text-gray-900 text-[14px]">
                      {comment.author}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-gray-400">
                    <span>{comment.time}</span>
                    {comment.isMine && (
                      <button
                        onClick={() => handleDeleteClick(comment.id)}
                        className="hover:text-gray-600 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[15px] text-gray-900 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 댓글 입력창 */}
      <div className="absolute bottom-0 left-0 w-full px-4 py-3 pb-safe z-30">
        <Input
          variant="pill"
          placeholder="댓글을 입력하세요"
          value={commentInput}
          onChange={(e) => setCommentInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              handleCommentSubmit();
            }
          }}
          className="!bg-[#F6F6F6] !border-transparent focus:!border-gray-300"
          rightNode={
            <button
              onClick={handleCommentSubmit}
              className="text-black flex items-center justify-center disabled:opacity-30"
              disabled={!commentInput.trim() || isCommentPending}
            >
              {isCommentPending ? (
                <Spinner
                  size="sm"
                  className="!border-black !border-t-transparent w-5 h-5 border-2"
                />
              ) : (
                <SendIcon height="1em" className="text-[22px]" />
              )}
            </button>
          }
        />
      </div>

      {/* Toast 컴포넌트 */}
      <Toast
        message={toastConfig.message}
        isVisible={toastConfig.isVisible}
        onClose={() =>
          setToastConfig((prev) => ({ ...prev, isVisible: false }))
        }
        actionText={toastConfig.showUndo ? '실행 취소' : undefined}
        onAction={toastConfig.showUndo ? handleUndoDelete : undefined}
      />

      {/* 게시글 삭제 모달 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        icon={
          <Icon icon={ICONS.WARNING} className="text-[40px] text-[#F94C66]" />
        }
        title="게시글을 삭제하시겠습니까?"
        footer={
          <>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="flex-1 py-3 px-4 rounded-full border border-gray-300 text-gray-700 font-medium text-[15px] hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              onClick={() => mutateDelete()}
              disabled={isDeletePending}
              className="flex-1 py-3 px-4 rounded-full bg-[#F94C66] text-white flex items-center justify-center gap-2 font-medium text-[15px] hover:bg-[#E03A53] transition-colors disabled:opacity-50"
            >
              {isDeletePending ? (
                <>
                  <Spinner
                    size="sm"
                    className="!border-white !border-t-transparent"
                  />
                  삭제 중...
                </>
              ) : (
                '삭제'
              )}
            </button>
          </>
        }
      >
        게시글은 복구할 수 없습니다
      </Modal>
    </div>
  );
};
