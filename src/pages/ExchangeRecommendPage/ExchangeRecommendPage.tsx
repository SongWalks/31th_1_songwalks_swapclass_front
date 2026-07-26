import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { ICONS } from '@/constants/icons';
import axiosInstance from '@/api/axiosInstance';

type RankTab = '1' | '2' | '3';

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

// 💡 GET /api/posts/{postId} 응답
interface PostDetailResponse {
  postId: number;
  discardCourse: CourseDetail;
  wantedCourses: WantedCourseItem[];
}

// 💡 GET /api/posts/me 응답 항목
interface MyPostResponse {
  postId: number;
  status: 'MATCHABLE' | 'IN_EXCHANGE' | 'COMPLETED' | 'DELETED' | string;
}

// 💡 GET /api/matches/recommendations 응답 항목
interface RecommendationItem {
  id: number;
  matchRank: number;
  requestStatus: string; // 예: 'NONE' | 'PENDING' 등 (정확한 enum 값은 백엔드 확인 필요)
}

// 💡 추천 후보(id/순위/제안상태) + 게시글 상세(과목명 등)를 합친 화면용 데이터
interface RecommendPost {
  id: number;
  matchRank: number;
  requestStatus: string;
  title: string;
  preferredSubjects: string[];
}

const ExchangeRecommendPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<RankTab>('1');
  const [recommendPosts, setRecommendPosts] = useState<RecommendPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposingId, setProposingId] = useState<number | null>(null);

  // 💡 내 게시글 ID (추천 조회 + 제안 시 senderPostId로 사용)
  const [myPostId, setMyPostId] = useState<number | null>(null);

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

  const fetchRecommendations = useCallback(async () => {
    if (!myPostId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. 추천 후보 목록 (id / matchRank / requestStatus)
      const listRes = await axiosInstance.get('/api/matches/recommendations', {
        params: { postId: myPostId, page: 0, size: 20 },
      });
      const items: RecommendationItem[] = listRes.data?.data?.posts || [];

      // 2. 각 후보의 게시글 상세를 병렬로 조회해서 과목명/희망과목 채우기
      const detailed = await Promise.all(
        items.map(async (item) => {
          const detailRes = await axiosInstance.get(`/api/posts/${item.id}`);
          const post: PostDetailResponse = detailRes.data?.data;

          const sortedWanted = [...(post?.wantedCourses || [])].sort(
            (a, b) => a.priority - b.priority,
          );

          return {
            id: item.id,
            matchRank: item.matchRank,
            requestStatus: item.requestStatus,
            title: post?.discardCourse?.name ?? '',
            preferredSubjects: sortedWanted.map((w) => w.course?.name ?? ''),
          } satisfies RecommendPost;
        }),
      );

      setRecommendPosts(detailed);
    } catch (error) {
      console.error('추천 게시글 조회 실패:', error);
      setRecommendPosts([]);
    } finally {
      setLoading(false);
    }
  }, [myPostId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const handlePropose = async (receiverPostId: number) => {
    if (!myPostId) return;

    try {
      setProposingId(receiverPostId);
      const response = await axiosInstance.post('/api/proposals', {
        senderPostId: myPostId,
        receiverPostId,
      });

      if (response.data?.success) {
        setRecommendPosts((prev) =>
          prev.map((p) =>
            p.id === receiverPostId ? { ...p, requestStatus: 'PENDING' } : p,
          ),
        );
      }
    } catch (error) {
      console.error('제안 생성 실패:', error);
      alert('제안을 보내는 중 오류가 발생했습니다.');
    } finally {
      setProposingId(null);
    }
  };

  const postsByRank = useMemo(() => {
    const grouped: Record<RankTab, RecommendPost[]> = {
      '1': [],
      '2': [],
      '3': [],
    };
    recommendPosts.forEach((post) => {
      const rankKey = String(post.matchRank) as RankTab;
      if (grouped[rankKey]) {
        grouped[rankKey].push(post);
      }
    });
    return grouped;
  }, [recommendPosts]);

  const tabs = useMemo(
    () => [
      { id: '1', label: `1순위 ${postsByRank['1'].length}` },
      { id: '2', label: `2순위 ${postsByRank['2'].length}` },
      { id: '3', label: `3순위 ${postsByRank['3'].length}` },
    ],
    [postsByRank],
  );

  const currentPosts = postsByRank[activeTab];

  return (
    <div className="w-full min-h-screen bg-[#FBFBFB] flex flex-col font-['Pretendard']">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#FBFBFB]">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={
            <div className="whitespace-nowrap text-black/70 text-xl font-semibold">
              교환 추천 매칭함
            </div>
          }
          rightNode={
            <IconButton
              icon={ICONS.BELL}
              onClick={() => navigate('/notifications')}
              className="text-brand-lightBlue"
            />
          }
        />

        <Tabs
          tabs={tabs}
          activeTabId={activeTab}
          onTabChange={(id) => setActiveTab(id as RankTab)}
          variant="line"
          className="[&>button]:!text-sm [&>button]:!font-normal"
        />
      </div>

      {/* 내용 */}
      <div className="flex-1 px-5 py-2">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            추천 목록을 불러오는 중입니다...
          </div>
        ) : currentPosts.length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center">
            <EmptyState
              className="min-h-0"
              title="아직 조건에 맞는 교환 게시글이 없습니다."
              description="새로운 게시글이 등록되면 추천해드릴게요."
            />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200">
            {currentPosts.map((post) => {
              const alreadyRequested =
                post.requestStatus && post.requestStatus !== 'NONE';

              return (
                <div key={post.id} className="py-6 flex flex-col">
                  {/* 제목 + 제안 버튼 */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/board/${post.id}`)}
                      className="text-lg font-medium tracking-wide text-left hover:opacity-80 transition-opacity"
                    >
                      {post.title}
                    </button>

                    <button
                      onClick={() => handlePropose(post.id)}
                      disabled={alreadyRequested || proposingId === post.id}
                      className={`px-4 py-1 rounded-full text-xs font-medium transition-opacity ${
                        alreadyRequested
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-brand-lightBlue text-white hover:opacity-90'
                      } ${proposingId === post.id ? 'opacity-60' : ''}`}
                    >
                      {alreadyRequested ? '제안 완료' : '제안'}
                    </button>
                  </div>

                  {/* 희망 과목 */}
                  <div className="mt-4 flex flex-col gap-2">
                    {post.preferredSubjects.map((subject, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-[14px] h-[14px] rounded-full bg-[#D2EBFC] flex items-center justify-center text-[9px] text-brand-lightBlue">
                          {index + 1}
                        </div>

                        <span className="text-xs font-light text-black/70">
                          {subject}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeRecommendPage;
