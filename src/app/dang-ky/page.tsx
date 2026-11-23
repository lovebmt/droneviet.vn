import type { Metadata } from "next";
import { CustomerGate } from "@/components/customer/customer-gate";

export const metadata: Metadata = { title: "Tạo tài khoản", robots: { index: false } };

export default async function CustomerRegisterPage({ searchParams }: { searchParams?: Promise<{ tiep?: string }> }) {
  const { tiep } = (await searchParams) ?? {};
  return <CustomerGate mode="register" next={tiep} />;
}
