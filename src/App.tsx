import { useReducer, useRef } from "react";
import { GithubApiError, fetchUserRepositories } from "./api/githubApi";
import { Pagination } from "./components/Pagination";
import { RepositoryList } from "./components/RepositoryList";
import { SearchForm } from "./components/SearchForm";
import type { RepositorySummary } from "./types";

type SearchStatus = "idle" | "loading" | "success" | "error";

interface SearchState {
  username: string;
  repositories: RepositorySummary[];
  page: number;
  totalPages: number;
  pageSize: number;
  status: SearchStatus;
  error: string | null;
}

type SearchAction =
  | { type: "search-start"; username: string; page: number; pageSize: number }
  | {
      type: "search-success";
      repositories: RepositorySummary[];
      page: number;
      totalPages: number;
    }
  | { type: "search-error"; message: string }
  | { type: "validation-error"; message: string };

const initialState: SearchState = {
  username: "",
  repositories: [],
  page: 1,
  totalPages: 1,
  pageSize: 10,
  status: "idle",
  error: null,
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case "search-start":
      return {
        ...state,
        username: action.username,
        page: action.page,
        pageSize: action.pageSize,
        status: "loading",
        error: null,
      };
    case "search-success":
      return {
        ...state,
        repositories: action.repositories,
        page: action.page,
        totalPages: action.totalPages,
        status: "success",
        error: null,
      };
    case "search-error":
      return { ...state, status: "error", error: action.message };
    case "validation-error":
      return { ...state, status: "error", error: action.message };
    default:
      return state;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof GithubApiError) {
    return error.message;
  }

  return "We could not reach GitHub. Please try again.";
}

export function App() {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const requestId = useRef(0);
  const activeController = useRef<AbortController | null>(null);

  async function loadRepositories(username: string, page: number, pageSize: number) {
    activeController.current?.abort();
    const controller = new AbortController();
    activeController.current = controller;
    const currentRequestId = ++requestId.current;

    dispatch({ type: "search-start", username, page, pageSize });

    try {
      const result = await fetchUserRepositories(
        username,
        page,
        pageSize,
        controller.signal,
      );
      if (currentRequestId !== requestId.current) {
        return;
      }
      dispatch({
        type: "search-success",
        repositories: result.repositories,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (error) {
      if (currentRequestId !== requestId.current) {
        return;
      }
      dispatch({ type: "search-error", message: getErrorMessage(error) });
    }
  }

  function handleSearch(value: string) {
    const username = value.trim();
    if (!username) {
      activeController.current?.abort();
      requestId.current += 1;
      dispatch({
        type: "validation-error",
        message: "Enter a GitHub username to search.",
      });
      return;
    }

    void loadRepositories(username, 1, state.pageSize);
  }

  function handlePageChange(page: number) {
    if (
      state.username &&
      page >= 1 &&
      page <= state.totalPages &&
      page !== state.page
    ) {
      void loadRepositories(state.username, page, state.pageSize);
    }
  }

  function handlePageSizeChange(pageSize: number) {
    if (state.username && pageSize !== state.pageSize) {
      void loadRepositories(state.username, 1, pageSize);
    }
  }

  const hasResults =
    state.repositories.length > 0 &&
    (state.status === "success" || state.status === "loading");

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero__eyebrow">
          <span aria-hidden="true">⌘</span> OPEN SOURCE DISCOVERY
        </div>
        <h1>Explore the code</h1>
        <p>Search public repositories by GitHub username</p>
      </header>

      <section className="search-panel" aria-label="Search GitHub repositories">
        <SearchForm
          isLoading={state.status === "loading"}
          onSubmit={handleSearch}
        />
      </section>

      {state.error && (
        <p className="status-message status-message--error" role="alert">
          {state.error}
        </p>
      )}

      {state.status === "idle" && (
        <section className="welcome-state" aria-live="polite">
          <div className="welcome-state__icon" aria-hidden="true">
            ◌
          </div>
          <h2>Start with a username</h2>
          <p>
            Try{" "}
            <button type="button" onClick={() => handleSearch("octocat")}>
              octocat
            </button>{" "}
            or search for any GitHub creator.
          </p>
        </section>
      )}

      {state.status === "loading" && state.repositories.length === 0 && (
        <RepositoryList isLoading repositories={state.repositories} />
      )}

      {state.status === "success" && !hasResults && (
        <section className="empty-state" aria-live="polite">
          <h2>No public repositories found for this user.</h2>
          <p>Try another username or check the spelling and search again.</p>
        </section>
      )}

      {hasResults && (
        <section className="results-section" aria-live="polite">
          <div className="results-heading">
            <div>
              <p className="section-kicker">PUBLIC REPOSITORIES</p>
              <h2>{state.username}&apos;s collection</h2>
            </div>
            <span className="results-count">
              Page {state.page} of {state.totalPages}
            </span>
          </div>
          <RepositoryList
            isLoading={state.status === "loading"}
            repositories={state.repositories}
          />
          <Pagination
            currentPage={state.page}
            totalPages={state.totalPages}
            pageSize={state.pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </section>
      )}
    </main>
  );
}
