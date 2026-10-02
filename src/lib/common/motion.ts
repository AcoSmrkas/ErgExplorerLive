import { cubicIn, cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export const reducedMotion =
	typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Why a tile is leaving: confirmed into a block (the usual case) or hidden by a filter.
let leavingFor: 'block' | 'filter' = 'block';

export function leaveForFilter() {
	leavingFor = 'filter';
	setTimeout(() => (leavingFor = 'block'), 400);
}

/** A tile appearing: rises in, a little later for each tile of the first batch. */
export function arrive(node: Element, { index = 0, first = false } = {}): TransitionConfig {
	if (reducedMotion) return { duration: 0 };

	return {
		delay: first ? Math.min(index * 22, 700) : 0,
		duration: 420,
		easing: cubicOut,
		css: (t, u) => `opacity: ${t}; transform: translateY(${u * 14}px) scale(${0.96 + 0.04 * t});`
	};
}

/**
 * A tile leaving the mempool flies into the next-block slot of the chain bar, shrinking
 * on the way: its tx is in the block that was just mined.
 */
export function intoBlock(node: Element, { index = 0 } = {}): TransitionConfig {
	const target = document.getElementById('next-block');

	if (reducedMotion || leavingFor === 'filter' || !target) {
		return { duration: 180, css: (t) => `opacity: ${t}` };
	}

	const from = node.getBoundingClientRect();
	const to = target.getBoundingClientRect();
	const dx = to.left + to.width / 2 - (from.left + from.width / 2);
	const dy = to.top + to.height / 2 - (from.top + from.height / 2);

	return {
		delay: Math.min(index * 18, 360),
		duration: 720,
		easing: cubicIn,
		css: (t, u) =>
			`transform: translate(${dx * u}px, ${dy * u}px) scale(${1 - 0.85 * u}); opacity: ${0.25 + 0.75 * t}; z-index: 40;`
	};
}

/** A new block in the chain bar slides out of the next-block slot on its right. */
export function land(node: Element, { distance = 60 } = {}): TransitionConfig {
	if (reducedMotion) return { duration: 0 };

	return {
		duration: 650,
		easing: cubicOut,
		css: (t, u) =>
			`transform: translateX(${u * distance}px) scale(${0.7 + 0.3 * t}); opacity: ${t};`
	};
}
