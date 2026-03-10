import {
  Layout,
  Button,
  Menu,
  ConfigProvider,
  Divider,
  Avatar,
  ColorPicker,
} from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import React, { useState } from 'react';
import styles from './MainLayout.module.css';
import logoImg from '../assets/logo.svg';
import { Bell } from 'lucide-react';

const { Header, Content, Sider } = Layout;

const MainLayout = ({
  children,
  siderItems,
  siderIcons,
  currentSelectedItem,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const currentRoleSiderItems = siderItems.map((item, index) => {
    const currentIcon = siderIcons[index];

    return {
      ...item,
      icon: currentIcon,
    };
  });

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
            itemSelectedColor: '#ffffff',
            itemSelectedBg: '#291D1A',
            itemHoverBg: 'rgba(255, 255, 255, 0.1)',
            itemHoverColor: '#ffffff',
            // --------------------------
            collapsedWidth: 10,
          },
          Layout: {
            siderBg: '#2D2D2D',
          },
        },
      }}
    >
      <Layout className={styles.layout}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
        >
          {!collapsed ? (
            <div className={styles.logoWrapper}>
              <img
                src={logoImg}
                alt="Logo"
                className={styles.logo}
              />
              {!collapsed && (
                <div className={collapsed ? styles.fadeOut : styles.fadeIn}>
                  <h1>Chấm bài OOP</h1>
                  <p>Khảo thí</p>
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

          <Menu
            defaultSelectedKeys={['1']}
            items={currentRoleSiderItems}
            onSelect={(item) => currentSelectedItem(item)}
            //items={}
            className={styles.menu}
            mode="inline"
          />
        </Sider>
        <Layout>
          <Header className={styles.header}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuUnfoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 48,
                height: 48,
              }}
            />
            <div className={styles.uti}>
              <Button
                shape="circle"
                color="default"
                variant="filled"
                icon={<Bell size="16px" />}
              ></Button>

              <div className={styles.divider}></div>
              <div className={styles.accWrapper}>
                <p>Khảo thí</p>
                <p>staff_01@gmail.vn</p>
              </div>
              <Avatar size="medium" />
            </div>
          </Header>
          <Content className={styles.content}>{children}</Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
