// pages/chat/ChatRoomPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import Header from '@/components/layout/Header';
import { IconButton } from '@/components/common/IconButton';
import { Input } from '@/components/common/Input';
import Button from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ICONS } from '@/constants/icons';
import sendIcon from '@/assets/icons/send.svg';
import disputeIcon from '@/assets/icons/dispute.svg';

import { chatRoomApi, type ChatMessageDto } from '@/api/chat/chatRoomApi';
import { exchangeApi } from '@/api/chat/exchangeApi';
import { ApiError } from '@/api/chat/apiClient';
import { useChatSocket } from '@/api/chat/useChatSocket';
import { getTokens, decodeUserId } from '../../store/tokenStorage';
import TerminateDealOverlay from './TDP';

const COUNTDOWN_START = 10;
const COUNTDOWN_RED_THRESHOLD = 3;
// ⚠️ 인증은 교환 예정 시간 5분 전부터 가능 (기능명세서 기준)
const VERIFY_LEAD_MS = 5 * 60 * 1000;
// ⚠️ 실제 채팅방 목록 라우트 경로에 맞게 확인/수정 필요
const ROOM_LIST_PATH = '/chat';

type FlowStep = 'CHAT' | 'GUIDE' | 'VERIFY' | 'COUNTDOWN' | 'DISPUTE';
type VerifySubStep =
  | 'INTRO'
  | 'CAPTURING'
  | 'WAITING_COUNTERPART'
  | 'CONFIRM_COUNTERPART'
  | 'READY';
type CountdownPhase = 'COUNTING' | 'RESULT_SELECT';
type DisputeSubStep = 'CAPTURE' | 'SUBMITTED';

const STATUS_TO_FLOW_STEP: Record<string, FlowStep> = {
  CHATTING: 'CHAT',
  SCHEDULED: 'CHAT',
  VERIFYING: 'VERIFY',
  COUNTDOWN: 'COUNTDOWN',
  DONE: 'CHAT',
};

const CHAT_INPUT_UNLOCKED_STEPS: FlowStep[] = ['CHAT', 'GUIDE'];

const GUIDE_STEPS = [
  {
    title: '1. 수강신청 내역 페이지를 열어주세요.',
    desc: '학교 수강신청 시스템에서 현재 신청한 강의 목록이 보이는 화면을 준비해주세요.',
    caption: '실제 수강신청 페이지 예시 · 강의 목록이 표시된 상태',
  },
  {
    title: '2. 인증 QR 코드가 보이도록 화면을 배치해주세요.',
    desc: '수강신청 내역과 인증 QR 코드가 한 화면에 함께 보이도록 창 크기를 조정해주세요.',
    caption: '왼쪽: 학교 수강신청 페이지 · 오른쪽: 서비스의 인증 QR 코드',
  },
  {
    title: '3. [인증 시작] 버튼을 눌러주세요.',
    desc: '버튼을 누르면 화면 공유 창이 나타납니다.',
    caption: '"인증 시작" 버튼이 강조된 화면',
  },
  {
    title: '4. 전체 화면을 선택해주세요.',
    desc: '화면 공유 창에서 "전체 화면"을 선택한 후 [공유] 버튼을 눌러주세요.',
    caption: '브라우저의 화면 공유 선택 창 · "전체 화면" 선택 부분 강조 표시',
  },
  {
    title: '5. 자동 인증이 진행됩니다.',
    desc: '공유가 시작되면 시스템이 현재 화면을 자동으로 촬영하여 인증을 진행합니다.\n※ 촬영 후 화면 공유는 자동으로 종료됩니다.',
    caption: '"인증 진행 중..." 로딩 화면',
  },
  {
    title: '6. 촬영된 이미지를 확인해주세요.',
    desc: '촬영된 이미지에서 교환하려는 강의가 정상적으로 보이는지 확인해주세요.',
    caption: '실제 촬영된 결과 예시 · 강의 목록과 QR 코드가 함께 보이는 화면',
  },
  {
    title: '7. 인증 완료',
    desc: '인증이 완료되면 다음 단계로 이동할 수 있습니다.',
    caption: '"인증이 완료되었습니다" 완료 화면 · "카운트다운 시작" 버튼',
  },
];

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const formatScheduledDate = (iso: string) => {
  const d = new Date(iso);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
};

