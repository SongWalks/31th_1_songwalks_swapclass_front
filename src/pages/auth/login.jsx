import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import { loginRequest, ApiError } from '@/api/auth/authApi';
import { saveTokens, decodeUserId } from '@/store/tokenStorage';
import { useAuthStore } from '@/store/useAuthStore';
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

      setBanner({
        type: 'success',
        message: `로그인에 성공했습니다. ${autoLogin ? '자동 로그인이 설정됨' : ''}`,
      });
      window.location.href = '/';
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
    <div className="h-full w-full flex items-center justify-center font-['Pretendard'] overflow-y-auto px-4 py-6">
      <div className="w-full max-w-[402px] flex flex-col bg-[#fbfbfb]">
        <div>
          <div className="w-1/3 min-w-[110px] max-w-[140px] mx-auto mt-14">
            <img src={logo} alt="SOO" className="w-full h-auto block" />
          </div>
          <p className="w-4/5 max-w-[280px] mx-auto mt-3 text-[#657a88] text-center text-[11px] font-normal leading-[18.384px] tracking-[0.368px]">
            눈송이들의 수강신청을 구조해줄 간편하고
            <br />
            안전한 강의 교환 매칭 제안 서비스
          </p>
        </div>

        <div
          className={twMerge(
            'min-h-[17px] mt-2 mb-1.5 mx-6 text-center text-[12px] font-medium leading-[17px] overflow-hidden',
            banner?.type === 'error' && 'text-[#e15252]',
            banner?.type === 'success' && 'text-[#2f7a3d]',
          )}
        >
          {banner?.message || ''}
        </div>

        <form className="flex flex-col px-6" onSubmit={handleSubmit} noValidate>
          {/* ── 이메일 ── */}
          <div className="flex flex-col mt-2">
            <label
              className="mb-2 text-[#657a88] text-[15px] font-medium leading-[20px] tracking-[0.4px]"
              htmlFor="email"
            >
              이메일
            </label>
            <div
              className={twMerge(
                'flex items-center gap-2 px-3 w-full h-[40.371px] border-[0.7px] border-[#afb1b6] rounded-[6px] bg-white focus-within:border-[#4c9dd1]',
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
                className="flex-1 min-w-0 !border-none !bg-transparent !p-0 !rounded-none !shadow-none placeholder:text-[11px] placeholder:leading-[18.384px] placeholder:tracking-[0.368px] placeholder:text-[#657a88] placeholder:font-['Pretendard'] placeholder:font-normal"
              />
            </div>
            <p className="h-[18.384px] overflow-hidden mt-1 text-[11px] leading-[18.384px] tracking-[0.368px] text-[#e15252]">
              {fieldErrors.email}
            </p>
          </div>

          {/* ── 비밀번호 ── */}
          <div className="flex flex-col mt-1">
            <label
              className="mb-2.5 text-[#657a88] text-[15px] font-medium leading-[20px] tracking-[0.4px]"
              htmlFor="password"
            >
              비밀번호
            </label>
            <div
              className={twMerge(
                'flex items-center gap-2 px-3 w-full h-[40.371px] border-[0.7px] border-[#afb1b6] rounded-[6px] bg-white focus-within:border-[#4c9dd1]',
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
                className="flex-1 min-w-0 !border-none !bg-transparent !p-0 !rounded-none !shadow-none [&::placeholder]:text-[11px] [&::placeholder]:leading-[18.384px] [&::placeholder]:tracking-[0.368px] placeholder:text-[#657a88] placeholder:font-['Pretendard'] placeholder:font-normal"
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
            <p className="h-[18.384px] overflow-hidden mt-1 text-[11px] leading-[18.384px] tracking-[0.368px] text-[#e15252]">
              {fieldErrors.password}
            </p>
          </div>

          {/* ── 자동 로그인 ── */}
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
                'w-[17.903px] h-[17.903px] flex-shrink-0 rounded-[4px] border-[1.5px] border-[#c6cad1] flex items-center justify-center',
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

          {/* ── 로그인 버튼 ── */}
          <Button
            type="submit"
            disabled={isLoginDisabled}
            fullWidth
            className="flex h-[53px] mt-3 px-5 py-4 justify-center items-center gap-1.5 !rounded-2xl bg-[#4c9dd1] text-white text-[15px] font-bold leading-6 tracking-[0.2px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Spinner size="sm" className="mr-1" />}
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        <div className="flex items-center justify-center gap-3 mt-8 pb-8">
          <button
            type="button"
            className="bg-none border-none flex items-center gap-1.5 cursor-pointer text-black text-[14px] font-light leading-5 tracking-[0.4px]"
            onClick={() => navigate('/findPW')}
          >
            <img
              className="w-[10.479px] h-[13.473px] mt-[-3px]"
              src={lockIcon}
              alt=""
            />
            비밀번호 찾기
          </button>
          <span className="text-[#d1d5db]">|</span>
          <button
            type="button"
            className="bg-none border-none flex items-center gap-1.5 cursor-pointer text-[#4c9dd1] text-[14px] font-light leading-6 tracking-[0.2px]"
            onClick={() => navigate('/signup')}
          >
            <img
              className="w-[11.929px] h-[11.929px] mt-[-4px]"
              src={joinIcon}
              alt=""
            />
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}
