import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GithubApiError, fetchUserRepositories } from './api/githubApi';
import { App } from './App';

vi.mock('./api/githubApi', async () => {
  const actual = await vi.importActual<typeof import('./api/githubApi')>('./api/githubApi');
  return {
    ...actual,
    fetchUserRepositories: vi.fn(),
  };
});

const mockedFetchUserRepositories = vi.mocked(fetchUserRepositories);

function repository(overrides: Partial<Awaited<ReturnType<typeof fetchUserRepositories>>['repositories'][number]> = {}) {
  return {
    id: 1,
    name: 'hello-world',
    fullName: 'octocat/hello-world',
    description: 'Example repository',
    stars: 42,
    htmlUrl: 'https://github.com/octocat/hello-world',
    language: 'TypeScript',
    ...overrides,
  };
}

function page(
  repositories: Awaited<ReturnType<typeof fetchUserRepositories>>['repositories'],
  currentPage = 1,
  totalPages = 1,
) {
  return { repositories, page: currentPage, totalPages };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

describe('App', () => {
  beforeEach(() => {
    mockedFetchUserRepositories.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('trims the username and renders repository cards after submit', async () => {
    mockedFetchUserRepositories.mockResolvedValue(page([repository()]));
    const user = userEvent.setup();

    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /github username/i }), '  octocat  ');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));

    expect(mockedFetchUserRepositories).toHaveBeenCalledWith('octocat', 1, 10, expect.anything());
    expect(await screen.findByRole('link', { name: /hello-world/i })).toHaveAttribute(
      'href',
      'https://github.com/octocat/hello-world',
    );
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  test('triggers the search when Enter is pressed in the username field', async () => {
    mockedFetchUserRepositories.mockResolvedValue(page([repository()]));
    const user = userEvent.setup();

    render(<App />);
    const input = screen.getByRole('textbox', { name: /github username/i });
    await user.type(input, 'octocat');
    await user.keyboard('{Enter}');

    expect(mockedFetchUserRepositories).toHaveBeenCalledWith(
      'octocat',
      1,
      10,
      expect.anything(),
    );
    expect(await screen.findByRole('link', { name: /hello-world/i })).toBeInTheDocument();
  });

  test('rejects an empty username without making an API request', async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /github username/i }), '   ');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));

    expect(screen.getByText('Enter a GitHub username to search.')).toBeInTheDocument();
    expect(mockedFetchUserRepositories).not.toHaveBeenCalled();
  });

  test('shows an empty state when the user has no public repositories', async () => {
    mockedFetchUserRepositories.mockResolvedValue(page([]));
    const user = userEvent.setup();

    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /github username/i }), 'octocat');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));

    expect(await screen.findByText('No public repositories found for this user.')).toBeInTheDocument();
  });

  test('shows the API error and keeps the search form available', async () => {
    mockedFetchUserRepositories.mockRejectedValue(
      new GithubApiError('GitHub user "missing" was not found.', 404),
    );
    const user = userEvent.setup();

    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /github username/i }), 'missing');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'GitHub user "missing" was not found.',
    );
    expect(screen.getByRole('button', { name: /search repositories/i })).toBeInTheDocument();
  });

  test('loads the next page when the next-page control is clicked', async () => {
    mockedFetchUserRepositories
      .mockResolvedValueOnce(page([repository()], 1, 2))
      .mockResolvedValueOnce(page([repository({ id: 2, name: 'second-page' })], 2, 2));
    const user = userEvent.setup();

    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /github username/i }), 'octocat');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));
    await screen.findByRole('link', { name: /hello-world/i });

    await user.click(screen.getByRole('button', { name: /next page/i }));

    expect(mockedFetchUserRepositories).toHaveBeenLastCalledWith(
      'octocat',
      2,
      10,
      expect.anything(),
    );
    expect(await screen.findByRole('link', { name: /second-page/i })).toBeInTheDocument();
  });

  test('reloads the first page with the selected rows per page', async () => {
    mockedFetchUserRepositories
      .mockResolvedValueOnce(page([repository()], 1, 3))
      .mockResolvedValueOnce(page([repository({ id: 2, name: 'larger-page' })], 1, 2));
    const user = userEvent.setup();

    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /github username/i }), 'octocat');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));
    await screen.findByRole('link', { name: /hello-world/i });

    await user.selectOptions(screen.getByRole('combobox', { name: /rows per page/i }), '20');

    expect(mockedFetchUserRepositories).toHaveBeenLastCalledWith(
      'octocat',
      1,
      20,
      expect.anything(),
    );
    expect(await screen.findByRole('link', { name: /larger-page/i })).toBeInTheDocument();
  });

  test('keeps the current cards visible while another page loads', async () => {
    const nextPage = deferred<ReturnType<typeof page>>();
    mockedFetchUserRepositories
      .mockResolvedValueOnce(page([repository()], 1, 2))
      .mockImplementationOnce(() => nextPage.promise);
    const user = userEvent.setup();

    render(<App />);
    await user.type(screen.getByRole('textbox', { name: /github username/i }), 'octocat');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));
    await screen.findByRole('link', { name: /hello-world/i });
    await user.click(screen.getByRole('button', { name: /next page/i }));

    expect(screen.getByRole('link', { name: /hello-world/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/loading repositories/i);

    nextPage.resolve(page([repository({ id: 2, name: 'second-page' })], 2, 2));
    expect(await screen.findByRole('link', { name: /second-page/i })).toBeInTheDocument();
  });

  test('does not let an older request overwrite the newest result', async () => {
    const firstRequest = deferred<ReturnType<typeof page>>();
    const secondRequest = deferred<ReturnType<typeof page>>();
    mockedFetchUserRepositories
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise);
    const user = userEvent.setup();

    render(<App />);
    const input = screen.getByRole('textbox', { name: /github username/i });
    await user.type(input, 'first-user');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));
    await waitFor(() => expect(mockedFetchUserRepositories).toHaveBeenCalledTimes(1));

    await user.clear(input);
    await user.type(input, 'second-user');
    await user.click(screen.getByRole('button', { name: /search repositories/i }));
    await waitFor(() => expect(mockedFetchUserRepositories).toHaveBeenCalledTimes(2));

    secondRequest.resolve(page([repository({ id: 2, name: 'newest-result' })]));
    expect(await screen.findByRole('link', { name: /newest-result/i })).toBeInTheDocument();

    firstRequest.resolve(page([repository({ id: 3, name: 'stale-result' })]));
    await waitFor(() => expect(screen.queryByRole('link', { name: /stale-result/i })).not.toBeInTheDocument());
  });
});
