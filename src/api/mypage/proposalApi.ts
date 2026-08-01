import axiosInstance from '@/api/axiosInstance';

// ==========================================
// 💡 Swagger 기반 상세 타입 정의
// ==========================================
export interface CourseInfo {
  courseId: number;
  name: string;
  professor: string;
  classTime: string;
  department: string;
  courseType: string;
}

export interface WantedCourseItem {
  priority: number;
  course: CourseInfo;
}

export interface PostDetail {
  postId: number;
  status: string;
  authorId: number;
  authorNickname: string;
  discardCourse: CourseInfo;
  wantedCourses: WantedCourseItem[];
  kakaoLink: string;
  createdAt: string;
  mine: boolean;
}

export interface ProposalData {
  id: number;
  status: string;
  expiresAt: string;
  remainSeconds: number;
  matchRank: number;
  senderPost: PostDetail;
  receiverPost: PostDetail;

  // 💡 프론트엔드 UI 호환용 속성들 (옵셔널)
  targetCourse?: string;
  targetType?: string;
  requestCount?: number;
  wantedCourses?: string[];
  remainTime?: string;
}

export interface ProposalListResponse {
  success: boolean;
  data: ProposalData[];
  message: string;
}

export interface SingleProposalResponse {
  success: boolean;
  data: ProposalData;
  message: string;
}

// ===================================================
// 💡 [API 통신 함수들 (실제 서버 연동 + 데이터 매핑)]
// ===================================================

/**
 * [GET] 받은 교환 요청 목록 조회
 */
export const getReceivedProposals = async () => {
  // ⚠️ 백엔드 API 명세서에 맞게 URL을 수정해 주세요 (예: '/api/proposals/received')
  const response = await axiosInstance.get<ProposalListResponse>(
    '/api/proposals/received',
  );

  if (response.data.success && response.data.data) {
    // 💡 Swagger 중첩 구조를 목록 화면(ExchangeRequestPage) UI에 맞게 매핑
    const mappedData = response.data.data.map((item) => ({
      ...item,
      targetCourse: item.senderPost?.discardCourse?.name || '과목명 없음',
      wantedCourses:
        item.senderPost?.wantedCourses?.map((w) => w.course.name) || [],
      requestCount: item.requestCount || 0, // 백엔드에서 requestCount를 안 주면 0으로 처리
    }));
    return { ...response.data, data: mappedData };
  }
  return response.data;
};

/**
 * [GET] 보낸 교환 요청 단건 조회
 */
export const getSentProposal = async () => {
  // ⚠️ 백엔드 API 명세서에 맞게 URL을 수정해 주세요 (예: '/api/proposals/sent')
  const response = await axiosInstance.get<SingleProposalResponse>(
    '/api/proposals/sent',
  );

  if (response.data.success && response.data.data) {
    const item = response.data.data;
    // 💡 화면 UI에 맞게 데이터 가공
    const mappedData = {
      ...item,
      targetCourse: item.senderPost?.discardCourse?.name || '과목명 없음',
      targetType: item.senderPost?.discardCourse?.courseType || '전공필수',
      wantedCourses:
        item.senderPost?.wantedCourses?.map((w) => w.course.name) || [],
      requestCount: item.requestCount || 0,
      remainTime: item.remainTime || '시간 정보 없음', // 필요시 remainSeconds를 활용해 시간 포맷팅 함수 적용
    };
    return { ...response.data, data: mappedData };
  }
  return response.data;
};

/**
 * [GET] 교환 요청 상세 조회
 */
export const getProposalDetail = async (proposalId: number) => {
  // ⚠️ 백엔드 URL 확인 필요 (예: `/api/proposals/${proposalId}`)
  const response = await axiosInstance.get<SingleProposalResponse>(
    `/api/proposals/${proposalId}`,
  );
  return response.data;
};

/**
 * [POST] 교환 요청 수락
 */
export const acceptProposal = async (proposalId: number) => {
  // ⚠️ 백엔드 URL 확인 필요
  const response = await axiosInstance.post(
    `/api/proposals/${proposalId}/accept`,
  );
  return response.data;
};

/**
 * [POST] 교환 요청 거절
 */
export const rejectProposal = async (proposalId: number) => {
  // ⚠️ 백엔드 URL 확인 필요
  const response = await axiosInstance.post(
    `/api/proposals/${proposalId}/reject`,
  );
  return response.data;
};

/**
 * [DELETE] 보낸 교환 요청 철회
 */
export const withdrawProposal = async (proposalId: number) => {
  // ⚠️ 백엔드 URL 확인 필요 (보통 DELETE 메서드 사용)
  const response = await axiosInstance.delete(`/api/proposals/${proposalId}`);
  return response.data;
};
