import React, { useState } from 'react';
import AuthLayout from '../../layouts/AuthLayout';
import { Input, Button } from 'antd';
import styles from './register.module.css';
import { lockIcon, personIcon } from '../../constants/icons.jsx';

const Register = () => {
  const [studentId, setStudentId] = useState();
  const [password, setPassword] = useState();

  const handleRegister = (e) => {
    e.preventDefault();
  };

  return (
    <AuthLayout>
      <div className={styles.formWrap}>
        <h1 className={styles.title}>Tạo tài khoản</h1>
        <p className={styles.subtitle}>
          <span style={{ display: 'block' }}>
            Truy cập Hệ thống chấm điểm tự động Java OOP
          </span>
          <span style={{ display: 'block' }}>
            Điền thông tin để tạo tài khoản
          </span>
        </p>

        <form
          onSubmit={handleRegister}
          className={styles.form}
        >
          <div>
            <label className={styles.label}>Mã số sinh viên</label>
            <Input
              placeholder="e.g. SE12345"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              prefix={personIcon}
              className={styles.input}
              size="large"
              autoComplete="username"
            />
          </div>

          <div>
            <label className={styles.label}>Mật khẩu</label>
            <Input.Password
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              prefix={lockIcon}
              className={styles.input}
              size="large"
              autoComplete="current-password"
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            className={styles.loginBtn}
            size="large"
            block
          >
            Đăng kí
            <span
              className={styles.arrow}
              aria-hidden
            >
              →
            </span>
          </Button>
        </form>

        <div className={styles.links}>
          <a
            href="/reset-password"
            className={styles.link}
          >
            Quên mật khẩu?
          </a>
          <a
            href="/login"
            className={styles.link}
          >
            Đã có tài khoản? Đăng nhập
          </a>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
