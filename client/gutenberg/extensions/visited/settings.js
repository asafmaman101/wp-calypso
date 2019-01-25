/** @format */
/**
 * Internal dependencies
 */
import { __ } from 'gutenberg/extensions/presets/jetpack/utils/i18n';
import edit from './components/edit';
import save from './components/save';
import { CRITERIA_AFTER } from './constants';

export const settings = {
	attributes: {
		criteria: {
			type: 'string',
			default: CRITERIA_AFTER,
		},
		threshold: {
			type: 'number',
			default: 3,
		},
	},
	category: 'jetpack',
	description: __(
		"Control block visibility depending on how many times they've visited the page."
	),
	icon: 'universal-access-alt',
	supports: { html: false },
	title: __( 'Visited' ),
	edit,
	save,
};
