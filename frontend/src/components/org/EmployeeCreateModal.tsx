import { useEffect, useState } from "react";
import { X } from "lucide-react";

type EmployeeStatus = "active" | "inactive";

type EmployeeFormValues = {
  name: string;
  department: "デイサービス" | "訪問介護";
  status: EmployeeStatus;
  note: string;
};

type EmployeeFormMode = "create" | "edit";

type EmployeeCreateModalProps = {
  open: boolean;
  onClose: () => void;
  mode: EmployeeFormMode;
  initialValues?: Partial<EmployeeFormValues>;
  onSubmit?: (values: EmployeeFormValues) => void;
};

function StatusToggle({
  status,
  onToggle,
}: {
  status: EmployeeStatus;
  onToggle: () => void;
}) {
  const isActive = status === "active";

  return (
    <button
      type="button"
      onClick={onToggle}
      className="relative inline-flex w-full max-w-[260px] items-center rounded-lg border border-slate-200 bg-background-light px-0 py-2.5 text-xs font-semibold text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      aria-pressed={isActive}
    >
      <span
        className={`pointer-events-none absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-white shadow-sm transition-all ${
          isActive ? "left-[calc(50%+2px)]" : "left-1"
        }`}
      />

      <span className="relative z-10 flex w-full items-center px-3.5">
        <span
          className={`transition-colors ${
            isActive ? "text-slate-400" : "text-slate-900"
          }`}
          style={{ width: "50%", textAlign: "center" }}
        >
          無効
        </span>
        <span
          className={`transition-colors ${
            isActive ? "text-emerald-700" : "text-slate-400"
          }`}
          style={{ width: "50%", textAlign: "center" }}
        >
          有効
        </span>
      </span>
    </button>
  );
}

export function EmployeeCreateModal({
  open,
  onClose,
  mode,
  initialValues,
  onSubmit,
}: EmployeeCreateModalProps) {
  const [name, setName] = useState("");
  const [department, setDepartment] =
    useState<EmployeeFormValues["department"]>("デイサービス");
  const [status, setStatus] = useState<EmployeeStatus>("active");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(initialValues?.name ?? "");
    setDepartment(initialValues?.department ?? "デイサービス");
    setStatus(initialValues?.status ?? "active");
    setNote(initialValues?.note ?? "");
  }, [open, initialValues?.name, initialValues?.department, initialValues?.status, initialValues?.note]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {mode === "create" ? "職員を追加" : "職員を編集"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === "create"
                ? "新しい職員の基本情報と部署、ステータスを登録します。"
                : "職員の基本情報や部署、ステータスを編集します。"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="モーダルを閉じる"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          className="px-6 pt-4 pb-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const values: EmployeeFormValues = {
              name,
              department,
              status,
              note,
            };
            onSubmit?.(values);
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="employee-name"
              className="block text-sm font-semibold text-slate-700"
            >
              氏名
            </label>
            <input
              id="employee-name"
              name="employee-name"
              type="text"
              placeholder="例：山田 太郎"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-background-light px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="employee-department"
                className="block text-sm font-semibold text-slate-700"
              >
                部署
              </label>
              <select
                id="employee-department"
                name="employee-department"
                className="w-full rounded-lg border border-slate-200 bg-background-light px-3.5 py-2.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value as EmployeeFormValues["department"])
                }
              >
                <option value="デイサービス">デイサービス</option>
                <option value="訪問介護">訪問介護</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="block text-sm font-semibold text-slate-700">
                ステータス
              </span>
              <StatusToggle
                status={status}
                onToggle={() =>
                  setStatus((prev) => (prev === "active" ? "inactive" : "active"))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="employee-note"
              className="block text-sm font-semibold text-slate-700"
            >
              メモ（任意）
            </label>
            <textarea
              id="employee-note"
              name="employee-note"
              rows={3}
              placeholder="担当業務や補足情報があれば記入してください。"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 bg-background-light px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 shadow-sm shadow-primary/20"
            >
              {mode === "create" ? "保存する" : "更新する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

