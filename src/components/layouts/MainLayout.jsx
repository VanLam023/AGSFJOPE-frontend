import {
  Layout,
  Button,
  Menu,
  ConfigProvider,
  Divider,
  Avatar,
  ColorPicker,
} from 'antd';
import { Link } from 'react-router-dom';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import React, { useState, useRef, useEffect } from 'react';
import styles from './MainLayout.module.css';
import logoImg from '../../assets/logo.svg';
import { Bell } from 'lucide-react';
import { useAuth } from '../../app/context/authContext';
import { sidebarItemsWithMaterialIcons } from '../utils/Utils';

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

// Map API role from backend to vietnamese to display label.
const ROLE_LABELS = {
  STAFF: 'Khảo thí',
  ADMIN: 'Quản trị',
  LECTURER: 'Giảng viên',
  TEACHER: 'Giảng viên',
  STUDENT: 'Sinh viên',
};

const MainLayout = ({
  children,
  siderItems,
  siderIcons,
  currentSelectedItem,
  notifCount,
  actionBtn = null,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);

  const headerDropdownRef = useRef(null);

  const { user } = useAuth();
  const roleLabel = user?.role
    ? (ROLE_LABELS[user.role] ?? user.role)
    : 'Khảo thí';
  const userEmail = user?.email ?? user?.username ?? '—';

  const currentRoleSiderItems = () => {
    const items =
      typeof siderItems === 'function' ? siderItems({ collapsed }) : siderItems;

    const hasChildren = items.some((item) => item.children != null);

    if (hasChildren) {
      return sidebarItemsWithMaterialIcons({
        icons: siderIcons,
        items: items,
      });
    } else {
      return items.map((item, index) => {
        const currentIcon = siderIcons[index];

        return {
          ...item,
          icon: currentIcon,
        };
      });
    }
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (
        headerDropdownRef.current &&
        !headerDropdownRef.current.contains(e.target)
      )
        setHeaderDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            // For #ffffff background
            // ------------------------------
            // itemColor: '#64748B',
            // itemSelectedBg: '#FFF4EE',
            // itemSelectedColor: '#F37021',
            // ------------------------------

            // For the other background
            // --------------------------
            itemColor: '#CBD5E1',
            //itemSelectedColor: '#ffffff',
            itemSelectedColor: '#F37021',
            itemSelectedBg: '#291D1A',
            itemHoverBg: 'rgba(255, 255, 255, 0.1)',
            itemHoverColor: '#ffffff',
            // --------------------------
            collapsedWidth: 10,

            groupTitleColor: '#A1A1AA',
            collapsedIconSize: 20,
          },
          Layout: {
            siderBg: '#2D2D2D',
          },
          Button: {
            colorPrimaryHover: '#F37021E6',
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
                {!collapsed && (
                  <div className={collapsed ? styles.fadeOut : styles.fadeIn}>
                    <h1 className="font-bold">Chấm bài OOP</h1>
                    <p>{roleLabel}</p>
                  </div>
                )}
              </div>
            ) : (
              <img
                src={logoImg}
                alt="Logo"
                // className={collapsed ? styles.logoCollapsed : styles.logo}
                className={styles.logoCollapsed}
              />
            )}
            <div className="mb-3 w-auto ml-[-24px] mr-[-24px] border-b border-slate-600"></div>
            <Menu
              defaultSelectedKeys={['1']}
              items={currentRoleSiderItems()}
              onSelect={(item) => currentSelectedItem(item)}
              className={styles.menu}
              mode="inline"
            />

            {actionBtn && (
              <div className="px-4 pb-3 mt-auto ">
                <div className="mb-3 w-auto ml-[-24px] mr-[-24px] border-t border-slate-600"></div>
                {typeof actionBtn === 'function'
                  ? actionBtn({ collapsed })
                  : actionBtn}
              </div>
            )}
          </div>
        </Sider>
        <Layout>
          <Header
            className={`${styles.header} border-b border-slate-200`}
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuUnfoldOutlined />}
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

              <div className={styles.divider}></div>
              <div
                className="flex items-center gap-3 pl-6 relative"
                ref={headerDropdownRef}
              >
                <button
                  onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
                  className="flex items-center gap-3 group"
                >
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 leading-none ">
                      {roleLabel}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium  leading-4">
                      {userEmail}
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
                  ></div>
                </button>

                {headerDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800">
                        {roleLabel}
                      </p>
                      <p className="text-xs text-slate-400">{userEmail}</p>
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
                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">
                        logout
                      </span>
                      Đăng xuất
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
