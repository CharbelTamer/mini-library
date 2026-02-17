import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
};

function createPrismaClient() {
  try {
    // @ts-expect-error Prisma v7 strict typing for constructor options
    return new PrismaClient();
  } catch {
    console.warn("PrismaClient initialization failed - database may not be available");
    return new Proxy({} as InstanceType<typeof PrismaClient>, {
      get: () => {
        throw new Error("Database not available");
      },
    });
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
