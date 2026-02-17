"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  LayoutDashboard,
  Library,
  MessageSquareText,
  Settings,
  Users,
  BookMarked,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "LIBRARIAN", "MEMBER"] },
  { href: "/catalog", label: "Catalog", icon: Library, roles: ["ADMIN", "LIBRARIAN", "MEMBER"] },
  { href: "/my-books", label: "My Books", icon: BookMarked, roles: ["ADMIN", "LIBRARIAN", "MEMBER"] },
  { href: "/ai-assistant", label: "AI Assistant", icon: MessageSquareText, roles: ["ADMIN", "LIBRARIAN", "MEMBER"] },
  { href: "/books/new", label: "Add Book", icon: BookOpen, roles: ["ADMIN", "LIBRARIAN"] },
  { href: "/admin", label: "Admin Panel", icon: Settings, roles: ["ADMIN"] },
  { href: "/admin/users", label: "Manage Users", icon: Users, roles: ["ADMIN"] },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role || "MEMBER";

  const filteredNav = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-card transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Mini Library</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {filteredNav.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground text-center">
            Mini Library v1.0
          </p>
        </div>
      </aside>
    </>
  );
}
