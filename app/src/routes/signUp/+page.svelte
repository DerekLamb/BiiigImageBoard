<script lang="ts">
    import { authClient } from "$lib/auth-client";

    const session = authClient.useSession();
    let email = $state('');
    let password = $state('');
    let name = $state('');
    let isLoading = $state(false);
    let username = $state('');
    
    async function handleSignUp(event: Event) {
        event.preventDefault();
        const {data, error} = await authClient.signUp.email({
            email:email,
            password:password,
            name: name,
        })

        console.log(data);
        console.log(error);
    }
</script>

<main>
    <div>
      {#if $session.data}
        <div>
          <p>
            {$session.data.user.name}
          </p>
          <button
            onclick={async () => {
              await authClient.signOut();
            }}
          >
            Sign Out
          </button>
        </div>
    #{:else}
      <form onsubmit={handleSignUp}>
        <div class="field">
            <label for="name">Name </label>
            <input 
                id="name" 
                type="text" 
                bind:value={name} 
                placeholder="Your Name" 
            />
        </div>

        <div class="field">
            <label for="name">Username (Optional)</label>
            <input 
                id="username" 
                type="text" 
                bind:value={username} 
                placeholder="Your Username" 
            />
        </div>

        <div class="field">
            <label for="email">Email</label>
            <input 
                id="email" 
                type="email" 
                bind:value={email} 
                placeholder="you@example.com" 
                required 
            />
        </div>

        <div class="field">
            <label for="password">Password</label>
            <input 
                id="password" 
                type="password" 
                bind:value={password} 
                placeholder="••••••••" 
                required 
            />
        </div>

        <button> SignUp </button>
      </form>
      {/if}
    </div>
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