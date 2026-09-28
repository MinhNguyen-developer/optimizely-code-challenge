import type { RepositoryPage, RepositorySummary } from '../types';

const API_BASE_URL = 'https://api.github.com';
const DEFAULT_PAGE_SIZE = 10;

interface GithubRepositoryResponse {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  language: string | null;
}

export class GithubApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'GithubApiError';
  }
}

export function parseLastPage(linkHeader: string | null): number {
  if (!linkHeader) {
    return 1;
  }

  const lastLink = linkHeader
    .split(',')
    .map((link) => link.trim())
    .find((link) => /rel="last"/.test(link));

  if (!lastLink) {
    return 1;
  }

  const urlMatch = lastLink.match(/<([^>]+)>/);
  if (!urlMatch) {
    return 1;
  }

  let pageValue: string | null;
  try {
    pageValue = new URL(urlMatch[1]).searchParams.get('page');
  } catch {
    return 1;
  }
  const page = Number(pageValue);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function mapRepository(repository: GithubRepositoryResponse): RepositorySummary {
  return {
    id: repository.id,
    name: repository.name,
    fullName: repository.full_name,
    description: repository.description,
    stars: repository.stargazers_count,
    htmlUrl: repository.html_url,
    language: repository.language,
  };
}

function errorForStatus(status: number, username: string): GithubApiError {
  if (status === 404) {
    return new GithubApiError(`GitHub user "${username}" was not found.`, status);
  }

  if (status === 403) {
    return new GithubApiError('GitHub rate limit reached. Please try again later.', status);
  }

  return new GithubApiError('GitHub could not complete the request.', status);
}

export async function fetchUserRepositories(
  username: string,
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
  signal?: AbortSignal,
): Promise<RepositoryPage> {
  const url = `${API_BASE_URL}/users/${encodeURIComponent(username)}/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`;
  const requestInit: RequestInit = {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  };

  if (signal) {
    requestInit.signal = signal;
  }

  const response = await fetch(url, requestInit);
  if (!response.ok) {
    throw errorForStatus(response.status, username);
  }

  const repositories = (await response.json() as GithubRepositoryResponse[]).map(mapRepository);
  return {
    repositories,
    page,
    totalPages: Math.max(page, parseLastPage(response.headers.get('Link'))),
  };
}
