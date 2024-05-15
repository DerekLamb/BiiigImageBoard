<script lang>
let detailText: string;
let dialogBox: string;
export let show: boolean;
let dialogBox;

</script>

<dialog bind:this = {dialogBox} 
    on:close={() => (show = false)}
    on:click|self={() => dialogBox.close()}>
    <div class="modal-content">
        <span class="close" on:click={() => show = false}>&times;</span>
        <p>{detailText}</p>
        <slot name="header" />
        <hr />
        <slot />
        <hr />
        <button on:click={() => dialog.close()}>Close</button>
    </div>
</dialog>

<style>
	dialog {
		max-width: 32em;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
	}
</style>