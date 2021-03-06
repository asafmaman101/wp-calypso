/** @format */
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { isNumber, includes } from 'lodash';
import { localize } from 'i18n-calypso';
import Gridicon from 'gridicons';
import classNames from 'classnames';
import page from 'page';

/**
 * Internal dependencies
 */
import DomainSuggestion from 'components/domains/domain-suggestion';
import {
	shouldBundleDomainWithPlan,
	getDomainPriceRule,
	hasDomainInCart,
} from 'lib/cart-values/cart-items';
import { recordTracksEvent } from 'state/analytics/actions';
import { abtest } from 'lib/abtest';
import {
	parseMatchReasons,
	VALID_MATCH_REASONS,
} from 'components/domains/domain-registration-suggestion/utility';
import ProgressBar from 'components/progress-bar';

const NOTICE_GREEN = '#4ab866';

class DomainRegistrationSuggestion extends React.Component {
	static propTypes = {
		isDomainOnly: PropTypes.bool,
		isSignupStep: PropTypes.bool,
		isFeatured: PropTypes.bool,
		buttonStyles: PropTypes.object,
		cart: PropTypes.object,
		suggestion: PropTypes.shape( {
			domain_name: PropTypes.string.isRequired,
			product_slug: PropTypes.string,
			cost: PropTypes.string,
			match_reasons: PropTypes.arrayOf( PropTypes.oneOf( VALID_MATCH_REASONS ) ),
		} ).isRequired,
		onButtonClick: PropTypes.func.isRequired,
		domainsWithPlansOnly: PropTypes.bool.isRequired,
		selectedSite: PropTypes.object,
		railcarId: PropTypes.string,
		recordTracksEvent: PropTypes.func,
		uiPosition: PropTypes.number,
		fetchAlgo: PropTypes.string,
		query: PropTypes.string,
		pendingCheckSuggestion: PropTypes.object,
		unavailableDomains: PropTypes.array,
	};

	componentDidMount() {
		this.recordRender();
	}

	componentDidUpdate( prevProps ) {
		if (
			prevProps.railcarId !== this.props.railcarId ||
			prevProps.uiPosition !== this.props.uiPosition
		) {
			this.recordRender();
		}
	}

	recordRender() {
		if ( this.props.railcarId && isNumber( this.props.uiPosition ) ) {
			let resultSuffix = '';
			if ( this.props.suggestion.isRecommended ) {
				resultSuffix = '#recommended';
			} else if ( this.props.suggestion.isBestAlternative ) {
				resultSuffix = '#best-alternative';
			}

			this.props.recordTracksEvent( 'calypso_traintracks_render', {
				railcar: this.props.railcarId,
				ui_position: this.props.uiPosition,
				fetch_algo: `${ this.props.fetchAlgo }/${ this.props.suggestion.vendor }`,
				rec_result: `${ this.props.suggestion.domain_name }${ resultSuffix }`,
				fetch_query: this.props.query,
			} );
		}
	}

	onButtonClick = () => {
		const { suggestion, railcarId } = this.props;

		if ( this.isUnavailableDomain( suggestion.domain_name ) ) {
			return;
		}

		if ( railcarId ) {
			this.props.recordTracksEvent( 'calypso_traintracks_interact', {
				railcar: railcarId,
				action: 'domain_added_to_cart',
			} );
		}

		this.props.onButtonClick( suggestion );
	};

	isUnavailableDomain = domain => {
		return includes( this.props.unavailableDomains, domain );
	};

