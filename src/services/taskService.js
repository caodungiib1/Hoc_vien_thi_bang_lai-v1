import { getUserScopedKey, readStorage, writeStorage } from './storageService';

const PRIORITIES = ['Khẩn', 'Bình thường', 'Thấp'];

const DEFAULT_TASKS = [
  { id: 1, text: 'Nhắc học viên Nguyễn Văn Anh nộp hồ sơ còn thiếu', priority: 'Khẩn', done: false, created: '15/04/2026' },
  { id: 2, text: 'Xác nhận lịch thi đợt B2 tháng 4 với sở GTVT', priority: 'Khẩn', done: false, created: '15/04/2026' },
  { id: 3, text: 'Gọi điện nhắc học viên Phạm Hồng Duy đóng học phí', priority: 'Bình thường', done: false, created: '14/04/2026' },
  { id: 4, text: 'Kiểm tra danh sách học viên chờ thi tháng 4', priority: 'Bình thường', done: true, created: '14/04/2026' },
  { id: 5, text: 'Cập nhật kết quả thi đợt A1 ngày 12/4', priority: 'Bình thường', done: true, created: '12/04/2026' },
  { id: 6, text: 'Báo cáo doanh thu tháng 3 cho giám đốc', priority: 'Thấp', done: false, created: '10/04/2026' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const TASK_BASE_KEY = 'tasks.v1';

const getStoredTasks = () => readStorage(getUserScopedKey(TASK_BASE_KEY), DEFAULT_TASKS);
const saveStoredTasks = (tasks) => writeStorage(getUserScopedKey(TASK_BASE_KEY), tasks);

export const getTaskPriorities = async () => clone(PRIORITIES);

export const getTasks = async () => clone(getStoredTasks());

export const createTask = async (payload) => {
  const newTask = {
    id: Date.now(),
    ...payload,
    done: false,
    created: new Date().toLocaleDateString('vi-VN'),
  };
  saveStoredTasks([newTask, ...getStoredTasks()]);
  return clone(newTask);
};

export const toggleTaskDone = async (task) => {
  const updatedTask = { ...clone(task), done: !task.done };
  const nextTasks = getStoredTasks().map((item) =>
    item.id === task.id ? updatedTask : item,
  );
  saveStoredTasks(nextTasks);
  return clone(updatedTask);
};

export const deleteTask = async (id) => {
  const normalizedId = Number(id);
  saveStoredTasks(getStoredTasks().filter((item) => item.id !== normalizedId));
  return { id: normalizedId, deleted: true, deletedAt: new Date().toISOString() };
};
