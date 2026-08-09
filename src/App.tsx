import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/routes/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toast } from '@/components/common/Toast';
import { setForegroundMessageListener } from '@/api/alert/msts';

const queryClient = new QueryClient();

export default function App() {
  const [toastMessage, setToastMessage] = useState('');
  const [isToastVisible, setIsToastVisible] = useState(false);

  useEffect(() => {
    setForegroundMessageListener((title: string, body: string) => {
      setToastMessage(body ? `${title} · ${body}` : title);
      setIsToastVisible(true);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* 추후 전역 UI(Toast 알림, 모달 등)나 
        React Query 같은 Provider가 추가된다면 이곳에 감싸게 됩니다. 
      */}
      <RouterProvider router={router} />

      <Toast
        message={toastMessage}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
        duration={3000}
      />
    </QueryClientProvider>
  );
}
