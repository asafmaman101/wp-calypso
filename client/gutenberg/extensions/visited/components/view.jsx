/** @format */

/**
 * External dependencies
 */
import { Component } from '@wordpress/element';

export class VisitDetector extends Component {
	render() {
		return (
			<div>
				<div>lol</div>
				<div>{ this.props.children }</div>
			</div>
		);
	}
}
