import { mockStudents } from './mockStudents';

const birthDates = [
  '12/08/2000',
  '05/03/1999',
  '19/11/1998',
  '27/01/1996',
  '14/09/2001',
  '30/06/2002',
  '08/04/1997',
  '22/12/1995',
  '17/07/1994',
  '09/10/2000',
];

const genders = ['Nam', 'Nữ', 'Nam', 'Nam', 'Nữ', 'Nữ', 'Nam', 'Nam', 'Nam', 'Nam'];

const addresses = [
  '12 Nguyễn Oanh, Gò Vấp, TP. Hồ Chí Minh',
  '48 Võ Văn Ngân, Thủ Đức, TP. Hồ Chí Minh',
  '73 Nguyễn Thị Thập, Quận 7, TP. Hồ Chí Minh',
  '102 Lê Văn Khương, Quận 12, TP. Hồ Chí Minh',
  '55 Quang Trung, Gò Vấp, TP. Hồ Chí Minh',
  '90 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. Hồ Chí Minh',
  '18 Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh',
  '110 Trường Chinh, Tân Bình, TP. Hồ Chí Minh',
  '21 Tỉnh lộ 8, Củ Chi, TP. Hồ Chí Minh',
  '44 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh',
];

const referredByList = [
  'Anh Minh Auto',
  'Fanpage trung tâm',
  'Chị Thanh giới thiệu',
  'Nhân viên tư vấn nội bộ',
  'Bạn bè giới thiệu',
  'TikTok Ads',
  'Anh Dũng cộng tác viên',
  'Website đăng ký',
  'Facebook Ads',
  'Chị Hà kế toán giới thiệu',
];

const consultantList = [
  'Phạm Khánh',
  'Ngọc Hà',
  'Quốc Bảo',
  'Ngọc Lan',
  'Minh Trí',
  'Khánh Linh',
  'Trung Hiếu',
  'Lan Vy',
  'Bảo Châu',
  'Gia Hân',
];

const emergencyContacts = [
  'Nguyễn Thị Hoa - 0901122334',
  'Trần Văn Cường - 0909988776',
  'Lê Thị Hồng - 0912233445',
  'Phạm Thị Ngọc - 0913344556',
  'Hoàng Văn Sơn - 0934455667',
  'Phan Văn Phú - 0945566778',
  'Đỗ Thị Anh - 0956677889',
  'Vũ Minh Tâm - 0967788990',
  'Bùi Thị Liên - 0978899001',
  'Lý Minh Khoa - 0989900112',
];

const toMoney = (value) => `${value.replace(/,/g, '.')}đ`;

const getStatusTone = (status) => {
  switch (status) {
    case 'Mới đăng ký':
      return 'blue';
    case 'Chờ khám sức khỏe':
    case 'Đã khám sức khỏe':
      return 'orange';
    case 'Đã nộp hồ sơ':
      return 'green';
    case 'Đang học':
      return 'purple';
    case 'Chờ thi':
      return 'neutral';
    case 'Đã đỗ':
      return 'green';
    case 'Thi lại':
      return 'red';
    default:
      return 'neutral';
  }
};

const buildDocuments = (student) => {
  const advancedStatuses = ['Đã khám sức khỏe', 'Đã nộp hồ sơ', 'Đang học', 'Chờ thi', 'Đã đỗ', 'Thi lại'];
  const hasHealthCheck = advancedStatuses.includes(student.status);

  return [
    { label: 'CCCD', value: 'Đã nhận bản sao', tone: 'green' },
    { label: 'Ảnh thẻ', value: student.id % 2 === 0 ? 'Đã nhận' : 'Chờ bổ sung 2 ảnh', tone: student.id % 2 === 0 ? 'green' : 'orange' },
    { label: 'Giấy khám sức khỏe', value: hasHealthCheck ? 'Đã cập nhật' : 'Chưa nộp', tone: hasHealthCheck ? 'green' : 'neutral' },
    { label: 'Đơn đăng ký', value: 'Đã ký xác nhận', tone: 'blue' },
  ];
};

