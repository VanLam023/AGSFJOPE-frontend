import React, { useEffect, useState } from 'react';
import { ConfigProvider, Tabs, Input, Button, Select, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layouts/MainLayout';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { renderStatusPill } from '../../components/utils/Utils';
import { useDeleteUser, useGetUserDetail } from '../../hooks';

const ROLE_LABEL_VI = {
  STUDENT: 'Sinh viên',
  LECTURER: 'Giảng viên',
  SYSTEM_ADMIN: 'Quản trị viên',
  EXAM_STAFF: 'Cán bộ khảo thí',
};

const formatDateVi = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

const UserDetail = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [selectedIndex, setSelectedIndex] = useState(1);
  const [notifCount] = useState(5);
  const { fetchUserDetail, loading, userDetail } = useGetUserDetail();
  const { callDeleteUserEndpoint, loading: deleteLoading } = useDeleteUser();
  const user = userDetail;
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUserDetail(userId);
  }, [userId]);

  const roleDisplay = ROLE_LABEL_VI[user?.roleName] ?? user?.roleName ?? '—';
  const roleOptions = Object.entries(ROLE_LABEL_VI).map(([value, label]) => ({
    value,
    label,
  }));

  const statusLabel = user?.isLocked
    ? 'Đã khóa'
    : user?.isActive
      ? 'Đang hoạt động'
      : 'Không hoạt động';

  const handleDeleteUser = async () => {
    try {
      await callDeleteUserEndpoint(userId);
      message.success('Xóa người dùng thành công.');
      setTimeout(() => {
        navigate('/admin/student-management');
      }, 1500);
    } catch (err) {
      if (err?.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Xóa người dùng thất bại.');
      }
    }
  };

  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) =>
        collapsed ? ADMIN_SIDEBAR_ITEMS_FLAT : ADMIN_SIDEBAR_ITEMS
      }
      notifCount={notifCount}
      currentSelectedItem={(item) => setSelectedIndex(Number(item.key))}
    >
      <ConfigProvider
        theme={{
          components: {
            Button: { colorPrimary: '#F37021' },
            Tabs: {
              inkBarColor: '#F37021',
              itemActiveColor: '#F37021',
              itemHoverColor: '#F37021',
              itemSelectedColor: '#F37021',
            },
          },
        }}
      >
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
          <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="hover:text-[#F37021] cursor-default">
                Quản lý người dùng
              </span>
              <span>/</span>
              <span className="text-slate-800 font-medium">
                Chi tiết người dùng
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <aside className="lg:col-span-4">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="size-28 rounded-full bg-slate-200 ring-4 ring-slate-100 bg-cover bg-center">
                      <div className="size-full rounded-full flex items-center justify-center text-3xl font-bold text-slate-400">
                        {user?.fullName?.charAt(0) ?? '?'}
                      </div>
                    </div>
                    <span
                      className={`absolute bottom-1 right-1 size-3.5 rounded-full border-2 border-white ${
                        user?.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                      title={user?.isActive ? 'Hoạt động' : 'Không hoạt động'}
                    />
                  </div>

                  <h1 className="text-xl font-bold text-slate-900">
                    {user?.fullName}
                  </h1>
                  <p className="text-sm text-slate-500 mt-1">
                    MSSV: {user?.mssv ?? '—'}
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {roleDisplay}
                    </span>
                  </div>

                  <div className="w-full mt-6 pt-6 border-t border-slate-100 space-y-4 text-left">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">
                        mail
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          Email
                        </p>
                        <p className="text-sm text-slate-800 break-all">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">
                        phone
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          Số điện thoại
                        </p>
                        <p className="text-sm text-slate-800">
                          {user?.phone ?? '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">
                        calendar_today
                      </span>
                      <div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                          Ngày gia nhập
                        </p>
                        <p className="text-sm text-slate-800">
                          {formatDateVi(user?.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              <section className="lg:col-span-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[480px] flex flex-col">
                  {loading && (
                    <div className="px-6 py-4 text-sm text-slate-500">
                      Đang tải thông tin người dùng...
                    </div>
                  )}
                  <Tabs
                    defaultActiveKey="info"
                    className="user-detail-tabs px-6 pt-2"
                    items={[
                      {
                        key: 'info',
                        label: 'Thông tin cá nhân',
                        children: (
                          <div className="px-6 pb-6 space-y-8">
                            <div>
                              <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                                <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                                Thông tin tài khoản
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Họ và tên
                                  </label>
                                  <Input
                                    size="large"
                                    value={user?.fullName}
                                    disabled={!isEdit}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Mã số sinh viên (MSSV)
                                  </label>
                                  <Input
                                    size="large"
                                    value={user?.mssv ?? ''}
                                    disabled={!isEdit}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Email FPT
                                  </label>
                                  <Input
                                    size="large"
                                    value={user?.email}
                                    disabled={!isEdit}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Vai trò
                                  </label>
                                  <Select
                                    className="w-full"
                                    size="large"
                                    options={roleOptions}
                                    value={user?.roleName}
                                    disabled={!isEdit}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Số điện thoại
                                  </label>
                                  <Input
                                    size="large"
                                    value={user?.phone ?? ''}
                                    placeholder="Chưa cập nhật"
                                    disabled={!isEdit}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                    Tên đăng nhập
                                  </label>
                                  <Input
                                    size="large"
                                    value={user?.username}
                                    disabled={!isEdit}
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <h3 className="flex items-center gap-2 text-base font-bold text-slate-800 mb-4">
                                <span className="w-1 h-5 rounded-full bg-[#F37021]" />
                                Thông tin bổ sung
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-semibold text-slate-500">
                                    Trạng thái tài khoản
                                  </label>

                                  {renderStatusPill({ status: statusLabel })}
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-semibold text-slate-500 w-fit">
                                    Cập nhật lần cuối
                                  </label>
                                  <span>{formatDateVi(user?.updatedAt)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                              {isEdit ? (
                                <Button
                                  size="large"
                                  onClick={() => setIsEdit((prev) => !prev)}
                                >
                                  Hủy
                                </Button>
                              ) : (
                                ''
                              )}
                              <Button
                                type="primary"
                                size="large"
                                onClick={() => setIsEdit((prev) => !prev)}
                              >
                                {isEdit ? 'Lưu thay đổi' : 'Chỉnh sửa'}
                              </Button>
                              <Button
                                danger
                                size="large"
                                loading={deleteLoading}
                                onClick={handleDeleteUser}
                              >
                                Xóa
                              </Button>
                            </div>
                          </div>
                        ),
                      },
                      {
                        key: 'activity',
                        label: 'Lịch sử hoạt động',
                        children: (
                          <div className="px-6 pb-8 text-slate-500 text-sm"></div>
                        ),
                      },
                      {
                        key: 'submissions',
                        label: 'Bài nộp',
                        children: (
                          <div className="px-6 pb-8 text-slate-500 text-sm"></div>
                        ),
                      },
                    ]}
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default UserDetail;
