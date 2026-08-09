interface SkeletonProps {
  className?: string; // 너비, 높이, 모양(원형/사각형)을 결정할 클래스
}

export const Skeleton = ({ className = '' }: SkeletonProps) => {
  return (
    // 💡 animate-pulse: 1.5초 주기로 투명도가 깜빡거리는 생동감 있는 효과
    <div className={`animate-pulse bg-gray-200 rounded-md ${className}`} />
  );
};
