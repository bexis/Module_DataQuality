// tailwind.config.js
import { join } from 'path';
import { skeleton } from '@skeletonlabs/tw-plugin';

export default {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',

		// Skeleton-Komponenten
		'./node_modules/@skeletonlabs/skeleton/**/*.{html,js,svelte,ts}',

		// BEXIS2-Komponenten
		//'./node_modules/@bexis2/bexis2-core-ui/**/*.{html,js,svelte,ts}'
	],
	theme: {
		extend: {}
	},
	plugins: [
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography'),
		skeleton()
	]
};
