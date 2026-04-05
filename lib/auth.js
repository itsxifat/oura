import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { getRequestMeta } from "@/lib/getRequestMeta";
import { trackUserActivity } from "@/lib/trackUserActivity";

// --- 1. LEGACY MASTER TOKEN LOGIC ---
export async function signAdminToken() {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24; 

  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(exp)
    .setIssuedAt(iat)
    .setNotBefore(iat)
    .sign(new TextEncoder().encode(process.env.ADMIN_SECRET || 'secret-key'));
}

export async function verifyAdminToken(token) {
  try {
    const { payload } = await jwtVerify(
      token, 
      new TextEncoder().encode(process.env.ADMIN_SECRET || 'secret-key')
    );
    return payload; 
  } catch (error) {
    return null; 
  }
}

// --- 2. NEXTAUTH CONFIGURATION ---
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials.email });

        if (!user) throw new Error("No user found");
        if (user.isBanned) throw new Error("Your account has been restricted. Please contact support.");

        // Guests who have not yet set a password cannot log in with credentials.
        // They must use the "forgot password" flow to set one first.
        if (user.provider === 'guest' && !user.password) {
          throw new Error("Please use 'Forgot Password' to set up your account password.");
        }

        if (!user.password) throw new Error("Please sign in with Google.");

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password");

        return {
          id:    user._id.toString(),
          name:  user.name,
          email: user.email,
          image: user.image,
          role:  user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Capture IP/UA once for both providers — fire-and-forget
      const { ip, userAgent } = await getRequestMeta().catch(() => ({ ip: 'unknown', userAgent: '' }));

      if (account.provider === 'google') {
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });

        if (!dbUser) {
          // Brand new user — create a full Google account
          dbUser = await User.create({
            name:            user.name,
            email:           user.email,
            image:           user.image,
            role:            'user',
            provider:        'google',
            isVerified:      true,
            registrationIp:  ip !== 'unknown' ? ip : undefined,
          });
        } else if (dbUser.isBanned) {
          return false;
        } else if (dbUser.provider === 'guest') {
          // ── Guest account upgrade via Google ─────────────────────────────
          await User.findByIdAndUpdate(dbUser._id, {
            provider:   'google',
            image:      user.image || dbUser.image,
            isVerified: true,
            ...((!dbUser.name || dbUser.name === 'Guest') && user.name ? { name: user.name } : {}),
          });
          dbUser = await User.findById(dbUser._id);
        }

        user.id   = dbUser._id.toString();
        user.role = dbUser.role;
      }

      // Track IP/device for the signing-in user (fire-and-forget)
      if (user.id) {
        trackUserActivity(user.id, { ip, userAgent }).catch(() => {});
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in — stamp token from the sign-in user object
        token.role     = user.role;
        token.id       = user.id;
        token.provider = user.provider;
      } else if (token.id) {
        // Subsequent visits — always refresh role and provider from DB so
        // upgrades (guest → credentials/google) take effect immediately
        await connectDB();
        const dbUser = await User.findById(token.id).select('role provider isBanned');
        if (dbUser) {
          if (dbUser.isBanned) return { ...token, error: 'banned' };
          token.role     = dbUser.role;
          token.provider = dbUser.provider;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role     = token.role;
        session.user.id       = token.id;
        session.user.provider = token.provider;
      }
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/admin/login", // Redirect here on auth error
  },
};