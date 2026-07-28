import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="h-[100dvh] bg-gray-200 flex justify-center font-sans text-gray-900">
<<<<<<< HEAD
      <div className="w-full max-w-[402px] h-full bg-gray-50 shadow-xl relative flex flex-col overflow-hidden">
=======
      <div className="w-full max-w-[402px] h-full bg-[#FBFBFB] shadow-xl relative flex flex-col overflow-hidden">
>>>>>>> da92837036da5417537f08086bbe249b0afac040
        <Outlet />
      </div>
    </div>
  );
}
