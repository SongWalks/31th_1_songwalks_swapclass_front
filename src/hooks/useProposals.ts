import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '@/api/axiosInstance'; // 만들어두신 axios 인스턴스 경로

// 🚀 1. 교환 제안하기 (POST)
export const useProposeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { senderPostId: number; receiverPostId: number }) =>
      axiosInstance.post('/api/proposals', data),

    // API 호출이 성공하면 실행됨
    onSuccess: () => {
      // 💡 핵심: 제안 성공 후 홈 화면의 데이터를 다시 불러오도록(refetch) 트리거합니다.
      // 'homeData' 부분은 useHomeQuery에서 사용하신 queryKey와 동일해야 합니다!
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
};

// 🚀 2. 교환 수락하기 (POST)
export const useAcceptMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (proposalId: number) =>
      axiosInstance.post(`/api/proposals/${proposalId}/accept`),

    onSuccess: () => {
      // 수락 성공 시에도 홈 데이터를 갱신하여 받은 요청함에서 해당 카드를 사라지게 함
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
    },
  });
};
