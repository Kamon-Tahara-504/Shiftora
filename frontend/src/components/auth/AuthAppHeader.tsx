import { CalendarDays } from "lucide-react";

export function AuthAppHeader() {
  return (
    <header className="w-full px-6 py-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-primary/10 sticky top-0 z-50">
      <div className="flex items-center gap-2.5">
        <div className="bg-primary p-2 rounded-xl flex items-center justify-center">
          <CalendarDays className="text-white w-6 h-6" />
        </div>
        <div className="flex flex-col leading-tight">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Shiftora
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            シフト最適化アプリ
          </p>
        </div>
      </div>
    </header>
  );
}

