/*
 * @flow
 */

import React from 'react';
import moment from 'moment';
import styled from 'styled-components';
import randomUUID from 'uuid/v4';
import Immutable, { List, Map, Set } from 'immutable';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import InfoButton from '../../components/buttons/InfoButton';
import BasicButton from '../../components/buttons/BasicButton';
import DatePicker from '../../components/controls/StyledDatePicker';
import SearchableSelect from '../../components/controls/SearchableSelect';
import HearingCardsHolder from '../../components/hearings/HearingCardsHolder';
import psaHearingConfig from '../../config/formconfig/PSAHearingConfig';
import LoadingSpinner from '../../components/LoadingSpinner';
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
  hr {
    margin: 30px -30px;
    width: calc(100% + 60px);
  }
`;


const Wrapper = styled.div`
  max-height: 100%;
  margin: -30px;
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


const SubmittingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  span {
    font-family: 'Open Sans', sans-serif;
    font-size: 16px;
    margin: 20px 0;
    color: #2e2e34;
  }
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

const ButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const InputLabel = styled.span`
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  text-align: left;
  color: #555e6f;
  margin-bottom: 10px;
`;

type Props = {
  defaultBond :Map<*, *>,
  defaultConditions :Map<*, *>,
  defaultDMF :Map<*, *>,
  dmfId :string,
  hearings :List<*, *>,
  hearingIdsRefreshing :Set<*, *>,
  hearingNeighborsById :Map<*, *>,
  neighbors :Map<*, *>,
  psaId :string,
  psaNeighborsById :Map<*, *>,
  psaEntityKeyId :string,
  personId :string,
  submitting :boolean,
  refreshingNeighbors :boolean,
  actions :{
    submit :(values :{
      config :Map<*, *>,
      values :Map<*, *>,
      callback :() => void
    }) => void,
    refreshPSANeighbors :({ id :string }) => void,
    refreshHearingNeighbors :({ id :string }) => void
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
    this.setState({
      selectingReleaseConditions: true,
      selectedHearing: { row, hearingId, entityKeyId }
    });
  };

  backToHearingSelection = () => {
    this.setState({
      selectingReleaseConditions: false,
      selectedHearing: Map()
    });
  }

  refreshHearingsNeighborsCallback = () => {
    const { selectedHearing } = this.state;
    const { actions } = this.props;
    actions.refreshHearingNeighbors({ id: selectedHearing.entityKeyId });
  }

  renderSelectReleaseCondtions = (selectedHearing) => {
    const {
      actions,
      hearingNeighborsById,
      defaultBond,
      defaultConditions,
      defaultDMF,
      dmfId,
      neighbors,
      personId,
      psaId,
      refreshPSANeighborsCallback,
      hearingIdsRefreshing,
      submitting
    } = this.props;
    console.log(hearingNeighborsById.toJS());

    const {
      deleteEntity,
      replaceEntity,
      submit,
      updateOutcomesAndReleaseCondtions
    } = actions;

    const oldDataOutcome = defaultDMF.getIn([PROPERTY_TYPES.OUTCOME, 0]);
    const { row, hearingId, entityKeyId } = selectedHearing
    const outcome = hearingNeighborsById.getIn([entityKeyId, ENTITY_SETS.OUTCOMES], defaultDMF);
    const bond = hearingNeighborsById.getIn([entityKeyId, ENTITY_SETS.BONDS], (defaultBond || Map()));
    const conditions = hearingNeighborsById
      .getIn([entityKeyId, ENTITY_SETS.RELEASE_CONDITIONS], (defaultConditions || Map()));
    const submittedOutcomes = !!(hearingNeighborsById.getIn([entityKeyId, ENTITY_SETS.OUTCOMES]) || oldDataOutcome);

    return (
      <Wrapper withPadding>
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
            refreshHearingsNeighborsCallback={this.refreshHearingsNeighborsCallback}
            hearingIdsRefreshing={hearingIdsRefreshing}
            hearingId={hearingId}
            hearingEntityKeyId={entityKeyId}
            hearing={row}
            backToSelection={this.backToHearingSelection}
            defaultOutcome={outcome}
            defaultDMF={defaultDMF}
            defaultBond={bond}
            defaultConditions={conditions} />
      </Wrapper>
    );
  }

  renderAvailableHearings = manuallyCreatingHearing => (
    <div>
      <Header>
        <StyledTitle with withSubtitle>
          <span>Available Hearings</span>
          Select a hearing to add it to the defendant's schedule
        </StyledTitle>
        {
          !manuallyCreatingHearing
            ? <CreateButton onClick={this.manuallyCreateHearing}>Create New Hearing</CreateButton>
            : <CreateButton onClick={this.manuallyCreateHearing}>Back to Selection</CreateButton>
        }
      </Header>
      {
        manuallyCreatingHearing
          ? this.renderNewHearingSection()
          : (
            <HearingCardsHolder
                hearings={this.getSortedHearings()}
                handleSelect={this.selectExistingHearing} />
          )
      }
    </div>
  );

  render() {
    const { manuallyCreatingHearing, selectingReleaseConditions, selectedHearing } = this.state;
    const {
      psaEntityKeyId,
      psaNeighborsById,
      hearingIdsRefreshing,
      submitting,
      refreshingNeighbors,
      hearingNeighborsById
    } = this.props;

    const hearingIds = Object.keys(hearingNeighborsById.toJS());
    const hearingsWithOutcomes = hearingIds.filter(id => hearingNeighborsById.getIn([id, ENTITY_SETS.OUTCOMES]));
    const scheduledHearings = psaNeighborsById.getIn([psaEntityKeyId, ENTITY_SETS.HEARINGS], Map())
      .sort((h1, h2) => (moment(h1.getIn([PROPERTY_TYPES.DATE_TIME, 0], ''))
        .isBefore(h2.getIn([PROPERTY_TYPES.DATE_TIME, 0], '')) ? 1 : -1));

    if (submitting || refreshingNeighbors || hearingIdsRefreshing.size) {
      return (
        <Wrapper>
          <SubmittingWrapper>
            <span>{ submitting ? 'Submitting' : 'Reloading' }</span>
            <LoadingSpinner />
          </SubmittingWrapper>
        </Wrapper>
      );
    }
    return (
      <Container>
        <Header>
          <StyledTitle with withSubtitle>
            <span>Scheduled Hearings</span>
          </StyledTitle>
        </Header>
        <HearingCardsHolder
            hearings={scheduledHearings}
            handleSelect={this.selectingReleaseConditions}
            selectedHearing={selectedHearing}
            hearingsWithOutcomes={hearingsWithOutcomes} />
        <hr />
        { selectingReleaseConditions
          ? this.renderSelectReleaseCondtions(selectedHearing)
          : this.renderAvailableHearings(manuallyCreatingHearing)
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
    [REVIEW.HEARINGS_NEIGHBORS_BY_ID]: review.get(REVIEW.HEARINGS_NEIGHBORS_BY_ID),
    [REVIEW.HEARING_IDS_REFRESHING]: review.get(REVIEW.HEARING_IDS_REFRESHING),
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
