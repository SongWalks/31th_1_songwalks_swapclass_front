// pages/chat/TerminateDealOverlay.tsx
// ChatRoomPage 위에 올라가는 거래 파기 오버레이. 라우트 이동을 하지 않으므로
// 과목명/확정시간 등 부모(ChatRoomPage)의 상태가 유실되지 않는다.
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { IconButton } from '@/components/common/IconButton';
import Button from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { ICONS } from '@/constants/icons';

import { exchangeApi, type CancelReason } from '@/api/chat/exchangeApi';
import { ApiError } from '@/api/chat/apiClient';

interface SubReason {
  label: string;
  value: CancelReason;
}

interface ReasonGroup {
  label: string;
  subReasons?: SubReason[];
  freeText?: boolean;
  blocked?: boolean;
  singleValue?: CancelReason;
}

// ⚠️ 백엔드 enum에는 MONEY_DEMAND도 있지만, 디자인상 선택 UI가 없어 프론트에는 노출하지 않는다.
const REASON_GROUPS: ReasonGroup[] = [
  {
    label: '상호 합의로 거래 취소',
    subReasons: [
      { label: '시간 조율 실패', value: 'MUTUAL_TIME_ISSUE' },
      {
        label: '서로 다른 과목으로 진행하기로 함',
        value: 'MUTUAL_COURSE_CHANGE',
      },
    ],
  },
  {
    label: '인증 정보가 의심됨',
    subReasons: [
      { label: '보유 과목 인증 사진이 의심됨', value: 'FRAUD_SUSPECT_IMAGE' },
      { label: '다른 과목 사진 제출', value: 'FRAUD_DIFFERENT_COURSE' },
    ],
  },
  {
    label: '상대방이 거래를 진행하지 않음',
    subReasons: [
      { label: '과목을 버리지 않음', value: 'NO_SHOW_COURSE' },
      { label: '거래를 일방적으로 중단함', value: 'NO_SHOW_STOPPED' },
    ],
  },
  {
    label: '상대방과 연락이 원활하지 않음',
    blocked: true,
    singleValue: 'NO_CONTACT',
  },
  { label: '기타', freeText: true, singleValue: 'OTHER' },
];

