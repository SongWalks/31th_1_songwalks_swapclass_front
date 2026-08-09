import { create } from 'zustand';

interface CourseType {
  id: number;
  title: string;
  professor: string;
  time: string;
  badges: { label: string; variant: string }[];
}

interface WriteState {
  courseTag: CourseType | null;
  postType: '강의꿀팁' | '폐강과목' | null;
  title: string;
  content: string;
  setWriteData: (data: Partial<WriteState>) => void;
  resetWriteData: () => void;
}

export const useWriteStore = create<WriteState>((set) => ({
  postType: null,
  courseTag: null,
  title: '',
  content: '',
  setWriteData: (data) => set((state) => ({ ...state, ...data })),
  resetWriteData: () =>
    set({ postType: null, courseTag: null, title: '', content: '' }),
}));
