import { Button } from 'antd';
import React from 'react';
import styles from './step.module.css';

const Step4 = ({ callback }) => {
  return (
    <>
      <div className={styles.formWrap}>
        <h1 className={styles.title}>Đặt mật khẩu mới thành công</h1>
        <p className={styles.subtitle}>
          <span style={{ display: 'block' }}>
            Ấn tiếp tục để trở về trang đăng nhập
          </span>
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            callback();
          }}
          className={styles.form}
        >
          <Button
            type="primary"
            htmlType="submit"
            className={styles.btnPri}
            size="large"
            block
          >
            Tiếp tục
          </Button>
        </form>
      </div>
    </>
  );
};

export default Step4;