const buildHealthCheck = (student) => {
  if (student.status === 'Chờ khám sức khỏe') {
    return {
      status: 'Chờ khám sức khỏe',
      result: 'Chưa có kết quả',
      appointment: '16/04/2026 - 08:30',
      clinic: 'Phòng khám Đa khoa Tân Bình',
      note: 'Nhắc học viên mang theo CCCD gốc trước giờ hẹn 15 phút.',
    };
  }

  return {
    status: 'Đã khám sức khỏe',
    result: 'Đủ điều kiện học và thi',
    appointment: '08/04/2026 - 09:00',
    clinic: 'Phòng khám Đa khoa Quận 10',
    note: 'Hồ sơ sức khỏe đã đồng bộ sang bộ phận đào tạo.',
  };
};

const buildExam = (student) => {
  if (student.status === 'Chờ thi') {
    return {
      batch: `Đợt thi ${student.licenseType} tháng 5/2026`,
      expectedDate: '24/05/2026',
      location: 'Trung tâm sát hạch Quận 12',
      theory: 'Đã xếp lịch',
      practical: 'Chờ xác nhận xe tập',
      attempt: 'Lần đầu',
    };
  }

  if (student.status === 'Thi lại') {
    return {
      batch: `Thi lại ${student.licenseType} tháng 5/2026`,
      expectedDate: '31/05/2026',
      location: 'Trung tâm sát hạch Bình Chánh',
      theory: 'Đã qua',
      practical: 'Thi lại lần 2',
      attempt: 'Lần 2',
    };
  }

  if (student.status === 'Đã đỗ') {
    return {
      batch: `Đợt thi ${student.licenseType} tháng 4/2026`,
      expectedDate: '11/04/2026',
      location: 'Trung tâm sát hạch Quận 12',
      theory: 'Đạt',
      practical: 'Đạt',
      attempt: 'Lần đầu',
    };
  }

  return {
    batch: `Dự kiến đợt thi ${student.licenseType} tháng 6/2026`,
    expectedDate: '14/06/2026',
    location: 'Đang chờ phân bổ',
    theory: 'Chưa thi',
    practical: 'Chưa thi',
    attempt: 'Chưa phát sinh',
  };
};

const buildSchedule = (student) => [
  {
    title: 'Buổi lý thuyết',
    time: '19:00 - 21:00, Thứ 3',
    location: 'Phòng học A2',
    value: `Lớp ${student.licenseType} - Ca tối`,
  },
  {
    title: 'Buổi thực hành',
    time: '07:30 - 09:30, Chủ nhật',
    location: 'Sân tập Quận 12',
    value: `Xe số ${student.licenseType === 'B2' ? 'sàn' : 'tự động'}`,
  },
];

const buildCareHistory = (student, consultant) => [
  {
    time: '14/04/2026 - 09:15',
    title: 'Gọi xác nhận hồ sơ',
    description: `${consultant} đã gọi xác nhận tình trạng hồ sơ và nhắc lịch xử lý tiếp theo.`,
  },
  {
    time: '12/04/2026 - 16:40',
    title: 'Cập nhật học phí',
    description: `Đã ghi nhận thanh toán ${toMoney(student.paid)} và cập nhật công nợ còn lại.`,
  },
  {
    time: '10/04/2026 - 11:00',
    title: 'Tạo hồ sơ học viên',
    description: 'Tiếp nhận thông tin ban đầu và phân công nhân viên theo dõi.',
  },
];

const buildNotes = (student) => [
  `Ưu tiên liên hệ ngoài giờ hành chính vì học viên đang đi làm tại khu vực ${student.region}.`,
  student.debt === '0'
    ? 'Học phí đã hoàn tất, không cần nhắc thanh toán thêm.'
    : `Cần nhắc đóng phần công nợ còn lại trước ngày 20/04/2026 (${toMoney(student.debt)}).`,
];

