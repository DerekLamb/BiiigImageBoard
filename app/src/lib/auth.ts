import { betterAuth } from "better-auth"; 
import { mongodbAdapter } from "better-auth/adapters/mongodb"
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
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: "string",
                defaultValue: "user",
                required: true,
            },
        },
    },
    // Hooks to control signup behavior
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
                { $set: { role: "admin", updatedAt: new Date() } }
            );
            console.log("Existing user promoted to admin");
            return true;
        }

        // Create new admin user via better-auth API
        const response = await auth.api.signUpEmail({
            body: {
                email: env.ADMIN_EMAIL,
                password: env.ADMIN_PASSWORD,
                name: "Admin",
            }
        });

        if (response?.user) {
            // Update the created user to have admin role
            await db.collection("user").updateOne(
                { email: env.ADMIN_EMAIL },
                { $set: { role: "admin" } }
            );
            console.log("Admin user created successfully");
            return true;
        }

        return false;
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
