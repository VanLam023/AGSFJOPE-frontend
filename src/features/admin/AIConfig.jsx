import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layouts/MainLayout';
import { renderSiderIconsMaterialSymbol } from '../../components/utils/Utils';
import {
  ADMIN_SIDEBAR_ITEMS,
  ADMIN_ICONS,
  ADMIN_SIDEBAR_ITEMS_FLAT,
} from '../../constants/sidebarItems';
import { ConfigProvider, Select, Input, Button, Form, message } from 'antd';
import CardContainer from '../../components/CardContainer';
import {
  useGetAIConfig,
  useUpdateAIConfig,
  useTestConnection,
} from '../../hooks';
import { AI_PROVIDERS, LANGUAGE, AI_PROVIDER_MODELS } from './config';
import { trimPayload } from '../../components/utils/Utils';

const AIConfig = () => {
  const [notifCount] = useState(5);
  const [form] = Form.useForm();
  const [validationError, setValidationError] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [connectionTestPassed, setConnectionTestPassed] = useState(false);
  const {
    callGetAIConfigEndpoint,
    config: fetchedConfig,
    loading: getConfigLoading,
    error: getConfigError,
  } = useGetAIConfig();

  const {
    callEditAIConfigEndpoint,
    loading: editConfigLoading,
    error: editConfigError,
  } = useUpdateAIConfig();

  const {
    callTestConnectionEndpoint,
    result,
    loading: testConnectionLoading,
    error: testConnectionError,
  } = useTestConnection();

  const config = fetchedConfig;

  useEffect(() => {
    callGetAIConfigEndpoint();
  }, []);

  useEffect(() => {
    form.setFieldsValue({
      provider: config?.provider,
      apiKeyMasked: config?.apiKeyMasked,
      model: config?.model,
      language: config?.language,
    });
  }, [config]);

  const handleTestConnection = async () => {
    const { provider, model } = form.getFieldsValue();
    const payload = trimPayload({
      provider,
      model,
      apiKey: form.getFieldValue('apiKeyMasked'),
    });

    try {
      const res = await callTestConnectionEndpoint(payload);

      if (res.data.errorMessage) {
        setConnectionTestPassed(false);
        message.error(
          res.message.split(':')[1] + '. Vui lòng kiểm tra lại API key',
        );
      } else {
        setConnectionTestPassed(true);
        message.success(res.message.split(':')[1]);
      }
    } catch (err) {
      setConnectionTestPassed(false);
      if (err.response.data.message) {
        message.error(
          err.response.data.message + '. Vui lòng kiểm tra lại API key',
        );
      }
    }
  };

  const handleEdit = async () => {
    const payload = trimPayload(form.getFieldsValue());

    try {
      const res = await callEditAIConfigEndpoint(payload);

      message.success(res.message.split(':')[1]);

      callGetAIConfigEndpoint();
    } catch (err) {
      if (err.response.data.message) {
        message.error(err.response.data.message);
      }
    }
  };

  const handleCancel = () => {
    form.setFieldsValue({
      provider: config.provider,
      apiKeyMasked: config.apiKeyMasked,
      model: config.model,
      language: config.language,
    });
    setValidationError(false);
    setConnectionTestPassed(false);
  };

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
          },
        }}
      >
        <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
          <CardContainer>
            <div className="px-4 py-2">
              <div className="flex gap-2 items-center">
                <span className="material-symbols-outlined text-[#F37021] text-2xl">
                  settings_alert
                </span>
                <h1 className="text-lg font-semibold">Cấu hình AI Provider</h1>
              </div>

              <Form
                form={form}
                onFieldsChange={() => {
                  const errors = form.getFieldsError();
                  const hasErrors = errors.some(
                    (field) => field.errors.length !== 0,
                  );

                  setValidationError(hasErrors);
                }}
                className="grid grid-cols-2 gap-x-4 gap-y-1"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    AI Provider
                  </label>
                  <Form.Item name="provider">
                    <Select
                      className="w-full"
                      disabled={!isEdit}
                      options={AI_PROVIDERS.map(([value, label]) => ({
                        value,
                        label,
                      }))}
                      onChange={(newProvider) => {
                        const models = AI_PROVIDER_MODELS[newProvider] ?? [];
                        const firstModel = models[0]?.[0];
                        form.setFieldValue('model', firstModel);
                      }}
                    />
                  </Form.Item>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    API Key
                  </label>
                  <Form.Item
                    name="apiKeyMasked"
                    rules={[
                      {
                        required: true,
                        message: 'Không được để trống',
                      },
                    ]}
                  >
                    <Input disabled={!isEdit} />
                  </Form.Item>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    AI Model
                  </label>
                  <Form.Item
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.provider !== currentValues.provider
                    }
                  >
                    {({ getFieldValue }) => {
                      const provider = getFieldValue('provider');
                      const models = AI_PROVIDER_MODELS[provider] ?? [];
                      return (
                        <Form.Item name="model">
                          <Select
                            className="w-full"
                            showSearch
                            defaultActiveFirstOption={true}
                            options={models.map(([value, label]) => ({
                              value,
                              label,
                            }))}
                            disabled={!isEdit}
                          />
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                    Ngôn ngữ nhận xét
                  </label>
                  <Form.Item name="language">
                    <Select
                      className="w-full"
                      options={LANGUAGE.map(([value, label]) => ({
                        value,
                        label,
                      }))}
                      disabled={!isEdit}
                    />
                  </Form.Item>
                </div>
              </Form>
            </div>
            <div className="flex items-center justify-between px-4">
              <div className="flex flex-1 items-center justify-end  gap-2 pt-2">
                {isEdit && (
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

                    {!connectionTestPassed ? (
                      <Button
                        size="large"
                        onClick={handleTestConnection}
                        loading={testConnectionLoading}
                        style={{ borderColor: '#F37021', color: '#F37021' }}
                        disabled={validationError}
                      >
                        Test kết nối
                      </Button>
                    ) : (
                      <Button
                        size="large"
                        type="primary"
                        onClick={async () => {
                          await handleEdit();
                          setIsEdit(false);
                          setConnectionTestPassed(false);
                        }}
                        loading={editConfigLoading}
                        disabled={validationError}
                      >
                        Lưu cấu hình
                      </Button>
                    )}
                  </>
                )}
                {!isEdit && (
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => {
                      setIsEdit(true);
                      setConnectionTestPassed(false);
                    }}
                  >
                    Cập nhật cấu hình
                  </Button>
                )}
              </div>
            </div>
          </CardContainer>
          {/* 
          <CardContainer>
            <div>Placeholder</div>
          </CardContainer> */}
        </div>
      </ConfigProvider>
    </MainLayout>
  );
};

export default AIConfig;
