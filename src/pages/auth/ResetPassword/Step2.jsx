import { Button, Input } from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './step.module.css';

const Step2 = ({ callback }) => {
  const [code, setCode] = useState();

  const handleValidateToken = () => {
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
        <h1 className={styles.title}>Nhập mã xác nhận</h1>
        <p className={styles.subtitle}>
          <span style={{ display: 'block' }}>
            Hệ thống đã gửi mã xác nhận đến email của bạn.
          </span>
          <span style={{ display: 'block' }}>
            Vui lòng kiểm tra hộp thư (và thư mục spam), sau đó nhập mã vào ô
            bên dưới.
          </span>
        </p>
        <form
          onSubmit={handleValidateToken}
          className={styles.form}
        >
          <div>
            <label className={styles.label}>Mã xác nhận</label>
            <Input
              placeholder="Nhập mã của bạn"
              value={code}
              onChange={(e) => setCode(e.target.value)}
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
            Kiểm tra mã
          </Button>
        </form>
        <div className={styles.links2}>
          <span className={styles.subtitle}>
            Chưa nhận được mã? <span className={styles.link}>Gửi lại</span>
          </span>
        </div>
      </div>
    </>
  );
};

export default Step2;
