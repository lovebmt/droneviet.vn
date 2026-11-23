"use client";

import { AdminGate } from "@/components/admin/admin-gate";
import { AdminUserContext } from "@/components/admin/admin-context";
import { AdminNav } from "@/components/admin/admin-nav";
import { Container } from "@/components/ui/container";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="py-8 sm:py-10">
      <AdminGate>
        {(user) => (
          <AdminUserContext.Provider value={user}>
            <div className="grid gap-8 lg:grid-cols-[12rem_1fr]">
              <div>
                <p className="mb-3 px-4 text-sm text-muted">Quản trị</p>
                <AdminNav roles={user.roles} />
              </div>
              <div className="min-w-0">{children}</div>
            </div>
          </AdminUserContext.Provider>
        )}
      </AdminGate>
    </Container>
  );
}
