import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import eyeIcon from '@/assets/icons/eye.svg';
import {
  sendPasswordResetCode,
  verifyEmailCode,
  resetPasswordRequest,
} from '@/api/auth/authApi';

const EMAIL_DOMAIN = 'sookmyung.ac.kr';
const CODE_TIMER_SECONDS = 5 * 60;
const PASSWORD_REGEX =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,12}$/;

export default function FindPasswordPage() {
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
  const [resetError, setResetError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);

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
      await sendPasswordResetCode(email);
      setIsCodeSent(true);
      setSecondsLeft(CODE_TIMER_SECONDS);
      setCode('');
      setCodeError('');
    } catch (err) {
      setEmailError(
        err.status === 404
          ? '가입되지 않은 이메일입니다.'
          : err.message || '인증코드 발송에 실패했습니다.',
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!isCodeSent || secondsLeft === 0 || !code.trim()) return;
    setCodeError('');
    setIsVerifying(true);
    try {
      await verifyEmailCode(email, code);
      setStep('password');
    } catch (err) {
      setCodeError(err.message || '잘못된 입력값입니다.');
    } finally {
      setIsVerifying(false);
    }
  };

  // 실시간 검증: 입력할 때마다 바로 체크 (버튼 눌러야만 검사되던 문제 수정)
  const handlePasswordChange = (value) => {
    setPassword(value);
    if (value.length === 0) {
      setPasswordError('');
    } else if (!PASSWORD_REGEX.test(value)) {
      setPasswordError('영문, 숫자, 특수문자를 포함하여 8~12자로 작성해주세요');
    } else {
      setPasswordError('');
    }
    if (passwordConfirm) {
      setConfirmError(
        passwordConfirm !== value ? '비밀번호가 일치하지 않습니다.' : '',
      );
    }
  };

  const handlePasswordConfirmChange = (value) => {
    setPasswordConfirm(value);
    if (value.length === 0) {
      setConfirmError('');
    } else {
      setConfirmError(
        value !== password ? '비밀번호가 일치하지 않습니다.' : '',
      );
    }
  };

  const validatePassword = () => {
    let valid = true;
    if (!PASSWORD_REGEX.test(password)) {
      setPasswordError('영문, 숫자, 특수문자를 포함하여 8~12자로 작성해주세요');
      valid = false;
    }
    if (password !== passwordConfirm) {
      setConfirmError('비밀번호가 일치하지 않습니다.');
      valid = false;
    }
    return valid;
  };

  const handleResetPassword = async () => {
    setResetError('');
    if (!validatePassword()) return;
    setIsSubmitting(true);
    try {
      await resetPasswordRequest({
        email,
        newPassword: password,
        newPasswordConfirm: passwordConfirm,
      });
      setShowCompleteModal(true);
    } catch (err) {
      setResetError(err.message || '비밀번호 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSendDisabled =
    email.length === 0 || isSending || (isCodeSent && secondsLeft > 0);

  const isResetDisabled =
    isSubmitting ||
    !password ||
    !passwordConfirm ||
    !!passwordError ||
    !!confirmError;

  return (
    <div className="w-full h-full flex items-center justify-center overflow-y-auto px-4 py-6">
      <div className="relative w-full max-w-[402px] bg-[#FBFBFB]">
        <div className="pt-6 pb-1 opacity-60">
          <IconButton icon={ICONS.BACK} onClick={handleBack} />
        </div>

        {step === 'email' ? (
          <div className="flex flex-col px-5 pt-14">
            <h1 className="text-2xl font-bold font-['Paperozi'] leading-9 tracking-wide text-cyan-900">
              비밀번호 찾기
            </h1>
            <p className="mt-2 text-lg font-semibold font-['Pretendard'] leading-normal tracking-wide text-slate-500">
              인증번호를 확인하여 비밀번호를 변경합니다.
            </p>

            <label
              className={`mt-12 text-base font-medium font-['Pretendard'] leading-5 tracking-wide ${
                emailError ? 'text-rose-500' : 'text-slate-500'
              }`}
            >
              이메일
            </label>
            <div className="mt-2">
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

            <label className="mt-6 text-base font-medium font-['Pretendard'] leading-5 tracking-wide text-slate-500">
              인증번호 입력
            </label>
            <div className="mt-2">
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
                className={isCodeSent ? '!border-brand-lightBlue' : ''}
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
              <p className="mt-1 ml-1 text-sm font-normal font-['Pretendard'] leading-5 tracking-wide text-brand-blue">
                메일이 발송되었습니다
              </p>
            )}

            <div className="mt-14">
              <Button variant="primary" size="lg" onClick={handleVerifyCode}>
                {isVerifying ? '확인 중...' : '인증하기'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col px-5 pt-14">
            <h1 className="text-2xl font-bold font-['Paperozi'] leading-9 tracking-wide text-cyan-900">
              비밀번호 재설정
            </h1>
            <p className="mt-2 text-lg font-semibold font-['Pretendard'] leading-normal tracking-wide text-slate-500">
              새로운 비밀번호로 재설정합니다
            </p>

            {resetError && (
              <p className="mt-4 text-xs text-point-red bg-point-red/5 border border-point-red/30 rounded-lg px-3 py-2">
                {resetError}
              </p>
            )}

            <label
              className={`mt-6 text-base font-medium font-['Pretendard'] leading-5 tracking-wide ${
                passwordError ? 'text-point-red' : 'text-slate-500'
              }`}
            >
              새 비밀번호
            </label>
            <div className="mt-2 [&>div]:!gap-0 [&_span]:!-mt-0.2">
              <Input
                type={showPw ? 'text' : 'password'}
                placeholder="영문, 숫자, 특수문자 포함 8~12자 비밀번호"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
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

            <label
              className={`mt-6 text-base font-medium font-['Pretendard'] leading-5 tracking-wide ${
                confirmError ? 'text-point-red' : 'text-slate-500'
              }`}
            >
              비밀번호 확인
            </label>
            <div className="mt-2">
              <Input
                type={showPwConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => handlePasswordConfirmChange(e.target.value)}
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

            <div className="mt-14 pb-10">
              <Button
                variant="primary"
                size="lg"
                disabled={isResetDisabled}
                onClick={handleResetPassword}
              >
                {isSubmitting ? '변경 중...' : '비밀번호 변경'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title={
          <div className="mt-10 text-base font-medium font-['Paperozi']">
            비밀번호가 변경되었습니다.
          </div>
        }
        footer={
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/login')}
          >
            확인
          </Button>
        }
      >
        <div className="h-2" />
      </Modal>
    </div>
  );
}
