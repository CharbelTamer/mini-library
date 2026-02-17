import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnSignIn = nextUrl.pathname.startsWith("/signin");
      const isAuthApi = nextUrl.pathname.startsWith("/api/auth");

      if (isAuthApi) return true;
      if (isOnSignIn) return true;
      if (!isLoggedIn) return false;
      return true;
    },
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = (user as unknown as Record<string, unknown>).role as string;
      }
      return session;
    },
  },
};
