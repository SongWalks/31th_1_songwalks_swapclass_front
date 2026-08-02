import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import Button from '@/components/common/Button';

export default function ReportSuccessPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen w-full relative">
      {/* ── 1. 헤더 ── */}
      <Header
        leftNode={<IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />}
        title="신고"
        rightNode={
          <div className="relative">
            <IconButton icon={ICONS.BELL} />
          </div>
        }
      />

      {/* ── 2. 본문 영역 (내용을 화면 중앙 위쪽으로 배치) ── */}
      <main className="flex-1 flex flex-col items-center px-5 pt-[60px] pb-8 overflow-y-auto">
        {/* 완료 체크 아이콘 */}
        <div className="w-[84px] h-[84px] rounded-full bg-brand-bg border border-brand-lightBlue flex justify-center items-center mb-6">
          {/* 안쪽 굵은 테두리 원 */}
          <div className="w-[52px] h-[52px] rounded-full border-[4px] border-brand-lightBlue flex justify-center items-center">
            {/* 체크 마크 */}
            <Icon
              icon={ICONS.CHECK}
              className="text-[32px] text-brand-lightBlue"
            />
          </div>
        </div>

        {/* 타이틀 및 설명 */}
        <h2 className="text-bold-16 !text-[20px] text-gray-900 mb-2">
          신고가 접수되었습니다.
        </h2>
        <p className="text-light-14 text-gray-500 text-center leading-relaxed mb-10">
          관리자 확인 후 처리합니다.
          <br />
          허위 신고 시 본인에게 제재가 부여될 수 있습니다.
        </p>

        {/* 정책 안내 박스 */}
        <div className="w-full bg-gray-100 border-[#AFB1B6] border rounded-xl p-6 flex flex-col gap-8">
          {/* 신고 처리 정책 */}
          <div>
            <h3 className="text-semibold-16 text-gray-700 mb-3">
              신고 처리 정책
            </h3>
            <div className="flex flex-col gap-2 text-light-14 text-gray-500 font-medium">
              <div className="flex justify-between">
                <span>1회 확인</span>
                <span>3일 이용 정지</span>
              </div>
              <div className="flex justify-between">
                <span>2회 확인</span>
                <span>수강정정기간 전체 정지</span>
              </div>
              <div className="flex justify-between">
                <span>3회 확인</span>
                <span>서비스 이용 불가</span>
              </div>
            </div>
          </div>

          <div className="w-full h-[1px] bg-gray-300" />

          {/* 허위 신고 정책 */}
          <div>
            <h3 className="text-semibold-16 font-bold text-gray-700 mb-3">
              허위 신고 정책
            </h3>
            <div className="flex flex-col gap-2 text-light-14 text-gray-500 font-medium">
              <div>1회 - 수강정정기간 정지</div>
              <div>2회 - 서비스 이용 불가</div>
            </div>
          </div>
        </div>

        {/* ── 3. 하단 확인 버튼 (flex의 특성을 이용해 맨 아래로 밀어냄) ── */}
        <div className="w-full mt-auto pt-8">
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/', { replace: true })}
          >
            확인
          </Button>
        </div>
      </main>
    </div>
  );
}
