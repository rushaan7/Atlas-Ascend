import dynamic from 'next/dynamic';

const GameShell = dynamic(() => import('@/components/game-shell').then((module) => module.GameShell), {
  ssr: false,
  loading: () => (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="surface-card p-6">
        <p className="text-sm text-muted">Loading map experience...</p>
      </div>
    </main>
  )
});

export default function HomePage() {
  return (
    <main>
      <GameShell />
    </main>
  );
}
