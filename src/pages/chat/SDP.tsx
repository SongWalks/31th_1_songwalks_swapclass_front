// pages/chat/ScheduleDecisionPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import Button from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ICONS } from '@/constants/icons';

import { chatRoomApi } from '@/api/chat/chatRoomApi';
import { exchangeApi } from '@/api/chat/exchangeApi';
import { ApiError } from '@/api/chat/apiClient';

// ⚠️ 수강신청 가능 날짜 범위를 내려주는 전용 API가 명세서/스웨거에 없어
//    오늘 날짜 기준으로 다음 3일을 동적 생성한다. (백엔드에 관련 API가 생기면 교체할 것)
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

const generateDateOptions = (count = 3) => {
  const options: { label: string; date: Date }[] = [];
  const today = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${String(
      d.getDate(),
    ).padStart(2, '0')}일 ${DAY_NAMES[d.getDay()]}요일`;
    options.push({ label, date: d });
  }
  return options;
};

const AMPM_OPTIONS = ['오전', '오후'] as const;
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => i + 1); // 1~12
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => i); // 0~59, 5분 단위 아님

export default function ScheduleDecisionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId = '' } = useParams();

  const [dateOptions] = useState(() => generateDateOptions());
  const [date, setDate] = useState(dateOptions[0].label);

  const [ampm, setAmpm] = useState<(typeof AMPM_OPTIONS)[number]>('오전');
  const [hour, setHour] = useState(4);
  const [minute, setMinute] = useState(0);

  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    '시간을 확정하지 못했습니다. 다시 시도해주세요.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 채팅방 진입 시 이미 받아온 exchangeId가 있으면 그걸 쓰고, 없으면(새로고침 등) 직접 조회한다.
  const [exchangeId, setExchangeId] = useState<number | null>(
    (location.state as { exchangeId?: number } | null)?.exchangeId ?? null,
  );

  useEffect(() => {
    if (exchangeId != null) return;
    chatRoomApi
      .getRoom(roomId, { size: 1 })
      .then((data) => setExchangeId(data.room.exchangeId))
      .catch(() => setExchangeId(null));
  }, [roomId, exchangeId]);

  const handleBack = () => navigate(-1);

  const timePreview = useMemo(
    () => `${ampm} ${hour}:${String(minute).padStart(2, '0')}`,
    [ampm, hour, minute],
  );

  const parseToIso = () => {
    const [, y, m, d] = date.match(/(\d+)년 (\d+)월 (\d+)일/) ?? [];
    let h = hour;
    if (ampm === '오후' && h !== 12) h += 12;
    if (ampm === '오전' && h === 12) h = 0;
    return new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      h,
      minute,
    ).toISOString();
  };

  const handleRegister = async () => {
    if (!exchangeId) {
      setErrorMessage('교환 정보를 불러오지 못했습니다. 다시 시도해주세요.');
      setIsErrorModalOpen(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const scheduledAt = parseToIso();
      const res = await exchangeApi.confirmSchedule(exchangeId, scheduledAt);
      // 확정된 시각을 채팅방으로 되돌려주면서 즉시 안내 배너를 그릴 수 있게 한다.
      // (스웨거 chat-room 응답에는 scheduledAt 필드가 없어, 시스템 메시지 파싱 전까지는
      //  navigation state로 임시 보완한다.)
      navigate(`/chat/${roomId}`, {
        replace: true,
        state: { scheduledAt: res.scheduledAt },
      });
    } catch (err) {
      setErrorMessage(
        err instanceof ApiError
          ? err.message
          : '시간을 확정하지 못했습니다. 다시 시도해주세요.',
      );
      setIsErrorModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative bg-[#fbfbfb] mx-auto overflow-hidden font-['Pretendard'] h-full flex flex-col">
      <div>
        <Header
          leftNode={<IconButton icon={ICONS.BACK} onClick={handleBack} />}
          title="교환시간 결정"
          rightNode={<IconButton icon={ICONS.CLOSE} onClick={handleBack} />}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-20">
        <div className="mt-6 flex flex-col gap-1 bg-brand-bg border-[0.46px] border-brand-lightBlue rounded-lg px-4 py-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#19191B]">날짜</span>
            <div className="relative">
              <select
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#19191B] bg-white"
              >
                {dateOptions.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Icon
                icon="mdi:chevron-down"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-gray-400 pointer-events-none"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-[#19191B]">시간</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={ampm}
                  onChange={(e) =>
                    setAmpm(e.target.value as (typeof AMPM_OPTIONS)[number])
                  }
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-3 text-sm text-[#19191B] bg-white"
                >
                  {AMPM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <Icon
                  icon="mdi:chevron-down"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none"
                />
              </div>

              <div className="relative flex-1">
                <select
                  value={hour}
                  onChange={(e) => setHour(Number(e.target.value))}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-3 text-sm text-[#19191B] bg-white"
                >
                  {HOUR_OPTIONS.map((h) => (
                    <option key={h} value={h}>
                      {h}시
                    </option>
                  ))}
                </select>
                <Icon
                  icon="mdi:chevron-down"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none"
                />
              </div>

              <div className="relative flex-1">
                <select
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-3 text-sm text-[#19191B] bg-white"
                >
                  {MINUTE_OPTIONS.map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}분
                    </option>
                  ))}
                </select>
                <Icon
                  icon="mdi:chevron-down"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-gray-400 pointer-events-none"
                />
              </div>
            </div>
            <span className="text-[11px] text-gray-400 mt-0.5">
              선택한 시간: {timePreview}
            </span>
          </label>
        </div>

        <div className="bg-yellow-light rounded-md px-5 py-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-bold text-[#856F00] mb-1">
              교환 시간 안내
            </p>
            <p className="text-xs text-[#856F00] leading-relaxed">
              교환 시간은 양측이 동시에 강의를 취소하고 신청하는 시점입니다.
              원활한 교환을 위해 상대방과 충분히 협의한 후 시간을 결정해 주세요.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold text-[#856F00] mb-1">유의사항</p>
            <ul className="flex flex-col gap-1">
              {[
                '교환 시간은 수강신청이 가능한 시간대로 설정해 주세요.',
                '교환 30분 전, 10분 전에 알림이 발송되며, 교환 5분 전부터 강의 보유 인증이 시작됩니다.',
                '인증을 완료하지 않거나 교환 시간에 참여하지 않을 경우 거래가 취소될 수 있으며 페널티가 부여될 수 있습니다.',
                '강의 취소 및 수강신청 결과는 학교 시스템 상황에 따라 달라질 수 있습니다.',
              ].map((text) => (
                <li
                  key={text}
                  className="flex items-start gap-1.5 text-xs text-[#856F00]"
                >
                  <span className="mt-0.5">⚠</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <ul className="flex flex-col gap-1">
            <li className="text-xs text-[#856F00]">
              • 상대방과 협의하여 결정한 시간입니다.
            </li>
            <li className="text-xs text-[#856F00]">
              • 선택한 교환 시간을 확인했으며, 해당 시간에 참여할 수 있습니다.
            </li>
          </ul>
        </div>
      </div>

      <div className="px-7 py-8 bg-[#fbfbfb]">
        <Button
          variant="primary"
          size="lg"
          onClick={handleRegister}
          disabled={isSubmitting}
        >
          {isSubmitting ? '등록 중...' : '교환시간 등록'}
        </Button>
      </div>

      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        icon={
          <span className="w-10 h-10 rounded-full bg-point-red/10 flex items-center justify-center">
            <Icon
              icon="mdi:alert-circle"
              className="text-[28px] text-point-red"
            />
          </span>
        }
        title="시간 확정에 실패했습니다"
        footer={
          <Button
            variant="danger"
            size="md"
            onClick={() => setIsErrorModalOpen(false)}
          >
            다시 시도하기
          </Button>
        }
      >
        {errorMessage}
      </Modal>
    </div>
  );
}
