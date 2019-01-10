/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { Map, List, Set } from 'immutable';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { NavLink } from 'react-router-dom';
import { Constants } from 'lattice';

import { formatPeopleInfo } from '../../utils/PeopleUtils';
import SecondaryButton from '../../components/buttons/SecondaryButton';
import ToggleButtonsGroup from '../../components/buttons/ToggleButtons';
import LoadingSpinner from '../../components/LoadingSpinner';
import PersonCard from '../../components/people/PersonCard';
import DatePicker from '../../components/datetime/DatePicker';
import * as Routes from '../../core/router/Routes';
import { StyledSectionWrapper } from '../../utils/Layout';
import { TIME_FORMAT } from '../../utils/FormattingUtils';
import { APP_TYPES_FQNS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { DOMAIN } from '../../utils/consts/ReportDownloadTypes';
import { sortPeopleByName } from '../../utils/PSAUtils';
import { OL } from '../../utils/consts/Colors';
import {
  APP,
  COURT,
  EDM,
  PSA_NEIGHBOR,
  PSA_MODAL,
  REVIEW,
  STATE,
  SUBMIT
} from '../../utils/consts/FrontEndStateConsts';

import * as CourtActionFactory from './CourtActionFactory';
import * as FormActionFactory from '../psa/FormActionFactory';
import * as ReviewActionFactory from '../review/ReviewActionFactory';
import * as PSAModalActionFactory from '../psamodal/PSAModalActionFactory';
import * as SubmitActionFactory from '../../utils/submit/SubmitActionFactory';
import * as DataActionFactory from '../../utils/data/DataActionFactory';

const { PEOPLE } = APP_TYPES_FQNS;
const peopleFqn :string = PEOPLE.toString();

const { OPENLATTICE_ID_FQN } = Constants;

const StyledFormViewWrapper = styled.div`
  display: flex;
  max-width: 960px;
`;

const StyledFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin: 55px auto;
  width: 100%;
`;

const StyledTitleWrapper = styled.div`
  align-items: center;
  color: ${OL.GREY34};
  display: flex;
  font-size: 32px;
  justify-content: space-between;
  margin-bottom: 30px;
  width: 100%;
`;

const HearingTime = styled.div`
  border-bottom: 1px solid ${OL.GREY11};
  padding: 30px;
  text-align: left;
  width: 100%;

  h1 {
    font-family: 'Open Sans', sans-serif;
    font-size: 18px;
    color: ${OL.GREY01};
    padding-bottom: 30px;
  }
`;

const HearingRow = styled.div`
  display: flex;
  flex-direction: row;

  &:not(:last-child) {
    margin-bottom: 50px;
  }
`;

const Courtroom = styled.div`
  width: 200px;
  padding: 20px;
  background-color: ${OL.GREY08};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  span {
    font-weight: 600;
    margin-bottom: 10px;
  }
`;

const PeopleWrapper = styled.div`
  width: 100%;
  padding: 20px 0 0 20px;
  border: 1px solid ${OL.GREY08};
  display: grid;
  grid-template-columns: 31% 31% 31%;
  column-gap: 3%;
`;

const DatePickerWrapper = styled.div`
  width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
`;

const Label = styled.span`
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
`;

const SpinnerWrapper = styled.div`
  margin-top: 30px;
`;

const ToggleWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  margin: 5px;
`;

type Props = {
  openPSAIds :List<*>,
  hearingsByTime :Map<*, *>,
  hearingNeighborsById :Map<*, *>,
  isLoadingPSAs :boolean,
  courtroom :string,
  courtrooms :List<*>,
  county :string,
  hearingIds :List<*>,
  peopleWithOpenPsas :Set<*>,
  peopleIdsToOpenPSAIds :Map<*>,
  scoresAsMap :Map<*>,
  loadingPSAData :boolean,
  submitting :boolean,
  selectedOrganizationId :string,
  psaIdsRefreshing :boolean,
  actions :{
    bulkDownloadPSAReviewPDF :({ peopleEntityKeyIds :string[] }) => void,
    changeHearingFilters :({ county? :string, courtroom? :string }) => void,
    checkPSAPermissions :() => void,
    clearSubmit :() => void,
    deleteEntity :(value :{ entitySetName :string, entityKeyId :string }) => void,
    downloadPSAReviewPDF :(values :{
      neighbors :Map<*, *>,
      scores :Map<*, *>
    }) => void,
    loadCaseHistory :(values :{
      personId :string,
      neighbors :Map<*, *>
    }) => void,
    loadHearingNeighbors :(hearingIds :string[]) => void,
    loadHearingsForDate :(date :Object) => void,
    loadJudges :() => void,
    loadPSAsByDate :(filter :string) => void,
    refreshPSANeighbors :({ id :string }) => void,
    replaceEntity :(value :{ entitySetName :string, entityKeyId :string, values :Object }) => void,
    submit :(value :{ config :Object, values :Object}) => void,
    loadPSAData :(psaIds :string[]) => void
  }
};

type State = {
  date :Object
}

const PENN_ROOM_PREFIX = 'Courtroom ';

class CourtContainer extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);
    this.state = {
      date: moment()
    };
  }

  componentDidMount() {
    const { date } = this.state;
    const {
      actions,
      hearingNeighborsById,
      hearingsByTime,
      selectedOrganizationId
    } = this.props;
    const { checkPSAPermissions, loadHearingsForDate, loadJudges } = actions;
    if (selectedOrganizationId) {
      checkPSAPermissions();
      loadJudges();
      if (!hearingsByTime.size || !hearingNeighborsById.size) {
        loadHearingsForDate(date);
      }
    }
  }

  componentWillReceiveProps(nextProps) {
    const { date } = this.state;
    const {
      actions,
      hearingsByTime,
      hearingIds,
      hearingNeighborsById,
      openPSAIds,
      selectedOrganizationId
    } = this.props;
    const { checkPSAPermissions, loadHearingsForDate, loadJudges } = actions;
    if (selectedOrganizationId !== nextProps.selectedOrganizationId) {
      checkPSAPermissions();
      loadJudges();
      if (!hearingsByTime.size || !hearingNeighborsById.size) {
        loadHearingsForDate(date);
      }
    }
    // if (openPSAIds.size !== nextProps.openPSAIds.size) {
    //   actions.loadPSAData(nextProps.openPSAIds.toJS());
    // }
    if (hearingIds.size !== nextProps.hearingIds.size) {
      actions.loadHearingNeighbors({ hearingIds: nextProps.hearingIds.toJS() });
    }
  }

  componentWillUnmount() {
    const { actions } = this.props;
    actions.clearSubmit();
  }

  loadCaseHistoryCallback = (personId, psaNeighbors) => {
    const { actions } = this.props;
    const { loadCaseHistory } = actions;
    loadCaseHistory({ personId, neighbors: psaNeighbors });
  }

  renderPersonCard = (person, index) => {
    const {
      actions,
      peopleIdsToOpenPSAIds,
      peopleWithOpenPsas,
      scoresAsMap,
      submitting,
      psaIdsRefreshing
    } = this.props;
    const personOlId = person.getIn([OPENLATTICE_ID_FQN, 0]);
    const openPSAId = peopleIdsToOpenPSAIds.get(personOlId, '');
    const hasOpenPSA = peopleWithOpenPsas.has(personOlId);
    const scores = scoresAsMap.get(openPSAId, Map());
    const personObj = formatPeopleInfo(person);
    return (
      <PersonCard
          key={`${personObj.identification}-${index}`}
          psaId={openPSAId}
          person={person}
          personId={personOlId}
          personObj={personObj}
          hasOpenPSA={hasOpenPSA}
          scores={scores}
          downloadFn={actions.downloadPSAReviewPDF}
          loadCaseHistoryFn={this.loadCaseHistoryCallback}
          loadPSAModal={actions.loadPSAModal}
          submitData={actions.submit}
          replaceEntity={actions.replaceEntity}
          deleteEntity={actions.deleteEntity}
          submitting={submitting}
          refreshingNeighbors={psaIdsRefreshing.has(openPSAId)}
          judgesview />
    );
  }

  downloadPDFs = (courtroom, people, time) => {
    const { actions } = this.props;
    const fileName = `${courtroom}-${moment().format('YYYY-MM-DD')}-${time}`;
    actions.bulkDownloadPSAReviewPDF({
      fileName,
      peopleEntityKeyIds: people.valueSeq().map(person => person.getIn([OPENLATTICE_ID_FQN, 0])).toJS()
    });
  }

  renderHearingRow = (courtroom, people, time) => {
    const persons = people.toList().sort(sortPeopleByName);
    return (
      <HearingRow key={`${courtroom}-${time}`}>
        <Courtroom key={`${courtroom}-${time}-${time}`}>
          <span>{courtroom}</span>
          <SecondaryButton
              onClick={() => this.downloadPDFs(courtroom, people, time)}>
            Download PDFs
          </SecondaryButton>
        </Courtroom>
        <PeopleWrapper key={`${time}-${courtroom}`}>{persons.map(this.renderPersonCard)}</PeopleWrapper>
      </HearingRow>
    );
  }

  renderHearingsAtTime = (time) => {
    const {
      county,
      courtroom,
      hearingsByTime,
      hearingNeighborsById
    } = this.props;
    let hearingsByCourtroom = Map();

    hearingsByTime.get(time).forEach((hearing) => {
      let shouldInclude = true;
      const room = hearing.getIn([PROPERTY_TYPES.COURTROOM, 0], '');

      if (county.length || courtroom.length) {

        if (courtroom.length && room !== courtroom) {
          shouldInclude = false;
        }

        if (shouldInclude && county.length) {
          const isPenn = room.startsWith(PENN_ROOM_PREFIX);
          shouldInclude = isPenn ? county === DOMAIN.PENNINGTON : county === DOMAIN.MINNEHAHA;
        }
      }
      if (shouldInclude) {
        const hearingId = hearing.getIn([OPENLATTICE_ID_FQN, 0]);
        const person = hearingNeighborsById
          .getIn([hearingId, peopleFqn, PSA_NEIGHBOR.DETAILS], Map());
        const personId = person.getIn([PROPERTY_TYPES.PERSON_ID, 0]);
        if (personId) {
          hearingsByCourtroom = hearingsByCourtroom
            .set(room, hearingsByCourtroom.get(room, Map()).set(personId, person));
        }
      }
    });


    if (!hearingsByCourtroom.size) return null;
    return (
      <HearingTime key={`${time}${courtroom}${county}`}>
        <h1>{time}</h1>
        {
          hearingsByCourtroom.entrySeq()
            .map(([room, people]) => this.renderHearingRow(room, people, time)).toJS()
        }
      </HearingTime>
    );
  }

  onCountyChange = (county) => {
    const { actions } = this.props;
    actions.changeHearingFilters({
      county,
      courtroom: ''
    });
  }

  onCourtroomChange = (courtroom) => {
    const { actions } = this.props;
    actions.changeHearingFilters({ courtroom });
  }

  renderCountyChoices = () => {
    const { county } = this.props;
    const countyOptions = [
      { value: '', label: 'All' },
      { value: DOMAIN.PENNINGTON, label: 'Pennington' },
      { value: DOMAIN.MINNEHAHA, label: 'Minnehaha' },
    ];
    return (
      <ToggleWrapper>
        <ToggleButtonsGroup
            options={countyOptions}
            selectedOption={county}
            onSelect={this.onCountyChange} />
      </ToggleWrapper>
    );
  }

  renderCourtroomChoices = () => {
    const {
      county,
      courtroom,
      courtrooms
    } = this.props;

    const pennCoutrooms = courtrooms.filter(room => room.startsWith(PENN_ROOM_PREFIX)).toList().sort().map(value => ({
      value,
      label: value
    }));
    const minnCoutrooms = courtrooms.filter(room => !room.startsWith(PENN_ROOM_PREFIX)).toList().sort().map(value => ({
      value,
      label: value
    }));

    let roomOptions = [{
      value: '',
      label: 'All'
    }];
    if (county === DOMAIN.MINNEHAHA) {
      roomOptions = [...roomOptions, ...minnCoutrooms];
    }
    else if (county === DOMAIN.PENNINGTON) {
      roomOptions = [...roomOptions, ...pennCoutrooms];
    }
    else {
      roomOptions = [...roomOptions, ...minnCoutrooms, ...pennCoutrooms];
    }

    return (
      <ToggleWrapper>
        <ToggleButtonsGroup
            options={roomOptions}
            selectedOption={courtroom}
            onSelect={this.onCourtroomChange} />
      </ToggleWrapper>
    );
  }

  handleDateChange = (dateStr) => {
    const { actions } = this.props;
    const date = moment(dateStr);
    if (date.isValid()) {
      this.setState({ date });
      actions.loadHearingsForDate(date);
    }
  }

  renderDatePicker = () => {
    const { date } = this.state;
    return (
      <DatePickerWrapper>
        <Label>Hearing Date</Label>
        <DatePicker
            value={date.format('YYYY-MM-DD')}
            onChange={this.handleDateChange} />
      </DatePickerWrapper>
    );
  }

  renderSearchLink = () => (
    <NavLink to={Routes.SEARCH_PEOPLE} name={Routes.SEARCH_PEOPLE}>Search All People</NavLink>
  )

  renderContent = () => {
    const { loadingPSAData, isLoadingPSAs, hearingsByTime } = this.props;
    if (loadingPSAData || isLoadingPSAs) {
      return <SpinnerWrapper><LoadingSpinner /></SpinnerWrapper>;
    }

    const timeOptions = hearingsByTime.keySeq().sort((time1, time2) => (
      moment(time1, TIME_FORMAT).isSameOrBefore(moment(time2, TIME_FORMAT)) ? -1 : 1));


    return timeOptions.map(this.renderHearingsAtTime);

  }

  render() {
    return (
      <StyledFormViewWrapper>
        <StyledFormWrapper>
          <StyledTitleWrapper>
            <div>Initial Appearances</div>
          </StyledTitleWrapper>
          <StyledSectionWrapper>
            {this.renderDatePicker()}
            {this.renderCountyChoices()}
            {this.renderCourtroomChoices()}
            {this.renderSearchLink()}
            {this.renderContent()}
          </StyledSectionWrapper>
        </StyledFormWrapper>
      </StyledFormViewWrapper>
    );
  }
}

