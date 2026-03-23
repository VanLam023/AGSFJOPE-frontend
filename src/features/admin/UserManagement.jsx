import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../app/context/authContext';
import {
  DashboardIcon,
  AIConfigurationIcon,
  AdvanceSettingsIcon,
  ExamManagementIcon,
  GradingSettingIcon,
  PayOSConfigIcon,
  RoleManagementIcon,
  UserManagementIcon,
} from '../../components/icons/SidebarIcons.jsx';
import {
  DownloadOutlined,
  PlusOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import {
  message,
  ConfigProvider,
  Table,
  Button,
  Input,
  Select,
  Upload,
  Empty,
  Tabs,
  Form,
} from 'antd';
import {
  renderSiderIconsMaterialSymbol,
  renderRolePill,
  renderStatusPill,
} from '../../components/utils/Utils';
import MainLayout from '../../components/layouts/MainLayout';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { allRoles, allStatus } from './test.jsx';
import Modal from '../../components/Modal.jsx';
import {
  useImportExcel,
  useGetUsers,
  useDebounce,
  useCreateUser,
} from '../../hooks';
import emptyImg from '../../assets/empty.png';

const rolesMap = new Map([
  ['STUDENT', 'Sinh viên'],
  ['LECTURER', 'Giảng viên'],
  ['EXAM_STAFF', 'Cán bộ khảo thí'],
  ['SYSTEM_ADMIN', 'Quản trị viên'],
]);

const UserManagement = () => {
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [notifCount] = useState(5);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [form] = Form.useForm();
  const [validationError, setValidationError] = useState(true);

  const [roleFilter, setRoleFilter] = useState();
  const debouncedFilter = useDebounce(roleFilter, 500);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    fetchUsers,
    loading: usersLoading,
    error: usersError,
    users,
    currentPage,
    isLast,
    pageSize,
    totalItems,
    totalPages,
  } = useGetUsers();

  const {
    callImportExcelEndpoint,
    importExcelData,
    loading: importLoading,
    error: importError,
  } = useImportExcel();

  const {
    callCreateUserEndpoint,
    loading: createUserLoading,
    error: createUserError,
  } = useCreateUser();

  const createUserRoleOptions = Array.from(rolesMap.entries()).map(
    ([value, label]) => {
      return {
        value,
        label,
      };
    },
  );

  useEffect(() => {
    fetchUsers({ search: debouncedQuery, roleName: debouncedFilter });
  }, [debouncedQuery, debouncedFilter]);

  const USER_COLUMNS = useMemo(
    () => [
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Người dùng
          </p>
        ),
        dataIndex: 'user',
        key: 'user',
        render: (user) => (
          <div className="flex items-center gap-3">
            <div
              className={`size-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${user.initialsColor}`}
            >
              {user.initials}
            </div>
            <span className="font-semibold text-slate-800 text-[16px]">
              {user.name}
            </span>
          </div>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Email/MSSV
          </p>
        ),
        dataIndex: 'id',
        key: 'id',
        render: (id) => (
          <span className={`flex flex-col gap-1.5 px-2.5 py-1 `}>
            <span className="text-[16px]">{id.email}</span>
            <span className="text-[13px] text-slate-400">{id.mssv}</span>
          </span>
        ),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">Vai trò</p>
        ),
        dataIndex: 'role',
        key: 'role',
        render: (role) => renderRolePill({ role }),
      },
      {
        title: (
          <p className="text-xs uppercase tracking-wider font-bold">
            Trạng thái
          </p>
        ),
        dataIndex: 'status',
        key: 'status',
        render: (status) => renderStatusPill({ status }),
      },
      {
        title: (
          <p className="text-xs text-center uppercase tracking-wider font-bold">
            Thao tác
          </p>
        ),
        dataIndex: 'action',
        key: 'action',
        render: (_, record) => (
          <div className="flex justify-center align-middle">
            <button
              className="bg-white border border-slate-300 text-slate-700 hover:text-[#F37021] hover:border-[#F37021] px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
              onClick={() =>
                navigate(`/admin/student-management/${record.userId}`)
              }
            >
              Xem chi tiết
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  const handleUpload = async ({ file, onSuccess, onError }) => {
    try {
      await callImportExcelEndpoint(file);
      onSuccess(null, file);
      message.success(`${file.name} uploaded thành công!.`);
    } catch (err) {
      onError(err);
      if (err.response) {
        message.error(`${err.response.data.message}`);
      } else {
        message.error(`Lỗi mạng: ${err.message}`);
      }
    }
  };

  const handleCreateUser = async () => {
    const payload = Object.fromEntries(
      Object.entries(form.getFieldsValue()).map(([key, value]) => [
        key,
        value.trim(),
      ]),
    );

    if (Object.values(payload).some((value) => value === '')) {
      message.warning('Vui lòng nhập đầy đủ thông tin người dùng.');
      return;
    }

    try {
      await callCreateUserEndpoint(payload);
      message.success('Tạo người dùng thành công.');
      setIsModalOpen(false);

      fetchUsers({ search: debouncedQuery, page: 0, size: 8 });
    } catch (err) {
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Tạo người dùng thất bại.');
      }
    }
  };

  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) => {
        if (collapsed) {
          return ADMIN_SIDEBAR_ITEMS_FLAT;
        } else {
          return ADMIN_SIDEBAR_ITEMS;
        }
      }}
      notifCount={notifCount}
      currentSelectedItem={(item) => setSelectedIndex(Number(item.key))}
    >
      <ConfigProvider
        theme={{
          components: {
            Table: {
              cellPaddingInline: 12,
              cellPaddingBlock: 6,
              headerBg: '#f8fafc',
              headerColor: '#45556c',
              headerSplitColor: 'transparent',
              rowHoverBg: 'rgb(243, 112, 33, 0.05)',
            },
            Button: { colorPrimary: '#F37021' },
            Pagination: {
              itemActiveBg: '#F37021',
              colorPrimary: '#F37021',
              itemActiveColor: '#ffffff',
              colorPrimaryHover: '#F37021E6',
            },
            Tabs: {
              inkBarColor: '#F37021',
              itemHoverColor: '#F37021',
              itemSelectedColor: '#F37021',
            },
          },
        }}
      >
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-5 max-w-7xl mx-auto w-full flex items-center gap-2 z-0">
            <Input
              className="flex-2 min-w-[300px]"
              enterButton={false}
              size="large"
              placeholder="Tìm kiếm theo tên, email, MSSV"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              allowClear
            />
            <Select
              className="flex-1 min-w-[200px]"
              options={createUserRoleOptions}
              size="large"
              placeholder="Vai trò"
              allowClear
              value={roleFilter}
              onChange={(v) => {
                setRoleFilter(v);
              }}
            />
            <Button
              className="flex-1 min-w-[150px]"
              size="large"
              icon={<DownloadOutlined />}
              variant="outlined"
            >
              Xuất Excel
            </Button>
            <Button
              size="large"
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => setIsModalOpen(true)}
            >
              Thêm người dùng
            </Button>
          </div>
          <div className="px-4 max-w-7xl mx-auto w-full">
            <div className="bg-white rounded-md mb-8 shadow-sm border border-slate-200 overflow-hidden">
              <Table
                rowKey="userId"
                columns={USER_COLUMNS}
                loading={usersLoading}
                dataSource={users}
                size="small"
                pagination={{
                  total: totalItems,
                  current: currentPage,
                  pageSize: 8,
                  showSizeChanger: false,
                  onChange: (page) => {
                    fetchUsers({ page: page - 1, size: 8 });
                  },
                }}
                locale={{
                  emptyText: (
                    <div className="py-10">
                      <Empty
                        image={emptyImg}
                        imageStyle={{
                          height: 300,
                          objectFit: 'contain',
                          display: 'flex',
                          justifyContent: 'center',
                          opacity: 1,
                        }}
                        description={
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-700 mb-0">
                              Không tìm thấy người dùng phù hợp
                            </p>
                            <p className="text-xs text-slate-400 mb-0">
                              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc vai trò,
                              trạng thái.
                            </p>
                          </div>
                        }
                      />
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        </div>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <div className="w-[760px] max-w-[90vw]">
            <Tabs
              defaultActiveKey="single"
              items={[
                {
                  key: 'single',
                  label: 'Thêm 1 người dùng',
                  children: (
                    <Form
                      form={form}
                      onFieldsChange={() => {
                        const errors = form.getFieldsError();
                        const hasErrors = errors.some(
                          (field) => field.errors.length !== 0,
                        );
                        const values = Object.entries(form.getFieldsValue());
                        const isEmpty = values.some(([key, value]) => {
                          return value === '' || value === undefined;
                        });
                        setValidationError(hasErrors || isEmpty);
                      }}
                      className="space-y-4 pt-2"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Vai trò
                          </label>
                          <Form.Item
                            name="roleName"
                            rules={[
                              {
                                required: true,
                                message: 'Không được để trống',
                              },
                            ]}
                          >
                            <Select
                              allowClear
                              className="w-full"
                              size="middle"
                              options={createUserRoleOptions}
                              placeholder="Chọn vai trò"
                            />
                          </Form.Item>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            MSSV
                          </label>
                          <Form.Item
                            name="mssv"
                            rules={[
                              {
                                required: true,
                                message: 'Mã số sinh viên không được để trống',
                              },
                            ]}
                          >
                            <Input
                              size="middle"
                              placeholder="Nhập MSSV"
                            />
                          </Form.Item>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Họ và tên
                          </label>
                          <Form.Item
                            name="fullName"
                            rules={[
                              {
                                required: true,
                                message: 'Tên không được để trống',
                              },
                            ]}
                          >
                            <Input
                              size="middle"
                              placeholder="Nhập họ và tên"
                            />
                          </Form.Item>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                            Email
                          </label>
                          <Form.Item
                            name="email"
                            rules={[
                              {
                                required: true,
                                message: 'Email không được để trống',
                              },
                              ({ getFieldValue }) => ({
                                validator: (_, value) => {
                                  if (
                                    !value ||
                                    getFieldValue('email').endsWith(
                                      '@fpt.edu.vn',
                                    )
                                  ) {
                                    return Promise.resolve();
                                  }
                                  return Promise.reject(
                                    new Error('Email phải có đuôi @fpt.edu.vn'),
                                  );
                                },
                              }),
                            ]}
                          >
                            <Input
                              size="middle"
                              placeholder="Nhập email"
                            />
                          </Form.Item>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <Button onClick={() => setIsModalOpen(false)}>
                          Hủy
                        </Button>
                        <Button
                          type="primary"
                          loading={createUserLoading}
                          onClick={handleCreateUser}
                          disabled={validationError}
                        >
                          Thêm người dùng
                        </Button>
                      </div>
                    </Form>
                  ),
                },
                {
                  key: 'multiple',
                  label: 'Thêm nhiều người dùng',
                  children: (
                    <div className="space-y-4 pt-2">
                      <Upload.Dragger
                        name="file"
                        multiple={false}
                        directory={false}
                        customRequest={handleUpload}
                        showUploadList={false}
                        disabled={importLoading}
                        style={{ borderColor: '#F37021E6' }}
                      >
                        <p className="ant-upload-drag-icon">
                          <InboxOutlined style={{ color: '#F37021' }} />
                        </p>
                        <p className="ant-upload-text">
                          Nhấn hay kéo file Excel tới khu vực này để upload
                        </p>
                      </Upload.Dragger>
                      <div className="flex items-center justify-end">
                        <Button onClick={() => setIsModalOpen(false)}>
                          Hủy
                        </Button>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </Modal>
      </ConfigProvider>
    </MainLayout>
  );
};

export default UserManagement;
