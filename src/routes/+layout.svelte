<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { socket } from '$lib/store/store';
	import { initSocket } from '$lib/socket/socket';
	import ChainNav from '$lib/components/ChainNav.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Loading from '$lib/components/Loading.svelte';
	import type { Socket } from 'socket.io-client';

	let { children } = $props();
	let socketConnected = $state(false);

	onMount(() => {
		initSocket();

		const unsubscribe = socket.subscribe((value: Socket) => {
			socketConnected = !!value?.connected;
		});

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
	<Loading height={'[100vh]'} />
{/if}
