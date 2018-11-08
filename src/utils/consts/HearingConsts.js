import moment from 'moment';
import { OrderedMap, Map } from 'immutable';
import { Constants } from 'lattice';

import { sortByDate } from '../DataUtils';
import { ENTITY_SETS, PROPERTY_TYPES } from './DataModelConsts';

const { OPENLATTICE_ID_FQN } = Constants;

export const COURTROOMS = [
  '1A',
  '6C ARRAIGNMENTS',
  'Courtroom C1',
  'Courtroom C2',
  'Courtroom C3',
  'Courtroom C4',
  'Courtroom C5',
  'Courtroom C6',
  'Courtroom C7',
  'Courtroom C8',
  'Courtroom C9',
  'Courtroom C10',
  'Courtroom M1',
  'Courtroom M2',
];

export const HEARING_CONSTS = {
  FIELD: 'field',
  FULL_NAME: 'fullName',
  JUDGE: 'judge',
  JUDGE_ID: 'judgeId',
  NEW_HEARING_TIME: 'newHearingTime',
  NEW_HEARING_DATE: 'newHearingDate',
  NEW_HEARING_COURTROOM: 'newHearingCourtroom',
  OTHER_JUDGE: 'Other'
};

export const formatJudgeName = (judge) => {
  if (judge) {
    const firstName = judge.getIn([PROPERTY_TYPES.FIRST_NAME, 0]);
    let middleName = judge.getIn([PROPERTY_TYPES.MIDDLE_NAME, 0]);
    let lastName = judge.getIn([PROPERTY_TYPES.LAST_NAME, 0]);
    middleName = middleName ? ` ${middleName}` : '';
    lastName = lastName ? ` ${lastName}` : '';
    const fullNameString = firstName + middleName + lastName;
    if (firstName && lastName) {
      return fullNameString;
    }
  }
  return 'NA';
};

export const getCourtroomOptions = () => {
  let courtroomOptions = OrderedMap();
  COURTROOMS.forEach((courtroom) => {
    courtroomOptions = courtroomOptions.set(courtroom, courtroom);
  });
  return courtroomOptions;
};

export const getJudgeOptions = (allJudges, jurisdiction) => {
  let judgeOptions = Map();

  allJudges.forEach((judge) => {
    if (judge.getIn([PROPERTY_TYPES.JURISDICTION, 0]) === jurisdiction) {
      const fullNameString = formatJudgeName(judge);
      judgeOptions = judgeOptions.set(
        fullNameString,
        judge
          .set(HEARING_CONSTS.FULL_NAME, fullNameString)
          .set(HEARING_CONSTS.FIELD, HEARING_CONSTS.JUDGE)
      );
    }
  });
  judgeOptions = judgeOptions.set(HEARING_CONSTS.OTHER_JUDGE, Map({
    [HEARING_CONSTS.FULL_NAME]: HEARING_CONSTS.OTHER_JUDGE,
    [HEARING_CONSTS.FIELD]: HEARING_CONSTS.JUDGE
  }));
  return judgeOptions.toOrderedMap().sortBy((k, _) => k);
};

// Get hearings from psa neighbors
export const getHearingsFromNeighbors = psaNeighbors => (
  psaNeighbors.get(ENTITY_SETS.HEARINGS, Map())
);

// Get hearing ids from psa neighbors
export const getHearingsIdsFromNeighbors = psaNeighbors => (
  getHearingsFromNeighbors(psaNeighbors)
    .map(hearing => hearing.getIn([OPENLATTICE_ID_FQN, 0]))
    .filter(id => !!id)
    .toJS()
);

// Get future hearings in sequential order from psa neighbors
export const getScheduledHearings = (psaNeighbors) => {
  const todaysDate = moment().startOf('day');
  return (
    getHearingsFromNeighbors(psaNeighbors)
      .filter(hearing => todaysDate.isBefore(hearing.getIn([PROPERTY_TYPES.DATE_TIME, 0], '')))
      .sort((h1, h2) => sortByDate(h1, h2, PROPERTY_TYPES.DATE_TIME))
  );
};

// Get past hearings in sequential order from psa neighbors
export const getPastHearings = (psaNeighbors) => {
  const todaysDate = moment().startOf('day');
  return (
    getHearingsFromNeighbors(psaNeighbors)
      .filter(hearing => todaysDate.isAfter(hearing.getIn([PROPERTY_TYPES.DATE_TIME, 0], '')))
      .sort((h1, h2) => sortByDate(h1, h2, PROPERTY_TYPES.DATE_TIME))
  );
};

// Get hearings for available hearings - hearings that are of type 'initial appearance', have no outcomes,
// haven't been cancelled, and are in the future.
export const getAvailableHearings = (personHearings, scheduledHearings, hearingNeighborsById) => {
  let scheduledHearingMap = Map();
  scheduledHearings.forEach((scheduledHearing) => {
    const dateTime = scheduledHearing.getIn([PROPERTY_TYPES.DATE_TIME, 0]);
    const courtroom = scheduledHearing.getIn([PROPERTY_TYPES.COURTROOM, 0]);
    scheduledHearingMap = scheduledHearingMap.set(dateTime, courtroom);
  });

  const unusedHearings = personHearings.filter((hearing) => {
    const hearingDateTime = hearing.getIn([PROPERTY_TYPES.DATE_TIME, 0], '');
    const hearingCourtroom = hearing.getIn([PROPERTY_TYPES.COURTROOM, 0], '');
    const id = hearing.getIn([OPENLATTICE_ID_FQN, 0]);
    const hasOutcome = !!hearingNeighborsById.getIn([id, ENTITY_SETS.OUTCOMES]);
    const hearingHasBeenCancelled = hearing.getIn([PROPERTY_TYPES.UPDATE_TYPE, 0], '')
      .toLowerCase().trim() === 'cancelled';
    const hearingIsInPast = moment(hearingDateTime).isBefore(moment());
    return !((scheduledHearingMap.get(hearingDateTime) === hearingCourtroom)
    || hasOutcome
    || hearingHasBeenCancelled
    || hearingIsInPast
    );
  });
  return unusedHearings.sort((h1, h2) => sortByDate(h1, h2, PROPERTY_TYPES.DATE_TIME));
};
