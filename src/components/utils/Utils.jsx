import { CARD_ADMIN_ICON } from '../../features/admin/config';

// Sidebar cho sidebar khong dung materialIcon
const renderSiderIcons = ({ icons, selectedIndex }) => {
  return icons.map((item, index) => {
    const isActive = index + 1 === selectedIndex;
    const color = isActive ? '#F37021' : '#ffffff';
    return item({ fill: color });
  });
};

// Sidebar cho admin khi sidebar dong
const sidebarItemsWithMaterialIconsFlat = ({ icons, items }) => {
  let iconIndex = 0;

  return items.map((item) => {
    const currentIcon = icons[iconIndex];
    iconIndex++;
    return {
      ...item,
      icon: (
        <span className="material-symbols-outlined text-[20px] flex-shrink-0">
          {currentIcon}
        </span>
      ),
    };
  });
};
// Sidebar cho admin
const sidebarItemsWithMaterialIcons = ({ icons, items }) => {
  let iconIndex = 0;

  return items.map((group) => {
    return {
      ...group,
      children: group.children?.map((item) => {
        const currentIconName = icons[iconIndex];
        iconIndex++;

        return {
          ...item,
          icon: (
            <span className="material-symbols-outlined text-[20px] flex-shrink-0">
              {currentIconName}
            </span>
          ),
        };
      }),
    };
  });
};

const renderSiderIconsMaterialSymbol = ({ icons }) => {
  return icons.map((icon) => {
    return (
      <span className="material-symbols-outlined text-[24px] flex-shrink-0">
        {icon}
      </span>
    );
  });
};
// Cho dashboard card
const renderCardWithIcon = ({ data }) => {
  return data.map((card, index) => {
    return { ...card, iconName: CARD_ADMIN_ICON[index] };
  });
};
// Pill trend cho dashboard card
const getTrendIcon = ({ trend }) => {
  if (trend !== '!') {
    const value = Number(trend.split('%')[0]);

    if (value > 0) {
      return (
        <>
          <span className="material-symbols-outlined text-[13px] mr-1">
            trending_up
          </span>
          {value} tháng này
        </>
      );
    } else if (value < 0) {
      return (
        <>
          <span className="material-symbols-outlined text-[13px] mr-1">
            trending_down
          </span>
          {value} tháng này
        </>
      );
    } else {
      return (
        <>
          <span className="material-symbols-outlined text-[13px] mr-1">
            trending_flat
          </span>{' '}
          không thay đổi
        </>
      );
    }
  } else {
    return (
      <>
        <span className="material-symbols-outlined text-[13px]">
          priority_high
        </span>{' '}
        Cần thao tác
      </>
    );
  }
};

const renderRolePill = ({ role }) => {
  if (role === 'Sinh viên') {
    return (
      <span className="text-blue-700 bg-blue-50 border border-blue-200 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md">
        {role}
      </span>
    );
  } else if (role === 'Giảng viên') {
    return (
      <span className="text-purple-700 bg-purple-50 border border-purple-200 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md">
        {role}
      </span>
    );
  } else if (role === 'Cán bộ khảo thí') {
    return (
      <span className="text-orange-700 bg-orange-50 border border-orange-200 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md">
        {role}
      </span>
    );
  } else {
    return (
      <span className="text-red-700 bg-red-50 border border-red-200 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md">
        {role}
      </span>
    );
  }
};

const renderStatusPill = ({ status }) => {
  if (status === 'Đang hoạt động') {
    return (
      <span className="text-green-700 bg-green-50 border border-green-200 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md">
        {status}
      </span>
    );
  }

  if (status === 'Tạm khóa') {
    return (
      <span className="text-slate-600 bg-slate-100 border border-slate-200 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md">
        {status}
      </span>
    );
  }

  return (
    <span className="text-slate-600 bg-slate-50 border border-slate-200 text-xs font-semibold whitespace-nowrap px-2 py-1 rounded-md">
      {status}
    </span>
  );
};
export {
  renderSiderIcons,
  renderSiderIconsMaterialSymbol,
  sidebarItemsWithMaterialIconsFlat,
  sidebarItemsWithMaterialIcons,
  renderCardWithIcon,
  getTrendIcon,
  renderRolePill,
  renderStatusPill,
};
