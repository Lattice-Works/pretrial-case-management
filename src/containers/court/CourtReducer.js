/*
 * @flow
 */

import moment from 'moment';
import { Constants } from 'lattice';
import {
  Map,
  Set,
  List,
  fromJS
} from 'immutable';

import {
  CHANGE_HEARING_FILTERS,
  filterPeopleIdsWithOpenPSAs,
  loadHearingsForDate,
  loadHearingNeighbors,
  refreshHearingNeighbors,
  loadJudges,
  SET_COURT_DATE
} from './CourtActionFactory';
import { refreshPSANeighbors, changePSAStatus } from '../review/ReviewActionFactory';
import { SWITCH_ORGANIZATION } from '../app/AppActionFactory';
import { APP_TYPES_FQNS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { COURT } from '../../utils/consts/FrontEndStateConsts';
import { PSA_STATUSES } from '../../utils/consts/Consts';

const { OPENLATTICE_ID_FQN } = Constants;

let { HEARINGS } = APP_TYPES_FQNS;

HEARINGS = HEARINGS.toString();

const INITIAL_STATE :Map<*, *> = fromJS({
  [COURT.COURT_DATE]: moment(),

  // Hearings
  [COURT.LOADING_HEARINGS]: false,
  [COURT.HEARINGS_TODAY]: List(),
  [COURT.HEARINGS_BY_TIME]: Map(),
  [COURT.LOADING_ERROR]: false,

  // Hearings Neighbors
  [COURT.LOADING_HEARING_NEIGHBORS]: false,
  [COURT.HEARINGS_NEIGHBORS_BY_ID]: Map(),
  [COURT.HEARING_IDS_REFRESHING]: false,
  [COURT.LOADING_HEARINGS_ERROR]: false,

  // People
  [COURT.PEOPLE_WITH_OPEN_PSAS]: Set(),
  [COURT.PEOPLE_RECEIVING_REMINDERS]: Set(),
  [COURT.PEOPLE_WITH_MULTIPLE_OPEN_PSAS]: Set(),
  [COURT.PEOPLE_IDS_TO_OPEN_PSA_IDS]: Map(),

  // Open PSAs + Neighbors
  [COURT.LOADING_PSAS]: false,
  [COURT.OPEN_PSAS]: Map(),
  [COURT.PSA_EDIT_DATES]: Map(),
  [COURT.OPEN_PSA_IDS]: Set(),
  [COURT.SCORES_AS_MAP]: Map(),

  // JUDGES
  [COURT.ALL_JUDGES]: Map(),
  [COURT.LOADING_JUDGES]: false,
  [COURT.LOADING_JUDGES_ERROR]: false,

  [COURT.COUNTY]: '',
  [COURT.COURTROOM]: '',
  [COURT.COURTROOMS]: Set()
});

export default function courtReducer(state :Map<*, *> = INITIAL_STATE, action :SequenceAction) {
  switch (action.type) {

    case changePSAStatus.case(action.type): {
      return changePSAStatus.reducer(state, action, {
        SUCCESS: () => {
          let peopleWithOpenPSAs = state.get(COURT.PEOPLE_WITH_OPEN_PSAS);
          const { entity } = action.value;
          const status = entity[PROPERTY_TYPES.STATUS][0];
          const psaIsClosed = status !== PSA_STATUSES.OPEN;
          state.get(COURT.PEOPLE_IDS_TO_OPEN_PSA_IDS).entrySeq().forEach(([personId, psaId]) => {
            if (psaIsClosed && psaId === action.value.id) peopleWithOpenPSAs = peopleWithOpenPSAs.delete(personId);
          });
          return state
            .set(COURT.SCORES_AS_MAP, state.get(COURT.SCORES_AS_MAP).set(action.value.id, fromJS(action.value.entity)))
            .set(COURT.PEOPLE_WITH_OPEN_PSAS, peopleWithOpenPSAs);
        }
      });
    }

    case filterPeopleIdsWithOpenPSAs.case(action.type): {
      return filterPeopleIdsWithOpenPSAs.reducer(state, action, {
        REQUEST: () => state
          .set(COURT.HEARINGS_NEIGHBORS_BY_ID, Map())
          .set(COURT.PEOPLE_WITH_OPEN_PSAS, Set())
          .set(COURT.PEOPLE_WITH_MULTIPLE_OPEN_PSAS, Set())
          .set(COURT.SCORES_AS_MAP, Map())
          .set(COURT.LOADING_PSAS, true),
        SUCCESS: () => {
          const {
            filteredPersonIds,
            scoresAsMap,
            personIdsToOpenPSAIds,
            personIdsWhoAreSubscribed,
            openPSAIds,
            hearingNeighborsById,
            peopleWithMultiplePSAs,
            psaIdToMostRecentEditDate
          } = action.value;
          const currentHearingNeighborsState = state.get(COURT.HEARINGS_NEIGHBORS_BY_ID);
          const newHearingNeighborsState = currentHearingNeighborsState.merge(hearingNeighborsById);
          return state
            .set(COURT.HEARINGS_NEIGHBORS_BY_ID, newHearingNeighborsState)
            .set(COURT.PEOPLE_WITH_OPEN_PSAS, fromJS(filteredPersonIds))
            .set(COURT.PEOPLE_WITH_MULTIPLE_OPEN_PSAS, peopleWithMultiplePSAs)
            .set(COURT.PEOPLE_RECEIVING_REMINDERS, personIdsWhoAreSubscribed)
            .set(COURT.PSA_EDIT_DATES, fromJS(psaIdToMostRecentEditDate))
            .set(COURT.SCORES_AS_MAP, scoresAsMap)
            .set(COURT.OPEN_PSA_IDS, openPSAIds)
            .set(COURT.PEOPLE_IDS_TO_OPEN_PSA_IDS, personIdsToOpenPSAIds);
        },
        FAILURE: () => state.set(COURT.PEOPLE_WITH_OPEN_PSAS, Set())
          .set(COURT.SCORES_AS_MAP, Map()),
        FINALLY: () => state.set(COURT.LOADING_PSAS, false)
      });
    }

    case loadHearingsForDate.case(action.type): {
      return loadHearingsForDate.reducer(state, action, {
        REQUEST: () => state
          .set(COURT.HEARINGS_TODAY, List())
          .set(COURT.HEARINGS_BY_TIME, Map())
          .set(COURT.COURTROOMS, Set())
          .set(COURT.LOADING_HEARINGS, true)
          .set(COURT.LOADING_ERROR, false),
        SUCCESS: () => state
          .set(COURT.HEARINGS_TODAY, action.value.hearingsToday)
          .set(COURT.HEARINGS_BY_TIME, action.value.hearingsByTime)
          .set(COURT.COURTROOMS, action.value.courtrooms)
          .set(COURT.LOADING_ERROR, false),
        FAILURE: () => state
          .set(COURT.HEARINGS_TODAY, List())
          .set(COURT.HEARINGS_BY_TIME, Map())
          .set(COURT.COURTROOMS, Set())
          .set(COURT.LOADING_ERROR, false),
        FINALLY: () => state.set(COURT.LOADING_HEARINGS, false)
      });
    }

    case CHANGE_HEARING_FILTERS: {
      const { county, courtroom } = action.value;
      let newState = state;
      if (county || county === '') {
        newState = newState.set(COURT.COUNTY, county);
      }
      if (courtroom || courtroom === '') {
        newState = newState.set(COURT.COURTROOM, courtroom);
      }
      return newState;
    }

    case SET_COURT_DATE: {
      const { courtDate } = action.value;
      return state.set(COURT.COURT_DATE, courtDate);
    }

    case refreshHearingNeighbors.case(action.type): {
      return refreshHearingNeighbors.reducer(state, action, {
        REQUEST: () => state.set(COURT.HEARING_IDS_REFRESHING, true),
        SUCCESS: () => {
          const { id, neighbors } = action.value;
          return state.setIn([COURT.HEARINGS_NEIGHBORS_BY_ID, id], neighbors);
        },
        FINALLY: () => state.set(COURT.HEARING_IDS_REFRESHING, false),
      });
    }

    case loadHearingNeighbors.case(action.type): {
      return loadHearingNeighbors.reducer(state, action, {
        REQUEST: () => state
          .set(COURT.LOADING_HEARING_NEIGHBORS, true)
          .set(COURT.LOADING_HEARINGS_ERROR, false),
        SUCCESS: () => {
          const currentState = state.get(COURT.HEARINGS_NEIGHBORS_BY_ID);
          const newState = currentState.merge(action.value.hearingNeighborsById);
          return (
            state
              .set(COURT.HEARINGS_NEIGHBORS_BY_ID, newState)
              .set(COURT.LOADING_HEARINGS_ERROR, false)
          );
        },
        FAILURE: () => state
          .set(COURT.HEARINGS_NEIGHBORS_BY_ID, Map())
          .set(COURT.LOADING_HEARINGS_ERROR, false),
        FINALLY: () => state.set(COURT.LOADING_HEARING_NEIGHBORS, false)
      });
    }


    case loadJudges.case(action.type): {
      return loadJudges.reducer(state, action, {
        REQUEST: () => state.set(COURT.LOADING_JUDGES, true),
        SUCCESS: () => {
          const { allJudges } = action.value;
          return state.set(COURT.ALL_JUDGES, allJudges);
        },
        FAILURE: () => state
          .set(COURT.ALL_JUDGES, Map())
          .set(COURT.LOADING_JUDGES_ERROR, action.error),
        FINALLY: () => state.set(COURT.LOADING_JUDGES, false)
      });
    }

    case refreshPSANeighbors.case(action.type): {
      return refreshPSANeighbors.reducer(state, action, {
        SUCCESS: () => {
          const { neighbors } = action.value;
          const courtDate = state.get(COURT.COURT_DATE);
          let hearingsByTime = state.get(COURT.HEARINGS_BY_TIME, Map());

          let refreshedHearings = Map();
          neighbors.get(HEARINGS).forEach((hearing) => {
            const hearingEntityKeyId = hearing.getIn([OPENLATTICE_ID_FQN, 0]);
            refreshedHearings = refreshedHearings.set(hearingEntityKeyId, hearing);
          });

          hearingsByTime.entrySeq().forEach(([time, hearings]) => {
            const filteredHearings = hearings.filter((hearing) => {
              const hearingEntityKeyId = hearing.getIn([OPENLATTICE_ID_FQN, 0]);
              const refreshedHearing = refreshedHearings.get(hearingEntityKeyId);
              if (refreshedHearing) {
                const hearingDateTime = moment(refreshedHearing.getIn([PROPERTY_TYPES.DATE_TIME, 0], ''));
                return hearingDateTime.isSame(courtDate, 'day');
              }
              return true;
            });
            if (hearings.size !== filteredHearings.size) {
              if (filteredHearings.size) {
                hearingsByTime = hearingsByTime.set(time, filteredHearings);
              }
              else {
                hearingsByTime = hearingsByTime.delete(time);
              }
            }
          });
          return state.set(COURT.HEARINGS_BY_TIME, hearingsByTime);
        }
      });
    }

    case SWITCH_ORGANIZATION: {
      return INITIAL_STATE;
    }

    default:
      return state;
  }
}
