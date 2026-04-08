import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { message } from 'antd';
import useDebounce from '../../../../hooks/useDebounce';
import useLecturerAppeals from '../../../../hooks/useLecturerAppeals';
import LecturerAppealOverviewCards from '../components/LecturerAppealOverviewCards';
import LecturerAppealFilters from '../components/LecturerAppealFilters';
import LecturerAppealTable from '../components/LecturerAppealTable';

export default function LecturerAppealsPage() {
  const navigate = useNavigate();
  const { setPageMeta } = useOutletContext();

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  const debouncedKeyword = useDebounce(keyword, 350);
  const params = useMemo(
    () => ({
      keyword: debouncedKeyword,
      status,
      page,
      size,
    }),
    [debouncedKeyword, status, page, size],
  );

  const { data, loading, error } = useLecturerAppeals(params);

  useEffect(() => {
    setPageMeta({
      title: 'Danh sách phúc khảo',
      subtitle: 'Tận dụng toàn bộ dữ liệu lecturer appeal backend đang trả về.',
      breadcrumbs: [
        { label: 'Dashboard', to: '/lecturer' },
        { label: 'Phúc khảo' },
      ],
      headerActions: null,
    });
  }, [setPageMeta]);

  useEffect(() => {
    if (error) {
      message.error('Không tải được danh sách phúc khảo của giảng viên.');
    }
  }, [error]);

  const handleKeywordChange = (value) => {
    setKeyword(value);
    setPage(0);
  };

  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(0);
  };

  const handleReset = () => {
    setKeyword('');
    setStatus('');
    setPage(0);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F37021]">Lecturer Appeal Workspace</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900">Quản lý và chấm các đơn phúc khảo được giao</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Màn hình này hiển thị đầy đủ các field BE đang trả về cho từng đơn appeal: mã đơn, ID, sinh viên, kỳ thi, block, học kỳ, lý do, trạng thái, điểm gốc, điểm mới, ngày tạo, deadline và cờ quá hạn.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm leading-6 text-orange-900 xl:max-w-sm">
            Ưu tiên mở các đơn có badge <span className="font-bold">Quá hạn</span> hoặc trạng thái <span className="font-bold">Đang xử lý</span> để hoàn tất review trước deadline.
          </div>
        </div>
      </section>

      <LecturerAppealOverviewCards
        overview={data?.overview}
        loading={loading}
      />

      <LecturerAppealFilters
        keyword={keyword}
        onKeywordChange={handleKeywordChange}
        status={status}
        onStatusChange={handleStatusChange}
        onReset={handleReset}
      />

      <LecturerAppealTable
        rows={data?.appeals ?? []}
        loading={loading}
        page={data?.currentPage ?? page}
        size={data?.pageSize ?? size}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
        onOpenAppeal={(appealId) => navigate(`/lecturer/appeals/${appealId}`)}
      />
    </div>
  );
}
