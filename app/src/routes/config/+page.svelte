<script>
    import { browser } from "$app/environment";
    export let data;
    export let currentUser = data.username;
    
</script>
    
    <div class = midContainer>
        <h3>Current User: {currentUser}</h3>
        <form method="POST" enctype="multipart/form-data">
            <label for="submit">Refresh image/db</label>
            <button type="submit">Refresh</button>
        </form>

        <form action="POST">
            <label for="ChangePassword">Change Password</label>
            <input type="password" id="ChangePassword" name="ChangePassword">
        </form>
    </div>
    
    <style>
        .midContainer{
            display:flex;
            flex-direction: column;
        }
    </style>