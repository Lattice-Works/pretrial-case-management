/*
 * @flow
 */

import React from 'react';
import { List, Map } from 'immutable';
import moment from 'moment';
import styled from 'styled-components';
import randomUUID from 'uuid/v4';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import InfoButton from '../../components/buttons/InfoButton';
import BasicButton from '../../components/buttons/BasicButton';
import DatePicker from '../../components/controls/StyledDatePicker';
import SearchableSelect from '../../components/controls/SearchableSelect';
import HearingCardsHolder from '../../components/hearings/HearingCardsHolder';
import psaHearingConfig from '../../config/formconfig/PSAHearingConfig';
import SelectReleaseConditions from '../../components/releaseconditions/SelectReleaseConditions';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { FORM_IDS, ID_FIELD_NAMES, HEARING } from '../../utils/consts/Consts';
import { getCourtroomOptions } from '../../utils/consts/HearingConsts';
import { getTimeOptions } from '../../utils/consts/DateTimeConsts';
import { PSA_NEIGHBOR, STATE, REVIEW } from '../../utils/consts/FrontEndStateConsts';
import { Title } from '../../utils/Layout';
import * as SubmitActionFactory from '../../utils/submit/SubmitActionFactory';
import * as ReviewActionFactory from '../review/ReviewActionFactory';


const Container = styled.div`
  padding: 30px;
`;


const ModalWrapper = styled.div`
  max-height: 100%;
  padding: ${props => (props.withPadding ? '30px' : '0')};
  hr {
    margin: ${props => (props.withPadding ? '30px -30px' : '15px 0')};
    width: ${props => (props.withPadding ? 'calc(100% + 60px)' : '100%')};
  }
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 20px;

  span {
    font-family: 'Open Sans', sans-serif;
    font-size: 16px;
    font-weight: 600;
    color: #555e6f;
  }
`;

const StyledTitle = styled(Title)`
  margin: 0;
`;

const CenteredContainer = styled.div`
  width: 100%;
  text-align: center;
`;

const StyledSearchableSelect = styled(SearchableSelect)`
  input {
    width: 100%;
  }
`;

const CreateButton = styled(InfoButton)`
  width: 210px;
  height: 40px;
  padding-left: 0;
  padding-right: 0;
`;

const ExistingButton = styled(BasicButton)`
  width: 210px;
  height: 40px;
  padding-left: 0;
  padding-right: 0;
`;

const InputRow = styled.div`
  display: inline-flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;

  section {
    width: 25%;
    padding: 0 2.5% 0 2.5%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
`;

const InputLabel = styled.span`
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  text-align: left;
  color: #555e6f;
  margin-bottom: 10px;
`;

type Props = {
  defaultConditions :Map<*, *>,
  defaultBond :Map<*, *>,
  defaultDMF :Map<*, *>,
  dmfId :string,
  hearings :List<*, *>,
  neighbors :Map<*, *>,
  psaId :string,
  psaNeighborsById :Map<*, *>,
  psaEntityKeyId :string,
  personId :string,
  submitting :boolean,
  actions :{
    submit :(values :{
      config :Map<*, *>,
      values :Map<*, *>,
      callback :() => void
    }) => void,
    refreshPSANeighbors :({ id :string }) => void
  },
  refreshPSANeighborsCallback :() => void,
  onSubmit? :(hearing :Object) => void
}

type State = {
  manuallyCreatingHearing :boolean,
  newHearingDate :?string,
  newHearingTime :?string,
  newHearingCourtroom :?string,
  selectedHearing :Object,
  selectingReleaseConditions :boolean
};

class SelectHearingsContainer extends React.Component<Props, State> {

  static defaultProps = {
    onSubmit: () => {}
  }

  constructor(props :Props) {
    super(props);
    this.state = {
      manuallyCreatingHearing: false,
      newHearingCourtroom: undefined,
      newHearingDate: undefined,
      newHearingTime: undefined,
      selectedHearing: Map(),
      selectingReleaseConditions: false
    };
  }

  onInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  getSortedHearings = () => {
    const { hearings } = this.props;
    return hearings.sort((h1, h2) => (moment(h1.getIn([PROPERTY_TYPES.DATE_TIME, 0], ''))
      .isBefore(h2.getIn([PROPERTY_TYPES.DATE_TIME, 0], '')) ? 1 : -1));
  }

  isReadyToSubmit = () => {
    const { newHearingCourtroom, newHearingDate, newHearingTime } = this.state;
    return (newHearingCourtroom && newHearingDate && newHearingTime);
  }

  selectHearing = (hearingDetails) => {
    const {
      psaId,
      personId,
      psaEntityKeyId,
      actions
    } = this.props;

    const values = Object.assign({}, hearingDetails, {
      [ID_FIELD_NAMES.PSA_ID]: psaId,
      [FORM_IDS.PERSON_ID]: personId
    });

    const callback = psaEntityKeyId ? () => actions.refreshPSANeighbors({ id: psaEntityKeyId }) : () => {};
    actions.submit({
      values,
      config: psaHearingConfig,
      callback
    });
  }

  selectCurrentHearing = () => {
    const { onSubmit } = this.props;
    const { newHearingDate, newHearingTime, newHearingCourtroom } = this.state;
    const dateFormat = 'MM/DD/YYYY';
    const timeFormat = 'hh:mm a';
    const date = moment(newHearingDate);
    const time = moment(newHearingTime, timeFormat);
    if (date.isValid() && time.isValid()) {
      const datetime = moment(`${date.format(dateFormat)} ${time.format(timeFormat)}`, `${dateFormat} ${timeFormat}`);
      const hearing = {
        [ID_FIELD_NAMES.HEARING_ID]: randomUUID(),
        [HEARING.DATE_TIME]: datetime.toISOString(true),
        [HEARING.COURTROOM]: newHearingCourtroom,
        [PROPERTY_TYPES.HEARING_TYPE]: 'Initial Appearance'
      };

      this.selectHearing(hearing);
      onSubmit(hearing);
    }
  }

  selectExistingHearing = (row, hearingId) => {
    const { onSubmit } = this.props;
    const hearingWithOnlyId = { [ID_FIELD_NAMES.HEARING_ID]: hearingId };
    this.selectHearing(hearingWithOnlyId);
    onSubmit(Object.assign({}, hearingWithOnlyId, {
      [HEARING.DATE_TIME]: row.getIn([PROPERTY_TYPES.DATE_TIME, 0], ''),
      [HEARING.COURTROOM]: row.getIn([PROPERTY_TYPES.COURTROOM, 0], '')
    }));
  }

  renderNewHearingSection = () => {
    const { newHearingDate, newHearingTime, newHearingCourtroom } = this.state;
    return (
      <CenteredContainer>
        <InputRow>
          <section>
            <InputLabel>Date</InputLabel>
            <DatePicker
                value={newHearingDate}
                onChange={hearingDate => this.setState({ newHearingDate: hearingDate })}
                clearButton={false} />
          </section>
          <section>
            <InputLabel>Time</InputLabel>
            <StyledSearchableSelect
                options={getTimeOptions()}
                value={newHearingTime}
                onSelect={hearingTime => this.setState({ newHearingTime: hearingTime })}
                short />
          </section>
          <section>
            <InputLabel>Courtroom</InputLabel>
            <StyledSearchableSelect
                options={getCourtroomOptions()}
                value={newHearingCourtroom}
                onSelect={hearingCourtroom => this.setState({ newHearingCourtroom: hearingCourtroom })}
                short />
          </section>
          <section>
            <InputLabel />
            <CreateButton disabled={!this.isReadyToSubmit()} onClick={this.selectCurrentHearing}>
              Create New
            </CreateButton>
          </section>
        </InputRow>
      </CenteredContainer>
    );
  }

