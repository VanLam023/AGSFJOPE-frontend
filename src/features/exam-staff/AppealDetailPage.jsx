import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import viVN from 'antd/locale/vi_VN';
import {
  ConfigProvider,
  Spin,
  Button,
  message,
  Select,
  DatePicker,
  Form,
  Checkbox,
} from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import MainLayout from '../../components/layouts/MainLayout';
import Modal from '../../components/Modal.jsx';
import { STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems';
import {
  DashboardIcon,
  ExamManagementIcon,
  SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
} from '../../components/icons/SidebarIcons.jsx';
import { appealStatusConfig } from './config.jsx';
import { useStaffAppealDetail, useStaffAppealLecturers } from '../../hooks';
import {
  formatDateTime,
  formatScore,
  renderPaymentStatusPill,
} from '../../components/utils/Utils';
import { assignStaffAppeal, confirmStaffAppeal } from '../../services/staffApi';

dayjs.locale('vi');

const icons = [
  DashboardIcon,
  ExamManagementIcon,
  SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
];

const AppealDetailPage = () => {
  const navigate = useNavigate();
  const { appealId } = useParams();

  const { fetchStaffAppealDetail, data, loading, error } =
    useStaffAppealDetail();
  const {
    fetchLecturers,
    lecturers,
    loading: lecturersLoading,
  } = useStaffAppealLecturers();

  const [assignForm] = Form.useForm();
  const [confirmForm] = Form.useForm();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);

  const renderedSiderIcons = icons.map((item, index) => {
    const isActive = index + 1 === 4;
    const color = isActive ? '#F37021' : '#ffffff';
    return item({ fill: color });
  });
  useEffect(() => {
    if (!appealId) return;
    fetchStaffAppealDetail(appealId).catch(() => {
      message.error('Không tải được chi tiết phúc khảo.');
    });
  }, [appealId]);

  const status = data?.status;
  const statusCfg = appealStatusConfig[status] ?? appealStatusConfig.PENDING;
  // const canAssign = status === 'PENDING';
  // const canConfirm = status === 'COMPLETED';
  const canAssign = true;
  const canConfirm = true;

  const lecturerOptions = useMemo(
    () =>
      lecturers.map((l) => ({
        value: l.lecturerId,
        label: `${l.fullName ?? '—'} (đang xử lý: ${l.activeAppealCount ?? 0})`,
      })),
    [lecturers],
  );

  const openAssignModal = () => {
    assignForm.resetFields();
    setAssignModalOpen(true);
    fetchLecturers().catch(() => {
      message.error('Không tải được danh sách giảng viên.');
    });
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    assignForm.resetFields();
  };

  const handleAssignFinish = async ({ lecturerId, deadlineAt }) => {
    if (!appealId) return;
    setAssignSubmitting(true);
    try {
      const res = await assignStaffAppeal(appealId, {
        lecturerId,
        deadlineAt: deadlineAt.toISOString(),
      });
      message.success(
        res?.message ||
          'Phân công giảng viên thành công. Đơn phúc khảo đang được xử lý.',
      );
      closeAssignModal();
      await fetchStaffAppealDetail(appealId);
    } catch (e) {
      message.error(
        e?.response?.data?.message
          .replace('PENDING', 'Đang chờ')
          .replace('APPROVED', 'Đã phân công') || 'Phân công thất bại.',
      );
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleConfirm = async (isApprove) => {
    if (!appealId) return;
    setConfirmSubmitting(true);
    try {
      const res = await confirmStaffAppeal(appealId, { isApprove });
      message.success(
        res?.message ||
          (isApprove
            ? 'Đã duyệt và cập nhật điểm chính thức.'
            : 'Đã từ chối đơn phúc khảo, giữ nguyên điểm gốc.'),
      );
      setConfirmModalOpen(false);
      confirmForm.resetFields();
      await fetchStaffAppealDetail(appealId);
    } catch (e) {
      message.error(
        e?.response?.data?.message
          .replace('(COMPLETED)', 'Hoàn tất')
          .replace('APPROVED', 'Đã phân công')
          .replace() || 'Xác nhận kết quả thất bại.',
      );
    } finally {
      setConfirmSubmitting(false);
    }
  };

  return (
    <MainLayout
      siderIcons={renderedSiderIcons}
      siderItems={STAFF_SIDEBAR_ITEMS}
    >
      <ConfigProvider
        locale={viVN}
        theme={{
          components: {
            Button: { colorPrimary: '#F37021' },
          },
        }}
      >
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <button
                  type="button"
                  className="hover:text-[#F37021] cursor-pointer bg-transparent border-0 p-0 font-inherit"
                  onClick={() => navigate('/exam-staff/appeals')}
                >
                  Đơn phúc khảo
                </button>
                <span>/</span>
                <span className="text-slate-800 font-medium">Chi tiết</span>
              </div>
              <div className="flex gap-2">
                {canAssign && (
                  <Button
                    type="primary"
                    size="medium"
                    onClick={openAssignModal}
                  >
                    Phân công giảng viên
                  </Button>
                )}
                {canConfirm && (
                  <Button
                    type="primary"
                    size="medium"
                    onClick={() => {
                      confirmForm.resetFields();
                      setConfirmModalOpen(true);
                    }}
                  >
                    Xác nhận kết quả
                  </Button>
                )}
              </div>
            </div>

            <Spin spinning={loading}>
              {error && !loading && (
                <p className="text-sm text-red-600">
                  Không tải được dữ liệu.{' '}
                  <button
                    type="button"
                    className="text-[#F37021] font-semibold underline"
                    onClick={() => navigate('/exam-staff/appeals')}
                  >
                    Quay lại danh sách
                  </button>
                </p>
              )}

              {data && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-5 flex flex-col gap-2">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                        <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                        Thông tin chung
                      </h2>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Họ và tên
                          </p>
                          <div className="text-sm text-slate-800 break-words font-medium">
                            {data.studentName ?? '—'}
                          </div>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Trạng thái:
                          </p>
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${statusCfg.cls}`}
                            >
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            MSSV
                          </p>
                          <div className="text-sm font-mono text-slate-800 break-words font-medium">
                            {data.studentMssv ?? '—'}
                          </div>
                        </div>

                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Email
                          </p>
                          <div className="text-sm text-slate-800 break-words font-medium">
                            {data.studentEmail ?? '—'}
                          </div>
                        </div>

                        <div className="col-span-2 pt-4 border-t border-slate-100">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="flex items-baseline gap-1">
                              <div className="text-[11px] text-nowrap font-bold uppercase tracking-wider text-slate-400">
                                Kỳ thi
                              </div>
                              <div className="text-sm text-nowrap text-slate-800 break-words font-medium">
                                {data.examName ?? '—'}
                              </div>
                            </div>
                            <div className="flex items-baseline gap-1 relative left-3">
                              <div className="text-[11px] text-nowrap  font-bold uppercase tracking-wider text-slate-400">
                                Học kỳ
                              </div>
                              <div className="text-sm text-nowrap  text-slate-800 break-words font-medium">
                                {data.semester ?? '—'}
                              </div>
                            </div>
                            <div className="flex items-baseline gap-1 relative right-10">
                              <div className="text-[11px] text-nowrap  font-bold uppercase tracking-wider text-slate-400">
                                Block
                              </div>
                              <div className="text-sm text-nowrap  text-slate-800 break-words font-medium">
                                {data.blockName ?? '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                        <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                        Phân công
                      </h2>
                      {data.assignedLecturerName ||
                      data.assignedLecturerEmail ||
                      data.assignedAt ? (
                        <div className="grid grid-cols-2 gap-y-3">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Giảng viên
                            </p>
                            <div className="text-sm text-slate-800 break-words font-medium">
                              {data.assignedLecturerName ?? '—'}
                            </div>
                            <div className="text-xs text-slate-500 m-0">
                              {data.assignedLecturerEmail ?? '—'}
                            </div>
                          </div>

                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Thời điểm phân công
                            </p>
                            <div className="text-sm text-slate-800 break-words font-medium">
                              {formatDateTime(data.assignedAt)}
                            </div>
                          </div>

                          <div className="col-span-2 flex items-baseline">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                              Hạn chót:
                            </p>
                            <div className="text-sm pl-2 text-slate-800 break-words font-medium">
                              {formatDateTime(data.deadlineAt)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 m-0">
                          Chưa phân công giảng viên.
                        </p>
                      )}
                    </div>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                        <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                        Thanh toán
                      </h2>
                      <div className="grid grid-cols-2">
                        <div className="flex items-baseline gap-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Trạng thái:
                          </p>
                          <div className="flex items-center gap-1 flex-wrap">
                            {renderPaymentStatusPill(data.paymentStatus)}
                          </div>
                        </div>
                        <div className="flex gap-1 items-baseline">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            Lúc:
                          </p>
                          <div className="text-sm text-slate-800 break-words font-medium">
                            {formatDateTime(data.paidAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-7 flex flex-col min-h-fit max-h-96">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col flex-1 min-h-0">
                      <h2 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4 shrink-0">
                        <span className="w-1 h-5 rounded-sm bg-[#F37021]" />
                        Lý do phúc khảo
                      </h2>
                      <div className="flex-1 min-h-0 rounded-md bg-slate-50/80 border border-slate-100 p-4">
                        <p className="text-sm text-slate-800 whitespace-pre-wrap m-0">
                          {data.reason?.trim() ? data.reason : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loading && !data && !error && appealId && (
                <p className="text-sm text-slate-500">Không có dữ liệu.</p>
              )}
            </Spin>
          </div>
        </div>

        <Modal
          isOpen={assignModalOpen}
          onClose={closeAssignModal}
        >
          <div className="w-[520px] max-w-[90vw]">
            <h3 className="text-base font-bold text-slate-800 m-0 mb-1">
              Phân công giảng viên
            </h3>
            <p className="text-sm text-slate-500 m-0 mb-4">
              Chọn giảng viên và thời hạn chấm cho đơn phúc khảo này.
            </p>
            <Form
              form={assignForm}
              layout="vertical"
              className="space-y-0"
              onFinish={handleAssignFinish}
              requiredMark={false}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Form.Item
                name="lecturerId"
                label="Giảng viên"
                rules={[
                  { required: true, message: 'Vui lòng chọn giảng viên.' },
                ]}
              >
                <Select
                  className="w-full"
                  size="middle"
                  placeholder="Chọn giảng viên"
                  loading={lecturersLoading}
                  showSearch
                  optionFilterProp="label"
                  options={lecturerOptions}
                  allowClear
                />
              </Form.Item>
              <Form.Item
                name="deadlineAt"
                label="Hạn chấm"
                rules={[
                  { required: true, message: 'Vui lòng chọn hạn chấm.' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (value.isBefore(dayjs())) {
                        return Promise.reject(
                          new Error('Hạn chấm không được ở quá khứ.'),
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker
                  showTime
                  className="w-full"
                  format="DD/MM/YYYY HH:mm"
                  disabledDate={(current) =>
                    current && current.isBefore(dayjs().startOf('day'))
                  }
                />
              </Form.Item>
              <Form.Item shouldUpdate>
                {() => {
                  const lecturerId = assignForm.getFieldValue('lecturerId');
                  const deadlineAt = assignForm.getFieldValue('deadlineAt');
                  const hasFieldErrors = assignForm
                    .getFieldsError()
                    .some(
                      (f) =>
                        (f.name?.[0] === 'lecturerId' ||
                          f.name?.[0] === 'deadlineAt') &&
                        (f.errors?.length ?? 0) > 0,
                    );
                  const incomplete =
                    lecturerId === undefined ||
                    lecturerId === null ||
                    lecturerId === '' ||
                    deadlineAt === undefined ||
                    deadlineAt === null;
                  const pastDeadline =
                    deadlineAt && dayjs(deadlineAt).isBefore(dayjs());
                  const assignPrimaryDisabled =
                    assignSubmitting ||
                    incomplete ||
                    pastDeadline ||
                    hasFieldErrors;
                  return (
                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button onClick={closeAssignModal}>Hủy</Button>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={assignSubmitting}
                        disabled={assignPrimaryDisabled}
                      >
                        Xác nhận phân công
                      </Button>
                    </div>
                  );
                }}
              </Form.Item>
            </Form>
          </div>
        </Modal>

        <Modal
          isOpen={confirmModalOpen}
          onClose={() => {
            if (confirmSubmitting) return;
            setConfirmModalOpen(false);
            confirmForm.resetFields();
          }}
        >
          <div className="w-[560px] max-w-[90vw]">
            <Form
              form={confirmForm}
              layout="vertical"
              className="space-y-0"
              requiredMark={false}
              validateTrigger={['onChange', 'onBlur']}
            >
              <h3 className="text-base font-bold text-slate-800 m-0 mb-1">
                Xác nhận kết quả phúc khảo
              </h3>
              {/* <p className="text-sm text-slate-500 m-0 mb-4">
                Duyệt để áp dụng điểm mới; từ chối để giữ điểm gốc.
              </p> */}
              <div className="rounded-sm border border-slate-200 bg-white overflow-hidden mb-4">
                <div className="grid grid-cols-2">
                  <div className="px-4 py-3 text-sm font-semibold text-slate-500 border-b border-slate-200">
                    Điểm cũ
                  </div>
                  <div className="px-4 py-3 text-sm font-semibold text-slate-500 border-b border-l border-slate-200">
                    Điểm sau phúc khảo
                  </div>
                  <div className="px-4 py-3 text-lg font-semibold tabular-nums text-slate-800">
                    {formatScore(data?.originalScore)}
                  </div>
                  <div className="px-4 py-3 text-lg font-semibold tabular-nums text-slate-800 border-l border-slate-200">
                    {formatScore(data?.newScore)}
                  </div>
                </div>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 pt-4">
                Nhận xét giảng viên
              </p>
              <div className="rounded-md border border-slate-200 bg-slate-100 px-2 py-2 text-sm mb-4">
                <div>
                  <p className="text-slate-800 whitespace-pre-wrap m-0">
                    {data?.lecturerComment?.trim() ? data.lecturerComment : '—'}
                  </p>
                </div>
              </div>
              {/* <Form.Item
                name="acknowledge"
                valuePropName="checked"
                className="mb-4"
                rules={[
                  {
                    validator: (_, checked) =>
                      checked
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              'Vui lòng xác nhận đã xem đủ thông tin trước khi quyết định.',
                            ),
                          ),
                  },
                ]}
              >
                <Checkbox>
                  Tôi đã xem xét đủ điểm số và nhận xét của giảng viên.
                </Checkbox>
              </Form.Item> */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <Button
                  onClick={() => {
                    setConfirmModalOpen(false);
                    confirmForm.resetFields();
                  }}
                  disabled={confirmSubmitting}
                >
                  Hủy
                </Button>
                <Button
                  danger
                  loading={confirmSubmitting}
                  onClick={() => handleConfirm(false)}
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  loading={confirmSubmitting}
                  onClick={() => handleConfirm(true)}
                >
                  Duyệt
                </Button>
              </div>
              {/* <Form.Item shouldUpdate>
                {() => {
                  const acknowledged = confirmForm.getFieldValue('acknowledge');
                  const ackInvalid =
                    (confirmForm
                      .getFieldsError()
                      .find((f) => f.name?.[0] === 'acknowledge')?.errors
                      ?.length ?? 0) > 0;
                  const confirmActionsDisabled =
                    confirmSubmitting || !acknowledged || ackInvalid;
                  return (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      <Button
                        onClick={() => {
                          setConfirmModalOpen(false);
                          confirmForm.resetFields();
                        }}
                        disabled={confirmSubmitting}
                      >
                        Hủy
                      </Button>
                      <Button
                        danger
                        loading={confirmSubmitting}
                        disabled={confirmActionsDisabled}
                        onClick={() => handleConfirm(false)}
                      >
                        Từ chối
                      </Button>
                      <Button
                        type="primary"
                        loading={confirmSubmitting}
                        disabled={confirmActionsDisabled}
                        onClick={() => handleConfirm(true)}
                      >
                        Duyệt
                      </Button>
                    </div>
                  );
                }}
              </Form.Item> */}
            </Form>
          </div>
        </Modal>
      </ConfigProvider>
    </MainLayout>
  );
};

export default AppealDetailPage;