const buildDefaultProfile = (student, index) => {
  const consultant = consultantList[index];

  return {
    id: student.id,
    name: student.name,
    phone: student.phone,
    email: `hocvien${student.id}@qlhv.vn`,
    birthDate: birthDates[index],
    gender: genders[index],
    cccd: student.cccd,
    address: addresses[index],
    region: student.region,
    referredBy: referredByList[index],
    consultant,
    emergencyContact: emergencyContacts[index],
    licenseType: student.licenseType,
    packageName: `Khóa ${student.licenseType} tiêu chuẩn`,
    className: `${student.licenseType} - Ca tối`,
    registerDate: student.registerDate,
    status: student.status,
    statusTone: getStatusTone(student.status),
    documents: buildDocuments(student),
    healthCheck: buildHealthCheck(student),
    tuition: {
      total: toMoney(student.totalFee),
      paid: toMoney(student.paid),
      debt: toMoney(student.debt),
      paymentMethod: student.id % 2 === 0 ? 'Tiền mặt' : 'Chuyển khoản',
      collector: consultant,
      deadline: '20/04/2026',
    },
    exam: buildExam(student),
    schedule: buildSchedule(student),
    notes: buildNotes(student),
    careHistory: buildCareHistory(student, consultant),
  };
};

const profileOverrides = {
  1: {
    email: 'anh.nguyen@qlhv.vn',
    packageName: 'Khóa B2 tiêu chuẩn 3 tháng',
    className: 'B2 - Ca tối T3/T5',
    notes: [
      'Học viên muốn hoàn tất hồ sơ sức khỏe trong tuần này để kịp xếp lớp lái thử.',
      'Đã ưu tiên ghép vào nhóm B2 có lịch học tối do phù hợp thời gian đi làm.',
    ],
  },
  4: {
    packageName: 'Khóa C nâng hạng chuyên sâu',
    exam: {
      batch: 'Đợt thi C tháng 5/2026',
      expectedDate: '21/05/2026',
      location: 'Trung tâm sát hạch Bình Tân',
      theory: 'Đã xác nhận',
      practical: 'Đang chờ phân xe thực hành',
      attempt: 'Lần đầu',
    },
  },
  7: {
    notes: [
      'Học viên đã hoàn thành phần thi lý thuyết, cần tập trung thêm cho sa hình trước đợt thi lại.',
      'Đề xuất đặt thêm 2 buổi thực hành cá nhân trong tuần tới.',
    ],
  },
  9: {
    healthCheck: {
      status: 'Đã khám sức khỏe',
      result: 'Đủ điều kiện học và thi',
      appointment: '05/04/2026 - 07:45',
      clinic: 'Bệnh viện Giao thông Vận tải',
      note: 'Hồ sơ sức khỏe đã được nộp đủ, chỉ còn chờ xếp lớp thực hành.',
    },
  },
};

export const mockStudentProfiles = mockStudents.map((student, index) => {
  const defaultProfile = buildDefaultProfile(student, index);
  const override = profileOverrides[student.id] || {};

  return {
    ...defaultProfile,
    ...override,
    tuition: {
      ...defaultProfile.tuition,
      ...(override.tuition || {}),
    },
    healthCheck: {
      ...defaultProfile.healthCheck,
      ...(override.healthCheck || {}),
    },
    exam: {
      ...defaultProfile.exam,
      ...(override.exam || {}),
    },
    documents: override.documents || defaultProfile.documents,
    schedule: override.schedule || defaultProfile.schedule,
    notes: override.notes || defaultProfile.notes,
    careHistory: override.careHistory || defaultProfile.careHistory,
  };
});

export const getMockStudentProfileById = (id) =>
  mockStudentProfiles.find((student) => String(student.id) === String(id));
