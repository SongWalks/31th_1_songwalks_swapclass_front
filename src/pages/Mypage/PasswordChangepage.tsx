import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/common/Input';
import { IconButton } from '@/components/common/IconButton';
import { ICONS } from '@/constants/icons';
import Header from '@/components/layout/Header';
import { Modal } from '@/components/common/Modal';
import defaultEyeIcon from '@/assets/icons/eye_icon.svg';
import cautionEyeIcon from '@/assets/icons/Caution_eye_icon.svg';

// 💡 1. 미리 만들어둔 mypageApi에서 updatePassword 함수를 가져옵니다.
import { updatePassword } from '@/api/mypageApi';

const PasswordChangepage = () => {
  const navigate = useNavigate();
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [touched, setTouched] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  // 💡 비밀번호 변경 성공 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpdate = async () => {
    // 1. 유효성 검사
    if (pw.new !== pw.confirm) {
      return alert('새 비밀번호가 일치하지 않습니다.');
    }

    // 2. API 호출
    try {
      // 💡 mypageApi의 함수 규격에 맞게 인자 전달
      const response = await updatePassword({
        currentPassword: pw.current,
        newPassword: pw.new,
        newPasswordConfirm: pw.confirm,
      });

      if (response.success) {
        setIsModalOpen(true);
      } else {
        alert(response.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('비밀번호 변경 오류:', error);
      alert(
        error.response?.data?.message || '서버 연결 중 오류가 발생했습니다.',
      );
    }
  };

  const isError = (key: keyof typeof pw) =>
    touched[key] && pw[key].trim() === '';

  const renderEyeNode = (key: keyof typeof pw) => (
    <button
      type="button"
      onClick={() =>
        setShowPassword({ ...showPassword, [key]: !showPassword[key] })
      }
      className="flex items-center justify-center w-6 h-6 cursor-pointer"
    >
      <img
        src={isError(key) ? cautionEyeIcon : defaultEyeIcon}
        className="w-7 h-10"
        alt="Toggle Visibility"
      />
    </button>
  );

  return (
    <div className="relative w-full h-full bg-[#FBFBFB] flex flex-col overflow-hidden">
      <div className="[&>header]:!border-none">
        <Header
          leftNode={
            <IconButton icon={ICONS.BACK} onClick={() => navigate(-1)} />
          }
          title={<div className="h-10" />}
          rightNode={<div className="w-10 h-10" />}
        />
      </div>

      <div className="px-5 pt-[70px]">
        <h1 className="text-2xl font-bold font-['Paperlogy'] leading-9 tracking-wide text-cyan-900 mb-[3px]">
          비밀번호 변경
        </h1>
        <p className="text-lg font-semibold font-['Pretendard'] leading-5 tracking-wide text-slate-500 mb-[39.67px]">
          새로운 비밀번호로 재설정합니다
        </p>
      </div>

      <div className="px-5 flex flex-col gap-6">
        <Input
          label="현재 비밀번호"
          type={showPassword.current ? 'text' : 'password'}
          value={pw.current}
          onChange={(e: any) => setPw({ ...pw, current: e.target.value })}
          onBlur={() => setTouched({ ...touched, current: true })}
          isError={isError('current')}
          rightNode={renderEyeNode('current')}
        />

        <Input
          label="새 비밀번호"
          type={showPassword.new ? 'text' : 'password'}
          value={pw.new}
          onChange={(e: any) => setPw({ ...pw, new: e.target.value })}
          onBlur={() => setTouched({ ...touched, new: true })}
          isError={isError('new')}
          rightNode={renderEyeNode('new')}
          errorMessage={
            isError('new')
              ? '영문, 숫자, 특수문자를 포함하여 8~12자로 작성해주세요'
              : ''
          }
        />

        <Input
          label="비밀번호 확인"
          type={showPassword.confirm ? 'text' : 'password'}
          value={pw.confirm}
          onChange={(e: any) => setPw({ ...pw, confirm: e.target.value })}
          onBlur={() => setTouched({ ...touched, confirm: true })}
          isError={isError('confirm')}
          rightNode={renderEyeNode('confirm')}
        />

        <button
          onClick={handleUpdate}
          className="w-full h-14 mt-4 bg-brand-lightBlue rounded-2xl text-white font-bold cursor-pointer hover:opacity-90 transition-opacity"
        >
          비밀번호 변경
        </button>

        {/* 🧪 개발 중 임시 버튼 - API 연동 확인되면 삭제 */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full h-10 border border-dashed border-gray-400 rounded-xl text-gray-500 text-sm cursor-pointer"
        >
          (테스트) 모달 미리보기
        </button>
      </div>

      {/* 💡 비밀번호 변경 성공 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="relative w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200"
        title={
          <div className="w-72 text-center justify-center text-cyan-900 text-sm font-medium font-['Pretendard'] leading-4 tracking-wide">
            성공적으로 변경되었습니다
          </div>
        }
        footer={
          <div className="flex flex-col w-full gap-2">
            <button
              onClick={() => navigate('/my')}
              className="w-full h-12 rounded-full bg-brand-lightBlue text-white font-medium cursor-pointer"
            >
              확인
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full h-12 rounded-full outline outline-1 outline-offset-[-1px] outline-gray-300 bg-white text-black font-medium cursor-pointer"
            >
              취소
            </button>
          </div>
        }
      >
        <div className="h-1" />
      </Modal>
    </div>
  );
};

export default PasswordChangepage;
