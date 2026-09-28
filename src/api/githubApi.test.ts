import { afterEach, describe, expect, test, vi } from 'vitest';
import { GithubApiError, fetchUserRepositories, parseLastPage } from './githubApi';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('parseLastPage', () => {
  test('extracts the last page from a GitHub Link header', () => {
    expect(
      parseLastPage(
        '<https://api.github.com/users/octocat/repos?page=2>; rel="next", <https://api.github.com/users/octocat/repos?page=4>; rel="last"',
      ),
    ).toBe(4);
  });

  test('defaults to one page when GitHub omits a last link', () => {
    expect(parseLastPage(null)).toBe(1);
    expect(
      parseLastPage('<https://api.github.com/users/octocat/repos?page=2>; rel="next"'),
    ).toBe(1);
  });

  test('defaults to one page when the last link is malformed', () => {
    expect(parseLastPage('<not-a-url>; rel="last"')).toBe(1);
  });
});

describe('fetchUserRepositories', () => {
  test('keeps the requested page as the total on the final page without a last link', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('[]', {
          status: 200,
          headers: {
            Link: '<https://api.github.com/users/octocat/repos?page=4>; rel="prev"',
          },
        }),
      ),
    );

    await expect(fetchUserRepositories('octocat', 5, 9)).resolves.toEqual({
      repositories: [],
      page: 5,
      totalPages: 5,
    });
  });

  test('maps repository fields and sends the expected request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: 1,
            name: 'hello-world',
            full_name: 'octocat/hello-world',
            description: 'Example',
            stargazers_count: 12,
            html_url: 'https://github.com/octocat/hello-world',
            language: 'TypeScript',
          },
        ]),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            Link: '<https://api.github.com/users/octocat/repos?page=3>; rel="last"',
          },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchUserRepositories('octocat', 2, 9)).resolves.toEqual({
      repositories: [
        {
          id: 1,
          name: 'hello-world',
          fullName: 'octocat/hello-world',
          description: 'Example',
          stars: 12,
          htmlUrl: 'https://github.com/octocat/hello-world',
          language: 'TypeScript',
        },
      ],
      page: 2,
      totalPages: 3,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/users/octocat/repos?per_page=9&page=2&sort=updated&direction=desc',
      expect.objectContaining({
        headers: { Accept: 'application/vnd.github+json' },
      }),
    );
  });

  test('encodes usernames before making a request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('[]', { status: 200 })),
    );

    await fetchUserRepositories('octo/cat', 1);

    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/users/octo%2Fcat/repos?per_page=10&page=1&sort=updated&direction=desc',
      expect.anything(),
    );
  });

  test('turns a missing user response into a friendly GithubApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));

    await expect(fetchUserRepositories('unknown-user', 1)).rejects.toEqual(
      new GithubApiError('GitHub user "unknown-user" was not found.', 404),
    );
  });

  test('turns a rate limit response into a friendly GithubApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 403 })));

    await expect(fetchUserRepositories('octocat', 1)).rejects.toEqual(
      new GithubApiError('GitHub rate limit reached. Please try again later.', 403),
    );
  });
});
