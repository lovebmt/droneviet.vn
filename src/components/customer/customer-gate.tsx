"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import { Field, FormError, Input } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { fetchOauthProviders, loginCustomer, oauthStartUrl, registerCustomer, type OauthProvider } from "@/lib/commerce/customer-auth";
import { goTo } from "@/lib/navigate";
import { rememberNextPath, safeNextPath } from "@/lib/next-path";

const providerLabels: Record<OauthProvider, string> = { google: "Google", zalo: "Zalo" };

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export function CustomerGate({
  mode,
  next,
  oauthError,
  oauthReason,
  oauthDetail,
}: {
  mode: "login" | "register";
  next?: string;
  oauthError?: OauthProvider;
  oauthReason?: string;
  oauthDetail?: string;
}) {
  const destination = safeNextPath(next) ?? "/tai-khoan";
  const isRegister = mode === "register";
  const [message, setMessage] = useState(oauthError ? `Đăng nhập ${providerLabels[oauthError]} không thành công. Vui lòng thử lại.` : "");
  const [providers, setProviders] = useState<Record<OauthProvider, boolean>>({ google: false, zalo: false });
  const [submitting, setSubmitting] = useState(false);
  const enabled = (Object.keys(providerLabels) as OauthProvider[]).filter((p) => providers[p]);

  useEffect(() => {
    let active = true;
    void fetchOauthProviders().then((value) => active && setProviders(value));
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    try {
      if (isRegister) await registerCustomer(String(data.get("displayName") ?? ""), email, password);
      else await loginCustomer(email, password);
      goTo(destination);
    } catch {
      setMessage(isRegister ? "Chưa tạo được tài khoản. Email có thể đã được dùng." : "Email hoặc mật khẩu chưa đúng.");
      setSubmitting(false);
    }
  }

  const otherHref = `${isRegister ? "/dang-nhap" : "/dang-ky"}${next && safeNextPath(next) ? `?tiep=${encodeURIComponent(destination)}` : ""}`;

  return (
    <div className="grid min-h-[70vh] lg:grid-cols-2">
      <aside className="hidden flex-col justify-end bg-gradient-to-br from-sky to-[#0a4fa8] p-12 text-white lg:flex">
        <h2 className="max-w-md text-4xl font-light leading-tight">Theo dõi đơn hàng, khóa học và kết quả bay mô phỏng ở một nơi.</h2>
        <p className="mt-4 max-w-md text-white/85">Tài khoản Drone Việt dành cho học sinh, giáo viên và nhà trường.</p>
      </aside>
      <section className="grid place-items-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight">{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h1>
          <p className="mt-2 text-muted">{isRegister ? "Lưu đơn hàng, khóa học và kết quả bay của bạn." : "Chào mừng bạn quay lại Drone Việt."}</p>

          {enabled.length ? (
            <>
              <div className="mt-8 grid gap-3">
                {enabled.map((provider) => (
                  <a
                    key={provider}
                    href={oauthStartUrl(provider)}
                    onClick={() => rememberNextPath(destination)}
                    className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-line bg-white font-semibold hover:border-ink"
                  >
                    {provider === "google" ? <GoogleMark /> : <MessageCircle size={18} strokeWidth={1.75} className="text-sky-ink" aria-hidden="true" />}
                    Tiếp tục với {providerLabels[provider]}
                  </a>
                ))}
              </div>
              <div className="my-7 flex items-center gap-3 text-sm text-muted">
                <span className="h-px flex-1 bg-line" />
                hoặc dùng email
                <span className="h-px flex-1 bg-line" />
              </div>
            </>
          ) : null}

          <form onSubmit={submit} className={`space-y-4 ${enabled.length ? "" : "mt-8"}`}>
            {isRegister ? (
              <Field label="Họ và tên"><Input required minLength={2} name="displayName" autoComplete="name" /></Field>
            ) : null}
            <Field label="Email"><Input required name="email" type="email" autoComplete="email" /></Field>
            <Field label="Mật khẩu" hint={isRegister ? "Ít nhất 12 ký tự" : undefined}>
              {/* 12 characters is the sign-up rule; existing accounts may have shorter passwords. */}
              <Input required minLength={isRegister ? 12 : undefined} name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} />
            </Field>
            <FormError message={message || null} />
            {oauthError && oauthReason ? <p className="text-xs text-muted">Mã lỗi: {oauthReason}</p> : null}
            {oauthError && oauthReason && oauthDetail ? <p className="break-words text-xs text-muted">Chi tiết: {oauthDetail}</p> : null}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Đang xử lý…" : isRegister ? "Tạo tài khoản" : "Đăng nhập"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted">
            {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
            <Link href={otherHref} className="font-semibold text-sky-ink hover:underline underline-offset-4">{isRegister ? "Đăng nhập" : "Tạo tài khoản"}</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
