<script lang="ts">
    import { applyAction, enhance } from '$app/forms';
    import type { ActionData } from './$types';

    export let form: ActionData;
    
    let isLoading = false;
</script>

<div class="container">
    <h1>Create New User</h1>
    <p>Only admins can access this page.</p>

    {#if form?.message}
        <div class="message" class:success={form.success} class:error={!form.success}>
            {form.message}
        </div>
    {/if}

    <form method="POST" use:enhance={() => {
        isLoading = true;
        return async ({ result }) => {
            isLoading = false;
            await applyAction(result);
        };
    }}>
        <div class="field">
            <label for="name">Name</label>
            <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="User Name" 
                value={form?.name ?? ''}
                required
            />
        </div>

        <div class="field">
            <label for="email">Email</label>
            <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="user@example.com" 
                value={form?.email ?? ''}
                required
            />
        </div>

        <div class="field">
            <label for="password">Password</label>
            <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="••••••••" 
                required
            />
        </div>

        <div class="field">
            <label for="role">Role</label>
            <select id="role" name="role" value={form?.role ?? 'user'}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>
        </div>

        <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create User'}
        </button>
    </form>

    <div class="links">
        <a href="/">Back to Home</a>
    </div>
</div>

<style>
    .container {
        max-width: 500px;
        margin: 2rem auto;
        padding: 2rem;
        border: 1px solid #ccc;
        border-radius: 8px;
    }

    h1 {
        margin-top: 0;
    }

    .field {
        margin-bottom: 1rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }

    input, select {
        width: 100%;
        padding: 0.5rem;
        font-size: 1rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        background-color: #333;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
    }

    button:disabled {
        background-color: #999;
        cursor: not-allowed;
    }

    .message {
        padding: 1rem;
        margin-bottom: 1rem;
        border-radius: 4px;
    }

    .success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .links {
        margin-top: 1rem;
        text-align: center;
    }
</style>
