import type { RepositorySummary } from "../types";

interface RepositoryCardProps {
  repository: RepositorySummary;
}

const numberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function RepositoryCard({ repository }: RepositoryCardProps) {
  return (
    <li className="repository-card">
      <div className="repository-card__topline">
        <span className="repository-card__icon" aria-hidden="true">
          ◈
        </span>
        <a
          className="repository-card__name"
          href={repository.htmlUrl}
          target="_blank"
          rel="noreferrer"
        >
          {repository.name}
        </a>
        <span className="repository-card__visibility">Public</span>
      </div>
      <p className="repository-card__description">
        {repository.description || "No description provided."}
      </p>
      <div className="repository-card__meta">
        <span>
          <span className="meta-dot meta-dot--gold" aria-hidden="true">
            ★
          </span>
          {numberFormatter.format(repository.stars)}
          <span className="sr-only"> stars</span>
        </span>
        {repository.language && (
          <span>
            <span className="meta-dot meta-dot--blue" aria-hidden="true" />
            {repository.language}
          </span>
        )}
      </div>
    </li>
  );
}
