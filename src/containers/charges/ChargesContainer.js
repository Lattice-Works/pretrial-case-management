/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { Button, SearchInput } from 'lattice-ui-kit';
import { List, Map } from 'immutable';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import type { RequestState } from 'redux-reqseq';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileSpreadsheet } from '@fortawesome/pro-regular-svg-icons';

import NewChargeModal from '../../components/managecharges/NewChargeModal';
import ChargeTable from '../../components/managecharges/ChargeTable';
import DashboardMainSection from '../../components/dashboard/DashboardMainSection';
import NavButtonToolbar from '../../components/buttons/NavButtonToolbar';
import ImportChargesModal from './ImportChargesModal';
import ArrestingAgencies from './ArrestingAgencies';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { CHARGE_TYPES } from '../../utils/consts/ChargeConsts';

import { STATE } from '../../utils/consts/redux/SharedConsts';
import { APP_DATA } from '../../utils/consts/redux/AppConsts';
import { CHARGE_DATA } from '../../utils/consts/redux/ChargeConsts';
import { getReqState, requestIsPending } from '../../utils/consts/redux/ReduxUtils';

import * as Routes from '../../core/router/Routes';
import { LOAD_CHARGES } from './ChargeActions';

const CSVIcon = <FontAwesomeIcon icon={faFileSpreadsheet} />;

const ToolbarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: baseline;
`;

const SubToolbarWrapper = styled(ToolbarWrapper)`
  margin-right: -30px;
`;

const ButtonWrapper = styled.div`
  button {
    margin-right: 5px;
  }
