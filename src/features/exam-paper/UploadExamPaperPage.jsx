import React, { useCallback, useEffect, useRef, useState } from 'react';
import examPaperApi from '../../services/examPaperApi';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
}

const ACCEPTED = ['.zip', '.rar'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadExamPaperPage({ examId, blockId, onBack }) {
  const fileInputRef = useRef(null);

  // Existing paper (from GET)
  const [paper,      setPaper]      = useState(null);
  const [loadingGet, setLoadingGet] = useState(true);

  // Selected file (before upload)
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging,     setDragging]     = useState(false);

  // Upload state
  const [uploading,    setUploading]    = useState(false);
  const [progress,     setProgress]     = useState(0);
  const [uploadResult, setUploadResult] = useState(null); // ExamPaperResponse after upload
  const [uploadError,  setUploadError]  = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Delete state
  const [deleting,    setDeleting]    = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ─── Load existing paper ────────────────────────────────────────────────────

  const loadPaper = useCallback(() => {
    if (!examId || !blockId) return;
    setLoadingGet(true);
    examPaperApi.getByBlock(examId, blockId)
      .then((res) => setPaper(res?.data ?? res ?? null))
      .catch(() => setPaper(null))          // 404 = chưa có đề → null
      .finally(() => setLoadingGet(false));
  }, [examId, blockId]);

  useEffect(() => { loadPaper(); }, [loadPaper]);

  // ─── File selection ─────────────────────────────────────────────────────────

  const validateFile = (file) => {
    if (!file) return 'Vui lòng chọn file.';
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!ACCEPTED.includes(ext)) return 'Chỉ chấp nhận file .zip hoặc .rar';
    if (file.size > 20 * 1024 * 1024) return 'File vượt quá giới hạn 20 MB';
    return null;
  };

  const handleFileSelect = (file) => {
    setUploadError('');
    setUploadResult(null);
    const err = validateFile(file);
    if (err) { setUploadError(err); return; }
    setSelectedFile(file);
  };

  // Drag & drop handlers
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop      = (e) => {
    e.preventDefault(); setDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  // ─── Upload ─────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    setUploadError('');
    setUploadResult(null);

    try {
      const res = await examPaperApi.upload(examId, blockId, selectedFile, setProgress);
      const data = res?.data?.data ?? res?.data ?? res;
      setUploadResult(data);
      setPaper(data);          // update displayed paper
      setSelectedFile(null);
      setShowSuccessPopup(true);

      setTimeout(() => {
        onBack?.();
      }, 1200);
    } catch (err) {
      setUploadError(
        err?.response?.data?.message || 'Upload thất bại. Vui lòng thử lại.'
      );
    } finally {
      setUploading(false);
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!window.confirm('Xóa đề thi này? Thao tác không thể hoàn tác.')) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await examPaperApi.deleteByBlock(examId, blockId);
      setPaper(null);
      setUploadResult(null);
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại.'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ─── Download ───────────────────────────────────────────────────────────────

  const handleDownload = async () => {
    try {
      const res = await examPaperApi.download(examId, blockId);
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = paper?.fileName || 'exam-paper';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — user will see nothing downloaded
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const displayPaper = uploadResult ?? paper;

  return (
    <div className="bg-[#F5F7FA] min-h-screen p-6 sm:p-8">
      <div className="max-w-[780px] mx-auto space-y-6">

        {/* Back */}
        <button type="button" onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-[#F37021] transition-colors text-sm font-semibold group">
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          Quay lại chi tiết Block
        </button>

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EAECF0] p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900">Tải lên đề thi</h2>
            <p className="text-slate-500 mt-1.5 text-sm">
              Upload file nén (.zip / .rar) chứa đề thi và bộ test case đi kèm.
            </p>
          </div>

          {/* ─── Existing paper info ─── */}
          {!loadingGet && displayPaper && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600 text-2xl">task_alt</span>
                  <div>
                    <p className="font-bold text-green-800 text-sm">{displayPaper.fileName}</p>
                    <p className="text-xs text-green-600 mt-0.5">
                      {fmtSize(displayPaper.fileSizeBytes)} •
                      {displayPaper.totalQuestions} câu hỏi •
                      {displayPaper.totalTestCases} test cases •
                      Upload lúc {fmtDate(displayPaper.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 h-8 text-xs font-bold text-green-700 border border-green-300 rounded-lg hover:bg-green-100 transition-colors">
                    <span className="material-symbols-outlined text-sm">download</span>
                    Tải xuống
                  </button>
                  <button onClick={handleDelete} disabled={deleting}
                    className="flex items-center gap-1.5 px-3 h-8 text-xs font-bold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
                    <span className="material-symbols-outlined text-sm">delete</span>
                    {deleting ? 'Đang xóa…' : 'Xóa đề'}
                  </button>
                </div>
              </div>
              {deleteError && (
                <p className="mt-2 text-xs text-red-600">{deleteError}</p>
              )}

              {/* Questions list */}
              {Array.isArray(displayPaper.questions) && displayPaper.questions.length > 0 && (
                <div className="mt-4 border border-green-200 rounded-xl p-4 bg-white">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Cấu trúc đề thi
                  </p>
                  <ul className="space-y-2 text-sm">
                    {displayPaper.questions.slice(0, 5).map((q, i) => (
                      <li key={q.questionId ?? i} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <span className="material-symbols-outlined text-[#F37021] text-sm">folder</span>
                          Câu {q.questionOrder ?? i + 1}: {q.questionName || `Question_0${i + 1}`}
                        </div>
                        {Array.isArray(q.testCases) && (
                          <p className="pl-6 text-xs text-slate-500">
                            {q.testCases.length} test case{q.testCases.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </li>
                    ))}
                    {displayPaper.questions.length > 5 && (
                      <li className="flex items-center gap-2 text-slate-400 italic text-xs pl-1">
                        <span className="material-symbols-outlined text-sm">more_horiz</span>
                        Và {displayPaper.questions.length - 5} câu hỏi khác…
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ─── Drop zone ─── */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 sm:p-12 flex flex-col items-center justify-center
                        cursor-pointer transition-all mb-5
                        ${dragging ? 'border-[#F37021] bg-orange-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}
          >
            <span className={`material-symbols-outlined text-6xl mb-3 transition-colors
                             ${dragging ? 'text-[#F37021]' : 'text-slate-400'}`}>
              cloud_upload
            </span>
            <p className="text-slate-900 font-semibold mb-1">
              {dragging ? 'Thả file vào đây…' : 'Click hoặc kéo thả file vào đây'}
            </p>
            <p className="text-slate-500 text-sm">Chấp nhận .zip / .rar (tối đa 20 MB)</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.rar"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />
          </div>

          {/* Selected file preview */}
          {selectedFile && (
            <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-[#EAECF0] mb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#F37021]">folder_zip</span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">{fmtSize(selectedFile.size)}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelectedFile(null)}
                className="text-slate-400 hover:text-red-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          )}

          {/* Upload progress bar */}
          {uploading && (
            <div className="mb-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>Đang upload…</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F37021] to-orange-400 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload success message (inline fallback) */}
          {uploadResult && !uploading && !showSuccessPopup && (
            <div className="mb-4 p-3 bg-[#ECFDF5] text-green-800 rounded-lg flex items-center gap-2 text-sm font-medium">
              <span className="material-symbols-outlined text-base">verified</span>
              Upload thành công! Phát hiện {uploadResult.totalQuestions} câu hỏi và {uploadResult.totalTestCases} test cases.
            </div>
          )}

          {/* Error */}
          {uploadError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-base">error</span>
              {uploadError}
            </div>
          )}

          {/* Warning */}
          <div className="bg-[#FFF4EE] border border-[#F37021]/20 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-[#F37021]">warning</span>
              <div>
                <p className="text-sm font-bold text-[#F37021]">Lưu ý quan trọng</p>
                <p className="text-xs text-[#F37021]/80 mt-1 leading-relaxed">
                  Tải lên tệp mới sẽ ghi đè lên toàn bộ dữ liệu đề thi hiện có của Block này (câu hỏi, test cases).
                  Tính năng xóa bị vô hiệu hóa nếu đã có sinh viên nộp bài.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full bg-[#F37021] hover:bg-[#F37021]/90 text-white font-bold py-3 px-6
                         rounded-lg transition-all flex items-center justify-center gap-2
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">cloud_done</span>
              {uploading ? `Đang upload… ${progress}%` : (displayPaper ? 'Upload lại đề thi' : 'Xác nhận upload')}
            </button>
            <button
              type="button"
              onClick={onBack}
              disabled={uploading}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 px-6
                         rounded-lg border border-[#EAECF0] transition-all disabled:opacity-50"
            >
              Hủy
            </button>
          </div>
        </div>

      </div>

      {/* Success popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-green-200 shadow-2xl p-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">Upload thành công</h3>
            <p className="text-sm text-slate-500 mt-1">
              Đang quay về trang chi tiết Block...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
