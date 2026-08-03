import { create } from 'zustand';

export interface Course {
  id: number;
  title: string;
}

// 1. Zustand 스토어 타입 정의
interface LoungeState {
  activeTab: string;
  searchQuery: string;
  selectedType: string | null;
  selectedCourses: Course[];
  isFilterModalOpen: boolean;

  setActiveTab: (tab: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedType: (type: string | null) => void;
  setSelectedCourses: (courses: Course[]) => void;
  setIsFilterModalOpen: (isOpen: boolean) => void;

  handleResetFilters: () => void;
  handleRemoveCourse: (courseId: number) => void;
  handleToggleType: (type: string) => void;
  handleAddCourse: (course: Course) => void;
}

// 2. Zustand 스토어 생성
const useLoungeStore = create<LoungeState>((set) => ({
  activeTab: 'target',
  searchQuery: '',
  selectedType: null,
  selectedCourses: [],
  isFilterModalOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedType: (type) => set({ selectedType: type }),
  setSelectedCourses: (courses) => set({ selectedCourses: courses }),
  setIsFilterModalOpen: (isOpen) => set({ isFilterModalOpen: isOpen }),

  handleResetFilters: () => set({ selectedType: null, selectedCourses: [] }),

  handleRemoveCourse: (courseIdToRemove) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.filter(
        (c) => c.id !== courseIdToRemove,
      ),
    })),

  handleToggleType: (type) =>
    set((state) => ({
      selectedType: state.selectedType === type ? null : type,
    })),

  handleAddCourse: (courseToAdd) =>
    set((state) => ({
      selectedCourses: state.selectedCourses.some(
        (c) => c.id === courseToAdd.id,
      )
        ? state.selectedCourses
        : [...state.selectedCourses, courseToAdd],
    })),
}));

// 3. 기존 UI와 호환을 위한 Custom Hook
// 컴포넌트들에서 이 훅을 그대로 호출하여 사용하므로 기존 코드 수정 불필요
export const useLounge = () => {
  const store = useLoungeStore();

  const hasActiveFilters =
    store.selectedType !== null || store.selectedCourses.length > 0;

  return {
    ...store,
    hasActiveFilters,
  };
};