`;

type Props = {
  arrestChargesById :Map;
  arrestChargePermissions :string;
  courtChargesById :Map;
  courtChargePermissions :boolean;
  loadChargesReqState :RequestState;
  selectedOrganizationId :string;
  location :Object;
};

type State = {
  charge :Map;
  chargeType :string;
  importIsVisible :boolean;
  newChargeModalOpen :boolean;
  searchQuery :string;
}

const MAX_RESULTS = 20;

class ManageChargesContainer extends React.Component<Props, State> {
  constructor(props :Props) {
    super(props);
    this.state = {
      charge: Map(),
      chargeType: CHARGE_TYPES.ARREST,
      importIsVisible: false,
      newChargeModalOpen: false,
      searchQuery: '',
    };
  }

  switchToArrestChargeType = () => (this.setState({ chargeType: CHARGE_TYPES.ARREST }))
  switchToCourtChargeType = () => (this.setState({ chargeType: CHARGE_TYPES.COURT }))

  openImportModal = () => this.setState({ importIsVisible: true });
  closeImportModal = () => this.setState({ importIsVisible: false });

  componentDidMount() {
    const { location } = this.props;
    const path = location.pathname;
    if (path.endsWith(Routes.ARREST_CHARGES)) {
      this.switchToArrestChargeType();
    }
    else if (path.endsWith(Routes.COURT_CHARGES)) {
      this.switchToCourtChargeType();
    }
  }

  componentDidUpdate(prevProps :Props) {
    const { location } = this.props;
    const path = location.pathname;
    const prevPath = prevProps.location.pathname;
    const pathsDoNotMatch = path !== prevPath;
    if (pathsDoNotMatch && path.endsWith(Routes.ARREST_CHARGES)) {
      this.switchToArrestChargeType();
    }
    else if (pathsDoNotMatch && path.endsWith(Routes.COURT_CHARGES)) {
      this.switchToCourtChargeType();
    }
  }

  getChargePermission = () => {
    const { chargeType } = this.state;
    const { arrestChargePermissions, courtChargePermissions } = this.props;
    const hasArrestPermission = (chargeType === CHARGE_TYPES.ARREST && arrestChargePermissions);
    const hasCourtPermission = (chargeType === CHARGE_TYPES.COURT && courtChargePermissions);
    return (hasArrestPermission || hasCourtPermission);
  }

  handleOnChangeSearchQuery = (event :SyntheticInputEvent<*>) => this.setState({
    searchQuery: event.target.value
  });

  openChargeModal = (charge :Map) => {
    const hasPermission = this.getChargePermission();
    if (hasPermission) this.setState({ charge, newChargeModalOpen: true });
  };

  closeChargeModal = () => (this.setState({ charge: Map(), newChargeModalOpen: false }))

  renderNewChargeModal = () => {
    const { charge, newChargeModalOpen, chargeType } = this.state;
    return (
      <NewChargeModal
          charge={charge}
          chargeType={chargeType}
          onClose={this.closeChargeModal}
          open={newChargeModalOpen} />
    );
  }

  handleFilterRequest = (charges :List) => {
    const { searchQuery } = this.state;
    let matchesStatute;
    let matchesDescription;
    let nextCharges = charges
      .sortBy((charge) => charge.getIn([PROPERTY_TYPES.REFERENCE_CHARGE_DESCRIPTION, 0], ''))
      .sortBy((charge) => charge.getIn([PROPERTY_TYPES.REFERENCE_CHARGE_STATUTE, 0], ''));
    if (searchQuery) {
      nextCharges = nextCharges.filter((charge) => {
        const statute = charge.getIn([PROPERTY_TYPES.REFERENCE_CHARGE_DESCRIPTION, 0]);
        const description = charge.getIn([PROPERTY_TYPES.REFERENCE_CHARGE_STATUTE, 0]);
        if (statute) {
          matchesStatute = statute.toLowerCase().includes(searchQuery.toLowerCase());
        }
        if (description) {
          matchesDescription = description.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return matchesStatute || matchesDescription;
      });
    }
    return nextCharges;
  }

  renderChargeSearch = () => (
    <SearchInput onChange={this.handleOnChangeSearchQuery} />
  )

  getChargeList = () => {
    const { chargeType } = this.state;
    const { arrestChargesById, courtChargesById, selectedOrganizationId } = this.props;
    let charges;
    if (chargeType === CHARGE_TYPES.ARREST) {
      charges = arrestChargesById.get(selectedOrganizationId, Map());
    }
    else if (chargeType === CHARGE_TYPES.COURT) {
      charges = courtChargesById.get(selectedOrganizationId, Map());
    }
    charges = this.handleFilterRequest(charges);
    const numResults = charges.length || charges.size;
    const numPages = Math.ceil(numResults / MAX_RESULTS);
    return { charges, numResults, numPages };
  }

  renderCharges = () => {
    const { chargeType } = this.state;
    const { loadChargesReqState } = this.props;
    const { charges } = this.getChargeList();
    const loadingCharge = requestIsPending(loadChargesReqState);
    return (
      <ChargeTable
          isLoading={loadingCharge}
          openChargeModal={this.openChargeModal}
          charges={charges}
          chargeType={chargeType} />
    );
  }

  render() {
    const { chargeType, importIsVisible } = this.state;
    const arrestRoute = `${Routes.CHARGE_SETTINGS}${Routes.ARREST_CHARGES}`;
    const courtRoute = `${Routes.CHARGE_SETTINGS}${Routes.COURT_CHARGES}`;

    const navButtons = [
      {
        path: arrestRoute,
        label: 'Arrest'
      },
      {
        path: courtRoute,
        label: 'Court'
      }
    ];

    const chargeManagementDisabled = !this.getChargePermission();

    return (
      <DashboardMainSection>
        <ArrestingAgencies editing={!chargeManagementDisabled} />
        <ToolbarWrapper>
          <NavButtonToolbar options={navButtons} />
          <ButtonWrapper>
            <Button
                disabled={chargeManagementDisabled}
                color="secondary"
                onClick={this.openChargeModal}>
              Add Single Charge
            </Button>
            <Button
                color="secondary"
                disabled={chargeManagementDisabled}
                startIcon={CSVIcon}
                onClick={this.openImportModal}>
              Import Charges
            </Button>
          </ButtonWrapper>
        </ToolbarWrapper>
        <SubToolbarWrapper>
          { this.renderChargeSearch() }
        </SubToolbarWrapper>
        <Switch>
          <Route path={arrestRoute} render={this.renderCharges} />
          <Route path={courtRoute} render={this.renderCharges} />
          <Redirect from={Routes.CHARGE_SETTINGS} to={arrestRoute} />
        </Switch>
        { this.renderNewChargeModal() }
        <ImportChargesModal
            visibleChargeType={chargeType}
            isVisible={importIsVisible}
            onClose={this.closeImportModal} />
      </DashboardMainSection>
    );
  }
}

function mapStateToProps(state) {
  const app = state.get(STATE.APP);
  const charges = state.get(STATE.CHARGES);

  return {
    // App
    [APP_DATA.ORGS]: app.get(APP_DATA.ORGS),
    [APP_DATA.SELECTED_ORG_ID]: app.get(APP_DATA.SELECTED_ORG_ID),
    [APP_DATA.SELECTED_ORG_TITLE]: app.get(APP_DATA.SELECTED_ORG_TITLE),

    // Charges
    loadChargesReqState: getReqState(app, LOAD_CHARGES),
    [CHARGE_DATA.ARREST_CHARGES_BY_ID]: charges.get(CHARGE_DATA.ARREST_CHARGES_BY_ID),
    [CHARGE_DATA.ARREST_PERMISSIONS]: charges.get(CHARGE_DATA.ARREST_PERMISSIONS),
    [CHARGE_DATA.COURT_CHARGES_BY_ID]: charges.get(CHARGE_DATA.COURT_CHARGES_BY_ID),
    [CHARGE_DATA.COURT_PERMISSIONS]: charges.get(CHARGE_DATA.COURT_PERMISSIONS)
  };
}

// $FlowFixMe
export default connect(mapStateToProps, null)(ManageChargesContainer);
