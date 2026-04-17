import React, { Suspense, lazy, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layouts/MainLayout.jsx';
import { STAFF_ICONS, STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems.jsx';
import DashboardCard from '../../components/DashboardCard.jsx';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils.jsx';
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
import ExamStaffNotificationsPage from './notifications/ExamStaffNotificationsPage.jsx';

const BlockStatisticsPage = lazy(() => import('./statistics/BlockStatisticsPage.jsx'));

export default function ExamStaffDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId, blockId, submissionId } = useParams();
  const [notifCount] = useState(5);

  const dashboardIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff') + 1;
  const examsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/exams') + 1;
  const appealsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/appeals') +
    1;
  const withdrawalsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/withdrawals') +
    1;
  const notificationsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/notifications') +
    1;
  const auditsIndex =
    STAFF_SIDEBAR_ITEMS.findIndex((item) => item.to === '/exam-staff/audits') +
    1;

  const pathSelectedIndexMap = {
    '/exam-staff': dashboardIndex,
    '/exam-staff/exams': examsIndex,
    '/exam-staff/exams/create': examsIndex,
    '/exam-staff/appeals': appealsIndex,
    '/exam-staff/withdrawals': withdrawalsIndex,
    '/exam-staff/notifications': notificationsIndex,
    '/exam-staff/audits': auditsIndex,
  };

  const selectedIndex = location.pathname.startsWith('/exam-staff/exams')
    ? examsIndex
    : location.pathname.startsWith('/exam-staff/withdrawals')
      ? withdrawalsIndex
      : location.pathname.startsWith('/exam-staff/audits')
        ? auditsIndex
        : (pathSelectedIndexMap[location.pathname] ?? dashboardIndex);

  const isExamManagementPage = location.pathname === '/exam-staff/exams';
  const isNotificationsPage = location.pathname === '/exam-staff/notifications';
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
  const isStatisticsPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    location.pathname.endsWith('/statistics');
  const isBlockDetailPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    location.pathname.includes('/blocks/') &&
    !isUploadExamPaperPage &&
    !isBlockSubmissionsPage &&
    !isSubmissionDetailPage &&
    !isStatisticsPage;
  const isExamDetailPage =
    location.pathname.startsWith('/exam-staff/exams/') &&
    !isCreateExamPage &&
    !isUpdateExamPage &&
    !isUploadExamPaperPage &&
    !isBlockDetailPage;

  const renderedSiderIcons = renderSiderIconsMaterialSymbol({
    icons: STAFF_ICONS,
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
      ) : isStatisticsPage ? (
        <Suspense
          fallback={
            <div className="max-w-6xl mx-auto px-6 sm:px-8 py-8 space-y-4 animate-pulse">
              <div className="h-8 w-40 bg-slate-200 rounded-lg" />
              <div className="h-28 bg-slate-100 rounded-3xl" />
              <div className="h-96 bg-slate-100 rounded-3xl" />
            </div>
          }
        >
          <BlockStatisticsPage
            examId={examId}
            blockId={blockId}
            onBack={() => navigate(`/exam-staff/exams/${examId}/blocks/${blockId}`)}
          />
        </Suspense>
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
          onOpenStatistics={(id) =>
            navigate(`/exam-staff/exams/${examId}/blocks/${id}/statistics`)
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
      ) : isNotificationsPage ? (
        <ExamStaffNotificationsPage />
      ) : (
        <ExamStaffHomeDashboard />
      )}
    </MainLayout>
  );
}
