<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { socket } from '$lib/store/store';
	import { initSocket } from '$lib/socket/socket';
	import ChainNav from '$lib/components/ChainNav.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import type { Socket } from 'socket.io-client';
	import { fetchAddressBook } from '$lib/common/utils';

	let { children } = $props();
	let socketConnected = $state(false);

	onMount(() => {
		initSocket();

		const unsubscribe = socket.subscribe((value: Socket) => {
			socketConnected = !!value?.connected;
		});

		(async () => {
			await fetchAddressBook();
		})();

		return () => {
			unsubscribe();
		};
	});
</script>

{#if socketConnected}
	<Navbar />

	{@render children()}

	<ChainNav />
{:else}
	<div class="loading-holder h-[100vh]">
		<Loading />
	</div>
{/if}
