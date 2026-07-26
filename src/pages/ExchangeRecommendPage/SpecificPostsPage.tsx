import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { CourseCard } from '@/components/common/CourseCard';
import { Badge } from '@/components/common/Badge';
import { Input } from '@/components/common/Input';
import Button from '@/components/common/Button';
import { Toast } from '@/components/common/Toast';
import { ICONS } from '@/constants/icons';

// SVG 파일
import throwArrow from '@/assets/icons/throw_arrow.svg';
import wantArrow from '@/assets/icons/want_arrow.svg';
import grayCircle from '@/assets/icons/gray_circle.svg';
import humanIcon from '@/assets/icons/human.svg';

const POST_DATA = {
  author: { name: '너송', requestCount: 3 },
  dropSubject: {
    name: '영어회화',
    prof: 'John Smith',
    time: '화목 10:30-11:45',
    tag: '교양필수',
  },
  wantSubjects: [
    {
      rank: 1,
      name: '컴퓨터구조',
      prof: 'John Smith',
      time: '화목 10:30-11:45',
      department: '컴퓨터 과학',
      type: '전공필수',
    },
    {
      rank: 2,
      name: '마케팅과 소비자 이슈',
      prof: 'John Smith',
      time: '화목 10:30-11:45',
      department: '컴퓨터 과학',
      type: '전공필수',
    },
    {
      rank: 3,
      name: '회계원리',
      prof: 'John Smith',
      time: '화목 10:30-11:45',
      department: '컴퓨터 과학',
      type: '전공필수',
    },
  ],
};

const SpecificPostsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col font-['Pretendard'] bg-neutral-50">
      {/* 고정 헤더 */}
      <div className="sticky top-0 z-50 bg-neutral-50">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={
            <div className="text-black/70 text-[17px] font-semibold">
              게시글 상세
            </div>
          }
          rightNode={
            <IconButton icon={ICONS.MORE_VERTICAL} className="text-black/40" />
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-32 relative">
        {/* 프로필 영역 */}
        <div className="flex items-center gap-3.5 py-2 px-6 border-b border-gray-200/60 mb-2">
          <div className="relative w-12 h-12 shrink-0">
            <img
              src={grayCircle}
              alt=""
              className="absolute inset-0 w-full h-full"
            />
            <img
              src={humanIcon}
              alt="profile"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7"
            />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-black text-[16px] font-medium leading-tight">
              {POST_DATA.author.name}
            </div>
            <div className="text-black/60 text-[12px] font-light leading-tight">
              받은 요청 {POST_DATA.author.requestCount}개
            </div>
          </div>
        </div>

        {/* 💡 케이스 C 응용: 버릴 과목 영역 */}
        <section className="mb-9">
          <h2 className="text-point-red text-[15px] font-bold px-3 mb-1">
            버릴 과목
          </h2>

          <CourseCard
            title={POST_DATA.dropSubject.name}
            professor={POST_DATA.dropSubject.prof}
            time={POST_DATA.dropSubject.time}
            className="!bg-[#FFF0F0] !border-0 outline outline-[0.25px] outline-offset-[-0.25px] !outline-gray-200 !rounded-xl min-h-[112px] flex items-center"
            leftNode={
              <div className="relative w-7 h-7 shrink-0 mb-12 flex items-center justify-center">
                {/* 💡 이미지가 아닌 div로 배경 원을 만들면 중앙 맞추기가 훨씬 쉽습니다 */}
                <div className="size-6 bg-rose-200 rounded-full" />

                <img
                  src={throwArrow}
                  alt="throw"
                  // 💡 부모 div(flex)에 의해 자동으로 정중앙에 위치합니다
                  className="absolute size-6"
                />
              </div>
            }
            // 💡 rightNode에 X 버튼과 배지를 세로로 묶어서 전달합니다
            rightNode={
              <div className="flex flex-col items-end justify-between h-[68px]">
                <IconButton
                  icon="ph:x"
                  variant="ghost"
                  className="p-1 -mr-1 -mt-1 text-gray-400"
                  onClick={() => console.log('삭제 클릭')}
                />
                <Badge
                  variant="lightRed"
                  className="!border !border-neutral-400 !text-zinc-900 !font-normal !text- !rounded-lg"
                >
                  {POST_DATA.dropSubject.tag}
                </Badge>
              </div>
            }
            // 💡 badges 속성은 비워둡니다
            badges={undefined}
          />
        </section>

        {/* 💡 케이스 B 응용: 원하는 과목 영역 */}
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
            {POST_DATA.wantSubjects.map((subject, idx) => (
              <div key={idx}>
                {' '}
                {/* map 항목 시작 */}
                <div className="text-gray-800 text-[13px] font-medium mb-1.5 ml-1">
                  {subject.rank}순위
                </div>
                <CourseCard
                  title={subject.name}
                  professor={subject.prof}
                  time={subject.time}

                  // 💡 min-h-[112px]로 최소 높이를 통일합니다.
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
                  // 💡 rightNode 사용: 오른쪽 영역의 높이를 강제로 버릴 과목과 맞춤
                  rightNode={
                    <div className="flex flex-col items-end justify-end h-[80px]">
                      {/* 💡 flex-row로 변경하여 가로 정렬 */}
                      <div className="flex flex-row gap-1.5">
                        <Badge
                          variant="lightBlue"
                          className="!border !border-neutral-400 !bg-sky-150 !text-zinc-900 !font-normal !text-[10px] !rounded-lg"
                        >
                          {subject.department}
                        </Badge>
                        <Badge
                          variant="lightBlue"
                          className="!border !border-neutral-400 !bg-sky-150 !text-zinc-900 !font-normal !text- !rounded-lg"
                        >
                          {subject.type}
                        </Badge>
                      </div>
                    </div>
                  }
                  badges={undefined}
                />
              </div> // 💡 map 항목 div를 여기서 확실히 닫아줍니다!
            ))}
          </div>
          {/* section을 닫는 태그는 map 전체를 감싸는 section 태그에 맞게 배치하세요 */}
        </section>

        {/* 카카오톡 링크 & 안내사항 */}
        <section className="mb-6">
          <h2 className="text-brand-lightBlue text-[15px] font-bold mb-2">
            카카오톡 오픈채팅방 링크
          </h2>
          <p className="text-gray-400 text-[11px] font-light mb-3 ml-1">
            교환 확정 시 상대방과 연락할 오픈채팅방 링크를 입력해주세요
          </p>

          <div className="mb-8">
            <Input
              defaultValue="https://open.kakao.com/o/..."
              className="text-gray-500 bg-white"
            />
          </div>

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
        </section>
      </div>

      {/* 하단 고정 버튼 영역 */}
      <div className="sticky bottom-0 left-0 right-0 z-10 pointer-events-none mt-auto">
        {/* 💡 배경색과 그라데이션을 하나의 div로 통합하고, 위에서부터 서서히 투명해지게 만듭니다 */}
        <div className="bg-gradient-to-t from-neutral-50 via-neutral-50/90 to-transparent pt-5 pb-6 px-4 pointer-events-auto flex flex-col gap-3">
          <p className="text-center text-gray-500 text-[11px] font-light">
            교환 요청 시 상대방이 30분 내에 수락해야 매칭이 성사됩니다.
          </p>

          <Button
            size="lg"
            variant="primary"
            fullWidth={true}
            onClick={() => setShowToast(true)}
            className="text-white text-lg !font-semibold font-['Pretendard'] leading-5 tracking-wide"
          >
            교환 요청하기
          </Button>
        </div>
      </div>
      <Toast
        message="교환 요청이 성공적으로 전송되었습니다."
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default SpecificPostsPage;
