import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layouts/MainLayout.jsx';
import { STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems.jsx';
import DashboardCard from '../../components/DashboardCard.jsx';
import {
  DashboardIcon,
  ExamManagementIcon,
  SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
} from '../../components/icons/SidebarIcons.jsx';
import { ConfigProvider, Table, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ExamManagementPage from '../exam/ExamManagementPage.jsx';
import CreateExamPage from '../exam/CreateExamPage.jsx';
import ExamDetailPage from '../exam/ExamDetailPage.jsx';
import UploadExamPaperPage from '../exam-paper/UploadExamPaperPage.jsx';
import BlockDetailPage from '../block/BlockDetailPage.jsx';
import BlockSubmissionsPage from '../submission/BlockSubmissionsPage.jsx';
import SubmissionDetailPage from '../submission/SubmissionDetailPage.jsx';
import ExamStaffHomeDashboard from './ExamStaffHomeDashboard.jsx';

const icons = [
  DashboardIcon,
  ExamManagementIcon,
  SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
];

export default function ExamStaffDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId, blockId, submissionId } = useParams();
  const [notifCount] = useState(5);

  const pathSelectedIndexMap = {
    '/exam-staff': 1,
    '/exam-staff/exams': 2,
    '/exam-staff/exams/create': 2,
    '/exam-staff/submissions': 3,
    '/exam-staff/appeals': 4,
    '/exam-staff/audits': 5,
  };

  const selectedIndex = location.pathname.startsWith('/exam-staff/exams')
    ? 2
    : location.pathname.startsWith('/exam-staff/audits')
      ? 5
      : (pathSelectedIndexMap[location.pathname] ?? 1);

  const isExamManagementPage = location.pathname === '/exam-staff/exams';
  const isCreateExamPage = location.pathname === '/exam-staff/exams/create';
  const isUpdateExamPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.endsWith('/edit');
  const isUploadExamPaperPage = location.pathname.includes('/upload-paper');
  const isBlockSubmissionsPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    location.pathname.endsWith('/submissions');
  const isSubmissionDetailPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    /\/submissions\/[^/]+$/.test(location.pathname);
  const isBlockDetailPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    !isUploadExamPaperPage &&
    !isBlockSubmissionsPage &&
    !isSubmissionDetailPage;
  const isExamDetailPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    !isCreateExamPage &&
    !isUpdateExamPage &&
    !isUploadExamPaperPage &&
    !isBlockDetailPage;

  const renderedSiderIcons = icons.map((item, index) => {
    const isActive = index + 1 === selectedIndex;
    const color = isActive ? '#F37021' : '#ffffff';
    return item({ fill: color });
  });

  return (
    <MainLayout
      siderIcons={renderedSiderIcons}
      siderItems={STAFF_SIDEBAR_ITEMS}
      notifCount={notifCount}
      actionBtn={({ collapsed }) => {
        return (
          <Button
            type="primary"
            size="large"
            onClick={() => navigate('/exam-staff/exams/create')}
            icon={
              <PlusOutlined
                style={{
                  fontSize: '16px',
                  strokeWidth: '30',
                  stroke: 'white',
                }}
              />
            }
            className="w-full bg-[#F37021] 
            text-white hover:bg-[#F37021]/90 
            py-3 rounded-md text-sm font-bold 
            transition-all flex items-center 
            justify-center gap-2 shadow-lg 
            shadow-[#F37021]/20"
          >
            {collapsed ? '' : 'Tạo kỳ thi mới'}
          </Button>
        );
      }}
    >
      {isCreateExamPage ? (
        <CreateExamPage
          onGoDashboard={() => navigate('/exam-staff')}
          onGoExamManagement={() => navigate('/exam-staff/exams')}
          onGoCreatedExamDetail={(id) => navigate(`/exam-staff/exams/${id}`)}
          onCancel={() => navigate('/exam-staff/exams')}
        />
      ) : isUpdateExamPage ? (
        <CreateExamPage
          examIdToEdit={examId}
          onGoDashboard={() => navigate('/exam-staff')}
          onGoExamManagement={() => navigate('/exam-staff/exams')}
          onGoExamDetail={() => navigate(`/exam-staff/exams/${examId}`)}
          onCancel={() => navigate(`/exam-staff/exams/${examId}`)}
        />
      ) : isUploadExamPaperPage ? (
        <UploadExamPaperPage
          examId={examId}
          blockId={blockId}
          onBack={() => navigate(`/exam-staff/exams/${examId}/blocks/${blockId}`)}
        />
      ) : isBlockSubmissionsPage ? (
        <BlockSubmissionsPage
          examId={examId}
          blockId={blockId}
          onBack={() => navigate(`/exam-staff/exams/${examId}/blocks/${blockId}`)}
        />
      ) : isSubmissionDetailPage ? (
        <SubmissionDetailPage
          examId={examId}
          blockId={blockId}
          submissionId={submissionId}
          onBack={() =>
            navigate(
              `/exam-staff/exams/${examId}/blocks/${blockId}/submissions`,
            )
          }
        />
      ) : isBlockDetailPage ? (
        <BlockDetailPage
          examId={examId}
          blockId={blockId}
          onBack={() => navigate(`/exam-staff/exams/${examId}`)}
          onOpenUploadPaper={(id) =>
            navigate(`/exam-staff/exams/${examId}/blocks/${id}/upload-paper`)
          }
          onOpenSubmissions={(id) =>
            navigate(`/exam-staff/exams/${examId}/blocks/${id}/submissions`)
          }
        />
      ) : isExamDetailPage ? (
        <ExamDetailPage
          examId={examId}
          onBack={() => navigate('/exam-staff/exams')}
          onEdit={() => navigate(`/exam-staff/exams/${examId}/edit`)}
          onOpenBlockDetail={(targetBlockId) =>
            navigate(`/exam-staff/exams/${examId}/blocks/${targetBlockId}`)
          }
        />
      ) : isExamManagementPage ? (
        <ExamManagementPage
          onCreateExam={() => navigate('/exam-staff/exams/create')}
          onOpenExamDetail={(id) => navigate(`/exam-staff/exams/${id}`)}
        />
      ) : (
        <ExamStaffHomeDashboard />
      )}
    </MainLayout>
  );
}
