/*
 * @flow
 */
import moment from 'moment';
import { Constants, DataApi, SearchApi } from 'lattice';
import {
  Map,
  List,
  Set,
  fromJS
} from 'immutable';
import {
  call,
  put,
  takeEvery,
  select
} from 'redux-saga/effects';

import { APP_TYPES_FQNS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { APP, PSA_NEIGHBOR, STATE } from '../../utils/consts/FrontEndStateConsts';
import { obfuscateEntity, obfuscateEntityNeighbors } from '../../utils/consts/DemoNames';
import { getEntitySetId } from '../../utils/AppUtils';
import { getPropertyTypeId } from '../../edm/edmUtils';
import { toISODate } from '../../utils/FormattingUtils';
import {
  GET_PEOPLE,
  GET_PERSON_DATA,
  GET_PERSON_NEIGHBORS,
  REFRESH_PERSON_NEIGHBORS,
  getPeople,
  getPersonData,
  getPersonNeighbors,
  refreshPersonNeighbors
} from './PeopleActionFactory';

let {
  CONTACT_INFORMATION,
  DMF_RESULTS,
  DMF_RISK_FACTORS,
  HEARINGS,
  MANUAL_PRETRIAL_CASES,
  PEOPLE,
  PSA_RISK_FACTORS,
  PSA_SCORES,
  PRETRIAL_CASES,
  STAFF
} = APP_TYPES_FQNS;

CONTACT_INFORMATION = CONTACT_INFORMATION.toString();
DMF_RESULTS = DMF_RESULTS.toString();
DMF_RISK_FACTORS = DMF_RISK_FACTORS.toString();
HEARINGS = HEARINGS.toString();
MANUAL_PRETRIAL_CASES = MANUAL_PRETRIAL_CASES.toString();
PEOPLE = PEOPLE.toString();
PSA_RISK_FACTORS = PSA_RISK_FACTORS.toString();
PSA_SCORES = PSA_SCORES.toString();
PRETRIAL_CASES = PRETRIAL_CASES.toString();
STAFF = STAFF.toString();

const { OPENLATTICE_ID_FQN } = Constants;

const getApp = state => state.get(STATE.APP, Map());
const getEDM = state => state.get(STATE.EDM, Map());
const getOrgId = state => state.getIn([STATE.APP, APP.SELECTED_ORG_ID], '');

function* getPeopleWorker(action) :Generator<*, *, *> {

  try {
    yield put(getPeople.request(action.id));
    const app = yield select(getApp);
    const orgId = yield select(getOrgId);
    const peopleEntitySetId = getEntitySetId(app, PEOPLE, orgId);
    const response = yield call(DataApi.getEntitySetData, peopleEntitySetId);
    yield put(getPeople.success(action.id, response));
  }
  catch (error) {
    yield put(getPeople.failure(action.id, error));
  }
  finally {
    yield put(getPeople.finally(action.id));
  }
}

function* getPeopleWatcher() :Generator<*, *, *> {
  yield takeEvery(GET_PEOPLE, getPeopleWorker);
}

function* getEntityForPersonId(personId :string) :Generator<*, *, *> {
  const app = yield select(getApp);
  const edm = yield select(getEDM);
  const orgId = yield select(getOrgId);
  const peopleEntitySetId = getEntitySetId(app, PEOPLE, orgId);
  const personIdPropertyTypeId = getPropertyTypeId(edm, PROPERTY_TYPES.PERSON_ID);

  const searchOptions = {
    searchTerm: `${personIdPropertyTypeId}:"${personId}"`,
    start: 0,
    maxHits: 1
  };

  const response = yield call(SearchApi.searchEntitySetData, peopleEntitySetId, searchOptions);
  const person = obfuscateEntity(response.hits[0]); // TODO just for demo
  return person;
}

function* getPersonDataWorker(action) :Generator<*, *, *> {

  try {
    yield put(getPersonData.request(action.id));
    const person = yield getEntityForPersonId(action.value);
    yield put(getPersonData.success(action.id, { person, entityKeyId: person[OPENLATTICE_ID_FQN][0] }));
  }
  catch (error) {
    yield put(getPersonData.failure(action.id, error));
  }
  finally {
    yield put(getPersonData.finally(action.id));
  }
}

function* getPersonDataWatcher() :Generator<*, *, *> {
  yield takeEvery(GET_PERSON_DATA, getPersonDataWorker);
}

function* getPersonNeighborsWorker(action) :Generator<*, *, *> {

  const { personId } = action.value;

  try {
    yield put(getPersonNeighbors.request(action.id));
    let caseNums = Set();
    let neighborsByEntitySet = Map();
    let mostRecentPSA = Map();
    let currentPSADateTime;

    const app = yield select(getApp);
    const orgId = yield select(getOrgId);
    const peopleEntitySetId = getEntitySetId(app, PEOPLE, orgId);
    const psaScoresEntitySetId = getEntitySetId(app, PSA_SCORES, orgId);
    const entitySetIdsToAppType = app.getIn([APP.ENTITY_SETS_BY_ORG, orgId]);

    const person = yield getEntityForPersonId(personId);
    const entityKeyId = person[OPENLATTICE_ID_FQN][0];
    let neighbors = yield call(SearchApi.searchEntityNeighbors, peopleEntitySetId, entityKeyId);
    neighbors = obfuscateEntityNeighbors(neighbors);
    neighbors = fromJS(neighbors);

    neighbors.forEach((neighborObj) => {
      const entitySetId = neighborObj.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id'], '');
      const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
      const entityDateTime = moment(neighborObj.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.DATE_TIME, 0]));
      if (appTypeFqn === PSA_SCORES) {
        if (!mostRecentPSA || !currentPSADateTime || currentPSADateTime.isBefore(entityDateTime)) {
          mostRecentPSA = neighborObj;
          currentPSADateTime = entityDateTime;
        }
      }
      if (appTypeFqn === CONTACT_INFORMATION) {
        neighborsByEntitySet = neighborsByEntitySet.set(
          appTypeFqn,
          neighborObj
        );
      }
      if (appTypeFqn === HEARINGS) {
        const hearingDetails = neighborObj.get(PSA_NEIGHBOR.DETAILS, Map());
        const hearingId = hearingDetails.getIn([OPENLATTICE_ID_FQN, 0]);
        const hearingDateTime = hearingDetails.getIn([PROPERTY_TYPES.DATE_TIME, 0]);
        const hearingExists = !!hearingDateTime && !!hearingId;
        const hearingHasBeenCancelled = hearingDetails.getIn([PROPERTY_TYPES.UPDATE_TYPE, 0], '')
          .toLowerCase().trim() === 'cancelled';
        if (hearingExists && !hearingHasBeenCancelled) {
          neighborsByEntitySet = neighborsByEntitySet.set(
            appTypeFqn,
            neighborsByEntitySet.get(appTypeFqn, List()).push(hearingDetails)
          );
        }
      }
      else {
        neighborsByEntitySet = neighborsByEntitySet.set(
          appTypeFqn,
          neighborsByEntitySet.get(appTypeFqn, List()).push(neighborObj)
        );
      }
    });

    const uniqNeighborsByEntitySet = neighborsByEntitySet.set(PRETRIAL_CASES,
      neighborsByEntitySet.get(PRETRIAL_CASES, List())
        .filter((neighbor) => {
          const caseNum = neighbor.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.CASE_ID, 0]);
          if (!caseNums.has(caseNum)) {
            caseNums = caseNums.add(caseNum);
            return true;
          }
          return false;
        }), neighborsByEntitySet);

    neighbors = obfuscateEntityNeighbors(neighbors);

    let mostRecentPSANeighborsByAppTypeFqn = Map();
    if (mostRecentPSA) {
      const psaId = mostRecentPSA.getIn([PSA_NEIGHBOR.DETAILS, OPENLATTICE_ID_FQN, 0]);
      let psaNeighbors = yield call(SearchApi.searchEntityNeighbors, psaScoresEntitySetId, psaId);
      psaNeighbors = fromJS(psaNeighbors);
      psaNeighbors.forEach((neighbor) => {
        const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id'], '');
        const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
        if (appTypeFqn === STAFF) {
          neighbors = neighbors.set(
            appTypeFqn,
            neighbors.get(appTypeFqn, List()).push(neighbor)
          );
        }
        else {
          mostRecentPSANeighborsByAppTypeFqn = mostRecentPSANeighborsByAppTypeFqn.set(
            appTypeFqn,
            fromJS(neighbor)
          );
        }
      });
    }

    yield put(getPersonNeighbors.success(action.id, {
      personId,
      neighbors: uniqNeighborsByEntitySet,
      psaScoresEntitySetId,
      mostRecentPSA,
      mostRecentPSANeighborsByAppTypeFqn
    }));
  }
  catch (error) {
    yield put(getPersonNeighbors.failure(action.id, { error, personId }));
  }
  finally {
    yield put(getPersonNeighbors.finally(action.id));
  }
}

