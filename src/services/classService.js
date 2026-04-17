import { mockStudentProfiles } from '../data/mockStudentProfiles';
import { getUserScopedKey, readStorage, removeStorage, writeStorage } from './storageService';

const getStudentById = (id) => mockStudentProfiles.find((student) => student.id === id);

const CLASS_TEMPLATES = [
  {
    id: 'b2-evening-q12',
    name: 'Lớp B2 - Ca tối Quận 12',
    licenseType: 'B2',
    schedule: 'Thứ 3, Thứ 5 - 19:00 đến 21:00',
    practiceSchedule: 'Chủ nhật - 07:30 đến 09:30',
    instructor: 'Thầy Minh Đức',
    assistant: 'Trợ giảng Khánh Linh',
    location: 'Phòng học A2 và sân tập Quận 12',
    capacity: 18,
    status: 'Đang học',
    statusTone: 'green',
    studentIds: [1, 5, 8],
    nextLessons: [
      { id: 1, title: 'Luật giao thông đường bộ', time: '16/04/2026 - 19:00', type: 'Lý thuyết', room: 'Phòng A2' },
      { id: 2, title: 'Thực hành sa hình cơ bản', time: '19/04/2026 - 07:30', type: 'Thực hành', room: 'Sân tập Quận 12' },
    ],
    note: 'Ưu tiên nhóm còn nợ học phí hoàn tất trước buổi thực hành thứ hai.',
  },
  {
    id: 'b1-weekend',
    name: 'Lớp B1 - Cuối tuần',
    licenseType: 'B1',
    schedule: 'Thứ 7 - 08:00 đến 10:30',
    practiceSchedule: 'Chủ nhật - 09:30 đến 11:30',
    instructor: 'Cô Thanh Huyền',
    assistant: 'Trợ giảng Lan Vy',
    location: 'Phòng học B1 và sân tập Tân Bình',
    capacity: 14,
    status: 'Đang học',
    statusTone: 'blue',
    studentIds: [3, 7],
    nextLessons: [
      { id: 1, title: 'Kỹ thuật lái xe an toàn', time: '18/04/2026 - 08:00', type: 'Lý thuyết', room: 'Phòng B1' },
      { id: 2, title: 'Bài tiến lùi hình chữ chi', time: '19/04/2026 - 09:30', type: 'Thực hành', room: 'Sân tập Tân Bình' },
    ],
    note: 'Theo dõi riêng học viên thi lại để bổ sung buổi kèm sa hình.',
  },
  {
    id: 'a1-basic',
    name: 'Lớp A1 - Cấp tốc',
    licenseType: 'A1',
    schedule: 'Thứ 2, Thứ 4 - 18:30 đến 20:00',
    practiceSchedule: 'Thứ 6 - 18:30 đến 20:00',
    instructor: 'Thầy Quốc Bảo',
    assistant: 'Trợ giảng Gia Hân',
    location: 'Phòng học C1 và sân xe máy Gò Vấp',
    capacity: 25,
    status: 'Sắp khai giảng',
    statusTone: 'orange',
    studentIds: [2, 6],
    nextLessons: [
      { id: 1, title: 'Khai giảng và phổ biến quy chế', time: '20/04/2026 - 18:30', type: 'Lý thuyết', room: 'Phòng C1' },
      { id: 2, title: 'Làm quen xe và bài vòng số 8', time: '24/04/2026 - 18:30', type: 'Thực hành', room: 'Sân xe máy Gò Vấp' },
    ],
    note: 'Chờ học viên Phan Thị Phương hoàn tất học phí trước khai giảng.',
  },
  {
    id: 'c-upgrade',
    name: 'Lớp C - Nâng hạng',
    licenseType: 'C',
    schedule: 'Thứ 2, Thứ 6 - 19:00 đến 21:30',
    practiceSchedule: 'Thứ 7 - 13:30 đến 16:30',
    instructor: 'Thầy Hữu Phước',
    assistant: 'Trợ giảng Minh Trí',
    location: 'Phòng D2 và sân tập Bình Tân',
    capacity: 12,
    status: 'Đang học',
    statusTone: 'purple',
    studentIds: [4, 9],
    nextLessons: [
      { id: 1, title: 'Kỹ thuật điều khiển xe tải', time: '17/04/2026 - 19:00', type: 'Lý thuyết', room: 'Phòng D2' },
      { id: 2, title: 'Bài dốc cầu và ghép xe', time: '18/04/2026 - 13:30', type: 'Thực hành', room: 'Sân tập Bình Tân' },
    ],
    note: 'Cần kiểm tra sức khỏe và hồ sơ gốc trước khi chốt danh sách thi.',
  },
];

const CLASS_BASE_KEY = 'classes.v1';

const clone = (value) => JSON.parse(JSON.stringify(value));

const buildClass = (template) => {
  const students = template.studentIds
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
      documentStatus: student.documents.every((document) => document.tone === 'green' || document.tone === 'blue')
        ? 'Đủ hồ sơ'
        : 'Cần bổ sung',
    }));

  return {
    ...template,
    students,
    studentCount: students.length,
    fillRate: Math.round((students.length / template.capacity) * 100),
  };
};

const classes = CLASS_TEMPLATES.map(buildClass);

const getStoredClasses = () => readStorage(getUserScopedKey(CLASS_BASE_KEY), classes);

const saveStoredClasses = (classList) => writeStorage(getUserScopedKey(CLASS_BASE_KEY), classList);

export const getClasses = async () => getStoredClasses();

export const getClassById = async (id) => {
  const classItem = getStoredClasses().find((item) => item.id === id);
  return classItem ? clone(classItem) : null;
};

export const getClassSummary = async () => {
  const classList = getStoredClasses();

  return {
    totalClasses: classList.length,
    activeClasses: classList.filter((item) => item.status === 'Đang học').length,
    activeStudents: classList.reduce((sum, item) => sum + item.studentCount, 0),
    weeklyLessons: classList.reduce((sum, item) => sum + item.nextLessons.length, 0),
  };
};

export const createClass = async (payload) => {
  const createdClass = {
    id: Date.now(),
    studentIds: [],
    students: [],
    studentCount: 0,
    fillRate: 0,
    status: 'Sắp khai giảng',
    statusTone: 'orange',
    ...payload,
  };

  saveStoredClasses([createdClass, ...getStoredClasses()]);
  return clone(createdClass);
};

export const resetClassesToDefault = async () => {
  removeStorage(getUserScopedKey(CLASS_BASE_KEY));
  return clone(classes);
};
