<script>
	import { getContainerHeight } from './utils/container.js';
	import {
		moveItemsAroundItem,
		moveItem,
		getItemById,
		specifyUndefinedColumns,
		findFreeSpaceForItem
	} from './utils/item.js';
	import { onMount, createEventDispatcher } from 'svelte';
	import { getColumn, getRowsCount, throttle } from './utils/other.js';
	import { makeMatrixFromItems } from './utils/matrix.js';
	import MoveResize from './MoveResize/index.svelte';

	const dispatch = createEventDispatcher();

	export let fillSpace = false;
	export let items;
	export let headerHeight = 0;
	export let rowHeight;
	export let cols;
	export let gap = [10, 10];
	export let fastStart = false;
	export let throttleUpdate = 100;
	export let throttleResize = 100;

	export let scroller = undefined;
	export let sensor = 20;

	let getComputedCols;

	let container;

	$: [gapX, gapY] = gap;

	let header = headerHeight;
	let xPerPx = 0;
	let yPerPx = rowHeight;

	let documentWidth;

	let containerWidth;

	$: containerHeight = getContainerHeight(items, yPerPx, header, getComputedCols);

	const pointerup = (ev) => {
		dispatch('pointerup', {
			id: ev.detail.id,
			cols: getComputedCols
		});
	};

	const onResize = throttle(() => {
		items = specifyUndefinedColumns(items, getComputedCols, cols);
		dispatch('resize', {
			cols: getComputedCols,
			xPerPx,
			yPerPx,
			header,
			width: containerWidth
		});
	}, throttleUpdate);

	onMount(() => {
		const sizeObserver = new ResizeObserver((entries) => {
			requestAnimationFrame(() => {
				let width = entries[0].contentRect.width;

				if (width === containerWidth) return;

				getComputedCols = getColumn(width, cols);

				xPerPx = width / getComputedCols;

				if (!containerWidth) {
					items = specifyUndefinedColumns(items, getComputedCols, cols);

					dispatch('mount', {
						cols: getComputedCols,
						xPerPx,
						yPerPx, // same as rowHeight
						header
					});
				} else {
					onResize();
				}

				containerWidth = width;
			});
		});

		sizeObserver.observe(container);

		return () => sizeObserver.disconnect();
	});

	const updateMatrix = ({ detail }) => {
		let activeItem = getItemById(detail.id, items);

		if (activeItem) {
			activeItem = {
				...activeItem,
				[getComputedCols]: {
					...activeItem[getComputedCols],
					...detail.shadow
				}
			};

			if (fillSpace) {
				items = moveItemsAroundItem(
					activeItem,
					items,
					getComputedCols,
					getItemById(detail.id, items)
				);
			} else {
				items = moveItem(activeItem, items, getComputedCols, getItemById(detail.id, items));
			}

			if (detail.onUpdate) detail.onUpdate();

			dispatch('change', {
				unsafeItem: activeItem,
				id: activeItem.id,
				cols: getComputedCols
			});
		}
	};

	const throttleMatrix = throttle(updateMatrix, throttleResize);

	const handleRepaint = ({ detail }) => {
		if (!detail.isPointerUp) {
			throttleMatrix({ detail });
		} else {
			updateMatrix({ detail });
		}
	};
</script>

<div class="svlt-grid-container" style="height: {containerHeight}px" bind:this={container}>
	{#if xPerPx || !fastStart}
		{#each items as item, i (item.id)}
			<MoveResize
				on:repaint={handleRepaint}
				on:pointerup={pointerup}
				id={item.id}
				resizable={item[getComputedCols] && item[getComputedCols].resizable}
				draggable={item[getComputedCols] && item[getComputedCols].draggable}
				{xPerPx}
				{yPerPx}
				width={Math.min(getComputedCols, item[getComputedCols] && item[getComputedCols].w) * xPerPx - gapX * 2}
				height={(item[getComputedCols] && item[getComputedCols].h) * (yPerPx + header) - gapY * 2 + (item[getComputedCols] && item[getComputedCols].h)}
				top={(item[getComputedCols] && item[getComputedCols].y) * (yPerPx + header) + + gapY}
				left={(item[getComputedCols] && item[getComputedCols].x) * xPerPx + gapX}
				item={item[getComputedCols]}
				min={item[getComputedCols] && item[getComputedCols].min}
				max={item[getComputedCols] && item[getComputedCols].max}
				cols={getComputedCols}
				{gapX}
				{gapY}
				{sensor}
				container={scroller}
				nativeContainer={container}
				let:resizePointerDown
				let:movePointerDown
			>
				{#if item[getComputedCols]}
					<slot
						{movePointerDown}
						{resizePointerDown}
						dataItem={item}
						item={item[getComputedCols]}
						index={i}
					/>
				{/if}
			</MoveResize>
		{/each}
	{/if}
</div>

<style>
	.svlt-grid-container {
		position: relative;
		width: 100%;
	}
</style>