export default function ChatRoomPage() {
  const [exchangeStatus, setExchangeStatus] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId = '' } = useParams();

  const navCourses = location.state as {
    myCourseName?: string;
    counterpartCourseName?: string;
    scheduledAt?: string;
  } | null;

  // ============ VERIFY ============
  const handleEnterVerify = async () => {
    setCardInsertIndex(messages.length);
    setShowPreviousChat(false);
    setLocalFlowStep(null);
    setVerifyStep('INTRO');
    setMyVerified(false);
    if (!exchangeId) return;
    try {
      // QR 발급은 서버가 VERIFYING 상태일 때만 허용하므로, 발급 전에 최신 상태를 한 번 확인한다.
      const roomData = await chatRoomApi.getRoom(roomId, { size: 1 });
      setRoomStatus(roomData.room.status);
      if (
        roomData.room.status !== 'VERIFYING' &&
        roomData.room.status !== 'READY'
      ) {
        setApiError(
          '아직 인증을 시작할 수 없는 상태입니다. 잠시 후 다시 시도해주세요.',
        );
        return;
      }
      const qr = await exchangeApi.createQr(exchangeId);
      setQrImageUrl(qr.qrImageUrl);
      setQrExpiresAt(qr.expiresAt);
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : 'QR 코드를 발급받지 못했습니다.',
      );
    }
  };

  // ===== 과목명 상태 =====
  const [courseNames, setCourseNames] = useState<{
    my: string;
    counterpart: string;
  } | null>(
    navCourses?.myCourseName && navCourses?.counterpartCourseName
      ? {
          my: navCourses.myCourseName,
          counterpart: navCourses.counterpartCourseName,
        }
      : null,
  );
  const myCourseName = courseNames?.my ?? '알 수 없음';
  const counterpartCourseName = courseNames?.counterpart ?? '알 수 없음';

  // JWT의 sub 클레임 = 로그인 유저 id. senderId(number)와 비교해야 하므로 Number 변환 필수.
  const CURRENT_USER_ID =
    Number(decodeUserId(getTokens()?.accessToken ?? '')) || null;

  // ===== 서버 연동 상태 =====
  const [exchangeId, setExchangeId] = useState<number | null>(null);
  const [roomStatus, setRoomStatus] = useState<string>('CHATTING');
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [scheduledAt, setScheduledAt] = useState<string | null>(
    navCourses?.scheduledAt ?? null,
  );

  const [inputValue, setInputValue] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  // ===== 화면 전환 로컬 상태 =====
  const [localFlowStep, setLocalFlowStep] = useState<FlowStep | null>(null);
  const flowStep: FlowStep =
    localFlowStep ??
    (exchangeStatus === 'DISPUTE'
      ? 'DISPUTE'
      : STATUS_TO_FLOW_STEP[roomStatus]) ??
    'CHAT';

  const [cardInsertIndex, setCardInsertIndex] = useState(0);
  const [scheduleInsertIndex, setScheduleInsertIndex] = useState(0);
  const prevScheduledAtRef = useRef(scheduledAt);
  const [showPreviousChat, setShowPreviousChat] = useState(false);

  // ----- VERIFY 관련 상태 -----
  const [verifyStep, setVerifyStep] = useState<VerifySubStep>('INTRO');
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [verifySecondsLeft, setVerifySecondsLeft] = useState(0);
  const [isCaptureFailModalOpen, setIsCaptureFailModalOpen] = useState(false);
  const [isCounterpartConfirmedChecked, setIsCounterpartConfirmedChecked] =
    useState(false);
  const [myVerified, setMyVerified] = useState(false);

  // ----- 5분 전 자동 인증 진입 -----
  const [verifyWindowReached, setVerifyWindowReached] = useState(false);

  // ----- COUNTDOWN 관련 상태 -----
  const [countdownPhase, setCountdownPhase] =
    useState<CountdownPhase>('COUNTING');
  const [countdownSecondsLeft, setCountdownSecondsLeft] =
    useState(COUNTDOWN_START);

  // ----- DISPUTE 관련 상태 -----
  const [isDisputeSubmitting, setIsDisputeSubmitting] = useState(false);
  const [disputeStep, setDisputeStep] = useState<DisputeSubStep>('CAPTURE');

  const isCompleted = exchangeStatus === 'COMPLETED';
  const isTerminated = isCancelled;

  // ============ 채팅방/교환 정보 최초 로딩 ============
  const loadRoom = async () => {
    try {
      const data = await chatRoomApi.getRoom(roomId, { size: 50 });
      setExchangeId(data.room.exchangeId);
      setRoomStatus(data.room.status);
      // 서버가 커서 페이징 특성상 최신순(내림차순)으로 내려주므로 createdAt 기준 오름차순으로 정렬해 표시한다.
      setMessages(
        [...data.messages].sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      );
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : '채팅방 정보를 불러오지 못했습니다.',
      );
    } finally {
      setIsLoadingRoom(false);
    }
  };

  useEffect(() => {
    // 마운트 시 1회 데이터 페칭 - 의도된 패턴이라 룰 예외 처리
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ============ 과목명 / 확정시간 보완 조회 ============
  // ⚠️ 채팅방 상세 조회(getRoom) 응답에 과목명·확정시간 필드가 없어(스웨거 확인 완료)
  //    새로고침 등으로 location.state가 없을 때 목록 API에서 동일 roomId를 찾아 보완한다.
  //    백엔드가 상세 응답에 필드를 추가하면 이 로직은 제거 가능.
  useEffect(() => {
    if (courseNames && scheduledAt) return;
    chatRoomApi
      .getRoomList()
      .then((list) => {
        const found = list.find((r) => String(r.roomId) === String(roomId));
        if (!found) return;
        setCourseNames((prev) =>
          prev
            ? prev
            : {
                my: found.myCourseName,
                counterpart: found.partnerCourseName,
              },
        );
        setScheduledAt((prev) => prev ?? found.scheduledAt ?? null);
      })
      .catch(() => {
        // 실패 시 조용히 무시 (기존 '알 수 없음' fallback 유지)
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ============ 실시간 채팅 (STOMP / SockJS) ============
  const handleIncomingMessage = (message: ChatMessageDto) => {
    setMessages((prev) => [...prev, message]);

    if (message.type === 'SYSTEM') {
      // 시스템 메시지 도착 = 서버측 상태가 바뀌었을 가능성이 높으므로 room을 재조회해 동기화한다.
      // ⚠️ 정확한 트리거 방식은 백엔드와 재확인 필요 (별도 상태 변경 이벤트가 없기 때문에 임시로 재조회 방식 사용)
      loadRoom();

      // "N월 N일 (요일)" + "오전/오후 h:mm" 패턴이 포함된 시스템 메시지라면 확정 시각으로 간주해 파싱 시도
      const match = message.content.match(
        /(\d{1,2})월\s*(\d{1,2})일.*?(오전|오후)\s*(\d{1,2}):(\d{2})/,
      );
      if (match) {
        const [, mm, dd, ampm, hh, min] = match;
        const now = new Date();
        let hour = Number(hh);
        if (ampm === '오후' && hour !== 12) hour += 12;
        if (ampm === '오전' && hour === 12) hour = 0;
        const iso = new Date(
          now.getFullYear(),
          Number(mm) - 1,
          Number(dd),
          hour,
          Number(min),
        ).toISOString();
        setScheduledAt(iso);
      }
    }
  };

  const { sendMessage } = useChatSocket({
    roomId,
    onMessage: handleIncomingMessage,
    enabled: !isLoadingRoom,
  });

  // 교환 시간이 방금 확정된 시점(false -> true 전환)의 메시지 개수를 기록
  useEffect(() => {
    if (!prevScheduledAtRef.current && scheduledAt) {
      setScheduleInsertIndex(messages.length);
    }
    prevScheduledAtRef.current = scheduledAt;
  }, [scheduledAt, messages.length]);

  // 새 카드/메시지가 생기면 맨 아래로 자동 스크롤 (GUIDE 진입 시엔 맨 위로)
  const prevFlowStepRef = useRef(flowStep);
  useEffect(() => {
    const justEnteredGuide =
      flowStep === 'GUIDE' && prevFlowStepRef.current !== 'GUIDE';
    if (justEnteredGuide) {
      scrollRef.current?.scrollTo({ top: 0 });
    } else {
      scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight });
    }
    prevFlowStepRef.current = flowStep;
  }, [
    messages,
    scheduledAt,
    flowStep,
    verifyStep,
    disputeStep,
    countdownPhase,
    cardInsertIndex,
    showPreviousChat,
    scheduleInsertIndex,
  ]);

  // ============ 5분 전 자동 인증 진입 트리거 ============
  // scheduledAt 기준 5분 전 시각을 계산해 도달 여부를 추적한다. 이 상태가 true가 되는 순간부터
  // 채팅 입력이 잠기고, 아래 폴링 효과에서 VERIFY 단계로 자동 진입을 시도한다.
  useEffect(() => {
    if (!scheduledAt || isTerminated || isCompleted || flowStep !== 'CHAT') {
      return;
    }
    const triggerAt = new Date(scheduledAt).getTime() - VERIFY_LEAD_MS;
    const now = Date.now();
    if (now >= triggerAt) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVerifyWindowReached(true);
      return;
    }
    setVerifyWindowReached(false);
    const timer = setTimeout(
      () => setVerifyWindowReached(true),
      triggerAt - now,
    );
    return () => clearTimeout(timer);
  }, [scheduledAt, flowStep, isTerminated, isCompleted]);

  // 인증 가능 시각이 되면, 서버 상태가 VERIFYING/READY로 바뀔 때까지 짧게 폴링한 뒤 인증 화면으로 진입한다.
  // ⚠️ 5분 전 상태 전환을 알려주는 서버 이벤트가 스웨거에 없어 클라이언트 폴링으로 감지한다.
  useEffect(() => {
    if (!verifyWindowReached || flowStep !== 'CHAT') return;
    let cancelled = false;

    const tryEnter = async () => {
      try {
        const data = await chatRoomApi.getRoom(roomId, { size: 1 });
        if (cancelled) return;
        setRoomStatus(data.room.status);
        if (data.room.status === 'VERIFYING' || data.room.status === 'READY') {
          handleEnterVerify();
        }
      } catch {
        // 폴링 실패는 조용히 무시하고 다음 tick에 재시도
      }
    };

    void tryEnter();
    const timer = setInterval(tryEnter, 3000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyWindowReached, flowStep, roomId]);

  // ============ VERIFY: 서버 status 폴링으로 상대방 인증 완료 감지 ============
  // ⚠️ 스웨거에 "상대방 인증 완료 여부"를 알려주는 전용 API/이벤트가 없어
  //    임시로 폴링 방식을 사용한다. 백엔드가 시스템 메시지나 별도 API로 알려줄 수 있다면 교체할 것.
  useEffect(() => {
    if (
      flowStep !== 'VERIFY' ||
      !myVerified ||
      verifyStep !== 'WAITING_COUNTERPART'
    )
      return;
    const timer = setInterval(async () => {
      try {
        const data = await chatRoomApi.getRoom(roomId, { size: 1 });
        setRoomStatus(data.room.status);
        if (data.room.status !== 'VERIFYING') {
          setVerifyStep('CONFIRM_COUNTERPART');
        }
      } catch {
        // 폴링 실패는 조용히 무시하고 다음 tick에 재시도
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [flowStep, myVerified, verifyStep, roomId]);

  const handleBack = () => {
    // 거래가 파기된 상태에서는 뒤로가기를 누르면 목록으로 바로 이동한다.
    if (isTerminated) {
      navigate(ROOM_LIST_PATH, { replace: true });
      return;
    }
    navigate(-1);
  };

  // ⚠️ 메시지 전송은 REST POST 엔드포인트가 없음(스웨거 확인 완료) — STOMP publish로만 처리한다.
  //    STOMP 연결이 안 되어 있으면 전송 자체가 불가하므로 에러만 안내한다.
  const handleSend = () => {
    const content = inputValue.trim();
    if (!content) return;
    const ok = sendMessage(content);
    if (ok) {
      setInputValue('');
      return;
    }
    setApiError('채팅 서버와 연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComposingRef.current && e.keyCode !== 229) {
      handleSend();
    }
  };

  // GUIDE 종료 = VERIFY 진입이므로 상태 재확인 + QR 발급까지 이어서 처리한다.
  const handleConfirmGuideAndEnterVerify = () => {
    handleEnterVerify();
  };

  const handleGoSchedule = () => {
    setIsMenuOpen(false);
    navigate(`/chat/${roomId}/schedule`, { state: { exchangeId } });
  };

  // 거래 파기: 라우트 이동 없이 오버레이 카드로 처리한다 (페이지 교체 시 과목명 등 state가 유실되는 문제 방지).
  const handleGoTerminate = () => {
    setIsMenuOpen(false);
    setIsTerminateOpen(true);
  };

  const handleReport = () => {
    setIsMenuOpen(false);
    navigate('/report');
  };

  const renderMessages = (msgs: ChatMessageDto[] = messages) =>
    msgs.map((msg) => {
      const isMine = msg.senderId === CURRENT_USER_ID;
      const timeNode = (
        <span className="text-[10px] text-gray-400 flex-shrink-0">
          {formatTime(msg.createdAt)}
        </span>
      );
      return (
        <div
          key={msg.id}
          className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
        >
          {isMine && timeNode}
          <div
            className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
              isMine
                ? 'bg-brand-lightBlue text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            }`}
          >
            {msg.content}
          </div>
          {!isMine && timeNode}
        </div>
      );
    });

  const renderScheduledBox = () =>
    scheduledAt && (
      <div className="mx-4 mt-7 bg-yellow-light border-[0.70px] border-[#D1B422] rounded-lg px-4 py-8 flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <span className="w-12 h-12 rounded-full border border-[#D1B422] bg-[#FFF3B6] flex items-center justify-center flex-shrink-0">
            <Icon
              icon="mdi:calendar-check-outline"
              className="text-[30px] text-[#D1B422]"
            />
          </span>
          <div>
            <p className="text-xs font-semibold text-[#D1B422]">
              교환 시간 확정
            </p>
            <p className="text-sm font-bold text-gray-700">
              날짜 : {formatScheduledDate(scheduledAt)}
            </p>
            <p className="text-sm font-bold text-gray-700">
              시간 : {formatTime(scheduledAt)}
            </p>
          </div>
        </div>

        <ul className="flex flex-col gap-1.5">
          {[
            '교환 5분 전 강의 보유 인증이 진행됩니다.',
            'PC에서 수강신청(내역) 페이지를 미리 열어주세요.',
            '모바일 인증은 지원되지 않습니다.',
          ].map((text) => (
            <li
              key={text}
              className="flex items-start gap-1.5 text-xs text-gray-700"
            >
              <Icon
                icon="mdi:check-circle-outline"
                className="text-[14px] bg-[#FFF3B6] rounded-full text-[#D1B422] mt-0.5 flex-shrink-0"
              />
              {text}
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={handleShowGuide}
          className="w-full py-2.5 border-[0.70px] border-[#D1B422] rounded-xl bg-[#FCEFAF] text-[#D1B422] text-sm font-semibold"
        >
          캡쳐 인증 방법 확인하기
        </button>
      </div>
    );

  const renderPreviousChatHistory = (uptoIndex: number) => {
    const boxIndex = Math.min(scheduleInsertIndex, uptoIndex);
    return (
      <>
        {renderMessages(messages.slice(0, boxIndex))}
        {boxIndex === scheduleInsertIndex && renderScheduledBox()}
        {renderMessages(messages.slice(boxIndex, uptoIndex))}
      </>
    );
  };

  // ============ GUIDE ============
  const handleShowGuide = () => {
    setCardInsertIndex(messages.length);
    setShowPreviousChat(false);
    setLocalFlowStep('GUIDE');
  };

  // 서버가 내려준 expiresAt 기준으로 남은 시간 계산 (로컬 타이머가 아니라 서버 시각과 동기화)
  useEffect(() => {
    if (flowStep !== 'VERIFY' || verifyStep !== 'INTRO' || !qrExpiresAt) return;
    const tick = () => {
      const remain = Math.max(
        0,
        Math.floor((new Date(qrExpiresAt).getTime() - Date.now()) / 1000),
      );
      setVerifySecondsLeft(remain);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [flowStep, verifyStep, qrExpiresAt]);

  const formatVerifyTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const captureScreen = async (): Promise<Blob | null> => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    stream.getTracks().forEach((track) => track.stop());
    return blob;
  };

  const handleStartCapture = async () => {
    if (!exchangeId) return;
    setVerifyStep('CAPTURING');
    try {
      const blob = await captureScreen();
      if (!blob) throw new Error('화면 캡처에 실패했습니다.');
      const result = await exchangeApi.uploadCapture(exchangeId, blob);
      if (!result.qrValid || result.status !== 'PASSED') {
        setIsCaptureFailModalOpen(true);
        setVerifyStep('INTRO');
        return;
      }
      setMyVerified(true);
      setVerifyStep('WAITING_COUNTERPART');
    } catch (err) {
      setIsCaptureFailModalOpen(true);
      setVerifyStep('INTRO');
      setApiError(err instanceof ApiError ? err.message : null);
    }
  };

  const handleConfirmCounterpart = () => setVerifyStep('READY');

  // ============ COUNTDOWN ============
  // ⚠️ 카운트다운 시작/진행에 대응하는 서버 API가 스웨거에 없어 클라이언트 로컬 진행으로 처리한다.
  //    (백엔드가 별도 이벤트를 제공하면 두 클라이언트 동기화 로직으로 교체 필요)
  const handleEnterCountdown = () => {
    setLocalFlowStep('COUNTDOWN');
    setCountdownPhase('COUNTING');
    setCountdownSecondsLeft(COUNTDOWN_START);
  };

  useEffect(() => {
    if (flowStep !== 'COUNTDOWN' || countdownPhase !== 'COUNTING') return;
    if (countdownSecondsLeft <= 0) {
      // 카운트다운 종료 → 결과 선택 단계로 전환하는 의도된 상태 변경
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCountdownPhase('RESULT_SELECT');
      return;
    }
    const timer = setTimeout(
      () => setCountdownSecondsLeft((prev) => prev - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [flowStep, countdownPhase, countdownSecondsLeft]);

  const handleExchangeResult = async (result: 'SUCCESS' | 'FAIL') => {
    if (!exchangeId) return;
    try {
      const res = await exchangeApi.submitResult(exchangeId, result);
      setExchangeStatus(res.exchangeStatus); // COMPLETED 또는 DISPUTE, 즉시 확정
      setLocalFlowStep(null);
      if (res.exchangeStatus === 'DISPUTE') {
        setCardInsertIndex(messages.length);
        setShowPreviousChat(false);
        setDisputeStep('CAPTURE');
      }
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : '교환 결과를 전달하지 못했습니다.',
      );
    }
  };

  // ============ DISPUTE ============
  // ⚠️ 분쟁 조정 전용 인증 API가 스웨거에 별도로 없어, 강의 보유 인증과 동일한
  //    verifications/capture 엔드포인트를 재사용한다. 백엔드가 별도 엔드포인트를 두면 교체할 것.
  const handleStartDisputeCapture = async () => {
    if (!exchangeId) return;
    setIsDisputeSubmitting(true);
    try {
      const blob = await captureScreen();
      if (!blob) throw new Error('화면 캡처에 실패했습니다.');
      await exchangeApi.uploadCapture(exchangeId, blob);
      setDisputeStep('SUBMITTED');
    } catch (err) {
      setApiError(
        err instanceof ApiError
          ? err.message
          : '인증 제출에 실패했습니다. 다시 시도해주세요.',
      );
    } finally {
      setIsDisputeSubmitting(false);
    }
  };

  const handleConfirmDisputeSubmitted = () => {
    setLocalFlowStep(null);
    loadRoom();
  };

  if (isLoadingRoom) {
    return (
      <div className="relative bg-[#fbfbfb] mx-auto overflow-hidden h-full flex items-center justify-center text-sm text-gray-400">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="relative bg-[#fbfbfb] mx-auto overflow-hidden h-full flex flex-col">
      {/* ============ 헤더 (모든 flowStep 공통 디폴트) ============ */}
      <div>
        <Header
          leftNode={<IconButton icon={ICONS.BACK} onClick={handleBack} />}
          title={
            <div className="flex flex-col items-start leading-tight mt-1">
              <span className="text-xl text-semibold-18 text-gray-900 leading-5">
                {myCourseName}
              </span>
              <span className="text-xs text-[#727272] font-light mt-1">
                ↔ {counterpartCourseName}
              </span>
            </div>
          }
          rightNode={
            <IconButton
              icon={ICONS.MENU}
              onClick={() => setIsMenuOpen((prev) => !prev)}
            />
          }
        />
      </div>

      {/* 햄버거 드롭다운 메뉴 - 평소 채팅 화면에서만 노출 */}
      {isMenuOpen && flowStep === 'CHAT' && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute top-[84px] right-4 z-40 w-56 bg-white rounded-xl border border-gray-100 py-2">
            {!isTerminated && !isCompleted && (
              <button
                type="button"
                onClick={handleGoTerminate}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Icon icon="mdi:alert-circle-outline" className="text-[18px]" />
                거래 파기하기
              </button>
            )}
            <button
              type="button"
              onClick={handleReport}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Icon icon="mdi:alert-outline" className="text-[18px]" />
              신고하기
            </button>
          </div>
        </>
      )}

      {/* ============ CHAT 화면 ============ */}
      {flowStep === 'CHAT' && (
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-4 bg-[#fbfbfb]"
        >
          <p className="text-center text-xs text-[#727272] font-light font-['Pretendard'] mt-2 mb-2">
            {myCourseName.replace(' ', '')} 교환 준비방이 생성되었습니다.
          </p>

          {!scheduledAt && (
            <div className="mx-4 bg-yellow-light border-[0.70px] border-[#D1B422] rounded-lg px-4 py-8 flex flex-col items-center text-center gap-5">
              <p className="text-sm font-bold text-[#194059BF] leading-relaxed">
                강의를 교환할 시간을 정해
                <br />
                교환 시간 결정 버튼을 눌러 확정해주세요.
              </p>
              <p className="text-xs text-gray-700">
                다른 학우들이 수강 정정을
                <br />
                활발히 하지 않는 새벽 시간대를 추천해요.
              </p>
              <button
                type="button"
                onClick={handleGoSchedule}
                className="w-3/4 py-2.5 rounded-md bg-yellow-main border-[0.50px] border-[#D1B422] text-[#D1B422] text-sm font-semibold"
              >
                교환시간 결정하기
              </button>
            </div>
          )}

          {renderMessages(messages.slice(0, scheduleInsertIndex))}

          {renderScheduledBox()}

          {renderMessages(messages.slice(scheduleInsertIndex))}

          {/* 거래 파기 안내 텍스트 - 버튼 없이 텍스트만 노출 */}
          {isTerminated && (
            <div className="mx-4 mt-4 flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-bold text-gray-700">
                거래가 파기되었습니다.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                파기 사유는 관리자에게 전달되었습니다.
                <br />
                검토 후 귀책 여부에 따라 페널티가 부여됩니다.
              </p>
            </div>
          )}

          {/* 교환 완료 안내 텍스트 */}
          {isCompleted && (
            <div className="mx-4 mt-4 flex flex-col items-center gap-2 text-center">
              <p className="text-sm font-bold text-gray-700">
                교환이 완료되었습니다.
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                강의 교환이 정상적으로 마무리되었습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ============ GUIDE 화면 (캡쳐 인증 방법 안내) ============ */}
      {flowStep === 'GUIDE' && (
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-5 py-6 flex flex-col gap-6 bg-[#fbfbfb] font-['Pretendard']"
        >
          <div className="mx-4 flex flex-col gap-2">
            <h1 className="text-lg font-bold text-gray-900">
              강의 보유 인증 안내
            </h1>
            <p className="text-xs text-gray-600 leading-relaxed">
              안전한 강의 교환을 위해 본인이 실제로 해당 강의를 보유하고 있는지
              확인하는 절차를 진행합니다.
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              인증은 교환 예정 시간 5분 전부터 가능합니다.
            </p>
            <p className="text-xs text-point-red leading-relaxed">
              인증 시작 후 5분 이내에 절차를 완료하지 않으면 거래가 자동
              취소되며 페널티가 부여될 수 있습니다. 교환 시간을 반드시 준수해
              주세요.
            </p>
          </div>

          <div className="mx-4 h-px bg-gray-200" />

          <div className="mx-4 flex flex-col gap-6">
            <h2 className="text-sm font-bold text-gray-900">인증 방법</h2>

            {GUIDE_STEPS.map((step, i) => (
              <div key={step.title} className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-gray-900">
                  {step.title}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                  {step.desc}
                </p>

                {i === 5 ? (
                  <div className="pointer-events-none opacity-80 bg-white border border-gray-200 rounded-lg px-4 py-4 flex flex-col gap-3">
                    <div className="w-full h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                      <Icon icon="mdi:image-outline" className="text-[28px]" />
                    </div>
                    <label className="flex items-center gap-2 text-xs text-gray-700">
                      <input type="checkbox" checked readOnly />
                      촬영된 이미지에 교환하려는 강의가 포함되어 있음을
                      확인했습니다.
                    </label>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 rounded-md border border-gray-300 text-xs text-gray-600">
                        다시 촬영
                      </button>
                      <button className="flex-1 py-2 rounded-md bg-yellow-main text-xs text-[#D1B422] font-semibold">
                        확인 완료
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-28 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                    <Icon icon="mdi:image-outline" className="text-[28px]" />
                  </div>
                )}

                <span className="text-[11px] text-gray-400">
                  {step.caption}
                </span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleConfirmGuideAndEnterVerify}
            className="mx-4 mt-2 py-2.5 rounded-md bg-yellow-main border-[0.50px] border-[#D1B422] text-[#D1B422] text-sm font-semibold"
          >
            확인했어요, 인증 시작하기
          </button>

          {messages.slice(cardInsertIndex).length > 0 && (
            <div className="mx-4 flex flex-col gap-4 pt-2">
              {renderMessages(messages.slice(cardInsertIndex))}
            </div>
          )}
        </div>
      )}

      {/* ============ VERIFY 화면 (이미지1) ============ */}
      {flowStep === 'VERIFY' && (
        <>
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-4"
          >
            {!showPreviousChat && (
              <button
                type="button"
                onClick={() => setShowPreviousChat(true)}
                className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 py-2"
              >
                이전 채팅 보기
                <Icon icon="mdi:chevron-down" className="text-[14px]" />
              </button>
            )}
            {showPreviousChat && (
              <>
                <div className="flex flex-col gap-4 pb-2">
                  {renderPreviousChatHistory(cardInsertIndex)}
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreviousChat(false)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 py-2"
                >
                  이전 채팅 보기
                  <Icon icon="mdi:chevron-up" className="text-[14px]" />
                </button>
              </>
            )}

            {(verifyStep === 'INTRO' || verifyStep === 'CAPTURING') && (
              <div className="mx-4 bg-yellow-light border-[0.7px] border-[#D1B422] rounded-lg px-5 py-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#FFF3B6] flex items-center justify-center">
                    <Icon
                      icon="mdi:calendar-check-outline"
                      className="text-[23px] text-[#D1B422]"
                    />
                  </span>
                  <p className="text-base font-bold text-gray-700">
                    교환 5분 전! 강의 보유 인증 시작
                  </p>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">
                  안전한 교환을 위해 현재 해당 강의를 보유하고 있는지
                  확인합니다. 5분 이내에 진행해주세요.
                </p>

                <div className="h-px bg-[#EADB93]" />

                <ul className="flex flex-col gap-1.5">
                  {[
                    'PC에 수강신청(내역) 페이지를 띄워주세요.',
                    '[인증 시작] 버튼을 누른 후 화면 공유를 허용해주세요.',
                    '수강신청(내역) 페이지와 아래 QR 코드가 함께 보이도록 전체 화면을 공유해주세요.',
                  ].map((text) => (
                    <li
                      key={text}
                      className="flex items-start gap-1.5 text-xs text-gray-700"
                    >
                      <Icon
                        icon="mdi:check-circle-outline"
                        className="text-[14px] text-[#D1B422] bg-[#FFF3B6] rounded-full mt-0.5 flex-shrink-0"
                      />
                      {text}
                    </li>
                  ))}
                </ul>

                <p className="text-[11px] text-[#D1B422]">
                  ※ 수강신청(내역) 페이지와 QR 코드가 동시에 확인되어야 인증이
                  완료됩니다.
                </p>

                {qrImageUrl && (
                  <div className="flex justify-center py-2">
                    <div className="w-36 h-36 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      <img
                        src={qrImageUrl}
                        alt="인증 QR 코드"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}

                <Button
                  variant="warning"
                  size="lg"
                  disabled={verifyStep === 'CAPTURING'}
                  onClick={handleStartCapture}
                  className="!bg-yellow-main !text-[#D1B422] border-[0.70px] border-[#D1B422]"
                >
                  {verifyStep === 'CAPTURING'
                    ? '인증 확인 중...'
                    : `인증 시작하기 ${formatVerifyTimer(verifySecondsLeft)}`}
                </Button>
              </div>
            )}

            {verifyStep === 'WAITING_COUNTERPART' && (
              <div className="mx-4 bg-yellow-light border-[0.7px] border-[#D1B422] rounded-lg px-5 py-8 flex flex-col items-center gap-3 text-center">
                <Icon
                  icon="mdi:check-circle"
                  className="text-[32px] text-[#D1B422]"
                />
                <p className="text-sm font-bold text-gray-700">
                  QR 코드 인증이 완료되었습니다.
                </p>
                <p className="text-xs text-gray-600">
                  상대방의 인증을 기다리고 있어요.
                </p>
              </div>
            )}

            {verifyStep === 'CONFIRM_COUNTERPART' && (
              <div className="mx-4 bg-yellow-light border-[0.7px] border-[#D1B422] rounded-lg px-5 py-6 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#FFF3B6] flex items-center justify-center">
                    <Icon
                      icon="mdi:calendar-check-outline"
                      className="text-[18px] text-[#D1B422]"
                    />
                  </span>
                  <p className="text-base font-bold text-gray-700">
                    교환 대상 강의 확인
                  </p>
                </div>
                <div className="bg-white rounded-xl h-32 flex flex-col items-center justify-center gap-1 text-gray-400">
                  <Icon icon="mdi:monitor" className="text-[36px]" />
                  <span className="text-sm">상대방의 공유 화면</span>
                </div>

                <p className="text-xs text-[#727272] leading-relaxed">
                  QR 코드 인증이 완료되었습니다.
                  <br />
                  상대방이 보유한 강의 정보를 확인해주세요.
                </p>
                <p className="text-xs text-gray-700">
                  교환을 진행할 준비가 되었다면 아래 버튼을 눌러주세요.
                </p>

                <label className="flex items-center gap-2 text-xs text-[#D1B422]">
                  <input
                    type="checkbox"
                    checked={isCounterpartConfirmedChecked}
                    onChange={(e) =>
                      setIsCounterpartConfirmedChecked(e.target.checked)
                    }
                    className="accent-[#D1B422]"
                  />
                  상대방의 강의 정보를 확인했습니다.
                </label>

                <Button
                  variant="warning"
                  size="lg"
                  disabled={!isCounterpartConfirmedChecked}
                  onClick={handleConfirmCounterpart}
                  className="!bg-yellow-main !border !border-[#D1B422] !text-[#D1B422]"
                >
                  교환 준비 완료
                </Button>
              </div>
            )}

            {verifyStep === 'READY' && (
              <div className="mx-4 bg-yellow-light border-[0.7px] border-[#D1B422] rounded-lg px-5 py-8 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#FFF3B6] flex items-center justify-center">
                    <Icon
                      icon="mdi:check-circle-outline"
                      className="text-[18px] text-[#D1B422]"
                    />
                  </span>
                  <p className="text-base font-bold text-gray-700">
                    교환 준비 완료
                  </p>
                </div>

                <p className="text-xs text-[#727272] leading-relaxed">
                  양측이 모두 [카운트다운 시작] 버튼을 누르면
                  <br />
                  10초 후 강의 교환이 시작됩니다.
                </p>
                <p className="text-xs text-[#727272] leading-relaxed">
                  카운트다운이 종료되면 현재 강의를 버리고
                  <br />
                  상대방의 강의를 신청해 주세요!
                </p>
                <p className="text-[11px] text-[#D1B422]">
                  ※ 카운트다운이 시작되면 취소할 수 없습니다.
                </p>

                <label className="flex items-center gap-2 text-xs text-[#D1B422]">
                  <input
                    className="accent-[#D1B422]"
                    type="checkbox"
                    checked
                    readOnly
                  />
                  강의를 버리고 잡을 준비가 되었습니다.
                </label>

                <Button
                  variant="warning"
                  size="lg"
                  onClick={handleEnterCountdown}
                  className="!bg-yellow-main border-[0.70px] border-[#D1B422] !text-[#D1B422] "
                >
                  카운트다운 시작
                </Button>
              </div>
            )}

            {messages.slice(cardInsertIndex).length > 0 && (
              <div className="flex flex-col gap-4 pt-2">
                {renderMessages(messages.slice(cardInsertIndex))}
              </div>
            )}
          </div>

          <Modal
            isOpen={isCaptureFailModalOpen}
            onClose={() => setIsCaptureFailModalOpen(false)}
            icon={
              <span className="w-10 h-10 rounded-full bg-point-red/10 flex items-center justify-center">
                <Icon
                  icon="mdi:alert-circle"
                  className="text-[28px] text-point-red"
                />
              </span>
            }
            title="인증에 실패했습니다"
            footer={
              <Button
                variant="danger"
                size="md"
                onClick={() => setIsCaptureFailModalOpen(false)}
              >
                다시 인증하기
              </Button>
            }
          >
            {'\n'}인증 QR 코드를 확인할 수 없습니다. {'\n\n'}
            수강신청(내역) 페이지와 인증 QR 코드가{'\n'}한 화면에 모두 보이도록
            한 뒤{'\n'}
            다시 인증을 진행해주세요.
          </Modal>
        </>
      )}

      {/* ============ DISPUTE 화면 (이미지3) ============ */}
      {flowStep === 'DISPUTE' && (
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4"
        >
          {!showPreviousChat && (
            <button
              type="button"
              onClick={() => setShowPreviousChat(true)}
              className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 py-2"
            >
              이전 채팅 보기
              <Icon icon="mdi:chevron-down" className="text-[14px]" />
            </button>
          )}
          {showPreviousChat && (
            <>
              <div className="flex flex-col gap-4 pb-2">
                {renderPreviousChatHistory(cardInsertIndex)}
              </div>
              <button
                type="button"
                onClick={() => setShowPreviousChat(false)}
                className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 py-2"
              >
                이전 채팅 보기
                <Icon icon="mdi:chevron-up" className="text-[14px]" />
              </button>
            </>
          )}

          {disputeStep === 'CAPTURE' && (
            <div className="mx-4 bg-point-red/5 border border-point-red rounded-lg px-5 py-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-point-red/10 border-[0.70px] border-point-red flex items-center justify-center">
                  <img src={disputeIcon} alt="" className="w-6 h-6" />
                </span>
                <p className="text-base font-bold text-gray-700">
                  교환 실패로 인한 분쟁 조정 진행
                </p>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                교환 실패로 인해 분쟁 조정 절차가 시작되었습니다. 양측 모두 수강
                취소 여부를 확인하기 위해 수강 취소 내역 인증을 진행합니다.
              </p>

              <div className="h-px bg-red-100" />

              <ul className="flex flex-col gap-1.5">
                {[
                  'PC에 수강신청(내역) 페이지를 띄워주세요.',
                  '[인증 시작] 버튼을 누른 후 화면 공유를 허용해주세요.',
                  '수강신청(내역) 페이지와 아래 QR 코드가 함께 보이도록 전체 화면을 공유해주세요.',
                ].map((text) => (
                  <li
                    key={text}
                    className="flex items-start gap-1.5 text-xs text-gray-700"
                  >
                    <Icon
                      icon="mdi:check-circle-outline"
                      className="text-[14px] text-point-red mt-0.5 flex-shrink-0"
                    />
                    {text}
                  </li>
                ))}
              </ul>

              <p className="text-[11px] text-point-red font-bold">
                ※ 수강신청(내역) 페이지와 QR 코드가 동시에 확인되어야 인증이
                완료됩니다.
                <br />※ 5분 이내에 인증을 완료하지 않을 경우 거래 결과 판정에
                불이익이 발생할 수 있습니다.
              </p>

              {qrImageUrl && (
                <div className="flex justify-center py-2">
                  <div className="w-36 h-36 bg-white border border-red-100 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={qrImageUrl}
                      alt="인증 QR 코드"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              <Button
                variant="danger"
                size="lg"
                disabled={isDisputeSubmitting}
                onClick={handleStartDisputeCapture}
              >
                {isDisputeSubmitting ? '확인 중...' : '인증 시작'}
              </Button>
            </div>
          )}

          {disputeStep === 'SUBMITTED' && (
            <div className="mx-4 bg-point-red/5 border border-point-red rounded-lg px-5 py-8 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-point-red/10 border-[0.70px] border-point-red flex items-center justify-center">
                  <Icon
                    icon="mdi:check"
                    className="text-[22px] text-point-red"
                  />
                </span>
                <p className="text-base font-bold text-gray-700">
                  인증 제출 완료
                </p>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                분쟁 조정 결과는 양측의 인증을 관리자가 확인한 후 알림을 통해
                확인할 수 있습니다.
              </p>

              <div className="h-px bg-red-100" />

              <ul className="flex flex-col gap-2">
                {[
                  '양측 모두 정상적으로 수강 취소를 진행한 것으로 확인될 경우, 해당 거래는 사기가 아닌 교환 실패로 처리됩니다.',
                  '수강신청 결과는 학교 시스템 및 제3자의 신청 상황에 따라 달라질 수 있으며, 이로 인해 발생한 교환 실패에 대해서는 결과를 보장할 수 없습니다.',
                  '교환 실패로 판정된 경우 양측 모두 페널티 없이 거래가 종료됩니다.',
                ].map((text) => (
                  <li
                    key={text}
                    className="flex items-start gap-1.5 text-xs text-gray-700"
                  >
                    <Icon
                      icon="mdi:check-circle-outline"
                      className="text-[14px] text-point-red mt-0.5 flex-shrink-0"
                    />
                    {text}
                  </li>
                ))}
              </ul>

              <Button
                variant="danger"
                size="lg"
                onClick={handleConfirmDisputeSubmitted}
              >
                확인
              </Button>
            </div>
          )}

          {messages.slice(cardInsertIndex).length > 0 && (
            <div className="flex flex-col gap-4 pt-2">
              {renderMessages(messages.slice(cardInsertIndex))}
            </div>
          )}
        </div>
      )}

      {/* ============ COUNTDOWN 배경 ============ */}
      {flowStep === 'COUNTDOWN' && (
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-4 bg-[#fbfbfb]"
        >
          {renderPreviousChatHistory(messages.length)}
        </div>
      )}

      {/* ============ COUNTDOWN 오버레이 (이미지2) ============ */}
      {flowStep === 'COUNTDOWN' && countdownPhase === 'COUNTING' && (
        <Modal isOpen title="교환 시작까지">
          <div className="flex flex-col items-center gap-4 translate-y-6">
            <p
              className={`text-5xl !font-['Paperozi'] font-extrabold mb-5 ${
                countdownSecondsLeft <= COUNTDOWN_RED_THRESHOLD
                  ? 'text-point-red'
                  : 'text-black'
              }`}
            >
              {countdownSecondsLeft}초
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              상대방도 준비를 완료했습니다.
              <br />
              강의를 버리고 잡을 준비를 해주세요.
            </p>
          </div>
        </Modal>
      )}

      {flowStep === 'COUNTDOWN' && countdownPhase === 'RESULT_SELECT' && (
        <Modal
          isOpen
          title={<span className="text-point-red">지금 교환하세요</span>}
          footer={
            <div className="w-full flex flex-col gap-2">
              <Button
                variant="danger"
                size="lg"
                onClick={() => handleExchangeResult('SUCCESS')}
              >
                교환성공
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => handleExchangeResult('FAIL')}
              >
                교환 실패
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-3 py-1">
            <div className="text-sm text-gray-700 leading-relaxed text-left">
              <p>1. 현재 강의를 취소하세요.</p>
              <p>2. 상대방의 강의를 신청하세요.</p>
            </div>
            <p className="text-sm text-left text-gray-700">
              강의 신청이 완료되면
              <br />
              결과에 따라 아래 버튼을 선택해주세요.
            </p>
          </div>
        </Modal>
      )}

      {/* ============ 푸터 (CHAT/GUIDE 단계 + 인증 가능 시각 이전에만 노출) ============ */}
      {CHAT_INPUT_UNLOCKED_STEPS.includes(flowStep) &&
        !isTerminated &&
        !isCompleted &&
        !verifyWindowReached && (
          <div className="px-6 py-3 bg-[#fbfbfb]">
            <Input
              variant="pill"
              placeholder="메세지 보내기"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onCompositionStart={() => (isComposingRef.current = true)}
              onCompositionEnd={() => (isComposingRef.current = false)}
              onKeyDown={handleKeyDown}
              rightNode={
                <button type="button" onClick={handleSend} aria-label="전송">
                  <img src={sendIcon} alt="" className="w-7 h-7" />
                </button>
              }
            />
          </div>
        )}

      {/* ============ 공통 에러 안내 모달 ============ */}
      <Modal
        isOpen={!!apiError}
        onClose={() => setApiError(null)}
        icon={
          <span className="w-10 h-10 rounded-full bg-point-red/10 flex items-center justify-center">
            <Icon
              icon="mdi:alert-circle"
              className="text-[28px] text-point-red"
            />
          </span>
        }
        title="문제가 발생했습니다"
        footer={
          <Button variant="danger" size="md" onClick={() => setApiError(null)}>
            확인
          </Button>
        }
      >
        {apiError}
      </Modal>

      {/* ============ 거래 파기 오버레이 (라우트 이동 없이 카드처럼 얹는다) ============ */}
      {isTerminateOpen && (
        <TerminateDealOverlay
          exchangeId={exchangeId}
          onClose={() => setIsTerminateOpen(false)}
          onSuccess={() => {
            setIsTerminateOpen(false);
            setIsCancelled(true); // 서버가 별도 상태를 안 주므로 로컬 플래그로 채팅 잠금 처리
          }}
        />
      )}
    </div>
  );
}
