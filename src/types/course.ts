export interface Course {
  courseId: number; // 💡 변경: id -> courseId (스웨거 기준)
  name: string; // 과목명
  professor: string; // 담당교수
  classTime: string; // 💡 변경: class_time -> classTime
  courseType: string; // 💡 변경: course_type -> courseType
  department: string | null; // 개설 학과 (전공일 때만 존재)
  category: string; // 교과구분 (교선핵심 / 전공필수 등)
  area: string | null; // 교양 영역·그룹 (교양일 때만 존재)
  isGraduationReq: boolean; // 💡 변경: is_graduation_req -> isGraduationReq

  // (아래 속성들은 백엔드 응답에 있다면 그대로 유지, 혹시 백엔드에서 다른 이름으로 준다면 맞춰서 수정해 주세요!)
  code: string; // 과목번호(학수번호)
  section: string; // 분반
  credits: string; // 학점
}
