import { auth } from "./auth";
import { redirect } from "next/navigation";

export type UserRole = "ADMIN" | "LIBRARIAN" | "MEMBER";

const roleHierarchy: Record<UserRole, number> = {
  ADMIN: 3,
  LIBRARIAN: 2,
  MEMBER: 1,
};

export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }
  return session;
}

export async function requireRole(role: UserRole) {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role as UserRole | undefined;
  if (!userRole || !hasMinRole(userRole, role)) {
    redirect("/");
  }
  return session;
}
