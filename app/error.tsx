'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body className="bg-background text-ink">
        <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
          <section className="surface-card w-full p-6">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted">{error.message || 'Unexpected application error.'}</p>
            <button className="btn-primary mt-4" type="button" onClick={() => reset()}>
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

