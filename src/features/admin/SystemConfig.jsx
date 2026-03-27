import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils';
import {
  Button,
  ConfigProvider,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Select,
} from 'antd';
import CardContainer from '../../components/CardContainer';
import { renderBooleanPill } from '../../components/utils/Utils';
import {
  useGetSystemConfig,
  useGetSystemGradingModes,
  useUpdateSystemConfig,
} from '../../hooks';

const SystemConfig = () => {
  const [notifCount] = useState(5);
  const [form] = Form.useForm();
  const [validationError, setValidationError] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const {
    callGetSystemConfigEndpoint,
    config,
    loading: getSystemConfigLoading,
  } = useGetSystemConfig();

  const {
    callGetSystemGradingModesEndpoint,
    data: gradingModesResponse,
    loading: getGradingModesLoading,
  } = useGetSystemGradingModes();
  const { callUpdateSystemConfigEndpoint, loading: updateSystemConfigLoading } =
    useUpdateSystemConfig();

  const isFptEmail = (value) => {
    return value.endsWith('@fpt.edu.vn');
  };

  useEffect(() => {
    callGetSystemConfigEndpoint();
    callGetSystemGradingModesEndpoint();
  }, []);

  const gradingModes = useMemo(() => {
    return gradingModesResponse?.modes ?? [];
  }, [gradingModesResponse]);

  useEffect(() => {
    const systemData = config ?? null;
    const defaultModeFromModes = gradingModesResponse?.defaultMode;

    if (!systemData && !defaultModeFromModes) return;
    form.setFieldsValue({
      maxUploadSizeMb: systemData?.maxUploadSizeMb,
      maxExamPaperMb: systemData?.maxExamPaperMb,
      smtpHost: systemData?.smtpHost,
      smtpPort: systemData?.smtpPort,
      smtpUsername: systemData?.smtpUsername,
      smtpPassword: '',
      smtpFromEmail: systemData?.smtpFromEmail,
      defaultGradingMode:
        systemData?.defaultGradingMode ?? defaultModeFromModes,
    });
  }, [config, gradingModesResponse, form]);

  const handleCancel = () => {
    const systemData = config?.data ?? null;
    const defaultModeFromModes = gradingModesResponse?.data?.defaultMode;
    form.setFieldsValue({
      maxUploadSizeMb: systemData?.maxUploadSizeMb,
      maxExamPaperMb: systemData?.maxExamPaperMb,
      smtpHost: systemData?.smtpHost,
      smtpPort: systemData?.smtpPort,
      smtpUsername: systemData?.smtpUsername,
      smtpPassword: '',
      smtpFromEmail: systemData?.smtpFromEmail,
      defaultGradingMode:
        systemData?.defaultGradingMode ?? defaultModeFromModes,
    });
    setValidationError(false);
  };

  const handleEdit = async () => {
    const payload = Object.fromEntries(
      Object.entries(form.getFieldsValue()).map(([key, value]) => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ]),
    );

    try {
      const res = await callUpdateSystemConfigEndpoint(payload);
      message.success(res.message.split(':')[1]);
      setIsEdit(false);
      setValidationError(false);
      callGetSystemConfigEndpoint();
      callGetSystemGradingModesEndpoint();
    } catch (err) {
      message.error(
        err?.response?.message || 'Cập nhật cấu hình hệ thống thất bại.',
      );
    }
  };

  const selectedMode = Form.useWatch('defaultGradingMode', form);

  const selectedModeObj = useMemo(() => {
    return gradingModes.find((m) => m.mode === selectedMode) ?? null;
  }, [gradingModes, selectedMode]);

  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) =>
        collapsed ? ADMIN_SIDEBAR_ITEMS_FLAT : ADMIN_SIDEBAR_ITEMS
      }
      notifCount={notifCount}
    >
      <ConfigProvider
        theme={{
          components: {
            Button: { colorPrimary: '#F37021' },
            InputNumber: {
              controlWidth: '60px',
            },
          },
        }}
      >
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <CardContainer>
            <div className="px-4 py-3">
              <div className="flex gap-2 items-center mb-2">
                <span className="material-symbols-outlined text-[#F37021] text-2xl">
                  settings
                </span>
                <h1 className="text-xl font-semibold">Cấu hình hệ thống</h1>
              </div>

              <Form
                form={form}
                layout="vertical"
                disabled={
                  !isEdit ||
                  getSystemConfigLoading ||
                  getGradingModesLoading ||
                  updateSystemConfigLoading
                }
                onFieldsChange={() => {
                  const errors = form.getFieldsError();
                  const hasErrors = errors.some(
                    (field) => field.errors.length !== 0,
                  );
                  setValidationError(hasErrors);
                }}
                className="-space-y-2"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="p-2">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="px-2 py-2 rounded-md bg-[#F37120]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#F37120]">
                          upload_file
                        </span>
                      </div>
                      <h2 className="font-semibold text-lg">
                        Giới hạn file tải lên
                      </h2>
                    </div>

                    <div className="flex flex-col">
                      <Form.Item
                        colon={false}
                        className="mb-3"
                      >
                        <div className="flex items-center gap-3">
                          <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                            Dung lượng bài làm tối đa (MB):
                          </label>
                          <Form.Item
                            name="maxUploadSizeMb"
                            rules={[
                              {
                                required: true,
                                message: 'Không được để trống',
                              },
                              {
                                validator: (_, value) => {
                                  if (Number(value) >= 1)
                                    return Promise.resolve();
                                  return Promise.reject(
                                    new Error(
                                      'Giá trị phải lớn hơn hoặc bằng 1',
                                    ),
                                  );
                                },
                              },
                            ]}
                            noStyle
                          >
                            <Input
                              className="w-[100px]"
                              type="number"
                              controls={false}
                              placeholder="VD: 20"
                            />
                          </Form.Item>
                          <span className="text-xs relative -left-2">MB</span>
                        </div>
                      </Form.Item>

                      <Form.Item colon={false}>
                        <div className="flex items-center gap-3">
                          <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                            Dung lượng đề thi tối đa (MB):
                          </label>
                          <Form.Item
                            controls={false}
                            name="maxExamPaperMb"
                            rules={[
                              {
                                required: true,
                                message: 'Không được để trống',
                              },
                              {
                                validator: (_, value) => {
                                  if (Number(value) >= 1)
                                    return Promise.resolve();
                                  return Promise.reject(
                                    new Error(
                                      'Giá trị phải lớn hơn hoặc bằng 1',
                                    ),
                                  );
                                },
                              },
                            ]}
                            noStyle
                          >
                            <Input
                              className="w-[100px]"
                              type="number"
                              controls={false}
                              placeholder="VD: 20"
                            />
                          </Form.Item>

                          <span className="text-xs relative -left-2">MB</span>
                        </div>
                      </Form.Item>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3  ">
                      <div className="px-2 py-2 rounded-md bg-[#16A34A]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#16A34A]">
                          mail
                        </span>
                      </div>
                      <h2 className="font-semibold text-lg ">
                        Thiết lập Email (SMTP)
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-1">
                      <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          SMTP Host
                        </label>
                        <Form.Item
                          name="smtpHost"
                          rules={[
                            { required: true, message: 'Không được để trống' },
                            {
                              validator: (_, value) => {
                                if (!value) return Promise.resolve();
                                const domainRegex =
                                  /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
                                const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
                                if (
                                  domainRegex.test(value) ||
                                  ipRegex.test(value)
                                ) {
                                  return Promise.resolve();
                                }
                                return Promise.reject(
                                  new Error('SMTP Host không hợp lệ'),
                                );
                              },
                            },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                      </div>
                      <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          Port
                        </label>
                        <Form.Item
                          name="smtpPort"
                          rules={[
                            { required: true, message: 'Không được để trống' },
                            {
                              validator: (_, value) => {
                                if (!value) return Promise.resolve();
                                if (
                                  /^\d+$/.test(String(value)) &&
                                  Number(value) >= 1 &&
                                  Number(value) <= 65535
                                )
                                  return Promise.resolve();
                                return Promise.reject(
                                  new Error(
                                    'Port phải trong khoảng từ 1 đến 65535',
                                  ),
                                );
                              },
                            },
                          ]}
                        >
                          <Input
                            className="w-full"
                            controls={false}
                            placeholder="VD: 587"
                          />
                        </Form.Item>
                      </div>
                      <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          SMTP Username
                        </label>
                        <Form.Item
                          name="smtpUsername"
                          rules={[
                            { required: true, message: 'Không được để trống' },
                            // {
                            //   validator: (_, value) => {
                            //     if (!value) return Promise.resolve();
                            //     if (isFptEmail(value)) return Promise.resolve();
                            //     return Promise.reject(
                            //       new Error(
                            //         'SMTP Username phải là email @fpt.edu.vn',
                            //       ),
                            //     );
                            //   },
                            // },
                          ]}
                        >
                          <Input />
                        </Form.Item>
                      </div>
                      <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          SMTP Password
                        </label>
                        <Form.Item
                          name="smtpPassword"
                          rules={[
                            // { required: true, message: 'Không được để trống' },
                          ]}
                        >
                          <Input.Password />
                        </Form.Item>
                      </div>
                      <div>
                        <label className="min-w-[180px] text-xs font-semibold text-slate-500">
                          Email gửi đi
                        </label>
                        <Form.Item
                          name="smtpFromEmail"
                          rules={[
                            { required: true, message: 'Không được để trống' },
                            {
                              type: 'email',
                              message: 'Email không đúng định dạng',
                            },
                          ]}
                        >
                          <Input placeholder="VD: noreply@domain.com" />
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                </div>

                <Divider className="my-1" />

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-2 py-2 rounded-md bg-[#2563EB]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#2563EB]">
                        rule_settings
                      </span>
                    </div>
                    <h2 className="font-semibold text-lg ">
                      Cấu hình chế độ chấm
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    <div>
                      <div className="flex gap-2">
                        <label className="text-base font-semibold text-slate-500">
                          Chế độ chấm hiện tại:
                        </label>
                        <Form.Item
                          name="defaultGradingMode"
                          rules={[
                            { required: true, message: 'Không được để trống' },
                          ]}
                        >
                          <Select
                            className="relative flex flex-1 min-w-[340px]"
                            placeholder="Chọn grading mode"
                            options={gradingModes.map((m) => ({
                              value: m.mode,
                              label: `${m.displayName} (${m.mode})`,
                            }))}
                          />
                        </Form.Item>
                      </div>

                      <div className="-mt-2 rounded-md border w-fit border-slate-200 bg-white p-3">
                        <div className="flex gap-1 items-baseline">
                          <h4 className="text-xs font-semibold text-slate-500">
                            Chế độ:
                          </h4>
                          <span className="text-sm font-semibold text-slate-900">
                            {selectedModeObj?.mode ?? '—'}
                          </span>
                        </div>
                        <div className="flex gap-1 items-baseline">
                          <h4 className="text-xs font-semibold text-slate-500 mt-2">
                            Tên hiển thị:
                          </h4>
                          <span className="text-sm text-slate-800">
                            {selectedModeObj?.displayName ?? '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md bg-slate-50 border border-slate-200 p-4">
                      <div className="font-semibold mb-2">Chi tiết</div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex gap-1 items-baseline">
                          <div className="text-xs font-semibold text-slate-500">
                            Trọng số Test Case
                          </div>
                          <div className="text-sm text-slate-900">
                            {selectedModeObj?.testCaseWeight ?? '—'}
                          </div>
                        </div>

                        <div className="flex gap-1 items-baseline">
                          <div className="text-xs font-semibold text-slate-500">
                            Trọng số OOP
                          </div>
                          <div className="text-sm text-slate-900">
                            {selectedModeObj?.oopWeight ?? '—'}
                          </div>
                        </div>

                        <div className="flex gap-1 items-baseline">
                          <div className="text-xs font-semibold text-slate-500">
                            Chỉ nhận xét OOP
                          </div>
                          <div className="text-sm text-slate-900">
                            {renderBooleanPill(
                              selectedModeObj?.oopCommentOnly,
                              {
                                trueText: 'Có',
                                falseText: 'Không',
                              },
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1 items-baseline">
                          <div className="text-xs font-semibold text-slate-500">
                            Đánh rớt nếu Test Case 0đ
                          </div>
                          <div className="text-sm text-slate-900">
                            {renderBooleanPill(
                              selectedModeObj?.failIfZeroTestCase,
                              {
                                trueText: 'Có',
                                falseText: 'Không',
                              },
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 items-baseline">
                          <div className="text-xs font-semibold text-slate-500">
                            Đánh rớt nếu vi phạm OOP
                          </div>
                          <div className="text-sm text-slate-900">
                            {renderBooleanPill(
                              selectedModeObj?.failIfOopViolated,
                              {
                                trueText: 'Có',
                                falseText: 'Không',
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 px-4 pt-1 pb-3">
                  {isEdit ? (
                    <>
                      <Button
                        size="large"
                        onClick={() => {
                          setIsEdit(false);
                          handleCancel();
                        }}
                      >
                        Hủy
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        disabled={validationError}
                        loading={updateSystemConfigLoading}
                        onClick={handleEdit}
                      >
                        Lưu cấu hình
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="primary"
                      size="large"
                      disabled={false}
                      onClick={() => {
                        setIsEdit(true);
                      }}
                    >
                      Cập nhật cấu hình
                    </Button>
                  )}
                </div>
              </Form>
            </div>
          </CardContainer>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default SystemConfig;
