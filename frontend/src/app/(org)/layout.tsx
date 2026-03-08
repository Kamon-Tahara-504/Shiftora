export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen p-6">
      <nav className="mb-6 flex gap-4 text-sm">
        <a href="/employees" className="text-blue-600 hover:underline">
          職員管理
        </a>
        <a href="/shift/generate" className="text-blue-600 hover:underline">
          シフト生成
        </a>
        <a href="/shift/calendar" className="text-blue-600 hover:underline">
          シフトカレンダー
        </a>
        <a href="/" className="text-zinc-500 hover:underline">
          トップ
        </a>
      </nav>
      {children}
    </div>
  );
}