interface TerminateDealOverlayProps {
  exchangeId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TerminateDealOverlay({
  exchangeId,
  onClose,
  onSuccess,
}: TerminateDealOverlayProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedReasonValue, setSelectedReasonValue] =
    useState<CancelReason | null>(null);
  const [otherDetail, setOtherDetail] = useState('');
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    '거래를 파기하지 못했습니다. 다시 시도해주세요.',
  );

  const handleToggleGroup = (group: ReasonGroup, index: number) => {
    if (group.blocked) {
      setIsBlockedModalOpen(true);
      return;
    }
    setOpenIndex((prev) => (prev === index ? null : index));
    setSelectedIndex(index);
    setSelectedReasonValue(null);
  };

  const handleSelectSubReason = (index: number, sub: SubReason) => {
    setSelectedIndex(index);
    setSelectedReasonValue(sub.value);
  };

  const selectedGroup =
    selectedIndex != null ? REASON_GROUPS[selectedIndex] : null;
  const canSubmit =
    selectedGroup != null &&
    (selectedGroup.freeText
      ? otherDetail.trim().length > 0
      : selectedReasonValue !== null);

  const handleSubmit = async () => {
    if (!canSubmit || !selectedGroup || !exchangeId) return;

    const reason: CancelReason | undefined = selectedGroup.freeText
      ? selectedGroup.singleValue
      : (selectedReasonValue ?? undefined);
    if (!reason) return;

    const detail = selectedGroup.freeText ? otherDetail : undefined;

    setIsSubmitting(true);
    try {
      await exchangeApi.cancel(exchangeId, reason, detail);
      onSuccess();
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : '거래를 파기하지 못했습니다. 다시 시도해주세요.',
      );
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-2 py-2 border-b border-gray-100">
        <IconButton icon={ICONS.BACK} onClick={onClose} />
        <span className="text-base font-semibold text-gray-900">거래 파기</span>
        <IconButton icon={ICONS.CLOSE} onClick={onClose} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <div className="bg-yellow-light px-5 py-6 flex flex-col items-center text-center gap-2">
          <Icon
            icon="mdi:alert-circle"
            className="text-[24px] text-[#856F00]"
          />
          <p className="text-sm font-bold text-[#856F00] leading-relaxed">
            정당한 사유 없이 거래를 일방적으로 파기하는 경우
            <br />
            서비스 이용이 제한될 수 있습니다.
          </p>
          <ul className="text-xs text-[#856F00] leading-relaxed">
            <li>• 1회 위반: 1일 이용 정지</li>
            <li>• 2회 위반: 3일 이용 정지</li>
            <li>• 3회 위반: 해당 학기 수강정정기간 전체 정지</li>
          </ul>
          <p className="text-xs text-[#856F00] leading-relaxed">
            파기된 사유가 일방적인 것으로 확인되면 상대방의 반박 신고를 통해
            귀책사유가 인정됩니다.
          </p>
        </div>

        <div className="px-5 py-5 flex flex-col gap-3">
          {REASON_GROUPS.map((group, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={`${group.singleValue ?? 'group'}-${group.label}`}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => handleToggleGroup(group, index)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm ${
                    selectedIndex === index
                      ? 'bg-brand-bg text-brand-lightBlue font-semibold'
                      : 'bg-white text-gray-900'
                  }`}
                >
                  {group.label}
                  <Icon
                    icon={isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                    className="text-[18px]"
                  />
                </button>

                {isOpen && group.subReasons && (
                  <div className="flex flex-col border-t border-gray-100">
                    {group.subReasons.map((sub) => (
                      <label
                        key={sub.value}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 border-b last:border-b-0 border-gray-100"
                      >
                        <input
                          type="radio"
                          name={`reason-${index}`}
                          checked={
                            selectedReasonValue === sub.value &&
                            selectedIndex === index
                          }
                          onChange={() => handleSelectSubReason(index, sub)}
                        />
                        {sub.label}
                      </label>
                    ))}
                  </div>
                )}

                {isOpen && group.freeText && (
                  <div className="px-4 py-3 border-t border-gray-100">
                    <Input
                      placeholder="사유를 입력해주세요."
                      value={otherDetail}
                      onChange={(e) => setOtherDetail(e.target.value)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="px-5 pb-4 text-xs text-gray-500 text-center leading-relaxed">
          상대방의 악의적인 행동이 의심된다면
          <br />
          거래 파기 후{' '}
          <span className="font-semibold text-gray-700">사용자 신고</span>로
          관리자에게 접수하세요
        </p>
      </div>

      <div className="px-7 py-8 bg-white">
        <Button
          variant="primary"
          size="lg"
          disabled={!canSubmit || isSubmitting || !exchangeId}
          onClick={handleSubmit}
        >
          {isSubmitting ? '처리 중...' : '거래 파기하기'}
        </Button>
      </div>

      <Modal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
        icon={
          <span className="w-10 h-10 rounded-full bg-point-red/10 flex items-center justify-center">
            <Icon
              icon="mdi:alert-circle"
              className="text-[24px] text-point-red"
            />
          </span>
        }
        title="해당 사유로는 직접 파기할 수 없습니다"
        footer={
          <Button
            variant="danger"
            size="md"
            onClick={() => setIsBlockedModalOpen(false)}
          >
            확인
          </Button>
        }
      >
        <span className="text-point-red font-medium">
          상대방이 30분 이상 응답하지 않을 경우{'\n'}거래는 자동으로 종료됩니다.
        </span>
        {'\n\n'}
        자동 종료 전 거래를 일방적으로 파기하면{'\n'}
        파기한 사용자에게 귀책사유가 인정되어{'\n'}
        페널티가 부여될 수 있습니다.
      </Modal>

      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        icon={
          <span className="w-10 h-10 rounded-full bg-point-red/10 flex items-center justify-center">
            <Icon
              icon="mdi:alert-circle"
              className="text-[24px] text-point-red"
            />
          </span>
        }
        title="거래 파기에 실패했습니다"
        footer={
          <Button
            variant="danger"
            size="md"
            onClick={() => setIsErrorModalOpen(false)}
          >
            확인
          </Button>
        }
      >
        {errorMessage}
      </Modal>
    </div>
  );
}
