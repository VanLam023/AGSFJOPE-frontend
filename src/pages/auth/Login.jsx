import { useState } from 'react';
import { Input, Button } from 'antd';
import { IMAGE } from '../../constants/images';
import styles from './login.module.css';
import AuthLayout from '../../layouts/AuthLayout';
import { personIcon, lockIcon } from '../../constants/icons.jsx';

export default function Login() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
  };

  return (
    <AuthLayout>
      <div className={styles.formWrap}>
        <h1 className={styles.title}>Chào mừng trở lại</h1>
        <p className={styles.subtitle}>
          <span style={{ display: 'block' }}>
            Truy cập Hệ thống chấm điểm tự động Java OOP
          </span>
          <span style={{ display: 'block' }}>
            Nhập thông tin tài khoản của bạn để tiếp tục
          </span>
        </p>

        <form
          onSubmit={handleLogin}
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
            />
          </div>

          <Button
            type="primary"
            htmlType="submit"
            className={styles.loginBtn}
            size="large"
            block
          >
            Đăng nhập
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
            href="/register"
            className={styles.link}
          >
            Tạo tài khoản mới
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}