	getButtonProps() {
		const {
			cart,
			domainsWithPlansOnly,
			isSignupStep,
			selectedSite,
			suggestion,
			translate,
			pendingCheckSuggestion,
			isFeatured,
		} = this.props;
		const { domain_name: domain } = suggestion;
		const isAdded = hasDomainInCart( cart, domain );

		let buttonContent;

		if ( isAdded ) {
			buttonContent = <Gridicon icon="checkmark" />;
		} else {
			buttonContent =
				! isSignupStep &&
				shouldBundleDomainWithPlan( domainsWithPlansOnly, selectedSite, cart, suggestion )
					? translate( 'Upgrade', {
							context: 'Domain mapping suggestion button with plan upgrade',
					  } )
					: translate( 'Select', { context: 'Domain mapping suggestion button' } );
		}

		let buttonStyles = { primary: true };
		if ( abtest( 'domainSearchButtonStyles' ) === 'onePrimary' ) {
			buttonStyles = ! isFeatured ? {} : this.props.buttonStyles;
		}

		if ( this.isUnavailableDomain( suggestion.domain_name ) ) {
			buttonStyles = { ...buttonStyles, disabled: true };
			buttonContent = translate( 'Unavailable', {
				context: 'Domain suggestion is not available for registration',
			} );
		} else if ( pendingCheckSuggestion ) {
			if ( pendingCheckSuggestion.domain_name === suggestion.domain_name ) {
				buttonStyles = { ...buttonStyles, busy: true };
			} else {
				buttonStyles = { ...buttonStyles, disabled: true };
			}
		}
		return {
			buttonContent,
			buttonStyles,
		};
	}

	getPriceRule() {
		const { cart, isDomainOnly, domainsWithPlansOnly, selectedSite, suggestion } = this.props;
		return getDomainPriceRule( domainsWithPlansOnly, selectedSite, cart, suggestion, isDomainOnly );
	}

	renderDomain() {
		const {
			suggestion: { domain_name: domain },
			translate,
		} = this.props;

		let isAvailable = false;

		//If we're on the Mapping or Transfer pages, add a note about availability
		if ( includes( page.current, '/mapping' ) || includes( page.current, '/transfer' ) ) {
			isAvailable = true;
		}

		const title = isAvailable ? translate( '%s is available!', { args: domain } ) : domain;

		return <h3 className="domain-registration-suggestion__title">{ title }</h3>;
	}

	renderProgressBar() {
		const {
			suggestion: { isRecommended, isBestAlternative, relevance: matchScore },
			translate,
			isFeatured,
		} = this.props;

		if ( ! isFeatured ) {
			return null;
		}

		let title, progressBarProps;
		if ( isRecommended ) {
			title = translate( 'Best Match' );
			progressBarProps = {
				color: NOTICE_GREEN,
				title,
				value: matchScore * 100 || 90,
			};
		}

		if ( isBestAlternative ) {
			title = translate( 'Best Alternative' );
			progressBarProps = {
				title,
				value: matchScore * 100 || 80,
			};
		}

		if ( title ) {
			return (
				<div className="domain-registration-suggestion__progress-bar">
					<ProgressBar { ...progressBarProps } />
					<span className="domain-registration-suggestion__progress-bar-text">{ title }</span>
				</div>
			);
		}
	}

	renderMatchReason() {
		const {
			suggestion: { domain_name: domain },
			isFeatured,
		} = this.props;

		if ( ! isFeatured || ! Array.isArray( this.props.suggestion.match_reasons ) ) {
			return null;
		}

		const matchReasons = parseMatchReasons( domain, this.props.suggestion.match_reasons );

		return (
			<div className="domain-registration-suggestion__match-reasons">
				{ matchReasons.map( ( phrase, index ) => (
					<div className="domain-registration-suggestion__match-reason" key={ index }>
						<Gridicon icon="checkmark" size={ 18 } />
						{ phrase }
					</div>
				) ) }
			</div>
		);
	}

	render() {
		const {
			domainsWithPlansOnly,
			isFeatured,
			suggestion: { domain_name: domain, product_slug: productSlug, cost },
		} = this.props;

		const isUnavailableDomain = this.isUnavailableDomain( domain );

		const extraClasses = classNames( {
			'featured-domain-suggestion': isFeatured,
			'is-unavailable': isUnavailableDomain,
		} );

		return (
			<DomainSuggestion
				extraClasses={ extraClasses }
				priceRule={ this.getPriceRule() }
				price={ productSlug && cost }
				domain={ domain }
				domainsWithPlansOnly={ domainsWithPlansOnly }
				onButtonClick={ this.onButtonClick }
				{ ...this.getButtonProps() }
			>
				{ this.renderDomain() }
				{ this.renderProgressBar() }
				{ this.renderMatchReason() }
			</DomainSuggestion>
		);
	}
}

export default connect(
	null,
	{ recordTracksEvent }
)( localize( DomainRegistrationSuggestion ) );
