export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen p-6">
      <nav className="mb-6 flex gap-4 text-sm">
        <a href="/my-shifts" className="text-blue-600 hover:underline">
          自分のシフト
        </a>
        <a href="/day-offs" className="text-blue-600 hover:underline">
          希望休
        </a>
        <a href="/" className="text-zinc-500 hover:underline">
          トップ
        </a>
      </nav>
      {children}
    </div>
  );
}
