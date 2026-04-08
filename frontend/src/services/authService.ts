import { apiFetch, parseApiError, type AuthTokens } from "@/lib/api";

export type AuthUser = {
  id: string;
  email: string;
  organization_id: string | null;
  role: "org_admin" | "staff";
  system_role: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterOrgInput = {
  organization_name: string;
  admin_email: string;
  password: string;
};

export type SignupInput = {
  token: string;
  password: string;
};

export type RegisterOrgResponse = AuthTokens & {
  organization_id: string;
  user_id: string;
};

export type SignupResponse = AuthTokens & {
  organization_id: string;
  user_id: string;
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

export async function signup(input: SignupInput): Promise<SignupResponse> {
  const response = await apiFetch(
    "/auth/signup",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    false,
  );
  if (!response.ok) {
    throw await parseApiError(response);
  }
  return (await response.json()) as SignupResponse;
}
