import { OauthCallback } from "./oauth-callback";

interface OauthCallbackPageProps {
  searchParams?: Promise<{ code?: string }>;
}

export default async function OauthCallbackPage({ searchParams }: OauthCallbackPageProps) {
  const { code } = (await searchParams) ?? {};
  return <OauthCallback code={code} />;
}
