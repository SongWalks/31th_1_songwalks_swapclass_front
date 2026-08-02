// pages/chat/TerminateDealPage.tsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import Button from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { ICONS } from '@/constants/icons';
import { mockExchangeStore } from '../mockExcn';

interface ReasonGroup {
  key: string;
  label: string;
  subReasons?: string[];
  freeText?: boolean;
  blocked?: boolean;
}

const REASON_GROUPS: ReasonGroup[] = [
  {
    key: 'MUTUAL',
    label: '상호 합의로 거래 취소',
    subReasons: ['시간 조율 실패', '서로 다른 과목으로 진행하기로 함'],
  },
  {
    key: 'FRAUD',
    label: '인증 정보가 의심됨',
    subReasons: ['보유 과목 인증 사진이 의심됨', '다른 과목 사진 제출'],
  },
  {
    key: 'ABUSE',
    label: '상대방이 거래를 진행하지 않음',
    subReasons: ['과목을 버리지 않음', '거래를 일방적으로 중단함'],
  },
  { key: 'NO_RESPONSE', label: '상대방과 연락이 원활하지 않음', blocked: true },
  { key: 'OTHER', label: '기타', freeText: true },
];

export default function TerminateDealPage() {
  const navigate = useNavigate();
  const { roomId = '' } = useParams();

  const [openKey, setOpenKey] = useState<string | null>(null);
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null);
  const [selectedSubReason, setSelectedSubReason] = useState<string | null>(
    null,
  );
  const [otherDetail, setOtherDetail] = useState('');
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  const handleBack = () => navigate(-1);

  const handleToggleGroup = (group: ReasonGroup) => {
    if (group.blocked) {
      setIsBlockedModalOpen(true);
      return;
    }
    setOpenKey((prev) => (prev === group.key ? null : group.key));
    setSelectedGroupKey(group.key);
    setSelectedSubReason(null);
  };

  const handleSelectSubReason = (groupKey: string, sub: string) => {
    setSelectedGroupKey(groupKey);
    setSelectedSubReason(sub);
  };

  const canSubmit =
    selectedGroupKey !== null &&
    (selectedGroupKey === 'OTHER'
      ? otherDetail.trim().length > 0
      : selectedSubReason !== null);

  const handleSubmit = () => {
    if (!canSubmit) return;
    // TODO: 실제로는 2번 API(거래 파기) 호출
    // reason: selectedGroupKey를 서버 enum(MUTUAL|FRAUD|MONEY_DEMAND|ABUSE|OTHER)에 맞게 매핑
    // detail: selectedGroupKey === 'OTHER' ? otherDetail : selectedSubReason
    //
    // 💡 실제 API 연동 로직 - 백엔드 거래 파기 API 붙으면 아래 주석 블록 해제
    /*
    const reason = selectedGroupKey;
    const detail =
      selectedGroupKey === 'OTHER' ? otherDetail : selectedSubReason;
    const res = await fetch(`${API_BASE}/api/exchange/${roomId}/terminate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, detail }),
      credentials: 'include',
    });
    if (!res.ok) {
      // TODO: 실패 시 에러 토스트/모달 처리
      return;
    }
    */

    // 💡 목업: 파기 상태로 전환 → ChatRoomPage에서 이 status를 보고
    // 안내 문구 노출 + 입력창 잠금 처리를 한다.
    mockExchangeStore.setStatus(roomId, 'TERMINATED');
    navigate(`/chat/${roomId}`);
  };

  return (
    <div className="relative bg-white mx-auto overflow-hidden font-['Pretendard'] h-full flex flex-col">
      <div>
        <Header
          leftNode={
            <div style={{ opacity: 0.6 }} className="z-10">
              <IconButton icon={ICONS.BACK} onClick={handleBack} />
            </div>
          }
          title={<span className="text-[#000000B2]">거래 파기/원상복구</span>}
          rightNode={
            <div style={{ opacity: 0.6 }} className="z-10">
              <IconButton icon={ICONS.CLOSE} onClick={handleBack} />
            </div>
          }
        />
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
          {REASON_GROUPS.map((group) => {
            const isOpen = openKey === group.key;
            return (
              <div
                key={group.key}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => handleToggleGroup(group)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm ${
                    selectedGroupKey === group.key
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
                        key={sub}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 border-b last:border-b-0 border-gray-100"
                      >
                        <input
                          type="radio"
                          name={group.key}
                          checked={
                            selectedSubReason === sub &&
                            selectedGroupKey === group.key
                          }
                          onChange={() => handleSelectSubReason(group.key, sub)}
                        />
                        {sub}
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
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          거래 파기하기
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
    </div>
  );
}
