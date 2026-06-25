"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Главная", icon: "✨" },
  { href: "/history", label: "История", icon: "📅" },
  { href: "/pair", label: "Пара", icon: "💞" },
  { href: "/profile", label: "Профиль", icon: "🌿" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Десктоп: верхний хедер */}
      <header className="hidden sm:flex sticky top-0 z-20 items-center justify-between border-b border-zinc-200 bg-white/90 backdrop-blur px-6 py-3">
        <Link href="/" className="font-semibold text-zinc-900">
          remembr
        </Link>
        <nav className="flex gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Мобилка: нижняя навигация */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex justify-between border-t border-zinc-200 bg-white px-2 pb-[env(safe-area-inset-bottom)]"
        aria-label="Основная навигация"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                active ? "text-zinc-900" : "text-zinc-400"
              }`}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
