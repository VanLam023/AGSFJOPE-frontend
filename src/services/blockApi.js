import axiosClient from './axiosClient';

/**
 * Block API service — nested resource under Exams.
 * Endpoint base: /api/exams/{examId}/blocks
 *
 * BlockResponse shape:
 *   { blockId, examId, name, description, examDate, startTime, endTime, createdAt }
 */
const blockApi = {
  /**
   * GET /api/exams/{examId}/blocks
   * Lấy danh sách tất cả block của một kỳ thi (luôn là Block 10 + Block 3).
   */
  getByExam: (examId) => axiosClient.get(`/exams/${examId}/blocks`),

  /**
   * GET /api/exams/{examId}/blocks/{blockId}
   * Lấy chi tiết một block.
   */
  getById: (examId, blockId) => axiosClient.get(`/exams/${examId}/blocks/${blockId}`),

  /**
   * PUT /api/exams/{examId}/blocks/{blockId}
   * Cập nhật lịch thi của block (examDate, startTime, endTime).
   * @param {string} examId
   * @param {string} blockId
   * @param {object} body - { examDate: 'YYYY-MM-DD', startTime: ISO, endTime: ISO }
   */
  update: (examId, blockId, body) => axiosClient.put(`/exams/${examId}/blocks/${blockId}`, body),
};

export default blockApi;
