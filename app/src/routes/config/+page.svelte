<script>
    import { browser } from "$app/environment";
    import { theme } from "$lib/stores/themeStore";
    
    export let data;
    export let currentUser = data.username;

    // Processing state
    let isProcessing = false;
    let processingStats = null;
    let processingMessage = "";
    let processingError = "";

    // User preferences (stored in localStorage)
    let postsPerPage = 20;
    let thumbnailSize = 'medium';
    let defaultSort = 'newest';
    let showImageInfo = true;
    let infiniteScroll = true;

    // Theme selection
    let currentTheme = 'light';

    // Load preferences from localStorage
    function loadPreferences() {
        if (browser) {
            postsPerPage = parseInt(localStorage.getItem('postsPerPage') || '20');
            thumbnailSize = localStorage.getItem('thumbnailSize') || 'medium';
            defaultSort = localStorage.getItem('defaultSort') || 'newest';
            showImageInfo = localStorage.getItem('showImageInfo') !== 'false';
            infiniteScroll = localStorage.getItem('infiniteScroll') !== 'false';
            currentTheme = localStorage.getItem('theme') || 'light';
        }
    }

    // Save preferences to localStorage
    function savePreferences() {
        if (browser) {
            localStorage.setItem('postsPerPage', postsPerPage.toString());
            localStorage.setItem('thumbnailSize', thumbnailSize);
            localStorage.setItem('defaultSort', defaultSort);
            localStorage.setItem('showImageInfo', showImageInfo.toString());
            localStorage.setItem('infiniteScroll', infiniteScroll.toString());
        }
        showSaveMessage();
    }

    let saveMessage = "";
    function showSaveMessage() {
        saveMessage = "Preferences saved!";
        setTimeout(() => { saveMessage = ""; }, 2000);
    }

    // Fetch processing status
    async function fetchProcessingStatus() {
        try {
            const response = await fetch('/api/process');
            const result = await response.json();
            if (result.success) {
                isProcessing = result.data.isProcessing;
                processingStats = result.data.stats;
            }
        } catch (error) {
            console.error('Error fetching processing status:', error);
        }
    }

    // Start image processing
    async function startProcessing() {
        processingError = "";
        processingMessage = "";
        
        try {
            const response = await fetch('/api/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'start' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                isProcessing = true;
                processingMessage = "Image processing started...";
                // Poll for status updates
                pollProcessingStatus();
            } else {
                processingError = result.error || 'Failed to start processing';
            }
        } catch (error) {
            processingError = error.message || 'Network error';
        }
    }

    // Poll processing status
    async function pollProcessingStatus() {
        if (!browser) return;
        
        const pollInterval = setInterval(async () => {
            await fetchProcessingStatus();
            if (!isProcessing) {
                clearInterval(pollInterval);
                processingMessage = "Processing complete!";
            }
        }, 2000);
    }

    // Theme toggle handler
    function handleThemeChange(newTheme) {
        currentTheme = newTheme;
        theme.set(newTheme);
    }

    // Initialize on mount
    $: if (browser) {
        loadPreferences();
        fetchProcessingStatus();
    }
</script>
    
