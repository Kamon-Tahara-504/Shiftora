"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const ADMIN_SYSTEM_ROLES = new Set(["super_admin", "support_admin"]);

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.system_role && ADMIN_SYSTEM_ROLES.has(user.system_role)) {
      router.replace("/admin/tokens");
      return;
    }
    if (!user.role) {
      router.replace("/invitations");
      return;
    }
    if (user.role === "org_admin") {
      router.replace("/employees");
      return;
    }
    router.replace("/my-shifts");
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return null;
}
