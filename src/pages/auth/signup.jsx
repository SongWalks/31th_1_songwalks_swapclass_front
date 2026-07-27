import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import eyeIcon from '@/assets/icons/eye.svg';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const API = {
  SEND_CODE: `${API_BASE}/api/auth/email/send-code`,
  VERIFY_CODE: `${API_BASE}/api/auth/email/verify-code`,
  CHECK_DUPLICATE: `${API_BASE}/api/auth/email/check`,
  SIGNUP: `${API_BASE}/api/auth/signup`,
};

const MOCK_ACCOUNT = { email: 'test1234@sookmyung.ac.kr', code: '123456' };

const postJson = async (url, body) => {
  if (body?.email === MOCK_ACCOUNT.email) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (url === API.SEND_CODE) return { status: 200, data: { success: true } };
    if (url === API.VERIFY_CODE) {
      const isCorrect = body.code === MOCK_ACCOUNT.code;
      return {
        status: isCorrect ? 200 : 400,
        data: isCorrect
          ? { success: true }
          : { success: false, message: '잘못된 입력값입니다.' },
      };
    }
    if (url === API.CHECK_DUPLICATE)
      return { status: 200, data: { success: true, data: { exists: false } } };
    if (url === API.SIGNUP) return { status: 201, data: { success: true } };
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
};

const EMAIL_DOMAIN = 'sookmyung.ac.kr';
const CODE_TIMER_SECONDS = 5 * 60;
const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,12}$/;

// 프레임 고정 크기 (Figma 기준)
const FRAME_W = 402;
const FRAME_H = 874;

