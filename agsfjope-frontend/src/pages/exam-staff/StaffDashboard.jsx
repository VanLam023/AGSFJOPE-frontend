import React, { useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems';
import {
  DashboardIcon,
  ExamManagementIcon,
  SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
} from '../../components/icons/SidebarIcons';
import DashboardCard from '../../components/DashboardCard';
import useDashboardData from '../../hooks/useDashboardData';
import styles from './StaffDashboard.module.css';

const ICON_MAP = {
  exam: ExamManagementIcon,
  submission: SubmissionsIcon,
  appeal: AppealsIcon,
  audit: AuditLogIcon,
  dashboard: DashboardIcon,
};

const StaffDashboard = () => {
  const [selectedIndex, setSelectedIndex] = useState(1);
  const { cardData } = useDashboardData();

  const icons = [
    DashboardIcon,
    ExamManagementIcon,
    SubmissionsIcon,
    AppealsIcon,
    AuditLogIcon,
  ];

  const renderedSiderIcons = icons.map((item, index) => {
    const isActive = index + 1 === selectedIndex;
    const color = isActive ? '#F37021' : '#ffffff';
    return item({ fill: color });
  });

  return (
    <MainLayout
      siderIcons={renderedSiderIcons}
      siderItems={STAFF_SIDEBAR_ITEMS}
      currentSelectedItem={(item) => setSelectedIndex(Number(item.key))}
    >
      <div className={styles.main}>
        <div className={styles.cardsContainer}>
          {cardData?.map((item) => {
            const IconComponent = ICON_MAP[item.iconKey] ?? DashboardIcon;
            return (
              <DashboardCard
                key={item.id}
                icon={<IconComponent />}
                iconBackground={item.iconBackground}
                title={item.title}
                value={item.value}
                trend={item.trend ?? null}
              />
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default StaffDashboard;
