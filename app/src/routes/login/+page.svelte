<script>
    import { enhance } from '$app/forms';

</script>

<main>
    <h1>Login</h1>
    <form method="post" use:enhance>
        <label>
            Username:
            <input type="text" name="username" id="username" />
        </label>
        <label>
            Password:
            <input type="password" name= "password" id="password" />
        </label>
        <button type="submit">Login</button>
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
        font-size:16px;
        padding: 0.5rem;
    }

    button {
        padding: 0.5rem 1rem;
    }
</style>