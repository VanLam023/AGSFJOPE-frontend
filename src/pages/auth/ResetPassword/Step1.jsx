import { Button, Input } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './step.module.css';

const Step1 = ({ callback }) => {
  const [email, setEmail] = useState();

  const handleEmailToSendCode = () => {
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
        <h1 className={styles.title}>Nhập email để tạo mật khẩu mới</h1>
        <p className={styles.subtitle}>
          <span style={{ display: 'block' }}>
            Nếu email hợp lệ, bạn sẽ nhận mã xác nhận qua email.
          </span>
          <span style={{ display: 'block' }}>
            Vui lòng kiểm tra hộp thư và nhập mã ở bước tiếp theo.
          </span>
        </p>
        <form
          onSubmit={handleEmailToSendCode}
          className={styles.form}
        >
          <div>
            <label className={styles.label}>Email</label>
            <Input
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              size="large"
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            className={styles.btnPri}
            size="large"
            block
          >
            Gửi mã
          </Button>
        </form>
      </div>
    </>
  );
};

export default Step1;