export default function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CODE_TIMER_SECONDS);
  const timerRef = useRef(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

  // 화면 크기에 맞춰 402x874 프레임을 통째로 스케일링
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setScale(w / FRAME_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (isCodeSent) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCodeSent]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isValidDomainEmail = (value) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value) &&
    value.toLowerCase().endsWith(`@${EMAIL_DOMAIN}`);

  const handleBack = () => {
    if (step === 'password') {
      setStep('email');
      return;
    }
    navigate('/login');
  };

  const handleSendCode = async () => {
    if (!isValidDomainEmail(email)) {
      setEmailError('숙명 이메일만 입력 가능합니다.');
      return;
    }
    setEmailError('');
    setIsSending(true);
    try {
      const { data } = await postJson(API.SEND_CODE, { email });
      if (data?.success) {
        setIsCodeSent(true);
        setSecondsLeft(CODE_TIMER_SECONDS);
        setCode('');
        setCodeError('');
      } else {
        setEmailError(data?.message || '인증코드 발송에 실패했습니다.');
      }
    } catch {
      setEmailError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isCodeSent || secondsLeft === 0 || !code.trim()) return;
    setCodeError('');
    setIsVerifying(true);
    try {
      const { data } = await postJson(API.VERIFY_CODE, { email, code });
      if (!data?.success) {
        setCodeError(data?.message || '잘못된 입력값입니다.');
        return;
      }
      const dup = await postJson(API.CHECK_DUPLICATE, { email });
      if (dup.data?.data?.exists) {
        setCodeError('이미 가입된 이메일입니다.');
        return;
      }
      setStep('password');
    } catch {
      setCodeError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePassword = () => {
    let valid = true;
    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError('영문, 숫자, 특수문자를 포함하여 8~12자로 작성해주세요');
      valid = false;
    } else {
      setPasswordError('');
    }
    if (password !== passwordConfirm) {
      setConfirmError('비밀번호가 일치하지 않습니다.');
      valid = false;
    } else {
      setConfirmError('');
    }
    return valid;
  };

  const handleSignup = async () => {
    setSignupError('');
    if (!validatePassword()) return;
    setIsSubmitting(true);
    try {
      const { status, data } = await postJson(API.SIGNUP, {
        email,
        password,
        passwordConfirm,
      });
      if (status === 201 && data?.success) {
        setShowCompleteModal(true);
        return;
      }
      setSignupError(data?.message || '회원가입에 실패했습니다.');
    } catch {
      setSignupError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSendDisabled =
    email.length === 0 || isSending || (isCodeSent && secondsLeft > 0);

  return (
    // 바깥 wrapRef가 실제 사용 가능한 너비를 재고, 그 비율만큼 402x874 프레임을 scale
    <div
      ref={wrapRef}
      className="w-full max-w-[402px] mx-auto"
      style={{ height: FRAME_H * scale }}
    >
      <div
        className="relative bg-[#FBFBFB] overflow-hidden origin-top-left"
        style={{
          width: FRAME_W,
          height: FRAME_H,
          transform: `scale(${scale})`,
        }}
      >
        {/* 뒤로가기 버튼 — 확대 (44px 탭 영역, 아이콘 28x16) */}
        <div
          style={{
            position: 'absolute',
            top: 25,
            left: 12,
            opacity: 0.6,
            transform: 'scale(1.3)',
            transformOrigin: 'top left',
          }}
          className="z-10"
        >
          <IconButton icon={ICONS.BACK} onClick={handleBack} />
        </div>

        {step === 'email' ? (
          <>
            <h1
              style={{ position: 'absolute', top: 228, left: 32, width: 300 }}
              className="text-2xl font-bold font-['Paperozi'] leading-9 tracking-wide text-cyan-900"
            >
              회원가입
            </h1>
            <p
              style={{ position: 'absolute', top: 264, left: 32, width: 340 }}
              className="text-lg font-semibold font-['Pretendard'] leading-5 tracking-wide text-slate-500"
            >
              숙명 이메일을 인증해주세요.
            </p>

            <label
              style={{ position: 'absolute', top: 350, left: 21.5 }}
              className={`text-base font-medium font-['Pretendard'] leading-5 tracking-wide ${
                emailError ? 'text-point-red' : 'text-slate-500'
              }`}
            >
              숙명 이메일
            </label>
            <div
              style={{ position: 'absolute', top: 377, left: 21.5, width: 359 }}
            >
              <Input
                type="email"
                placeholder="abc1234@sookmyung.ac.kr"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                disabled={isCodeSent}
                isError={!!emailError}
                errorMessage={emailError}
                rightNode={
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={isSendDisabled}
                    className={`pointer-events-auto w-20 h-7 flex items-center justify-center rounded-xl border-[0.70px] text-xs font-normal font-['Pretendard'] leading-5 tracking-wide whitespace-nowrap transition-colors duration-200 ${
                      isCodeSent
                        ? 'bg-brand-soft border-brand-lightBlue text-brand-lightBlue'
                        : email.length === 0
                          ? 'bg-gray-100 border-zinc-400 text-gray-400'
                          : 'bg-[#FBFBFB] border-zinc-400 text-gray-700'
                    }`}
                  >
                    {isSending
                      ? '발송 중...'
                      : isCodeSent && secondsLeft === 0
                        ? '재발송'
                        : '인증번호 발송'}
                  </button>
                }
              />
            </div>

            <label
              style={{ position: 'absolute', top: 454, left: 21.5 }}
              className={`text-base font-medium font-['Pretendard'] leading-5 tracking-wide ${
                codeError ? 'text-point-red' : 'text-slate-500'
              }`}
            >
              인증번호 입력
            </label>
            <div
              style={{ position: 'absolute', top: 481, left: 21.5, width: 359 }}
            >
              <Input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (codeError) setCodeError('');
                }}
                disabled={!isCodeSent || secondsLeft === 0}
                isError={!!codeError}
                errorMessage={codeError}
                className={
                  isCodeSent && !codeError ? '!border-brand-lightBlue' : ''
                }
                rightNode={
                  isCodeSent ? (
                    <span className="w-20 h-7 flex items-center justify-center rounded-xl border-[0.70px] border-brand-lightBlue bg-brand-soft text-xs font-normal font-['Pretendard'] leading-5 tracking-wide text-gray-700">
                      {formatTime(secondsLeft)}
                    </span>
                  ) : null
                }
              />
            </div>

            {isCodeSent && !codeError && (
              <p
                style={{ position: 'absolute', top: 532, left: 25.4 }}
                className="text-sm font-normal font-['Pretendard'] leading-5 tracking-wide text-brand-blue"
              >
                메일이 발송되었습니다
              </p>
            )}

            <div
              style={{ position: 'absolute', top: 592, left: 21.5, width: 359 }}
            >
              <Button variant="primary" size="lg" onClick={handleVerifyCode}>
                {isVerifying ? '확인 중...' : '인증하기'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 회원가입 */}
            <h1
              style={{
                position: 'absolute',
                top: 186.87,
                left: 32.05,
                width: 300,
              }}
              className="text-2xl font-bold font-['Paperozi'] leading-9 tracking-wide text-cyan-900"
            >
              회원가입
            </h1>

            {/* 가입을 완료해주세요 */}
            <p
              style={{
                position: 'absolute',
                top: 221.03,
                left: 32.05,
                width: 340,
              }}
              className="text-lg font-semibold font-['Pretendard'] leading-5 tracking-wide text-slate-500"
            >
              가입을 완료해주세요
            </p>

            {signupError && (
              <p
                style={{
                  position: 'absolute',
                  top: 250,
                  left: 21.5,
                  width: 359,
                }}
                className="text-xs text-point-red bg-point-red/5 border border-point-red/30 rounded-lg px-3 py-2"
              >
                {signupError}
              </p>
            )}

            {/* 숙명 이메일 */}
            <label
              style={{ position: 'absolute', top: 287.82, left: 21.5 }}
              className="text-base font-medium font-['Pretendard'] leading-5 tracking-wide text-slate-500"
            >
              숙명 이메일
            </label>

            {/* 숙명 이메일 텍스트 박스 */}
            <div
              style={{
                position: 'absolute',
                top: 314.75,
                left: 21.5,
                width: 359,
              }}
            >
              <Input
                type="email"
                value={email}
                disabled
                className="border-zinc-400 text-neutral-400"
              />
            </div>

            {/* 비밀번호 입력 */}
            <label
              style={{ position: 'absolute', top: 380.83, left: 21.5 }}
              className={`text-base font-medium font-['Pretendard'] leading-5 tracking-wide ${
                passwordError ? 'text-point-red' : 'text-slate-500'
              }`}
            >
              비밀번호 입력
            </label>

            {/*
              비밀번호 입력 텍스트 박스.
            */}
            <div
              style={{
                position: 'absolute',
                top: 407.76,
                left: 21.5,
                width: 359,
              }}
              className="[&>div]:!gap-0 [&_span]:!-mt-0.2"
            >
              <Input
                type={showPw ? 'text' : 'password'}
                placeholder="영문, 숫자, 특수문자 포함 8~12자 비밀번호"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                isError={!!passwordError}
                errorMessage={passwordError}
                className={`placeholder:text-neutral-400 placeholder:text-s placeholder:font-light ${
                  passwordError ? '' : 'border-zinc-400'
                }`}
                rightNode={
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="w-6 h-6"
                  >
                    <img src={eyeIcon} alt="" className="w-10 h-6" />
                  </button>
                }
              />
            </div>

            {/* 비밀번호 확인 */}
            <label
              style={{ position: 'absolute', top: 473.83, left: 21.5 }}
              className={`text-base font-medium font-['Pretendard'] leading-5 tracking-wide ${
                confirmError ? 'text-point-red' : 'text-slate-500'
              }`}
            >
              비밀번호 확인
            </label>

            {/* 비밀번호 확인 텍스트 박스 (에러 메시지+아이콘은 Input 내부에서 자동 렌더링) */}
            <div
              style={{
                position: 'absolute',
                top: 500.36,
                left: 21.5,
                width: 359,
              }}
            >
              <Input
                type={showPwConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  if (confirmError) setConfirmError('');
                }}
                isError={!!confirmError}
                errorMessage={confirmError}
                className={confirmError ? '' : 'border-zinc-400'}
                rightNode={
                  <button
                    type="button"
                    onClick={() => setShowPwConfirm((v) => !v)}
                    className="w-6 h-6"
                  >
                    <img src={eyeIcon} alt="" className="w-10 h-6" />
                  </button>
                }
              />
            </div>

            {/* 회원가입 완료 버튼 */}
            <div
              style={{
                position: 'absolute',
                top: 591.64,
                left: 21.5,
                width: 359,
              }}
            >
              <Button
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                onClick={handleSignup}
              >
                {isSubmitting ? '가입 중...' : '회원가입 완료'}
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="가입이 완료되었습니다"
        footer={
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
          >
            로그인하러가기
          </Button>
        }
      >
        필요한 강의는 얻고, 가진 강의는 나누며
        <br />
        더 넓게 배워보세요.
        <br />
        성공적인 강의 교환을 응원합니다!
      </Modal>
    </div>
  );
}
