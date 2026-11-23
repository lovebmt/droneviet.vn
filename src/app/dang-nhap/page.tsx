import { CustomerGate } from "@/components/customer/customer-gate";

interface CustomerLoginPageProps {
  searchParams?: Promise<{ error?: string }>;
}

export default async function CustomerLoginPage({ searchParams }: CustomerLoginPageProps) {
  const { error } = (await searchParams) ?? {};
  const oauthError = error === "google" || error === "zalo" ? error : undefined;

  return <CustomerGate mode="login" oauthError={oauthError} />;
}
