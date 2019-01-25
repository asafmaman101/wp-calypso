/** @format */
/**
 * Internal dependencies
 */
import FrontendManagement from 'gutenberg/extensions/shared/frontend-management';
import { component } from './components/view';
import { settings } from './settings';
import './style.scss';

window &&
	window.addEventListener( 'load', function() {
		const frontendManagement = new FrontendManagement();
		frontendManagement.blockIterator( document, [
			{
				component,
				options: {
					settings,
				},
			},
		] );
	} );
