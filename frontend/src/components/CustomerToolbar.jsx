import { PAGE_SIZE_OPTIONS } from "../hooks/usePageSize";

const CustomerToolbar = ({
    searchTerm,
    onSearchChange,
    sortField,
    onSortChange,
    sortOrder,
    onToggleSortOrder,
    pageSize,
    onPageSizeChange,
}) => (
    <div className="crm-toolbar">
        <div className="crm-search">
            <i className="fa-solid fa-magnifying-glass crm-search__icon" aria-hidden="true"></i>
            <input
                type="text"
                className="crm-search__input"
                placeholder="Szukaj po nazwie, NIP lub mieście..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Szukaj klientów"
            />
            {searchTerm && (
                <button
                    type="button"
                    className="crm-search__clear"
                    onClick={() => onSearchChange("")}
                    aria-label="Wyczyść wyszukiwanie"
                >
                    <i className="fa-solid fa-xmark"></i>
                </button>
            )}
        </div>

        <div className="crm-toolbar__controls">
            <label className="crm-select">
                <i className="fa-solid fa-arrow-up-wide-short" aria-hidden="true"></i>
                <span className="crm-select__text">Sortuj</span>
                <select
                    className="crm-select__control"
                    value={sortField}
                    onChange={onSortChange}
                    aria-label="Sortuj według"
                >
                    <option value="name">Nazwa firmy</option>
                    <option value="address.postcode">Kod pocztowy</option>
                    <option value="nip">NIP</option>
                </select>
            </label>

            <button
                type="button"
                className="crm-toolbar__order"
                onClick={onToggleSortOrder}
                aria-label="Zmień kierunek sortowania"
                title={sortOrder === "asc" ? "Rosnąco" : "Malejąco"}
            >
                <i className={`fa-solid fa-arrow-${sortOrder === "asc" ? "up" : "down"}`}></i>
                <span className="crm-toolbar__order-label">
                    {sortOrder === "asc" ? "Rosnąco" : "Malejąco"}
                </span>
            </button>

            <label className="crm-select">
                <i className="fa-solid fa-list" aria-hidden="true"></i>
                <span className="crm-select__text">Na stronie</span>
                <select
                    className="crm-select__control"
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(e.target.value)}
                    aria-label="Ilość klientów na stronie"
                >
                    {PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    </div>
);

export default CustomerToolbar;