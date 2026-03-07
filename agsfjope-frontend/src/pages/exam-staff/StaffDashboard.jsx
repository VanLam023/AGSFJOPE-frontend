import React, { useEffect, useState } from 'react';
import MainLayout from '../../layouts/MainLayout';
import { STAFF_SIDEBAR_ITEMS } from '../../constants/sidebarItems';
import {
  DashboardIcon,
  ExamManagementIcon,
  SubmissionsIcon,
  AppealsIcon,
  AuditLogIcon,
} from '../../components/icons/SidebarIcons';

const StaffDashboard = () => {
  const [selectedIndex, setSelectedIndex] = useState(1);
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

  useEffect(() => {
    // console.log(renderedSiderIcons);
    // console.log(selectedIndex);
  }, [selectedIndex]);

  return (
    <MainLayout
      siderIcons={renderedSiderIcons}
      siderItems={STAFF_SIDEBAR_ITEMS}
      currentSelectedItem={(item) => setSelectedIndex(Number(item.key))}
    >
      Hello world
    </MainLayout>
  );
};

export default StaffDashboard;
