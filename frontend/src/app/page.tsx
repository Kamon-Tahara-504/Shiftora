export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <main className="text-center">
        <h1 className="text-2xl font-semibold">Shiftora</h1>
        <p className="mt-2 text-zinc-600">
          未認証ならログインへ、認証済みならロールに応じたダッシュボードへ（5.1 で実装）
        </p>
        <nav className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <a href="/login" className="text-blue-600 hover:underline">
            ログイン
          </a>
          <a href="/signup" className="text-blue-600 hover:underline">
            招待 signup
          </a>
          <a href="/employees" className="text-blue-600 hover:underline">
            職員管理
          </a>
          <a href="/shift/generate" className="text-blue-600 hover:underline">
            シフト生成
          </a>
          <a href="/shift/calendar" className="text-blue-600 hover:underline">
            シフトカレンダー
          </a>
          <a href="/my-shifts" className="text-blue-600 hover:underline">
            自分のシフト
          </a>
          <a href="/day-offs" className="text-blue-600 hover:underline">
            希望休
          </a>
        </nav>
      </main>
    </div>
  );
}
