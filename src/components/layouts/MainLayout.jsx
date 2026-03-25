import { Layout, Button, Menu, ConfigProvider } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import styles from './MainLayout.module.css';
import logoImg from '../../assets/logo.svg';
import { Bell } from 'lucide-react';
import { useAuth } from '../../app/context/authContext';
import { sidebarItemsWithMaterialIcons } from '../utils/Utils';
import axiosClient from '../../services/axiosClient';

const { Header, Content, Sider } = Layout;

const siderStyle = {
  overflow: 'hidden',
  height: '100vh',
  position: 'sticky',
  insetInlineStart: 0,
  top: 0,
  scrollbarWidth: 'thin',
  scrollbarGutter: 'stable',
};

const ROLE_LABELS = {
  SYSTEM_ADMIN: 'Quản trị',
  ADMIN: 'Quản trị',
  EXAM_STAFF: 'Khảo thí',
  STAFF: 'Khảo thí',
  LECTURER: 'Giảng viên',
  TEACHER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

const normalizeRole = (role) =>
  typeof role === 'string' ? role.trim().toUpperCase() : '';

const findKeyByPath = (items, pathname) => {
  for (const item of items) {
    if (item.to && String(item.to) === pathname) return String(item.key);
    if (item.children) {
      const found = findKeyByPath(item.children, pathname);
      if (found) return found;
    }
  }
  return null;
};

const MainLayout = ({
  children,
  siderItems,
  siderIcons,
  notifCount,
  actionBtn = null,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const headerDropdownRef = useRef(null);

  const { user, logout } = useAuth();

  const roleKey = normalizeRole(user?.roleName ?? user?.role);
  const roleLabel = roleKey ? (ROLE_LABELS[roleKey] ?? roleKey) : 'Người dùng';
  const userDisplay = user?.fullName ?? user?.username ?? 'Người dùng';
  const userSubText = user?.email ?? user?.username ?? roleLabel;

  const menuItems = useMemo(() => {
    const items =
      typeof siderItems === 'function' ? siderItems({ collapsed }) : siderItems;

    const attachLink = (item) => ({
      ...item,
      label: item.to ? <Link to={item.to}>{item.label}</Link> : item.label,
      children: item.children ? item.children.map(attachLink) : undefined,
    });

    const hasChildren = items.some((item) => item.children != null);

    const baseItems = hasChildren
      ? sidebarItemsWithMaterialIcons({ icons: siderIcons, items })
      : items.map((item, index) => ({ ...item, icon: siderIcons[index] }));

    return baseItems.map(attachLink);
  }, [collapsed, siderItems, siderIcons]);

  const selectedKey = useMemo(() => {
    return (
      findKeyByPath(
        menuItems,
        location.pathname.split('/').length === 4
          ? location.pathname.split('/').slice(0, -1).join('/')
          : location.pathname,
      ) ?? '1'
    );
  }, [menuItems, location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (
        headerDropdownRef.current &&
        !headerDropdownRef.current.contains(e.target)
      ) {
        setHeaderDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setHeaderDropdownOpen(false);

    try {
      // Backend: POST /api/auth/logout
      // axiosClient đã tự gắn Authorization: Bearer <token>
      await axiosClient.post('/auth/logout');
    } catch (error) {
      // Dù backend logout lỗi thì vẫn xóa session local để tránh user bị kẹt
      console.error('Logout API failed:', error);
    } finally {
      logout(); // xóa token + user trong AuthContext hiện tại
      localStorage.removeItem('refreshToken'); // backend có revoke refresh token, frontend cũng nên xóa local
      navigate('/login', { replace: true });
      setLoggingOut(false);
    }
  }, [loggingOut, logout, navigate]);

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemColor: '#CBD5E1',
            itemSelectedColor: '#F37021',
            itemSelectedBg: '#291D1A',
            itemHoverBg: 'rgba(255, 255, 255, 0.1)',
            itemHoverColor: '#ffffff',
            collapsedWidth: 10,
            groupTitleColor: '#A1A1AA',
            collapsedIconSize: 20,
          },
          Layout: {
            siderBg: '#2D2D2D',
          },
          Button: {
            colorPrimaryHover: '#F37021E6',
            colorPrimaryActive: '#D95F19',
          },
        },
      }}
    >
      <Layout className={styles.layout}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={240}
          style={siderStyle}
        >
          <div className="flex flex-col h-full">
            {!collapsed ? (
              <div className={styles.logoWrapper}>
                <img
                  src={logoImg}
                  alt="Logo"
                  className={styles.logo}
                />
                <div className={collapsed ? styles.fadeOut : styles.fadeIn}>
                  <h1 className="font-bold">Chấm bài OOP</h1>
                  <p>{roleLabel}</p>
                </div>
              </div>
            ) : (
              <img
                src={logoImg}
                alt="Logo"
                className={styles.logoCollapsed}
              />
            )}

            <div className="mb-3 w-auto ml-[-24px] mr-[-24px] border-b border-slate-600" />

            <Menu
              selectedKeys={[selectedKey]}
              items={menuItems}
              className={styles.menu}
              mode="inline"
            />

            {actionBtn && (
              <div className="px-4 pb-3 mt-auto">
                <div className="mb-3 w-auto ml-[-24px] mr-[-24px] border-t border-slate-600" />
                {typeof actionBtn === 'function'
                  ? actionBtn({ collapsed })
                  : actionBtn}
              </div>
            )}
          </div>
        </Sider>

        <Layout>
          <Header
            className={`${styles.header} border-b border-slate-200 z-50`}
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 36,
                height: 36,
                position: 'relative',
                left: 32,
              }}
            />

            <div className={styles.uti}>
              <Button
                shape="circle"
                color="default"
                variant="filled"
                icon={<Bell size="16px" />}
              >
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F37021] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  {notifCount}
                </span>
              </Button>

              <div className={styles.divider} />

              <div
                className="flex items-center gap-3 pl-6 relative"
                ref={headerDropdownRef}
              >
                <button
                  onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                  className="flex items-center gap-3 group"
                  type="button"
                >
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 leading-none">
                      {userDisplay}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium leading-4">
                      {userSubText}
                    </p>
                  </div>

                  <div
                    className={`aspect-square w-10 rounded-full bg-slate-200 
                      ring-2 transition-all cursor-pointer
                      bg-cover bg-center bg-no-repeat
                      ${headerDropdownOpen ? 'ring-[#F37021]' : 'ring-[#F37021]/20 group-hover:ring-[#F37021]/50'}`}
                    style={{
                      backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCo9OzzsHT5Aj1roCt7Nv_ABU8KJRL7UBksbvyl8DFixLZmQ2vxz3SsOFXyWhWJCalc9K3AabCLNaCf3_kDh_9QDIhAzQ9qnUcXAFaH_lfs_mFpcJlPc1CQT9aYTuqZuXXIetZeDRKzu4GYopfz4IUuSuD26s3zs6lAxoPlSBwDwLZQucu91YX_cVtzA-0EIEaY6lqafYO2RGLh7Z6wYmcYsdUmozJEK5oFY4fPidEncDwgS9et7v3C6xbKSoT7OE1y69DF5Fm9bxNd")`,
                    }}
                  />
                </button>

                {headerDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800">
                        {userDisplay}
                      </p>
                      <p className="text-xs text-slate-400">{userSubText}</p>
                    </div>

                    <Link
                      to="/exam-staff/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-slate-400">
                        person
                      </span>
                      Hồ sơ cá nhân
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        logout
                      </span>
                      {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Header>

          <Content className={styles.content}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
