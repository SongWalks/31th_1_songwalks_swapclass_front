import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="h-[100dvh] bg-gray-200 flex justify-center font-sans text-gray-900">
      <div className="w-full max-w-[402px] h-full bg-[#FBFBFB] shadow-xl relative flex flex-col overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