<div class="config-container">
    <h1>Settings</h1>
    
    {#if currentUser}
        <p class="user-info">Logged in as: <strong>{currentUser}</strong></p>
    {/if}

    {#if saveMessage}
        <div class="save-message">{saveMessage}</div>
    {/if}

    <!-- Appearance Section -->
    <section class="config-section">
        <h2>Appearance</h2>
        
        <div class="config-row">
            <label for="theme">Theme</label>
            <select id="theme" bind:value={currentTheme} on:change={() => handleThemeChange(currentTheme)}>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
            </select>
        </div>

        <div class="config-row">
            <label for="thumbnailSize">Thumbnail Size</label>
            <select id="thumbnailSize" bind:value={thumbnailSize}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
            </select>
        </div>

        <div class="config-row checkbox">
            <input type="checkbox" id="showImageInfo" bind:checked={showImageInfo}>
            <label for="showImageInfo">Show image info on hover</label>
        </div>
    </section>

    <!-- Browsing Section -->
    <section class="config-section">
        <h2>Browsing</h2>
        
        <div class="config-row">
            <label for="postsPerPage">Posts per page</label>
            <select id="postsPerPage" bind:value={postsPerPage}>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select>
        </div>

        <div class="config-row">
            <label for="defaultSort">Default sort order</label>
            <select id="defaultSort" bind:value={defaultSort}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="popular">Most popular</option>
                <option value="random">Random</option>
            </select>
        </div>

        <div class="config-row checkbox">
            <input type="checkbox" id="infiniteScroll" bind:checked={infiniteScroll}>
            <label for="infiniteScroll">Enable infinite scroll</label>
        </div>
    </section>

    <!-- Image Processing Section -->
    <section class="config-section">
        <h2>Image Processing</h2>
        
        <div class="processing-status">
            <p>Status: <span class:active={isProcessing}>{isProcessing ? 'Processing...' : 'Idle'}</span></p>
            {#if processingStats}
                <p>Processed: {processingStats.processed || 0} | Failed: {processingStats.failed || 0}</p>
            {/if}
            {#if processingMessage}
                <p class="processing-message">{processingMessage}</p>
            {/if}
            {#if processingError}
                <p class="error-message">{processingError}</p>
            {/if}
        </div>

        <button 
            class="process-btn" 
            on:click={startProcessing}
            disabled={isProcessing}
        >
            {isProcessing ? 'Processing...' : 'Start Image Processing'}
        </button>
        
        <p class="help-text">Reprocess all images to generate thumbnails and extract metadata.</p>
    </section>

    <!-- Account Section -->
    <section class="config-section">
        <h2>Account</h2>
        
        <form class="config-form">
            <div class="config-row">
                <label for="changePassword">Change Password</label>
                <input type="password" id="changePassword" placeholder="Enter new password">
            </div>
            <button type="button" class="secondary-btn">Update Password</button>
        </form>
    </section>

    <!-- Save Button -->
    <div class="save-section">
        <button class="save-btn" on:click={savePreferences}>Save Preferences</button>
    </div>
</div>
    
<style>
    .config-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
    }

    h1 {
        color: var(--text-primary);
        font-family: 'Orbitron', sans-serif;
        margin-bottom: 10px;
    }

    h2 {
        color: var(--text-primary);
        font-family: 'Montserrat', sans-serif;
        font-size: 1.2rem;
        margin-bottom: 15px;
        padding-bottom: 5px;
        border-bottom: 1px solid var(--border-color);
    }

    .user-info {
        color: var(--text-secondary);
        margin-bottom: 20px;
    }

    .config-section {
        background: var(--bg-card);
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
        transition: background-color 0.3s ease;
    }

    .config-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .config-row.checkbox {
        justify-content: flex-start;
        gap: 10px;
    }

    label {
        color: var(--text-primary);
        font-family: 'Montserrat', sans-serif;
    }

    select, input[type="password"] {
        background: var(--bg-input);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 8px 12px;
        font-family: 'Montserrat', sans-serif;
        min-width: 150px;
        transition: background-color 0.3s ease;
    }

    select:focus, input:focus {
        outline: none;
        border-color: var(--text-accent);
    }

    input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--button-primary);
    }

    .process-btn, .save-btn {
        background: var(--button-primary);
        color: var(--button-text);
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        cursor: pointer;
        transition: opacity 0.2s, background-color 0.3s ease;
    }

    .process-btn:hover:not(:disabled), .save-btn:hover {
        opacity: 0.9;
    }

    .process-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .secondary-btn {
        background: var(--bg-input);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 10px 20px;
        font-family: 'Montserrat', sans-serif;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    .secondary-btn:hover {
        background: var(--button-hover);
    }

    .processing-status {
        margin-bottom: 15px;
        padding: 15px;
        background: var(--bg-input);
        border-radius: 8px;
    }

    .processing-status p {
        margin: 5px 0;
        color: var(--text-secondary);
    }

    .processing-status span {
        font-weight: bold;
    }

    .processing-status span.active {
        color: var(--text-accent);
    }

    .processing-message {
        color: var(--text-accent);
    }

    .error-message {
        color: #e74c3c;
    }

    .help-text {
        color: var(--text-muted);
        font-size: 0.85rem;
        margin-top: 10px;
    }

    .save-message {
        background: var(--text-hover);
        color: var(--bg-primary);
        padding: 10px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        text-align: center;
        font-family: 'Montserrat', sans-serif;
    }

    .save-section {
        text-align: center;
        margin-top: 30px;
    }

    .config-form {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
</style>
