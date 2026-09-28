import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getPageItems, Pagination } from './Pagination';

describe('Pagination', () => {
  test('renders page buttons and disables the boundary controls', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination
        currentPage={1}
        totalPages={3}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /page 2/i }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  test('marks the active page and compacts long page ranges', () => {
    render(
      <Pagination
        currentPage={5}
        totalPages={12}
        pageSize={10}
        onPageChange={vi.fn()}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /page 5/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(getPageItems(12, 5)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 12]);
  });

  test('jumps five pages in either direction', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination
        currentPage={8}
        totalPages={20}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /previous 5 pages/i }));
    await user.click(screen.getByRole('button', { name: /next 5 pages/i }));

    expect(onPageChange.mock.calls).toEqual([[3], [13]]);
  });

  test('changes rows per page and submits a destination page', async () => {
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const user = userEvent.setup();
    const paginationProps = {
      currentPage: 3,
      totalPages: 20,
      onPageChange,
      pageSize: 10,
      onPageSizeChange,
    };

    render(<Pagination {...paginationProps} />);

    const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i });
    expect(pageSizeSelect).toHaveValue('10');
    await user.selectOptions(pageSizeSelect, '20');
    expect(onPageSizeChange).toHaveBeenCalledWith(20);

    const destinationInput = screen.getByRole('spinbutton', { name: /go to page/i });
    await user.clear(destinationInput);
    await user.type(destinationInput, '14');
    await user.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenCalledWith(14);
  });

  test('does not request the page that is already active', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        pageSize={10}
        onPageChange={onPageChange}
        onPageSizeChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /page 2/i }));

    expect(onPageChange).not.toHaveBeenCalled();
  });

  test('keeps the rows-per-page control available for a single page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
        pageSize={10}
        onPageSizeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: /rows per page/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
  });
});
