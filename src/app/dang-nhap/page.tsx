import { CustomerGate } from "@/components/customer/customer-gate";

interface CustomerLoginPageProps {
  searchParams?: Promise<{ detail?: string; error?: string; reason?: string }>;
}

// Step names the API reports in ?reason=; anything else in the URL is ignored, never echoed.
const oauthReasons = ["config", "denied", "profile", "state", "token_exchange", "unknown"];

export default async function CustomerLoginPage({ searchParams }: CustomerLoginPageProps) {
  const { detail, error, reason } = (await searchParams) ?? {};
  const oauthError = error === "google" || error === "zalo" ? error : undefined;
  const oauthReason = oauthError && reason && oauthReasons.includes(reason) ? reason : undefined;

  // Same alphabet the API emits; anything else (markup, long strings) is dropped, never echoed.
  const oauthDetail = oauthReason && detail && /^[\w .,:=-]{1,80}$/.test(detail) ? detail : undefined;

  return (
    <CustomerGate mode="login" oauthError={oauthError} oauthReason={oauthReason} oauthDetail={oauthDetail} />
  );
}
