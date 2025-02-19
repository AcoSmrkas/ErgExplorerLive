<script>
	import { fade } from 'svelte/transition';
</script>

<div class="holder" out:fade|local={{ duration: 200 }}>
	<div class="image-container">
		<div class="loading-spinner"></div>
		<img src="https://ergexplorer.com/images/logo.png" alt="Logo" class="round-image" />
	</div>
</div>

<style>
	.holder {
		margin: 0;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.image-container {
		position: relative;
		width: 200px;
		height: 200px;
	}

	.round-image {
		position: relative;
		border-radius: 50%;
		object-fit: cover;
		z-index: 1;
		position: relative;
		width: 190px;
		height: 190px;
		top: 5px;
		left: 5px;
		border: 2px solid var(--main-color);
	}

	.loading-spinner {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		border: 5px solid transparent;
		border-top-color: var(--main-color);
		border-bottom-color: var(--main-color);
		animation: spin 1.5s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
