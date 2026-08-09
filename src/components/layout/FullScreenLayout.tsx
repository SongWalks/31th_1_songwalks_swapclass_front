import { Outlet } from 'react-router-dom';

export default function FullScreenLayout() {
  return (
    <div className="flex flex-col h-full w-full relative">
      <main className="flex-1 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
