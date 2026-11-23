import { CustomerGate } from "@/components/customer/customer-gate";

interface CustomerLoginPageProps {
  searchParams?: Promise<{ error?: string; reason?: string }>;
}

// Step names the API reports in ?reason=; anything else in the URL is ignored, never echoed.
const oauthReasons = ["config", "denied", "profile", "state", "token_exchange", "unknown"];

export default async function CustomerLoginPage({ searchParams }: CustomerLoginPageProps) {
  const { error, reason } = (await searchParams) ?? {};
  const oauthError = error === "google" || error === "zalo" ? error : undefined;
  const oauthReason = oauthError && reason && oauthReasons.includes(reason) ? reason : undefined;

  return <CustomerGate mode="login" oauthError={oauthError} oauthReason={oauthReason} />;
}
