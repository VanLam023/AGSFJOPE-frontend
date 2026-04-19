import { useState } from 'react';
import { message } from 'antd';
import MainLayout from '../../components/layouts/MainLayout';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils';
import {
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import AppealFeeConfigCard from './payos-config/components/AppealFeeConfigCard';
import MerchantConfigCard from './payos-config/components/MerchantConfigCard';
import PayOSPageIntro from './payos-config/components/PayOSPageIntro';
import {
  payOSInitialFeeConfig,
  payOSInitialMerchantConfig,
} from './payos-config/payosMockData';

export default function PayOSConfigurationPage() {
  const [merchantConfig, setMerchantConfig] = useState(
    payOSInitialMerchantConfig,
  );
  const [feeConfig, setFeeConfig] = useState(payOSInitialFeeConfig);
  const [connectionStatus, setConnectionStatus] = useState(
    'Kết nối PayOS API thành công ✅',
  );

  const handleMerchantFieldChange = (field, value) => {
    setMerchantConfig((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleFeeFieldChange = (field, value) => {
    setFeeConfig((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaveMerchantConfig = () => {
    message.success('Đã lưu cấu hình PayOS.');
  };

  const handleTestConnection = () => {
    setConnectionStatus('Kết nối PayOS API thành công ✅');
    message.success('Test connection thành công.');
  };

  const handleSaveFeeConfig = () => {
    message.success('Đã cập nhật thiết lập phí phúc khảo.');
  };

  return (
    <MainLayout
      siderIcons={renderSiderIconsMaterialSymbol({ icons: ADMIN_ICONS })}
      siderItems={({ collapsed }) =>
        collapsed ? ADMIN_SIDEBAR_ITEMS_FLAT : ADMIN_SIDEBAR_ITEMS
      }
    >
      <div className="min-w-0 flex-1 bg-slate-50">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-8">
          <PayOSPageIntro />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <MerchantConfigCard
              values={merchantConfig}
              connectionStatus={connectionStatus}
              onChange={handleMerchantFieldChange}
              onSave={handleSaveMerchantConfig}
              onTestConnection={handleTestConnection}
            />

            <AppealFeeConfigCard
              values={feeConfig}
              onChange={handleFeeFieldChange}
              onSave={handleSaveFeeConfig}
            />
          </div>

        </div>
      </div>
    </MainLayout>
  );
}