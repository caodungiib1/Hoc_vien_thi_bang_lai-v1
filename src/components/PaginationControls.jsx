import React from 'react';

const PaginationControls = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  startItem,
  endItem,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = 'mục',
  className = '',
}) => {
  const minPageSize = Math.min(...pageSizeOptions);
  if (totalItems <= minPageSize && totalPages === 1) return null;

  return (
    <div className={`pagination-shell ${className}`.trim()}>
      <div className="pagination-summary">
        Hiển thị <strong>{startItem}-{endItem}</strong> / {totalItems} {itemLabel}
      </div>

      <div className="pagination-actions">
        <label className="pagination-size">
          <span>Mỗi trang</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Trước
        </button>

        <span className="pagination-page">
          Trang {page}/{totalPages}
        </span>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
