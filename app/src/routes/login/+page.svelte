<script lang="ts">
    import { authClient } from '$lib/auth-client';
    import { goto } from '$app/navigation';

    let email = $state('');
    let password = $state('');
    let error = $state('');
    let isLoading = $state(false);

    async function handleLogin(event: SubmitEvent) {
        event.preventDefault();
        error = '';
        isLoading = true;

        const { data, error: authError } = await authClient.signIn.email({
            email,
            password,
        });

        isLoading = false;

        if (authError) {
            error = authError.message || 'Login failed';
            return;
        }

        // Redirect on successful login
        goto('/');
    }
</script>

<main>
    <h1>Login</h1>
    <form onsubmit={handleLogin}>
        {#if error}
            <div class="error">{error}</div>
        {/if}
        <label>
            Email:
            <input 
                type="email" 
                name="email" 
                id="email" 
                bind:value={email}
                required
            />
        </label>
        <label>
            Password:
            <input 
                type="password" 
                name="password" 
                id="password" 
                bind:value={password}
                required
            />
        </label>
        <button type="submit" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
        </button>
    </form>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
    }

    h1 {
        margin-bottom: 1rem;
    }

    form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    input {
        font-size: 16px;
        padding: 0.5rem;
    }

    button {
        padding: 0.5rem 1rem;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .error {
        color: red;
        padding: 0.5rem;
        background: #ffeeee;
        border-radius: 4px;
    }
</style>
