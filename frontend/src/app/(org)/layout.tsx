import { RequireAuth } from "@/components/auth/RequireAuth";

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequireAuth>{children}</RequireAuth>;
}
