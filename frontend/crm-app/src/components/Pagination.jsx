function Pagination({ dataPerPage, totalData, currentPage, paginate }) {
  const totalPages = Math.ceil(totalData / dataPerPage);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Paginacja">
      <ul className="crm-pagination">
        {pages.map((number) => (
          <li
            key={number}
            className={`crm-pagination__item${currentPage === number ? " active" : ""}`}
          >
            <a
              onClick={(e) => { e.preventDefault(); paginate(number); }}
              href="#"
              aria-current={currentPage === number ? "page" : undefined}
            >
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Pagination;
