import { Icon } from '@iconify/react';

interface AvatarProps {
  src?: string; // 실제 프로필 이미지 URL (없으면 기본 아이콘)
  alt?: string; // 시각장애인 리더기용 텍스트
  size?: 'sm' | 'md' | 'lg'; // 사이즈 (sm: 댓글용, md: 리스트용, lg: 내 프로필용)
  className?: string;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-[20px]', // 32px (댓글 등 좁은 곳)
  md: 'w-12 h-12 text-[30px]', // 48px (게시글 상세 작성자 등)
  lg: 'w-20 h-20 text-[50px]', // 80px (마이페이지 메인 등)
};

export const Avatar = ({
  src,
  alt = '프로필 이미지',
  size = 'md',
  className = '',
}: AvatarProps) => {
  return (
    <div
      className={`
        relative flex items-center justify-center shrink-0 
        rounded-full overflow-hidden bg-gray-200
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {src ? (
        // 이미지가 있을 경우 (꽉 차게 렌더링)
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        // 이미지가 없을 경우 (시안의 둥근 사람 실루엣 기본 아이콘)
        // Iconify의 기본 user 아이콘을 하얀색으로 띄웁니다.
        <Icon icon="healthicons:person" className="text-white" />
      )}
    </div>
  );
};
