# TB ERP System - Authentication Implementation Guide

> **Objective:** Implement proper authentication with real user database using NextAuth.js  
> **Architecture:** NextAuth.js credentials provider connecting to PostgreSQL auth schema  
> **Status:** Step-by-step guide for implementation

---

## 📋 Overview

The authentication system will:
1. Store users in `auth.users` table (PostgreSQL)
2. Use bcrypt for password hashing
3. Use NextAuth.js for session management
4. Generate JWT tokens for backend service authentication
5. Support role-based access control (RBAC)

---

## 🔧 Implementation Steps

### Step 1: Install Required Dependencies

**Location:** `apps/web-frontend/`

```bash
cd apps/web-frontend
npm install bcryptjs @prisma/client prisma
npm install -D @types/bcryptjs
```

**Purpose:**
- `bcryptjs` - Password hashing
- `prisma` - Database ORM for user management
- We'll use Prisma specifically for auth since NextAuth integrates well with it

---

### Step 2: Initialize Prisma for Auth Schema

**Location:** `apps/web-frontend/`

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema definition
- `.env` will need DATABASE_URL

---

### Step 3: Configure Prisma Schema

**File:** `apps/web-frontend/prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           Int        @id @default(autoincrement())
  email        String     @unique
  passwordHash String     @map("password_hash")
  fullName     String     @map("full_name")
  isActive     Boolean    @default(true) @map("is_active")
  isVerified   Boolean    @default(false) @map("is_verified")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")
  userRoles    UserRole[]

  @@map("users")
  @@schema("auth")
}

model Role {
  id          Int        @id @default(autoincrement())
  name        String     @unique
  description String?
  createdAt   DateTime   @default(now()) @map("created_at")
  userRoles   UserRole[]

  @@map("roles")
  @@schema("auth")
}

model UserRole {
  id        Int      @id @default(autoincrement())
  userId    Int      @map("user_id")
  roleId    Int      @map("role_id")
  createdAt DateTime @default(now()) @map("created_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@map("user_roles")
  @@schema("auth")
}
```

---

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

This generates the TypeScript client for database access.

---

### Step 5: Create Auth Library

**File:** `apps/web-frontend/src/lib/auth.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roles: user.userRoles.map(ur => ur.role.name)
  };
}

export function generateJWT(user: AuthUser): string {
  return jwt.sign(
    {
      sub: user.id.toString(),
      email: user.email,
      name: user.fullName,
      roles: user.roles
    },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
```

---

### Step 6: Update NextAuth Configuration

**File:** `apps/web-frontend/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authenticateUser, generateJWT } from '@/lib/auth';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter email and password');
        }

        const user = await authenticateUser(credentials.email, credentials.password);
        
        if (!user) {
          throw new Error('Invalid email or password');
        }

        // Generate JWT for backend services
        const accessToken = generateJWT(user);

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.fullName,
          roles: user.roles,
          accessToken
        };
      }
    })
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.roles = (user as any).roles;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).roles = token.roles;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60 // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

---

### Step 7: Create Type Definitions

**File:** `apps/web-frontend/src/types/next-auth.d.ts`

```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      roles: string[];
    } & DefaultSession['user'];
    accessToken: string;
  }

  interface User {
    id: string;
    roles: string[];
    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    roles: string[];
    accessToken: string;
  }
}
```

---

### Step 8: Create Registration API

**File:** `apps/web-frontend/src/app/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json();

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        isActive: true,
        isVerified: false
      }
    });

    // Assign default 'employee' role
    const employeeRole = await prisma.role.findUnique({
      where: { name: 'employee' }
    });

    if (employeeRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: employeeRole.id
        }
      });
    }

    return NextResponse.json(
      { message: 'User created successfully', userId: user.id },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

---

### Step 9: Create Registration Page

**File:** `apps/web-frontend/src/app/auth/register/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        router.push('/auth/signin?registered=true');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>Create Account</h1>
        
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label>Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label>Confirm Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', opacity: 0.7 }}>
          Already have an account?{' '}
          <Link href="/auth/signin" style={{ color: 'var(--accent-primary)' }}>
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
```

---

### Step 10: Update Environment Variables

**File:** `.env`

```env
# Database (Single database with schema separation)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tb_erp_db
DB_USER=postgres
DB_PASSWORD=your_password

# For Prisma  
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=auth

# JWT Secret (32+ characters)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# NextAuth
NEXTAUTH_SECRET=your-nextauth-secret-key
NEXTAUTH_URL=http://localhost:3000
```

---

## 📁 Final File Structure

```
apps/web-frontend/
├── prisma/
│   └── schema.prisma          # NEW: Prisma schema for auth
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── [...nextauth]/
│   │   │       │   └── route.ts    # UPDATED: Real authentication
│   │   │       └── register/
│   │   │           └── route.ts    # NEW: Registration API
│   │   └── auth/
│   │       ├── signin/
│   │       │   └── page.tsx        # EXISTING: Sign in page
│   │       └── register/
│   │           └── page.tsx        # NEW: Registration page
│   ├── lib/
│   │   └── auth.ts                 # NEW: Auth utilities
│   └── types/
│       └── next-auth.d.ts          # NEW: Type definitions
```

---

## ✅ Execution Checklist

Run these commands in order:

```bash
# 1. Navigate to frontend
cd apps/web-frontend

# 2. Install dependencies
npm install bcryptjs @prisma/client prisma jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken

# 3. Initialize Prisma
npx prisma init

# 4. After creating schema.prisma, generate client
npx prisma generate

# 5. Test database connection
npx prisma db pull

# 6. Start development server
npm run dev
```

---

## 🔐 Default Login Credentials

After running init_db.sql, you can login with:

- **Email:** admin@trustybytes.in
- **Password:** admin123

---

## 🎯 What This Gives You

1. ✅ Real user database (PostgreSQL auth schema)
2. ✅ Secure password hashing (bcrypt)
3. ✅ JWT tokens for backend authentication
4. ✅ Role-based access control
5. ✅ User registration flow
6. ✅ Session management
7. ✅ Type-safe authentication

---

Would you like me to start implementing these steps now?
