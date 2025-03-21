import { getRowsCount } from './other.js';

export function getContainerHeight(items, yPerPx, additionalY, cols) {
	return getRowsCount(items, cols) * yPerPx + additionalY;
}
