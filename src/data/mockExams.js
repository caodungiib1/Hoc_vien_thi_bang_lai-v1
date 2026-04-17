import { mockStudentProfiles } from './mockStudentProfiles';

const getStudentById = (id) =>
  mockStudentProfiles.find((student) => student.id === id);

const assignedStudentIds = new Set([4, 5, 7, 9, 10]);

const examBatchTemplates = [
  {
    id: 'b2-apr-2026',
    name: 'Đợt thi B2 - Tháng 4/2026',
    date: '18/04/2026',
    time: '07:30',
    location: 'Trung tâm sát hạch Quận 12',
    type: 'Thi sát hạch',
    licenseType: 'B2',
    status: 'Đã xác nhận',
    statusTone: 'blue',
    note: 'Tập trung tại cổng A trước giờ thi 30 phút để điểm danh.',
    studentIds: [5],
  },
  {
    id: 'c-may-2026',
    name: 'Đợt thi C - Tháng 5/2026',
    date: '21/05/2026',
    time: '08:00',
    location: 'Trung tâm sát hạch Bình Tân',
    type: 'Thi nâng hạng',
    licenseType: 'C',
    status: 'Đang chốt danh sách',
    statusTone: 'orange',
    note: 'Ưu tiên hoàn tất hồ sơ thực hành trước ngày 10/05/2026.',
    studentIds: [4, 9],
  },
  {
    id: 'retake-may-2026',
    name: 'Thi lại B1/B2 - Cuối tháng 5',
    date: '31/05/2026',
    time: '13:30',
    location: 'Trung tâm sát hạch Bình Chánh',
    type: 'Thi lại',
    licenseType: 'B1/B2',
    status: 'Dự kiến',
    statusTone: 'purple',
    note: 'Đợt thi dành cho học viên cần thi lại phần thực hành sa hình.',
    studentIds: [7],
  },
  {
    id: 'a2-jun-2026',
    name: 'Đợt thi A2 - Đầu tháng 6',
    date: '14/06/2026',
    time: '09:00',
    location: 'Sân sát hạch Nhà Bè',
    type: 'Thi sát hạch',
    licenseType: 'A2',
    status: 'Chờ duyệt',
    statusTone: 'neutral',
    note: 'Tạm giữ chỗ cho học viên A2 hoàn tất hồ sơ trong tháng 5.',
    studentIds: [10],
  },
];

export const mockExamBatches = examBatchTemplates.map((batch) => {
  const students = batch.studentIds
    .map(getStudentById)
    .filter(Boolean)
    .map((student) => ({
      id: student.id,
      name: student.name,
      phone: student.phone,
      licenseType: student.licenseType,
      status: student.status,
      statusTone: student.statusTone,
      tuitionDebt: student.tuition.debt,
      theory: student.exam.theory,
      practical: student.exam.practical,
      consultant: student.consultant,
    }));

  return {
    ...batch,
    students,
    studentCount: students.length,
  };
});

export const mockUnscheduledStudents = mockStudentProfiles
  .filter((student) => !assignedStudentIds.has(student.id))
  .map((student) => ({
    id: student.id,
    name: student.name,
    phone: student.phone,
    licenseType: student.licenseType,
    region: student.region,
    status: student.status,
    statusTone: student.statusTone,
    expectedExam: student.exam.expectedDate,
    consultant: student.consultant,
  }));

export const examSummary = {
  totalBatches: mockExamBatches.length,
  upcomingBatches: mockExamBatches.filter((batch) => batch.status !== 'Hoàn tất').length,
  assignedStudents: mockExamBatches.reduce((sum, batch) => sum + batch.studentCount, 0),
  unassignedStudents: mockUnscheduledStudents.length,
  retakeStudents: mockExamBatches
    .flatMap((batch) => batch.students)
    .filter((student) => student.status === 'Thi lại').length,
};

export const getExamBatchById = (id) =>
  mockExamBatches.find((batch) => batch.id === id);
