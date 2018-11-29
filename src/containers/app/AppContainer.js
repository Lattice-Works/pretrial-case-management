/*
 * @flow
 */

import React from 'react';

import styled from 'styled-components';
import { AuthActionFactory } from 'lattice-auth';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Redirect, Route, Switch } from 'react-router-dom';

import AppConsent from './AppConsent';
import HeaderNav from '../../components/nav/HeaderNav';
import Dashboard from '../../components/dashboard/Dashboard';
import Forms from '../forms/Forms';
import ContactSupport from '../../components/app/ContactSupport';
import { APP, CHARGES, STATE } from '../../utils/consts/FrontEndStateConsts';
import { APP_TYPES_FQNS } from '../../utils/consts/Consts';
import { termsAreAccepted } from '../../utils/AcceptTermsUtils';
import { OL } from '../../utils/consts/Colors';

import * as Routes from '../../core/router/Routes';
import * as AppActionFactory from './AppActionFactory';
import * as ChargesActionFactory from '../charges/ChargesActionFactory';

const {
  logout
} = AuthActionFactory;

const {
  ARREST_CHARGE_LIST,
  COURT_CHARGE_LIST
} = APP_TYPES_FQNS;

/*
 * styled components
 */

const AppWrapper = styled.div`
  background-color: ${OL.GREY09};
  display: flex;
  flex-direction: column;
  min-height: 100%;
  min-width: fit-content;
  font-family: 'Open Sans', sans-serif;
`;

const AppBodyWrapper = styled.div`
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  padding: 30px 170px;
  margin: 0 auto;
`;

/*
 * types
 */

type Props = {
  actions :{
    loadApp :RequestSequence;
    loadHospitals :RequestSequence;
    switchOrganization :(orgId :string) => Object;
    logout :() => void;
  };
};

class AppContainer extends React.Component<Props, *> {

  componentDidMount() {
    const { actions } = this.props;
    actions.loadApp();
  }

  componentWillReceiveProps(nextProps) {

    const { app, actions } = this.props;
    const prevOrg = app.get(APP.ORGS);
    const nextOrg = nextProps.app.get(APP.ORGS);
    if (prevOrg.size !== nextOrg.size) {
      nextOrg.keySeq().forEach((id) => {
        const selectedOrgId :string = id;
        const arrestChargesEntitySetId = nextProps.app.getIn(
          [ARREST_CHARGE_LIST.toString(), APP.ENTITY_SETS_BY_ORG, selectedOrgId]
        );
        const courtChargesEntitySetId = nextProps.app.getIn(
          [COURT_CHARGE_LIST.toString(), APP.ENTITY_SETS_BY_ORG, selectedOrgId]
        );
        if (arrestChargesEntitySetId && courtChargesEntitySetId) {
          actions.loadCharges({
            arrestChargesEntitySetId,
            courtChargesEntitySetId,
            selectedOrgId
          });
        }
      });
    }
  }

  renderComponent = (Component, props) => (
    termsAreAccepted()
      ? <Component {...props} />
      : <Redirect to={Routes.TERMS} />
  );

  render() {
    const { actions } = this.props;
    return (
      <AppWrapper>
        <HeaderNav logout={actions.logout} />
        <ContactSupport />
        <AppBodyWrapper>
          <Switch>
            <Route path={Routes.TERMS} component={AppConsent} />
            <Route path={Routes.DASHBOARD} render={() => this.renderComponent(Dashboard)} />
            <Route path={Routes.FORMS} render={() => this.renderComponent(Forms)} />
            <Redirect to={Routes.DASHBOARD} />
          </Switch>
        </AppBodyWrapper>
      </AppWrapper>
    );
  }
}

function mapStateToProps(state) {
  const app = state.get(STATE.APP);
  const charges = state.get(STATE.CHARGES);

  return {
    app,
    [CHARGES.ARREST]: charges.get(CHARGES.ARREST),
    [CHARGES.COURT]: charges.get(CHARGES.COURT),
    [CHARGES.LOADING]: charges.get(CHARGES.LOADING)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(AppActionFactory).forEach((action :string) => {
    actions[action] = AppActionFactory[action];
  });

  Object.keys(ChargesActionFactory).forEach((action :string) => {
    actions[action] = ChargesActionFactory[action];
  });

  actions.logout = logout;

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(AppContainer);
