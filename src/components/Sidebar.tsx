"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, logout } from "@/lib/api";

const navItems = [
  {
    href: "/dashboard",
    label: "대시보드",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" fill="currentColor" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5" />
      </svg>
    ),
  },
  {
    href: "/students",
    label: "학생 관리",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4" fill="currentColor" />
        <path d="M2 20c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75M21 20c0-2.76-2.24-5-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/timetable",
    label: "시간표 관리",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
        <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2M15 17h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/calendar",
    label: "일정 관리",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
        <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="15" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/attendance",
    label: "출석체크 QR",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="2" />
        <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3M14 21h3M20 18v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "부모님 연락",
    icon: (
      <svg width="17" height="17" fill="none" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; role: string; academy_name: string } | null>(null);

  useEffect(() => {
    getMe().then(setMe).catch(() => {});
  }, []);

  function handleLogout() {
    logout();
    router.push("/");
  }

  const initial = me?.name?.[0] ?? "?";

  return (
    <aside className="w-56 flex-shrink-0 h-screen flex flex-col"
      style={{ background: "var(--sidebar-bg)", color: "var(--sidebar-text)" }}>
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5 border-b" style={{ borderColor: "#2a2a3e" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ background: "var(--accent)" }}>C</div>
        <span className="font-semibold text-base" style={{ color: "#fff" }}>Classly</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? "rgba(124, 106, 247, 0.18)" : "transparent",
                color: active ? "#fff" : "var(--sidebar-muted)",
              }}>
              <span style={{ color: active ? "var(--accent)" : "var(--sidebar-muted)" }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — 유저 정보 + 로그아웃 */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "#2a2a3e" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
            style={{ background: "var(--accent)" }}>
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate" style={{ color: "#e5e7eb" }}>
              {me?.academy_name ?? "불러오는 중..."}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--sidebar-muted)" }}>
              {me?.name}{me?.role === "headmaster" ? " · 원장" : me?.role === "teacher" ? " · 선생님" : ""}
            </p>
          </div>
          <button onClick={handleLogout}
            title="로그아웃"
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: "#9ca3af" }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
