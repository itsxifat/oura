import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

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
        if (user.isBanned) throw new Error("User is banned");

        // Verify Password
        if (user.password) {
           const isValid = await bcrypt.compare(credentials.password, user.password);
           if (!isValid) throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role, 
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === 'google') {
        await connectDB();
        let dbUser = await User.findOne({ email: user.email });
        if (!dbUser) {
          dbUser = await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            role: 'user', 
            provider: 'google',
          });
        } else if (dbUser.isBanned) {
          return false;
        }
        user.role = dbUser.role; // Pass role to JWT
      }
      return true;
    },
    async jwt({ token, user }) {
      // 1. Initial Sign In
      if (user) {
        token.role = user.role;
        token.id = user.id;
      } 
      // 2. Subsequent Visits: FETCH FRESH ROLE FROM DB
      else if (token.id) {
        await connectDB();
        const dbUser = await User.findById(token.id).select('role');
        if(dbUser) {
          token.role = dbUser.role; // Update token with latest DB role
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
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