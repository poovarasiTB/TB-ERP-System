import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { SignJWT } from 'jose';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                // TODO: Replace with actual employee service authentication
                // This is a placeholder for development
                if (credentials?.email && credentials?.password) {
                    // In production, call Employee Service to authenticate
                    // const response = await fetch(`${process.env.EMPLOYEE_SERVICE_URL}/api/v1/auth/login`, {
                    //   method: 'POST',
                    //   headers: { 'Content-Type': 'application/json' },
                    //   body: JSON.stringify(credentials),
                    // });

                    // Mock user for development
                    return {
                        id: '1',
                        email: credentials.email,
                        name: 'Admin User',
                        roles: ['admin', 'asset_manager', 'accountant', 'hr_manager'],
                    };
                }
                return null;
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.roles = (user as any).roles || [];
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).roles = token.roles;

                // Generate JWT for backend services
                const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                const jwt = await new SignJWT({
                    sub: token.id as string,
                    email: token.email,
                    roles: token.roles,
                })
                    .setProtectedHeader({ alg: 'HS256' })
                    .setIssuedAt()
                    .setExpirationTime('24h')
                    .sign(secret);

                (session as any).accessToken = jwt;
            }
            return session;
        },
    },

    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },

    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 24 hours
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