  manuallyCreateHearing = () => {
    const { manuallyCreatingHearing } = this.state;
    this.setState({ manuallyCreatingHearing: !manuallyCreatingHearing });
  };

  selectingReleaseConditions = (row, hearingId, entityKeyId) => {
    const { selectingReleaseConditions } = this.state;
    this.setState({
      selectingReleaseConditions: !selectingReleaseConditions,
      selectedHearing: { row, hearingId, entityKeyId }
    });
  };

  backToHearingSelection = () => {
    const { selectingReleaseConditions } = this.state;
    this.setState({
      selectingReleaseConditions: !selectingReleaseConditions,
      selectedHearing: Map()
    });
  }
  renderSelectReleaseCondtions = (selectedHearing) => {
    const {
      actions,
      defaultBond,
      defaultConditions,
      defaultDMF,
      dmfId,
      neighbors,
      personId,
      psaId,
      refreshPSANeighborsCallback,
      submitting
    } = this.props;

    const {
      deleteEntity,
      replaceEntity,
      submit,
      updateOutcomesAndReleaseCondtions
    } = actions;

    const submittedOutcomes = !!neighbors
      .getIn([ENTITY_SETS.DMF_RESULTS, PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.OUTCOME]);

    return (
      <ModalWrapper>
        <SelectReleaseConditions
            submitting={submitting}
            submittedOutcomes={submittedOutcomes}
            neighbors={neighbors}
            personId={personId}
            psaId={psaId}
            dmfId={dmfId}
            submit={submit}
            replace={replaceEntity}
            delete={deleteEntity}
            submitCallback={refreshPSANeighborsCallback}
            updateFqn={updateOutcomesAndReleaseCondtions}
            hearing={selectedHearing.row}
            backToSelection={this.backToHearingSelection}
            defaultDMF={defaultDMF}
            defaultBond={defaultBond}
            defaultConditions={defaultConditions} />
      </ModalWrapper>
    );
  }

  render() {
    const { manuallyCreatingHearing, selectingReleaseConditions, selectedHearing } = this.state;
    const { psaEntityKeyId, psaNeighborsById } = this.props;

    const scheduledHearings = psaNeighborsById.getIn([psaEntityKeyId, ENTITY_SETS.HEARINGS], Map());

    if (selectingReleaseConditions) {
      return this.renderSelectReleaseCondtions(selectedHearing);
    }

    return (
      <Container>
        <Header>
          <StyledTitle with withSubtitle>
            <span>Scheduled Hearings</span>
          </StyledTitle>
        </Header>
        <HearingCardsHolder hearings={scheduledHearings} handleSelect={this.selectingReleaseConditions} />
        <Header>
          <StyledTitle with withSubtitle>
            <span>Available Hearings</span>
            Select a hearing to add it to the defendant's schedule
          </StyledTitle>
          {
            !manuallyCreatingHearing
              ? <CreateButton onClick={this.manuallyCreateHearing}>Create New Hearing</CreateButton>
              : null
          }
        </Header>
        {
          manuallyCreatingHearing
            ? this.renderNewHearingSection()
            : <HearingCardsHolder hearings={this.getSortedHearings()} handleSelect={this.selectExistingHearing} />
        }
      </Container>
    );
  }
}

function mapStateToProps(state) {
  const review = state.get(STATE.REVIEW);
  return {
    [REVIEW.SCORES]: review.get(REVIEW.SCORES),
    [REVIEW.NEIGHBORS_BY_ID]: review.get(REVIEW.NEIGHBORS_BY_ID),
    [REVIEW.LOADING_RESULTS]: review.get(REVIEW.LOADING_RESULTS),
    [REVIEW.ERROR]: review.get(REVIEW.ERROR)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(SubmitActionFactory).forEach((action :string) => {
    actions[action] = SubmitActionFactory[action];
  });

  Object.keys(ReviewActionFactory).forEach((action :string) => {
    actions[action] = ReviewActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SelectHearingsContainer);
