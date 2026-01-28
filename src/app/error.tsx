"use client";

export default function ErrorPage(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-neutral-700">
        The classroom chat hit an unexpected error. Try again, and if it persists,
        report it to your teacher/admin.
      </p>
      <pre className="overflow-auto rounded-lg border border-neutral-200 bg-white p-4 text-xs text-neutral-800">
        {props.error.message}
      </pre>
      <button
        className="w-fit rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
        onClick={() => props.reset()}
      >
        Retry
      </button>
    </div>
  );
}

