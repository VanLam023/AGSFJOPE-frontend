const recentExams = [
  {
    id: 1,
    key: 1,
    name: 'OOP Final Exam 2024',
    semester: 'Summer 2024',
    status: 'ONGOING',
  },
  {
    id: 2,
    key: 2,
    name: 'Midterm Practical Test',
    semester: 'Summer 2024',
    status: 'UPCOMING',
  },
  {
    id: 3,
    key: 3,
    name: 'Retake Workshop 2',
    semester: 'Spring 2024',
    status: 'COMPLETED',
  },
];

const examStatusConfig = {
  ONGOING: {
    label: 'Đang diễn ra',
    cls: 'bg-green-100 text-green-700 border-green-200',
  },
  UPCOMING: {
    label: 'Sắp diễn ra',
    cls: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  COMPLETED: {
    label: 'Hoàn thành',
    cls: 'bg-slate-200 text-slate-700 border-slate-300',
  },
};

const appealStatusConfig = {
  PENDING: {
    label: 'Đang chờ',
    // icon: 'schedule',
    cls: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  ASSIGNED: {
    label: 'Đã được giao',
    //    icon: 'person',
    cls: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

const pendingAppeals = [
  {
    id: 1,
    student: {
      name: 'Nguyen Van Luan',
      mssv: 'HE150123',
      initials: 'NL',
      initialsColor: 'bg-[#F37021]/10 text-[#F37021] border-[#F37021]/20',
    },
    examName: 'OOP Final Exam 2024',
    status: 'PENDING',
  },
  {
    id: 2,
    student: {
      name: 'Tran Minh Hoang',
      mssv: 'HE161244',
      initials: 'TH',
      initialsColor: 'bg-slate-200 text-slate-600 border-slate-300',
    },
    examName: 'OOP Final Exam 2024',
    status: 'ASSIGNED',
  },
];

const gradeDistribution = [
  { range: '0-4', height: 15, active: false },
  { range: '4-6', height: 35, active: false },
  // { range: '6-8', height: '85%', active: true },
  { range: '6-8', height: 100, active: true },
  { range: '8-9', height: 60, active: false },
  { range: '9-10', height: 40, active: false },
];

export {
  recentExams,
  examStatusConfig,
  pendingAppeals,
  appealStatusConfig,
  gradeDistribution,
};
