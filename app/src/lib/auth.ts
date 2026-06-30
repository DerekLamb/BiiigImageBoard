import { betterAuth } from "better-auth"; 
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/db.server";
import { env } from '$env/dynamic/private';

// User type with role for use throughout the app
export interface UserWithRole {
    id: string;
    email: string;
    name: string;
    image?: string | null;
    role: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Better-Auth configuration with role support and admin-only signup
export const auth = betterAuth({
    experimental: { joins: true },
    database: mongodbAdapter(db),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",
    basePath: "/api/auth",
    session: {
        cookieCache: {
            enabled: true,
        }
    },
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    plugins: [sveltekitCookies(getRequestEvent)],
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user",
                required: true,
            },
            passwordChangeRequired: {
                type: "boolean",
                defaultValue: true,
            },
        },
    },


    hooks: {
        before: async (ctx) => {
            // Only allow signup if:
            // 1. No user exist yet (first admin signup via /init)
            // 2. An admin is currently logged in
            
            // Check if this is a sign-up request
            const isSignUp = ctx.path.includes("/sign-up");

            if (isSignUp && !ctx.context.session) {
                const userCount = await db.collection("user").countDocuments();
                
                // Allow first user signup (initialization)
                if (userCount === 0) {
                    return { context: ctx.context };
                }

                // Block signup - only admins can create accounts via admin panel
                throw new Error("Only admins can create new accounts. Contact your administrator.");
            }
            return { context: ctx.context };
        },
    },
});

/**
 * Initialize admin user from environment variables
 * Call this after DB connection is established
 */
export async function initializeAdminUser(): Promise<boolean> {
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
        console.log("Admin credentials not configured in environment");
        return false;
    }

    try {
        // Check if any admin already exists
        const adminExists = await db.collection("user").findOne({ role: "admin" });
        
        if (adminExists) {
            console.log("Admin user already exists");
            return true;
        }

        // Check if user with admin email already exists (non-admin role)
        const existingUser = await db.collection("user").findOne({ email: env.ADMIN_EMAIL });
        
        if (existingUser) {
            // Update existing user to admin
            await db.collection("user").updateOne(
                { email: env.ADMIN_EMAIL },
                { $set: { role: "admin", emailVerified: true, passwordChangeRequired: true, updatedAt: new Date() } }
            );
            console.log("Existing user promoted to admin");
            return true;
        }

        const { hashPassword } = await import('@better-auth/utils/password');
        const hashedPassword = await hashPassword(env.ADMIN_PASSWORD);
        const userId = crypto.randomUUID ? crypto.randomUUID() : 'admin-' + Date.now();

        await db.collection("user").insertOne({
            id: userId,
            email: env.ADMIN_EMAIL,
            emailVerified: true,
            name: "Admin",
            role: "admin",
            passwordChangeRequired: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await db.collection("account").insertOne({
            id: crypto.randomUUID ? crypto.randomUUID() : 'acct-' + Date.now(),
            userId: userId,
            accountId: env.ADMIN_EMAIL,
            providerId: "credential",
            password: hashedPassword,
            createdAt: new Date(),
        });

        console.log("Admin user created successfully");
        return true;
    } catch (error) {
        console.error("Failed to initialize admin user:", error);
        return false;
    }
}

/**
 * Check if a user has admin role
 */
export function isAdmin(user: { role?: string } | null): boolean {
    return user?.role === "admin";
}
