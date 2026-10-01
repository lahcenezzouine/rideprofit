"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const ITEMS = [
  { href: "/", label: "Calculator", icon: "🧮" },
  { href: "/city", label: "City", icon: "🏙️" },
  { href: "/history", label: "History", icon: "📜" },
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/routes", label: "Routes", icon: "🗺️" },
  { href: "/compare", label: "Compare", icon: "⚖️" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop/tablet top bar */}
      <header className="hidden sm:flex items-center justify-between border-b border-border bg-surface px-6 py-3 sticky top-0 z-20">
        <div className="font-semibold text-lg tracking-tight">
          RideProfit
        </div>
        <nav className="flex gap-1">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:bg-background"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Mobile top bar (title only, nav lives at the bottom for thumb reach) */}
      <header className="sm:hidden flex items-center justify-center border-b border-border bg-surface px-4 py-3 sticky top-0 z-20">
        <div className="font-semibold text-base tracking-tight">
          RideProfit
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-surface grid grid-cols-7 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium",
              pathname === item.href ? "text-accent" : "text-muted"
            )}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
