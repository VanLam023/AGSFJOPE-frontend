import { Button, Input } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './step.module.css';
import { lockIcon } from '../../../constants/icons';

const Step3 = ({ callback }) => {
  const [password, setPassword] = useState();

  const handleSetNewPassword = () => {
    callback();
  };

  return (
    <>
      <div className={styles.formWrap}>
        <div className={styles.links}>
          <Link
            to="/login"
            className={styles.link}
          >
            ← Quay lại đăng nhập
          </Link>
        </div>
        <h1 className={styles.title}>Đặt mật khẩu mới</h1>
        <form
          onSubmit={handleSetNewPassword}
          className={styles.form}
        >
          <div>
            <label className={styles.label}>Mật khẩu mới</label>
            <Input.Password
              placeholder="Nhập mã xác nhận"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefix={lockIcon}
              className={styles.input}
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            className={styles.btnPri}
            size="large"
            block
          >
            Đặt lại mật khẩu
          </Button>
        </form>
      </div>
    </>
  );
};

export default Step3;
