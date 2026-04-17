import { useEffect, useMemo, useState } from 'react';

const usePagination = (items, options = {}) => {
  const {
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 50],
    resetDeps = [],
  } = options;

  const sourceItems = Array.isArray(items) ? items : [];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = sourceItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    setPage(1);
  }, resetDeps);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return sourceItems.slice(startIndex, startIndex + pageSize);
  }, [sourceItems, page, pageSize]);

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(page * pageSize, totalItems);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageSizeOptions,
    totalItems,
    totalPages,
    pageItems,
    startItem,
    endItem,
  };
};

export default usePagination;
