/** @format */

/**
 * Internal dependencies
 */
import registerJetpackBlock from 'gutenberg/extensions/presets/jetpack/utils/register-jetpack-block';
import { name, settings, childBlocks } from '.';

registerJetpackBlock( name, settings, childBlocks );
