import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZES = [10, 25, 50];

interface Props {
  page: number; // starts at 0
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

export default function Pagination({ page, size, totalElements, totalPages, onPageChange, onSizeChange }: Props) {
  const first = totalElements === 0 ? 0 : page * size + 1;
  const last = Math.min((page + 1) * size, totalElements);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination-info">Showing {first}–{last} of {totalElements}</span>
      <label className="pagination-size">
        Rows per page
        <select className="form-control" value={size} onChange={e => onSizeChange(Number(e.target.value))} aria-label="Rows per page">
          {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <div className="pagination-buttons">
        <button className="btn btn-secondary btn-sm" disabled={page === 0} onClick={() => onPageChange(page - 1)} aria-label="Previous page">
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="pagination-current">Page {totalPages === 0 ? 0 : page + 1} of {totalPages}</span>
        <button className="btn btn-secondary btn-sm" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Next page">
          Next <ChevronRight size={14} />
        </button>
      </div>
    </nav>
  );
}
