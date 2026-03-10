import axiosClient from './axiosClient';
import { testDashboardData } from '../pages/test-data/test';

const getDashboardData = async () => {
  try {
    // const res = await axiosClient.get('/dashboard');
    // return res;
    return testDashboardData;
  } catch (err) {
    // Todo
  }
};

export { getDashboardData };
