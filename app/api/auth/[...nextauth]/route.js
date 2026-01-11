import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// 1. Define authOptions separately and EXPORT it so other files can use it
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
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error("No user found.");
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid password.");
        return user;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === 'google') {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            name: user.name,
            email: user.email,
            image: user.image,
            provider: 'google',
            isVerified: true
          });
        }
      }
      return true;
    },
    async session({ session }) {
      await connectDB();
      
      const dbUser = await User.findOne({ email: session.user.email })
        .select('name phone image role _id profilePicture');
      
      if (dbUser) {
        session.user.id = dbUser._id.toString();
        session.user.name = dbUser.name;
        session.user.phone = dbUser.phone;
        session.user.role = dbUser.role;
        
        // Handle encrypted vs public image
        const hasEncrypted = dbUser.profilePicture && dbUser.profilePicture.iv;

        if (hasEncrypted) {
          session.user.image = `/api/user/avatar/${dbUser._id.toString()}?t=${Date.now()}`;
        } else {
          session.user.image = dbUser.image || null;
        }
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: '/login' }
};

// 2. Pass the exported options to NextAuth
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };