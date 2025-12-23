/**
 * Prisma Database Client
 * Prisma 7 reads DATABASE_URL from prisma.config.ts automatically
 */
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
    return new PrismaClient();
};

declare const globalThis: {
    prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prisma;
}

export { prisma };
