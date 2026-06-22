import { auth } from "$lib/auth";
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions = {
    default: async (event) => {
        const formData = await event.request.formData();
        const username = formData.get("username") as string;
        const password = formData.get("password") as string;

        if (typeof username !== "string" || username.length < 4 || username.length > 31 || !/^[a-zA-Z0-9_-]*$/.test(username)) {
            return fail(400, { error: "Invalid username" });
        }

        if (typeof password !== "string" || password.length < 8 || password.length > 255) {
            return fail(400, { error: "Invalid password" });
        }

        try {
            const result = await auth.api.signInEmail({
                body: {
                    email: username,
                    password: password,
                },
                response: true,
                asResponse: true,
            });

            const sessionCookie = result.headers.get("set-cookie");
            if (sessionCookie) {
                const cookieParts = sessionCookie.split(";")[0].split("=");
                const cookieName = cookieParts[0];
                const cookieValue = cookieParts[1];
                event.cookies.set(cookieName, cookieValue, {
                    path: "/",
                    httpOnly: true,
                    secure: true,
                    sameSite: "lax",
                });
            }

            redirect(302, "/");
        } catch (err) {
            console.error("Login error:", err);
            return fail(400, { error: "Incorrect username or password" });
        }
    },
} satisfies Actions;
