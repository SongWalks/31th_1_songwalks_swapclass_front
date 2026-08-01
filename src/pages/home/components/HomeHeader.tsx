import { useNavigate } from 'react-router-dom';
import { ICONS } from '@/constants/icons';
import { IconButton } from '@/components/common/IconButton';
import sooLogo from '@/assets/icons/soo-logo.png';

export const HomeHeader = ({
  isScrolled = false,
  unreadCount = 0,
}: {
  isScrolled?: boolean;
  unreadCount?: number;
}) => {
  const navigate = useNavigate();

  return (
    <header
      className={`sticky top-0 z-50 flex justify-between items-center w-full max-w-[402px] mx-auto h-[56px] px-2 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="flex items-center w-12 h-12 ml-2">
        <img
          src={sooLogo}
          alt="SOO Logo"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex items-center justify-end mr-1">
        <div
          className="relative mt-1 cursor-pointer"
          onClick={() => navigate('/alert')}
        >
          <IconButton icon={ICONS.BELL} />

          {unreadCount > 0 && (
            <div className="absolute top-2.5 left-1.5 w-1 h-1 bg-point-red rounded-full" />
          )}
        </div>
      </div>
    </header>
  );
};
