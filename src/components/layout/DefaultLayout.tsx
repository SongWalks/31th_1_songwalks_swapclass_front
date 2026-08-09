import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function DefaultLayout() {
  return (
    <div className="flex flex-col h-full w-full relative">
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto w-full"
      >
        <Outlet />
      </main>

      <div className="w-full shrink-0 relative z-50 bg-white">
        <BottomNav />
      </div>
    </div>
  );
}
