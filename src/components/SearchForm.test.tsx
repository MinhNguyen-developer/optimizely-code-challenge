import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchForm } from './SearchForm';

describe('SearchForm', () => {
  test('blocks whitespace-only usernames with the existing validation message', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<SearchForm isLoading={false} onSubmit={onSubmit} />);
    await user.type(screen.getByRole('textbox', { name: /github username/i }), '   ');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter a GitHub username to search.',
    );
  });

  test('submits the username when Enter is pressed in the input', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<SearchForm isLoading={false} onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: /github username/i });
    await user.type(input, 'octocat');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('octocat');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  test('submits through the form handler for an Enter keydown event', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<SearchForm isLoading={false} onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: /github username/i });
    await user.type(input, 'octocat');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('octocat');
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
