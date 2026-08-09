import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { IconButton } from '@/components/common/IconButton';
import { useNavigate, useLocation } from 'react-router-dom';
import { ICONS } from '@/constants/icons';
import Header from '@/components/layout/Header';
import Button from '@/components/common/Button';
import { NotificationBell } from '@/components/common/NotificationBell';
import api from '@/api/axiosInstance'; // 백엔드 API 연결

// ==========================================
// 1. 상수와 유틸 함수는 컴포넌트 외부로 분리
// ==========================================
const REPORT_REASONS = [
  {
    id: 'FAKE_VERIFICATION',
    title: '허위 인증 사진제출',
    desc: '다른 과목 또는 타인의 화면을 제출한 경우',
  },
  {
    id: 'FAKE_COURSE',
    title: '허위 과목 등록 / 거래 불이행',
    desc: '실제로 보유하지 않은 과목을 등록하거나 교환을 이행하지 않은 경우',
  },
  {
    id: 'MONEY_DEMAND',
    title: '금전 요구 또는 부당한 조건 변경',
    desc: '금전을 요구하거나 합의 없이 조건을 변경한 경우',
  },
  {
    id: 'ABUSE',
    title: '욕설 및 비매너',
    desc: '욕설, 협박, 불쾌한 언행을 한 경우',
  },
  { id: 'OTHER', title: '기타', desc: '' },
];

const uploadImages = async (files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data.imageUrl;
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
};

