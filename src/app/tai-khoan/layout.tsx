import type { Metadata } from "next";
import { AccountNav } from "@/components/account/account-nav";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Tài khoản", robots: { index: false } };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[12rem_1fr] lg:gap-12">
      <AccountNav />
      <div className="min-w-0">{children}</div>
    </Container>
  );
}
