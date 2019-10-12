/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { Map } from 'immutable';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import type { RequestSequence, RequestState } from 'redux-reqseq';
import {
  Checkbox,
  Radio,
  Select,
  Card,
  CardSegment,
  EditButton
} from 'lattice-ui-kit';

import RCMSettings from './RCMSettings';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { OL } from '../../utils/consts/Colors';
import { getEntityProperties } from '../../utils/DataUtils';
import { HeaderSection } from '../../components/settings/SettingsStyledComponents';
import {
  CASE_CONTEXTS,
  CONTEXTS,
  MODULE,
  SETTINGS
} from '../../utils/consts/AppSettingConsts';

import { STATE } from '../../utils/consts/redux/SharedConsts';
import { getReqState, requestIsSuccess } from '../../utils/consts/redux/ReduxUtils';
import { APP_DATA } from '../../utils/consts/redux/AppConsts';
import { COUNTIES_DATA } from '../../utils/consts/redux/CountiesConsts';
import { SETTINGS_ACTIONS, SETTINGS_DATA } from '../../utils/consts/redux/SettingsConsts';

import * as SettingsActions from './SettingsActions';
import { StyledFormViewWrapper, StyledFormWrapper } from '../../utils/Layout';

const { ENTITY_KEY_ID, NAME } = PROPERTY_TYPES;

const SubSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin-bottom: 40px;

  h1 {
    font-family: 'Open Sans', sans-serif;
    font-size: 16px;
    color: ${OL.GREY01};
  }
`;

const ChoiceWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
`;

const StyledCell = styled.div`
  padding: 10px 10px;
  text-align: ${props => props.align || 'left'};
  word-wrap: break-word;
`;

const RadioSection = styled.div`
  margin-bottom: 10px;

  h1 {
    font-family: 'Open Sans', sans-serif;
    font-size: 14px;
    color: ${OL.GREY01};
  }

  article {
    margin-left: 15px;
  }
`;


type Props = {
  settings :Map<*, *>,
  selectedOrganizationId :string,
  submitSettingsReqState :RequestState,
  selectedOrganizationSettings :Map<*, *>,
  countiesById :Map<*, *>,
  actions :{
    loadApp :RequestSequence;
    replaceEntity :RequestSequence;
  };
};

class SettingsContainer extends React.Component<Props, State> {
  constructor(props :Props) {
    super(props);
    this.state = { editing: false };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const { submitSettingsReqState } = nextProps;
    const { editing } = prevState;
    if (editing && requestIsSuccess(submitSettingsReqState)) {
      return { editing: false };
    }
    return null;
  }

  initializeSettings = () => {
    const { actions, selectedOrganizationSettings } = this.props;
    actions.initializeSettings({ selectedOrganizationSettings });
  }

  componentDidMount() {
    const { selectedOrganizationId } = this.props;
    if (selectedOrganizationId) {
      this.initializeSettings();
    }
  }

  componentDidUpdate(prevProps) {
    const { selectedOrganizationId, submitSettingsReqState } = this.props;
    if (selectedOrganizationId !== prevProps.selectedOrganizationId || requestIsSuccess(submitSettingsReqState)) {
      this.initializeSettings();
    }
  }

  renderCheckbox = (path, label) => {
    const { editing } = this.state;
    const { actions, settings } = this.props;
    return (
      <StyledCell key={label + path} align="center">
        <Checkbox
            disabled={!editing}
            checked={settings.getIn(path, false)}
            label={label}
            onChange={({ target }) => {
              actions.updateSetting({ path, value: target.checked });
            }} />
      </StyledCell>
    );
  }

  renderRadioButton = (path, optionValue, label) => {
    const { editing } = this.state;
    const { actions, settings } = this.props;
    return (
      <StyledCell align="center">
        <Radio
            disabled={!editing}
            value={optionValue}
            checked={settings.getIn(path) === optionValue}
            label={label}
            onChange={({ target }) => {
              actions.updateSetting({ path, value: target.value });
            }} />
      </StyledCell>
    );
  }

  updatePreferredCounty = (county) => {
    const { actions } = this.props;
    actions.updateSetting({ path: [SETTINGS.PREFERRED_COUNTY], value: county });
  };

  renderCountyOptions = () => {
    const { countiesById, settings } = this.props;
    const countyFilter = settings.get(SETTINGS.PREFERRED_COUNTY, '');
    const countyOptions :List = countiesById.entrySeq().map(([countyEKID, county]) => {
      const { [NAME]: countyName } = getEntityProperties(county, [ENTITY_KEY_ID, NAME]);
      return {
        label: countyName,
        value: countyEKID
      };
    }).toJS();
    const currentFilterValue :Object = {
      label: countiesById.getIn([countyFilter, NAME, 0], 'All'),
      value: countyFilter
    };
    return (
      <Select
          value={currentFilterValue}
          options={countyOptions}
          onChange={this.updatePreferredCounty} />
    );
  }

  submit = () => {
    const { actions } = this.props;
    actions.submitSettings();
  }

