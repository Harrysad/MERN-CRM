import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Pagination from '../../../src/components/Pagination';

describe('Pagination', () => {
  it('renders nothing when there is only one page', () => {
    const { container } = render(
      <Pagination dataPerPage={10} totalData={5} currentPage={1} paginate={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a link for each page', () => {
    render(
      <Pagination dataPerPage={10} totalData={35} currentPage={1} paginate={() => {}} />
    );
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('marks the current page as active', () => {
    render(
      <Pagination dataPerPage={10} totalData={35} currentPage={2} paginate={() => {}} />
    );
    expect(screen.getByText('2')).toHaveAttribute('aria-current', 'page');
  });

  it('calls paginate with the clicked page number', () => {
    const paginate = vi.fn();
    render(
      <Pagination dataPerPage={10} totalData={35} currentPage={1} paginate={paginate} />
    );
    fireEvent.click(screen.getByText('3'));
    expect(paginate).toHaveBeenCalledWith(3);
  });
});