function* getPersonNeighborsWatcher() :Generator<*, *, *> {
  yield takeEvery(GET_PERSON_NEIGHBORS, getPersonNeighborsWorker);
}

function* refreshPersonNeighborsWorker(action) :Generator<*, *, *> {

  const { personId } = action.value;

  try {
    yield put(refreshPersonNeighbors.request(action.id));
    let caseNums = Set();
    let currentPSADateTime;
    let mostRecentPSA = Map();
    let neighbors = Map();
    const app = yield select(getApp);
    const orgId = yield select(getOrgId);
    const entitySetIdsToAppType = app.getIn([APP.ENTITY_SETS_BY_ORG, orgId]);
    const peopleEntitySetId = getEntitySetId(app, PEOPLE, orgId);
    const psaScoresEntitySetId = getEntitySetId(app, PSA_SCORES, orgId);

    const person = yield getEntityForPersonId(personId);
    const entityKeyId = person[OPENLATTICE_ID_FQN][0];
    let neighborsList = yield call(SearchApi.searchEntityNeighbors, peopleEntitySetId, entityKeyId);
    neighborsList = obfuscateEntityNeighbors(neighborsList);
    neighborsList = fromJS(neighborsList);

    neighborsList.forEach((neighbor) => {
      const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id'], '');
      const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
      const entityDateTime = moment(neighbor.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.DATE_TIME, 0]));
      if (appTypeFqn === PSA_SCORES) {
        if (!mostRecentPSA || !currentPSADateTime || currentPSADateTime.isBefore(entityDateTime)) {
          mostRecentPSA = neighbor;
          currentPSADateTime = entityDateTime;
        }
      }
      if (appTypeFqn === CONTACT_INFORMATION) {
        neighbors = neighbors.set(
          appTypeFqn,
          neighbor
        );
      }
      else {
        neighbors = neighbors.set(
          appTypeFqn,
          neighbors.get(appTypeFqn, List()).push(neighbor)
        );
      }
    });
    neighbors = neighbors.set(PRETRIAL_CASES,
      neighbors.get(PRETRIAL_CASES, List())
        .filter((neighbor) => {
          const caseNum = neighbor.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.CASE_ID, 0]);
          if (!caseNums.has(caseNum)) {
            caseNums = caseNums.add(caseNum);
            return true;
          }
          return false;
        }), neighbors);

    let mostRecentPSANeighborsByAppTypeFqn = Map();
    if (mostRecentPSA) {
      const psaId = mostRecentPSA.getIn([PSA_NEIGHBOR.DETAILS, OPENLATTICE_ID_FQN, 0]);
      let psaNeighbors = yield call(SearchApi.searchEntityNeighbors, psaScoresEntitySetId, psaId);
      psaNeighbors = fromJS(psaNeighbors);
      psaNeighbors.forEach((neighbor) => {
        const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id'], '');
        const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
        if (appTypeFqn === STAFF) {
          neighbors = neighbors.set(
            appTypeFqn,
            neighbors.get(appTypeFqn, List()).push(neighbor)
          );
        }
        else {
          mostRecentPSANeighborsByAppTypeFqn = mostRecentPSANeighborsByAppTypeFqn.set(
            appTypeFqn,
            fromJS(neighbor)
          );
        }
      });
    }

    yield put(refreshPersonNeighbors.success(action.id, {
      personId,
      mostRecentPSA,
      mostRecentPSANeighborsByAppTypeFqn,
      neighbors,
      scoresEntitySetId: psaScoresEntitySetId
    }));
  }
  catch (error) {
    console.error(error);
    yield put(refreshPersonNeighbors.failure(action.id, { error, personId }));
  }
  finally {
    yield put(refreshPersonNeighbors.finally(action.id));
  }
}

function* refreshPersonNeighborsWatcher() :Generator<*, *, *> {
  yield takeEvery(REFRESH_PERSON_NEIGHBORS, refreshPersonNeighborsWorker);
}

export {
  getPeopleWatcher,
  getPersonDataWatcher,
  getPersonNeighborsWatcher,
  refreshPersonNeighborsWatcher
};
