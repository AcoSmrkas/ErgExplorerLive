<script>
	import { fly } from 'svelte/transition';
</script>

<div
	in:fly={{ y: -100, duration: 300, delay: 200 }}
	id="navbar"
	class="bg-bg fixed z-10 h-auto w-full items-center"
	style="transition: all 0.5s ease;"
>
	<div class="nav-container relative flex items-center justify-between p-2 md:p-3">
		<a href="/" class="me-auto flex items-center gap-2">
			<img
				class="relative h-[40px] md:h-[57px]"
				src="https://ergexplorer.com/images/logo.png"
				alt="Logo"
			/>
			<span class="ms-1 text-xl font-bold text-gray-100 md:text-3xl">LIVE</span>
		</a>
		<div
			class="flex items-center gap-4"
			style="margin-left: auto;flex: 0 1 auto; /* Allow items to have their natural widths */"
		></div>
	</div>
</div>

<style>
	.nav-container {
		display: flex;
		justify-content: space-between;
		align-items: center;
		position: relative;
		margin-left: auto;
		margin-right: auto;
		width: 100%;
	}
</style>
