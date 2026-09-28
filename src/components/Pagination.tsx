import { useEffect, useState, type FormEvent } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export type PageItem = number | 'ellipsis';

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function getPageItems(totalPages: number, currentPage: number): PageItem[] {
  if (totalPages <= 0) {
    return [];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  const items: PageItem[] = [1];

  if (start > 2) {
    items.push('ellipsis');
  }

  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    items.push(pageNumber);
  }

  if (end < totalPages - 1) {
    items.push('ellipsis');
  }

  items.push(totalPages);
  return items;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const [destinationPage, setDestinationPage] = useState(String(currentPage));

  useEffect(() => {
    setDestinationPage(String(currentPage));
  }, [currentPage]);

  if (totalPages <= 0) {
    return null;
  }

  function submitDestinationPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const page = Number(destinationPage);
    if (Number.isInteger(page) && page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  }

  const previousFivePage = Math.max(1, currentPage - 5);
  const nextFivePage = Math.min(totalPages, currentPage + 5);

  return (
    <nav className="pagination" aria-label="Repository pages">
      <div className="pagination__navigation">
        <button
          type="button"
          className="pagination__jump-button"
          aria-label="Previous 5 pages"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(previousFivePage)}
        >
          « <span>5</span>
        </button>
        <button
          type="button"
          className="pagination__edge-button"
          aria-label="Previous page"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          ← <span>Previous</span>
        </button>
        <div className="pagination__pages">
          {getPageItems(totalPages, currentPage).map((item, index) => (
            item === 'ellipsis' ? (
              <span className="pagination__ellipsis" key={`ellipsis-${index}`} aria-hidden="true">…</span>
            ) : (
              <button
                type="button"
                className="pagination__page-button"
                key={item}
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? 'page' : undefined}
                onClick={() => {
                  if (item !== currentPage) {
                    onPageChange(item);
                  }
                }}
              >
                {item}
              </button>
            )
          ))}
        </div>
        <button
          type="button"
          className="pagination__edge-button"
          aria-label="Next page"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span>Next</span> →
        </button>
        <button
          type="button"
          className="pagination__jump-button"
          aria-label="Next 5 pages"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(nextFivePage)}
        >
          <span>5</span> »
        </button>
      </div>
      <div className="pagination__options">
        <label htmlFor="pagination-page-size">Rows per page</label>
        <select
          id="pagination-page-size"
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option value={option} key={option}>{option}</option>
          ))}
        </select>
        <form className="pagination__destination" onSubmit={submitDestinationPage}>
          <label htmlFor="pagination-destination-page">Go to page</label>
          <input
            id="pagination-destination-page"
            type="number"
            min={1}
            max={totalPages}
            value={destinationPage}
            onChange={(event) => setDestinationPage(event.target.value)}
          />
          <button type="submit">Go</button>
        </form>
      </div>
    </nav>
  );
}
