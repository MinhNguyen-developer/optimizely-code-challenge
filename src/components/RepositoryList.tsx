import type { RepositorySummary } from '../types';
import { RepositoryCard } from './RepositoryCard';

interface RepositoryListProps {
  isLoading: boolean;
  repositories: RepositorySummary[];
}

export function RepositoryList({ isLoading, repositories }: RepositoryListProps) {
  if (isLoading && repositories.length === 0) {
    return (
      <ul className="repository-grid" aria-label="Loading repositories" aria-busy="true">
        {Array.from({ length: 6 }, (_, index) => (
          <li className="repository-card repository-card--skeleton" key={index} aria-hidden="true">
            <span className="skeleton-line skeleton-line--short" />
            <span className="skeleton-line" />
            <span className="skeleton-line skeleton-line--medium" />
            <span className="skeleton-line skeleton-line--tiny" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <ul
        className="repository-grid"
        aria-label={isLoading ? 'Repositories loading' : 'Repositories'}
        aria-busy={isLoading}
      >
        {repositories.map((repository) => (
          <RepositoryCard key={repository.id} repository={repository} />
        ))}
      </ul>
      {isLoading && <p className="loading-note" role="status">Loading repositories…</p>}
    </>
  );
}