  renderAdvancedSettings = () => (
    <>
      <CardSegment>
        <HeaderSection>Advanced Settings</HeaderSection>
      </CardSegment>
      <CardSegment vertical>
        <SubSection>
          <h1>Modules</h1>
          <article>
            {this.renderCheckbox([SETTINGS.MODULES, MODULE.PSA], 'PSA')}
            {this.renderCheckbox([SETTINGS.MODULES, MODULE.PRETRIAL], 'Pretrial')}
          </article>
        </SubSection>
        <SubSection>
          <h1>Court reminders enabled</h1>
          <article>
            {this.renderCheckbox([SETTINGS.COURT_REMINDERS], 'Enabled?')}
          </article>
        </SubSection>
        <SubSection>
          <h1>Check-in voice enrollment enabled</h1>
          <article>
            {this.renderCheckbox([SETTINGS.ENROLL_VOICE], 'Enabled?')}
          </article>
        </SubSection>
        <SubSection>
          <h1>Load cases on the fly</h1>
          <article>
            {this.renderCheckbox([SETTINGS.LOAD_CASES], 'Should load?')}
          </article>
        </SubSection>
        <SubSection>
          <h1>Preferred County Entity Key Id</h1>
          <article>
            {this.renderCountyOptions()}
          </article>
        </SubSection>
      </CardSegment>
    </>
  )

  startEdit = () => this.setState({ editing: true });

  cancelEdit = () => {
    this.initializeSettings();
    this.setState({ editing: false });
  };

  renderHeader = () => {
    const { editing } = this.state;
    return (
      <CardSegment>
        <HeaderSection>Manage App Settings</HeaderSection>
        <HeaderSection>
          <div>
            {
              editing
                ? <EditButton onClick={this.cancelEdit}>Cancel</EditButton>
                : <EditButton onClick={this.startEdit}>Edit</EditButton>
            }
          </div>
        </HeaderSection>
      </CardSegment>
    );
  }

  render() {
    const { editing } = this.state;

    return (
      <StyledFormViewWrapper>
        <StyledFormWrapper>
          <Card>
            { this.renderHeader() }
            <CardSegment vertical>
              <SubSection>
                <h1>Contexts</h1>
                <ChoiceWrapper>
                  {this.renderCheckbox([SETTINGS.CONTEXTS, CONTEXTS.COURT], 'Court')}
                  {this.renderCheckbox([SETTINGS.CONTEXTS, CONTEXTS.BOOKING], 'Booking')}
                </ChoiceWrapper>
              </SubSection>
              <SubSection>
                <h1>Case contexts</h1>
                <article>
                  <RadioSection>
                    <h1>Case/charge types for booking context:</h1>
                    <ChoiceWrapper>
                      {this.renderRadioButton([SETTINGS.CASE_CONTEXTS, CONTEXTS.BOOKING], CASE_CONTEXTS.ARREST, 'Arrest')}
                      {this.renderRadioButton([SETTINGS.CASE_CONTEXTS, CONTEXTS.BOOKING], CASE_CONTEXTS.COURT, 'Court')}
                    </ChoiceWrapper>
                  </RadioSection>
                  <RadioSection>
                    <h1>Case/charge types for court context:</h1>
                    <ChoiceWrapper>
                      {this.renderRadioButton([SETTINGS.CASE_CONTEXTS, CONTEXTS.COURT], CASE_CONTEXTS.ARREST, 'Arrest')}
                      {this.renderRadioButton([SETTINGS.CASE_CONTEXTS, CONTEXTS.COURT], CASE_CONTEXTS.COURT, 'Court')}
                    </ChoiceWrapper>
                  </RadioSection>
                </article>
              </SubSection>
              <SubSection>
                <h1>Additional RCM Guidance:</h1>
                <ChoiceWrapper>
                  {this.renderCheckbox([SETTINGS.STEP_INCREASES], 'Step Increases')}
                  {this.renderCheckbox([SETTINGS.SECONDARY_HOLD_CHARGES], 'Secondary Hold and Release Charges')}
                </ChoiceWrapper>
              </SubSection>
            </CardSegment>
            { this.renderAdvancedSettings() }
            <RCMSettings editing={editing} />
          </Card>
        </StyledFormWrapper>
      </StyledFormViewWrapper>
    );
  }
}

function mapStateToProps(state) {
  const app = state.get(STATE.APP);
  const counties = state.get(STATE.COUNTIES);
  const settings = state.get(STATE.SETTINGS);
  return {

    // Counties
    [COUNTIES_DATA.COUNTIES_BY_ID]: counties.get(COUNTIES_DATA.COUNTIES_BY_ID),

    [APP_DATA.SELECTED_ORG_ID]: app.get(APP_DATA.SELECTED_ORG_ID),
    [APP_DATA.SELECTED_ORG_SETTINGS]: app.get(APP_DATA.SELECTED_ORG_SETTINGS),

    submitSettingsReqState: getReqState(settings, SETTINGS_ACTIONS.SUBMIT_SETTINGS),
    settings: settings.get(SETTINGS_DATA.APP_SETTINGS)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(SettingsActions).forEach((action :string) => {
    actions[action] = SettingsActions[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsContainer);
