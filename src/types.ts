export interface RepositorySummary {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  htmlUrl: string;
  language: string | null;
}

export interface RepositoryPage {
  repositories: RepositorySummary[];
  page: number;
  totalPages: number;
}
