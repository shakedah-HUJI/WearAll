export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-5xl font-bold tracking-tight">WearAll</h1>
      <p className="text-lg text-gray-500">
        Your AI-powered stylist &amp; virtual wardrobe
      </p>
      <div className="mt-4 flex gap-4">
        <a
          href="/wardrobe"
          className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          My Wardrobe
        </a>
        <a
          href="/stylist"
          className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold hover:bg-gray-50"
        >
          AI Stylist
        </a>
      </div>
    </main>
  );
}
