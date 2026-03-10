import React from 'react';
import styles from './AuthLayout.module.css';
import { IMAGE } from '../constants/images'

const AuthLayout = ({ children }) => {
  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <header className={styles.header}>
          <img
            src={IMAGE.LOGO}
            className={styles.logo}
            alt="logo"
          />
          <div className={styles.taglineContainer}>
            <p className={styles.tagline}>FUTURE</p>
            <p className={styles.tagline}>FORWARD</p>
            <p className={styles.tagline}>GLOBAL READY</p>
          </div>
        </header>
        {children}
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.firstWrapper}>
          <div className={styles.image3} />
        </div>
        <div className={styles.flexbox}>
          <div className={styles.secondWrapper}>
            <div className={styles.image4} />
          </div>
          <div className={styles.thirdWrapper}>
            <div className={styles.image2} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