function mapStateToProps(state) {
  const app = state.get(STATE.APP);
  const court = state.get(STATE.COURT);
  const edm = state.get(STATE.EDM);
  const review = state.get(STATE.REVIEW);
  const psaModal = state.get(STATE.PSA_MODAL);
  const submit = state.get(STATE.SUBMIT);
  return {
    [APP.SELECTED_ORG_ID]: app.get(APP.SELECTED_ORG_ID),

    [COURT.HEARINGS_TODAY]: court.get(COURT.HEARINGS_TODAY),
    [COURT.HEARINGS_BY_TIME]: court.get(COURT.HEARINGS_BY_TIME),
    [COURT.LOADING_HEARING_NEIGHBORS]: court.get(COURT.LOADING_HEARING_NEIGHBORS),
    [COURT.HEARINGS_NEIGHBORS_BY_ID]: court.get(COURT.HEARINGS_NEIGHBORS_BY_ID),
    [COURT.HEARING_IDS_REFRESHING]: court.get(COURT.HEARING_IDS_REFRESHING),
    [COURT.LOADING_HEARINGS_ERROR]: court.get(COURT.LOADING_HEARINGS_ERROR),
    [COURT.PEOPLE_WITH_OPEN_PSAS]: court.get(COURT.PEOPLE_WITH_OPEN_PSAS),
    [COURT.LOADING_HEARINGS]: court.get(COURT.LOADING_HEARINGS),
    [COURT.LOADING_PSAS]: court.get(COURT.LOADING_PSAS),
    [COURT.LOADING_ERROR]: court.get(COURT.LOADING_ERROR),
    [COURT.COUNTY]: court.get(COURT.COUNTY),
    [COURT.COURTROOM]: court.get(COURT.COURTROOM),
    [COURT.COURTROOMS]: court.get(COURT.COURTROOMS),
    [COURT.SCORES_AS_MAP]: court.get(COURT.SCORES_AS_MAP),
    [COURT.OPEN_PSA_IDS]: court.get(COURT.OPEN_PSA_IDS),
    [COURT.PEOPLE_IDS_TO_OPEN_PSA_IDS]: court.get(COURT.PEOPLE_IDS_TO_OPEN_PSA_IDS),
    [COURT.ALL_JUDGES]: court.get(COURT.ALL_JUDGES),

    [EDM.FQN_TO_ID]: edm.get(EDM.FQN_TO_ID),

    [REVIEW.LOADING_DATA]: review.get(REVIEW.LOADING_DATA),
    [REVIEW.PSA_IDS_REFRESHING]: review.get(REVIEW.PSA_IDS_REFRESHING),

    [PSA_MODAL.HEARING_IDS]: psaModal.get(PSA_MODAL.HEARING_IDS),

    [SUBMIT.SUBMITTING]: submit.get(SUBMIT.SUBMITTING, false)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(CourtActionFactory).forEach((action :string) => {
    actions[action] = CourtActionFactory[action];
  });

  Object.keys(FormActionFactory).forEach((action :string) => {
    actions[action] = FormActionFactory[action];
  });

  Object.keys(ReviewActionFactory).forEach((action :string) => {
    actions[action] = ReviewActionFactory[action];
  });

  Object.keys(PSAModalActionFactory).forEach((action :string) => {
    actions[action] = PSAModalActionFactory[action];
  });

  Object.keys(SubmitActionFactory).forEach((action :string) => {
    actions[action] = SubmitActionFactory[action];
  });

  Object.keys(DataActionFactory).forEach((action :string) => {
    actions[action] = DataActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CourtContainer);
