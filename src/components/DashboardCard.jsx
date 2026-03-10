import React from 'react';
import styles from './DashboardCard.module.css';

const DashboardCard = ({
  icon,
  iconBackground,
  title,
  trend = null,
  value,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div
          className={styles.iconWrapper}
          style={
            iconBackground ? { backgroundColor: iconBackground } : undefined
          }
        >
          {icon}
        </div>
        {trend != null && <div className={styles.trend}>{trend}</div>}
      </div>
      <div className={styles.content}>
        <p>{title}</p>
        <h4>{value}</h4>
      </div>
    </div>
  );
};

export default DashboardCard;
