import { useForm } from 'react-hook-form';
import type { KeyboardEvent } from 'react';

interface SearchFormProps {
  isLoading: boolean;
  onSubmit: (username: string) => void;
}

interface SearchFormValues {
  username: string;
}

export function SearchForm({ isLoading, onSubmit }: SearchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchFormValues>({ defaultValues: { username: '' } });

  const submitForm = handleSubmit(({ username }) => onSubmit(username));

  function handleUsernameKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submitForm(event);
    }
  }

  return (
    <form className="search-form" onSubmit={submitForm} noValidate>
      <label htmlFor="github-username">GitHub username</label>
      <div className="search-form__controls">
        <input
          {...register('username', {
            validate: (value) => value.trim().length > 0 || 'Enter a GitHub username to search.',
          })}
          id="github-username"
          type="text"
          autoComplete="off"
          placeholder="e.g. octocat"
          onKeyDown={handleUsernameKeyDown}
          aria-invalid={errors.username ? 'true' : 'false'}
          aria-describedby={errors.username ? 'github-username-error' : undefined}
        />
        <button type="submit" aria-busy={isLoading}>
          Search repositories
        </button>
      </div>
      {errors.username && (
        <p id="github-username-error" className="search-form__error" role="alert">
          {errors.username.message}
        </p>
      )}
    </form>
  );
}
