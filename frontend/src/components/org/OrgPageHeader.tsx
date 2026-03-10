import { ReactNode } from "react";

type OrgPageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function OrgPageHeader({ title, description, actions }: OrgPageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="inline-flex w-full items-center justify-between gap-6 rounded-full bg-white/80 px-6 py-4 shadow-sm border border-slate-200">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
            {title}
          </h2>
          {description && (
            <p className="text-xs md:text-sm text-slate-500 mt-0.5 truncate">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex-shrink-0 flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

