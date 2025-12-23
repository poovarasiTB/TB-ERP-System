/**
 * Authentication Library
 * Handles user authentication with Prisma + bcrypt
 */
import { prisma } from './db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    id: number;
    email: string;
    fullName: string;
    roles: string[];
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
    try {
        const user = await prisma.users.findUnique({
            where: { email },
            include: {
                user_roles: {
                    include: {
                        roles: true
                    }
                }
            }
        });

        if (!user || !user.is_active) {
            return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return null;
        }

        return {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            roles: user.user_roles
                .filter(ur => ur.roles !== null)
                .map(ur => ur.roles!.name)
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}

/**
 * Generate JWT token for backend services
 */
export function generateJWT(user: AuthUser): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }

    return jwt.sign(
        {
            sub: user.id.toString(),
            email: user.email,
            name: user.fullName,
            roles: user.roles
        },
        secret,
        { expiresIn: '24h' }
    );
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
    return prisma.users.findUnique({
        where: { email },
        include: {
            user_roles: {
                include: {
                    roles: true
                }
            }
        }
    });
}

/**
 * Create a new user
 */
export async function createUser(email: string, password: string, fullName: string) {
    const passwordHash = await hashPassword(password);

    const user = await prisma.users.create({
        data: {
            email,
            password_hash: passwordHash,
            full_name: fullName,
            is_active: true,
            is_verified: false
        }
    });

    // Assign default 'employee' role
    const employeeRole = await prisma.roles.findUnique({
        where: { name: 'employee' }
    });

    if (employeeRole) {
        await prisma.user_roles.create({
            data: {
                user_id: user.id,
                role_id: employeeRole.id
            }
        });
    }

    return user;
}

// Re-export prisma for other files that may need it
export { prisma };
