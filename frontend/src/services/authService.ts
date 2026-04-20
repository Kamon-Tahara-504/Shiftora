import { apiFetch, parseApiError, type AuthTokens } from "@/lib/api";

export type AuthUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  organization_id: string | null;
  role: "org_admin" | "staff" | null;
  system_role: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterOrgInput = {
  organization_name: string;
  service_token: string;
};

export type RegisterUserInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

export type RegisterOrgResponse = AuthTokens & {
  organization_id: string;
  user_id: string;
};

export type RegisterUserResponse = AuthTokens & {
  organization_id: string | null;
  user_id: string;
  message: string;
};

export type UserInvitation = {
  id: string;
  organization_id: string;
  role: "staff";
  status: "pending" | "accepted" | "rejected" | "expired";
  expires_at: string;
  created_at: string;
};

export type AcceptInvitationResponse = AuthTokens & {
  status: "accepted";
  message: string;
  organization_id: string;
};

export type AdminServiceToken = {
  id: string;
  purpose: "create_org";
  is_active: boolean;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
  state: "active" | "revoked_or_used" | "expired";
};

export type AdminIssueServiceTokenResponse = {
  id: string;
  token: string;
  purpose: "create_org";
  is_active: boolean;
  expires_at: string | null;
  used_at: string | null;
  created_at: string;
  message: string;
};

export type OrganizationAuditItem = {
  organization_id: string;
  organization_name: string;
  subscription_status: string;
  plan_type: string | null;
  max_users: number;
  active_user_count: number;
  remaining_slots: number;
  subscription_expires_at: string | null;
  created_at: string;
};

export async function fetchMe(): Promise<AuthUser> {
  const response = await apiFetch("/auth/me");
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as AuthUser;
}

export async function login(input: LoginInput): Promise<AuthTokens> {
  const response = await apiFetch(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    false,
  );
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as AuthTokens;
}

export async function logout(): Promise<void> {
  const response = await apiFetch("/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw await parseApiError(response);
  }
}

export async function registerUser(input: RegisterUserInput): Promise<RegisterUserResponse> {
  const response = await apiFetch(
    "/auth/register-user",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    false,
  );
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as RegisterUserResponse;
}

export async function registerOrg(input: RegisterOrgInput): Promise<RegisterOrgResponse> {
  const response = await apiFetch(
    "/auth/register-org",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    false,
  );
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as RegisterOrgResponse;
}

export async function getMyInvitations(): Promise<UserInvitation[]> {
  const response = await apiFetch("/org/invitations/me");
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as UserInvitation[];
}

export async function acceptInvitation(invitationId: string): Promise<AcceptInvitationResponse> {
  const response = await apiFetch(`/org/invitations/${invitationId}/accept`, {
    method: "POST",
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as AcceptInvitationResponse;
}

export async function adminIssueServiceToken(expires_in_hours?: number): Promise<AdminIssueServiceTokenResponse> {
  const response = await apiFetch("/admin/service-tokens", {
    method: "POST",
    body: JSON.stringify({
      purpose: "create_org",
      expires_in_hours: expires_in_hours ?? null,
    }),
  });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as AdminIssueServiceTokenResponse;
}

export async function adminListServiceTokens(): Promise<AdminServiceToken[]> {
  const response = await apiFetch("/admin/service-tokens");
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as AdminServiceToken[];
}

export async function adminRevokeServiceToken(tokenId: string): Promise<{ message: string }> {
  const response = await apiFetch(`/admin/service-tokens/${tokenId}/revoke`, { method: "POST" });
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as { message: string };
}

export async function adminListOrganizationAudit(): Promise<OrganizationAuditItem[]> {
  const response = await apiFetch("/admin/organizations/audit");
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as OrganizationAuditItem[];
}
