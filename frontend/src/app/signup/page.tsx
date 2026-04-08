import SignupPage from "@/app/pages/auth/SignupPage";

type SignupRouteProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function SignupRoute({ searchParams }: SignupRouteProps) {
  const params = await searchParams;
  const token = (params.token ?? "").trim();
  return <SignupPage token={token} />;
}