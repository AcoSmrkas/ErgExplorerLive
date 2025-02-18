<script lang="ts">
	import { truncateAddress } from '$lib/common/utils';

	let { type, value, trunc = 0 } = $props();

	$effect(() => {
		if (value && trunc > 0) {
			value = truncateAddress(value, trunc);
		}
	});
</script>

<a target="_new" href="https://ergexplorer.com/{type}/{value}">{value}</a>
