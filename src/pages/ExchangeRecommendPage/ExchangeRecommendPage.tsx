import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { Tabs } from '@/components/common/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { ICONS } from '@/constants/icons';

type RankTab = '1' | '2' | '3';

interface RecommendPost {
  id: number;
  title: string;
  preferredSubjects: string[];
  requestCount: number;
}

const ExchangeRecommendPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<RankTab>('1');

  // 백엔드 연동 예정
  const recommendPosts: Record<RankTab, RecommendPost[]> = {
    '1': [
      {
        id: 1,
        title: '마케팅과 소비자이슈',
        preferredSubjects: ['운영체제', '소프트웨어이해', '프로그래밍언어론'],
        requestCount: 3,
      },
      {
        id: 2,
        title: '교양필라테스',
        preferredSubjects: [
          '교양 요가',
          '발레를 통한 자세교정',
          '교양 웨이트 트레이닝',
        ],
        requestCount: 3,
      },
      {
        id: 3,
        title: 'SM리더특강',
        preferredSubjects: ['운영체제', '소프트웨어이해', '프로그래밍언어론'],
        requestCount: 3,
      },
    ],
    '2': [],
    '3': [],
  };

  const tabs = useMemo(
    () => [
      {
        id: '1',
        label: `1순위 ${recommendPosts['1'].length}`,
      },
      {
        id: '2',
        label: `2순위 ${recommendPosts['2'].length}`,
      },
      {
        id: '3',
        label: `3순위 ${recommendPosts['3'].length}`,
      },
    ],
    [],
  );

  const currentPosts = recommendPosts[activeTab];

  return (
    <div className="w-full min-h-screen bg-[#FBFBFB] flex flex-col font-['Pretendard']">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#FBFBFB]">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={
            <div className="text-left whitespace-nowrap -translate-x-16 text-black/70 text-xl font-semibold">
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
        />
      </div>

      {/* 내용 */}
      <div className="flex-1 px-5 py-2">
        {currentPosts.length === 0 ? (
          <div className="flex h-[60vh] items-center justify-center">
            <EmptyState
              className="min-h-0"
              title="아직 조건에 맞는 교환 게시글이 없습니다."
              description="새로운 게시글이 등록되면 추천해드릴게요."
            />
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200">
            {currentPosts.map((post) => (
              <div key={post.id} className="py-6 flex flex-col">
                {/* 제목 + 제안 버튼 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium tracking-wide">
                    {post.title}
                  </h3>

                  <button className="px-4 py-1 rounded-full bg-brand-lightBlue text-white text-xs font-medium">
                    제안
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

                {/* 받은 요청 */}
                <button
                  onClick={() => navigate(`/exchange/requests/${post.id}`)}
                  className="self-end mt-3 flex items-center gap-1 hover:opacity-80"
                >
                  <span className="text-xs font-light text-neutral-500">
                    받은 요청 {post.requestCount}개
                  </span>

                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M8.59063 18.1598L14.2506 12.4998L8.59063 6.83984L7.89062 7.54984L12.8406 12.4998L7.89062 17.4498L8.59063 18.1598Z"
                      fill="currentColor"
                      className="text-neutral-400"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExchangeRecommendPage;
