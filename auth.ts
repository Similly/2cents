import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {loginSchema} from "@/lib/validators";
import {prisma} from "@/lib/prisma";

export const {handlers, auth, signIn, signOut} = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: {label: "Email", type: "email"},
        password: {label: "Password", type: "password"},
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: {email: parsed.data.email.toLowerCase()},
        });

        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({token, user}) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    session({session, token}) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role ?? "ADMIN";
      }
      return session;
    },
  },
});