// ==========================================
// 2. 메인 페이지 컴포넌트 (훨씬 짧아졌습니다!)
// ==========================================
export default function ReportPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const reportedUserId = location.state?.reportedUserId;
  const currentExchangeId = location.state?.exchangeId || null;

  useEffect(() => {
    if (!reportedUserId) {
      alert('잘못된 접근입니다. 신고 대상을 찾을 수 없습니다.');
      navigate(-1); // 💡 요렇게 숫자 -1만 딱 남겨주세요!
    }
  }, [reportedUserId, navigate]);

  // 상태 관리
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [otherReasonText, setOtherReasonText] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 제출 가능 여부 검사
  const isSubmitEnabled =
    selectedReason !== '' &&
    images.length > 0 &&
    (selectedReason !== 'OTHER' || otherReasonText.trim().length > 0);

  // 이미지 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    if (images.length + newFiles.length > 5) {
      alert('사진은 최대 5장까지 첨부 가능합니다.');
      return;
    }
    setImages((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // API 제출 핸들러
  const handleSubmit = async () => {
    if (!reportedUserId) return; // 안전장치 한 번 더!

    try {
      const uploadedUrls = await uploadImages(images);

      const requestBody = {
        reportedUserId,
        reason: selectedReason,
        imageUrls: uploadedUrls,
        ...(currentExchangeId ? { exchangeId: currentExchangeId } : {}),
      };

      const response = await api.post('/api/reports', requestBody);

      if (response.data.success) {
        navigate('/report/success', { replace: true });
      }
    } catch (error) {
      console.error('신고 처리 중 에러 발생:', error);
      alert('신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full relative overflow-hidden">
      <Header
        leftNode={<IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />}
        title="신고"
        rightNode={<NotificationBell />}
      />

      <main className="flex-1 overflow-y-auto px-5 pt-4 pb-4">
        {/* 분리된 사유 선택 섹션 */}
        <section className="mb-8">
          <h2 className="text-brand-lightBlue text-bold-16 mb-3">신고 사유</h2>
          <div className="flex flex-col gap-3">
            {REPORT_REASONS.map((reason) => (
              <ReasonItem
                key={reason.id}
                reason={reason}
                isSelected={selectedReason === reason.id}
                onSelect={() => setSelectedReason(reason.id)}
                otherText={otherReasonText}
                onOtherTextChange={setOtherReasonText}
              />
            ))}
          </div>
        </section>

        {/* 분리된 이미지 업로드 섹션 */}
        <ImageUploadSection
          images={images}
          fileInputRef={fileInputRef}
          onUpload={handleImageUpload}
          onRemove={handleRemoveImage}
        />
      </main>

      <div className="w-full px-5 pb-8 pt-3 shrink-0 z-10">
        <Button
          size="lg"
          variant="primary"
          disabled={!isSubmitEnabled}
          onClick={handleSubmit}
          className="h-[52px]"
        >
          신고하기
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// 3. 서브 컴포넌트 분리 (코드를 깔끔하게 해주는 역할)
// ==========================================

// 3-1. 개별 신고 사유 항목 UI
interface ReasonItemProps {
  reason: {
    id: string;
    title: string;
    desc: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  otherText: string;
  onOtherTextChange: (text: string) => void;
}

function ReasonItem({
  reason,
  isSelected,
  onSelect,
  otherText,
  onOtherTextChange,
}: ReasonItemProps) {
  return (
    <div
      className={`border rounded-[10px] overflow-hidden ${isSelected ? 'border-brand-lightBlue bg-[#F4F9FF]' : 'border-gray-200 bg-white'}`}
    >
      <label className="flex flex-col p-4 cursor-pointer w-full">
        <div className="flex items-center">
          <input
            type="radio"
            name="reportReason"
            value={reason.id}
            checked={isSelected}
            onChange={onSelect}
            className="hidden"
          />
          <div className="mr-3 shrink-0 flex items-center">
            <Icon
              icon={isSelected ? 'mdi:radiobox-marked' : 'mdi:radiobox-blank'}
              className={`text-[20px] ${isSelected ? 'text-brand-lightBlue' : 'text-gray-300'}`}
            />
          </div>
          <div
            className={`text-medium-14 font-bold ${isSelected ? 'text-brand-lightBlue' : 'text-gray-900'}`}
          >
            {reason.title}
          </div>
        </div>
        {reason.desc && (
          <div className="text-light-13 text-gray-500 mt-1 ml-[32px] break-keep leading-tight">
            {reason.desc}
          </div>
        )}
      </label>

      {reason.id === 'OTHER' && isSelected && (
        <div className="bg-[#F5F5F5] p-4 border-t border-gray-200">
          <div className="text-[12px] text-gray-600 mb-2">신고 사유</div>
          <input
            type="text"
            value={otherText}
            onChange={(e) => onOtherTextChange(e.target.value)}
            placeholder="사유를 입력해주세요."
            className="w-full p-3 rounded-lg border border-gray-200 bg-white text-[14px] outline-none focus:border-brand-lightBlue"
          />
        </div>
      )}
    </div>
  );
}

// 3-2. 이미지 첨부 영역 UI
interface ImageUploadSectionProps {
  images: File[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: (indexToRemove: number) => void;
}

function ImageUploadSection({
  images,
  fileInputRef,
  onUpload,
  onRemove,
}: ImageUploadSectionProps) {
  return (
    <section>
      <div className="flex justify-between items-end mb-1">
        <h2 className="text-brand-lightBlue text-bold-16 font-bold">
          증거 사진 첨부
        </h2>
        <span className="text-light-13 text-gray-400 font-medium">
          {images.length}/5
        </span>
      </div>
      <p className="text-light-13 text-gray-500 mb-4 tracking-tight">
        정확한 확인을 위해 채팅 내역이나 정황 캡처본을 첨부해주세요.
      </p>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-[140px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
      >
        <Icon icon="ph:camera" className="text-[32px] text-gray-400 mb-2" />
        <span className="text-gray-400 text-medium-14">파일 검색하기</span>
      </div>
      <input
        type="file"
        multiple
        accept="image/*"
        ref={fileInputRef}
        onChange={onUpload}
        className="hidden"
      />

      {images.length > 0 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2 snap-x [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full -mx-5 px-5">
          {images.map((file: File, index: number) => (
            <div
              key={index}
              className="w-[72px] h-[72px] shrink-0 rounded-lg overflow-hidden relative border border-gray-200 snap-start isolate"
            >
              <img
                src={URL.createObjectURL(file)}
                alt={`preview-${index}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute top-1 right-1 w-[20px] h-[20px] bg-black/60 rounded-full flex justify-center items-center backdrop-blur-sm z-10"
              >
                <Icon icon="ph:x-bold" className="text-white text-[12px]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
