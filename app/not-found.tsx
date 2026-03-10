import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <section className="surface-card w-full p-6">
        <h1 className="text-xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-muted">The requested page does not exist.</p>
        <Link className="btn-primary mt-4 inline-flex" href="/">
          Return Home
        </Link>
      </section>
    </main>
  );
}

