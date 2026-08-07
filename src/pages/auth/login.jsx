import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import { loginRequest, ApiError } from '@/api/auth/authApi';
import { saveTokens, decodeUserId } from '@/store/tokenStorage';
import { useAuthStore } from '@/store/useAuthStore';
import { subscribeToPush } from '@/api/alert/push';
import lockIcon from '../../assets/icons/lock.svg';
import joinIcon from '../../assets/icons/join.svg';
import checkIcon from '../../assets/icons/check.svg';
import emailIcon from '../../assets/icons/email.svg';
import logo from '../../assets/icons/logo.png';
import eyeIcon from '../../assets/icons/eye.svg';
import pwLockIcon from '../../assets/icons/pwlock.svg';
import Button from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [banner, setBanner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(refreshTimerRef.current);
  }, []);

  function validate() {
    const errors = { email: '', password: '' };
    if (!email.trim()) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = '올바른 이메일 형식이 아닙니다.';
    }
    if (!password) {
      errors.password = '비밀번호를 입력해주세요.';
    }
    setFieldErrors(errors);
    return !errors.email && !errors.password;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBanner(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      const { data } = await loginRequest({ email: trimmedEmail, password });

      saveTokens(data, autoLogin, trimmedEmail);

      login({
        id: decodeUserId(data.accessToken),
        email: trimmedEmail,
      });

      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'denied') {
          try {
            await subscribeToPush();
          } catch (pushErr) {
            console.error('FCM 토큰 재등록 실패:', pushErr);
          }
        }
      }

      setBanner({
        type: 'success',
        message: `로그인에 성공했습니다. ${autoLogin ? '자동 로그인이 설정됨' : ''}`,
      });

      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setBanner({ type: 'error', message: err.message });
      } else {
        setBanner({
          type: 'error',
          message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLoginDisabled = isSubmitting || !email.trim() || !password;

  return (
    <div className="relative w-full h-full bg-[#FBFBFB] flex flex-col justify-between overflow-y-auto">
      {/* ── 수직 중앙 정렬을 위한 컨텐츠 덩어리 (my-auto) ── */}
      <div className="my-auto w-full py-6">
        {/* 상단 로고 및 서비스 설명 영역 */}
        <div className="mb-10">
          <div className="w-1/3 min-w-[110px] max-w-[140px] mx-auto">
            <img src={logo} alt="SOO" className="w-full h-auto block" />
          </div>
          <p className="w-4/5 max-w-[280px] mx-auto mt-3 text-[#657a88] text-center text-[11px] font-normal leading-[18.384px] tracking-[0.368px]">
            눈송이들의 수강신청을 구조해줄 간편하고
            <br />
            안전한 강의 교환 매칭 제안 서비스
          </p>
        </div>

        {banner?.message && (
          <div
            className={twMerge(
              'min-h-[17px] mb-4 px-6 text-center text-[12px] font-medium leading-[17px] overflow-hidden',
              banner?.type === 'error' && 'text-[#e15252]',
              banner?.type === 'success' && 'text-[#2f7a3d]',
            )}
          >
            {banner.message}
          </div>
        )}

        {/* 폼 입력 영역 */}
        <form
          className="flex flex-col px-6 gap-4"
          onSubmit={handleSubmit}
          noValidate
        >
          {/* 이메일 */}
          <div className="flex flex-col">
            <label
              className="mb-2 text-[#657a88] text-[15px] font-medium leading-[20px] tracking-[0.4px]"
              htmlFor="email"
            >
              이메일
            </label>
            <div
              className={twMerge(
                'flex items-center gap-2 px-3 w-full h-[48px] border-[0.7px] border-[#afb1b6] rounded-xl bg-white focus-within:border-[#4c9dd1]',
                fieldErrors.email && 'border-[#e15252]',
              )}
            >
              <span className="flex-shrink-0 flex items-center justify-center w-[17px] h-[15px]">
                <img
                  src={emailIcon}
                  alt=""
                  style={{ width: '100%', height: '100%' }}
                />
              </span>
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력해주세요"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value.trim())
                    setFieldErrors((prev) => ({ ...prev, email: '' }));
                  if (banner) setBanner(null);
                }}
                autoComplete="email"
                className="flex-1 min-w-0 !border-none !bg-transparent !p-0 !rounded-none !shadow-none placeholder:text-[13px] placeholder:text-[#657a88]"
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-[11px] leading-[18px] text-[#e15252]">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="flex flex-col">
            <label
              className="mb-2 text-[#657a88] text-[15px] font-medium leading-[20px] tracking-[0.4px]"
              htmlFor="password"
            >
              비밀번호
            </label>
            <div
              className={twMerge(
                'flex items-center gap-2 px-3 w-full h-[48px] border-[0.7px] border-[#afb1b6] rounded-xl bg-white focus-within:border-[#4c9dd1]',
                fieldErrors.password && 'border-[#e15252]',
              )}
            >
              <span className="flex-shrink-0 flex items-center justify-center w-[22px] h-[22px]">
                <img
                  src={pwLockIcon}
                  alt=""
                  style={{ width: '100%', height: '100%' }}
                />
              </span>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value)
                    setFieldErrors((prev) => ({ ...prev, password: '' }));
                  if (banner) setBanner(null);
                }}
                autoComplete="current-password"
                className="flex-1 min-w-0 !border-none !bg-transparent !p-0 !rounded-none !shadow-none placeholder:text-[13px] placeholder:text-[#657a88]"
              />
              <button
                type="button"
                className="flex-shrink-0 w-6 h-6 p-0 bg-none border-none cursor-pointer flex items-center justify-center"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <img
                  src={eyeIcon}
                  alt=""
                  style={{ width: '100%', height: '100%' }}
                />
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-[11px] leading-[18px] text-[#e15252]">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* 자동 로그인 */}
          <div
            className="flex items-center gap-2 mt-1 cursor-pointer w-fit select-none"
            onClick={() => setAutoLogin((v) => !v)}
            role="checkbox"
            aria-checked={autoLogin}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setAutoLogin((v) => !v);
              }
            }}
          >
            <span
              className={twMerge(
                'w-[18px] h-[18px] flex-shrink-0 rounded-[4px] border-[1.5px] border-[#c6cad1] flex items-center justify-center',
                autoLogin && 'bg-[#4c9dd1] border-[#4c9dd1] text-white',
              )}
            >
              {autoLogin && (
                <img
                  src={checkIcon}
                  alt=""
                  style={{ width: '70%', height: '70%' }}
                />
              )}
            </span>
            <span className="text-[#657a88] text-[13px] font-light leading-[20px] tracking-[0.4px]">
              자동 로그인
            </span>
          </div>

          {/* 로그인 버튼 */}
          <Button
            type="submit"
            disabled={isLoginDisabled}
            fullWidth
            className="mt-2 h-14 bg-brand-lightBlue rounded-2xl text-white font-bold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting && <Spinner size="sm" className="mr-1" />}
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </div>

      {/* ── 하단 고정 링크 (비밀번호 찾기 | 회원가입) ── */}
      <div className="flex items-center justify-center gap-3 pb-8">
        <button
          type="button"
          className="bg-none border-none flex items-center gap-1.5 cursor-pointer text-black text-[14px] font-light leading-5 tracking-[0.4px]"
          onClick={() => navigate('/findPW')}
        >
          <img className="w-[10.479px] h-[13.473px]" src={lockIcon} alt="" />
          비밀번호 찾기
        </button>
        <span className="text-[#d1d5db]">|</span>
        <button
          type="button"
          className="bg-none border-none flex items-center gap-1.5 cursor-pointer text-[#4c9dd1] text-[14px] font-light leading-6 tracking-[0.2px]"
          onClick={() => navigate('/signup')}
        >
          <img className="w-[11.929px] h-[11.929px]" src={joinIcon} alt="" />
          회원가입
        </button>
      </div>
    </div>
  );
}
