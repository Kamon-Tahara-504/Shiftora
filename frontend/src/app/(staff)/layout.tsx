import { RequireAuth } from "@/components/auth/RequireAuth";

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
