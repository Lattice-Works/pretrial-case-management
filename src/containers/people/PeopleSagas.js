/*
 * @flow
 */

import { DateTime } from 'luxon';
import { Constants, SearchApi } from 'lattice';
import {
  DataApiActions,
  DataApiSagas,
  SearchApiActions,
  SearchApiSagas
} from 'lattice-sagas';
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
} from '@redux-saga/core/effects';
import type { SequenceAction } from 'redux-reqseq';
import Logger from '../../utils/Logger';

import { APP_TYPES, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { PSA_NEIGHBOR } from '../../utils/consts/FrontEndStateConsts';
import { getEntitySetIdFromApp } from '../../utils/AppUtils';
import { getEntityProperties, getSearchTerm } from '../../utils/DataUtils';
import { hearingIsCancelled } from '../../utils/HearingUtils';
import { getPropertyTypeId } from '../../edm/edmUtils';
import { HEARING_TYPES, PSA_STATUSES } from '../../utils/consts/Consts';
import { getCasesForPSA, getChargeHistory, getCaseHistory } from '../../utils/CaseUtils';
import { loadPSAData } from '../review/ReviewActionFactory';
import {
  GET_PEOPLE_NEIGHBORS,
  GET_PERSON_DATA,
  GET_STAFF_EKIDS,
  LOAD_REQUIRES_ACTION_PEOPLE,
  getPeopleNeighbors,
  getPersonData,
  getStaffEKIDs,
  loadRequiresActionPeople
} from './PeopleActions';

import { STATE } from '../../utils/consts/redux/SharedConsts';
import { APP_DATA } from '../../utils/consts/redux/AppConsts';

const LOG :Logger = new Logger('PeopleSagas');

const { getEntitySetData } = DataApiActions;
const { getEntitySetDataWorker } = DataApiSagas;
const { searchEntitySetData, searchEntityNeighborsWithFilter } = SearchApiActions;
const { searchEntitySetDataWorker, searchEntityNeighborsWithFilterWorker } = SearchApiSagas;

const {
  CHARGES,
  CHECKINS,
  CHECKIN_APPOINTMENTS,
  CONTACT_INFORMATION,
  DMF_RISK_FACTORS,
  FTAS,
  HEARINGS,
  MANUAL_CHARGES,
  MANUAL_COURT_CHARGES,
  MANUAL_PRETRIAL_CASES,
  MANUAL_PRETRIAL_COURT_CASES,
  MANUAL_REMINDERS,
  PEOPLE,
  PSA_RISK_FACTORS,
  PSA_SCORES,
  PRETRIAL_CASES,
  RELEASE_CONDITIONS,
  RELEASE_RECOMMENDATIONS,
  SENTENCES,
  STAFF,
  SUBSCRIPTION,
  SPEAKER_RECOGNITION_PROFILES
} = APP_TYPES;

const {
  DATE_TIME,
  ENTITY_KEY_ID,
  HEARING_TYPE,
  PERSON_ID
} = PROPERTY_TYPES;

const LIST_FQNS = [
  CHARGES,
  CHECKINS,
  CHECKIN_APPOINTMENTS,
  CONTACT_INFORMATION,
  DMF_RISK_FACTORS,
  FTAS,
  HEARINGS,
  MANUAL_CHARGES,
  MANUAL_COURT_CHARGES,
  MANUAL_PRETRIAL_CASES,
  MANUAL_PRETRIAL_COURT_CASES,
  MANUAL_REMINDERS,
  PSA_RISK_FACTORS,
  PSA_SCORES,
  PRETRIAL_CASES,
  RELEASE_CONDITIONS,
  RELEASE_RECOMMENDATIONS,
  SENTENCES,
  STAFF
];

const { OPENLATTICE_ID_FQN } = Constants;

const getApp = state => state.get(STATE.APP, Map());
const getEDM = state => state.get(STATE.EDM, Map());
const getOrgId = state => state.getIn([STATE.APP, APP_DATA.SELECTED_ORG_ID], '');

function* getAllSearchResults(entitySetId :string, searchTerm :string) :Generator<*, *, *> {
  const loadSizeRequest = {
    searchTerm,
    start: 0,
    maxHits: 1
  };
  const response = yield call(
    searchEntitySetDataWorker,
    searchEntitySetData({ entitySetId, searchOptions: loadSizeRequest })
  );
  if (response.error) throw response.error;
  const { numHits } = response.data;

  const loadResultsRequest = {
    searchTerm,
    start: 0,
    maxHits: numHits
  };
  return yield call(
    searchEntitySetDataWorker,
    searchEntitySetData({ entitySetId, searchOptions: loadResultsRequest })
  );
}

function* getPeopleNeighborsWorker(action) :Generator<*, *, *> {

  const {
    peopleEKIDS,
    srcEntitySets,
    dstEntitySets
  } = action.value;

  try {
    yield put(getPeopleNeighbors.request(action.id));
    let mostRecentPSAEKIDs = Set();
    let scoresAsMap = Map();

    const app = yield select(getApp);
    const orgId = yield select(getOrgId);
    const entitySetIdsToAppType = app.getIn([APP_DATA.ENTITY_SETS_BY_ORG, orgId]);

    /*
     * Get Entity Set Ids
     */
    const arrestCasesEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.ARREST_CASES);
    const bondsEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.BONDS);
    const chargesEntitySetId = getEntitySetIdFromApp(app, CHARGES);
    const checkInAppointmentsEntitySetId = getEntitySetIdFromApp(app, CHECKIN_APPOINTMENTS);
    const contactInformationEntitySetId = getEntitySetIdFromApp(app, CONTACT_INFORMATION);
    const dmfResultsEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.DMF_RESULTS);
    const dmfRiskFactorsEntitySetId = getEntitySetIdFromApp(app, DMF_RISK_FACTORS);
    const ftaEntitySetId = getEntitySetIdFromApp(app, FTAS);
    const hearingsEntitySetId = getEntitySetIdFromApp(app, HEARINGS);
    const manualChargesEntitySetId = getEntitySetIdFromApp(app, MANUAL_CHARGES);
    const manualCourtChargesEntitySetId = getEntitySetIdFromApp(app, MANUAL_COURT_CHARGES);
    const manualPretrialCourtCasesEntitySetId = getEntitySetIdFromApp(app, MANUAL_PRETRIAL_COURT_CASES);
    const manualRemindersEntitySetId = getEntitySetIdFromApp(app, MANUAL_REMINDERS);
    const manualPretrialCasesEntitySetId = getEntitySetIdFromApp(app, MANUAL_PRETRIAL_CASES);
    const outcomesEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.OUTCOMES);
    const peopleEntitySetId = getEntitySetIdFromApp(app, PEOPLE);
    const pretrialCasesEntitySetId = getEntitySetIdFromApp(app, PRETRIAL_CASES);
    const psaRiskFactorsEntitySetId = getEntitySetIdFromApp(app, PSA_RISK_FACTORS);
    const psaScoresEntitySetId = getEntitySetIdFromApp(app, PSA_SCORES);
    const releaseConditionsEntitySetId = getEntitySetIdFromApp(app, RELEASE_CONDITIONS);
    const releaseRecommendationsEntitySetId = getEntitySetIdFromApp(app, RELEASE_RECOMMENDATIONS);
    const sentencesEntitySetId = getEntitySetIdFromApp(app, SENTENCES);
    const speakerRecognitionProfilesEntitySetId = getEntitySetIdFromApp(app, SPEAKER_RECOGNITION_PROFILES);
    const subscriptionEntitySetId = getEntitySetIdFromApp(app, SUBSCRIPTION);

    let sourceEntitySetIds = [
      bondsEntitySetId,
      checkInAppointmentsEntitySetId,
      contactInformationEntitySetId,
      dmfResultsEntitySetId,
      dmfRiskFactorsEntitySetId,
      ftaEntitySetId,
      manualRemindersEntitySetId,
      outcomesEntitySetId,
      peopleEntitySetId,
      psaRiskFactorsEntitySetId,
      psaScoresEntitySetId,
      releaseConditionsEntitySetId,
      releaseRecommendationsEntitySetId,
      speakerRecognitionProfilesEntitySetId
    ];

    let destinationEntitySetIds = [
      arrestCasesEntitySetId,
      chargesEntitySetId,
      hearingsEntitySetId,
      manualChargesEntitySetId,
      manualCourtChargesEntitySetId,
      manualPretrialCourtCasesEntitySetId,
      pretrialCasesEntitySetId,
      manualPretrialCasesEntitySetId,
      sentencesEntitySetId,
      subscriptionEntitySetId
    ];

    if (srcEntitySets) {
      sourceEntitySetIds = srcEntitySets.map(appType => getEntitySetIdFromApp(app, appType));
    }
    if (dstEntitySets) {
      destinationEntitySetIds = dstEntitySets.map(appType => getEntitySetIdFromApp(app, appType));
    }

    /*
     * Get Neighbors
     */
    let peopleNeighborsResponse = yield call(
      searchEntityNeighborsWithFilterWorker,
      searchEntityNeighborsWithFilter({
        entitySetId: peopleEntitySetId,
        filter: {
          entityKeyIds: peopleEKIDS,
          sourceEntitySetIds,
          destinationEntitySetIds
        }
      })
    );
    if (peopleNeighborsResponse.error) throw peopleNeighborsResponse.error;
    peopleNeighborsResponse = fromJS(peopleNeighborsResponse.data);

    let hearingEKIDs = Set();

    const peopleNeighborsById = Map().withMutations((mutableMap) => {
      peopleNeighborsResponse.entrySeq().forEach(([personEKID, neighbors]) => {

        let neighborsByAppTypeFqn = Map();
        let mostRecentPSAEKID = '';
        let currentPSADateTime;
        let caseNums = Set();
        neighbors.forEach((neighbor) => {
          const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id'], '');
          const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
          const neighborEntityKeyId = neighbor.getIn([PSA_NEIGHBOR.DETAILS, OPENLATTICE_ID_FQN, 0], '');
          const entityDateTime = DateTime.fromISO(
            neighbor.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.DATE_TIME, 0], '')
          );

          if (appTypeFqn === PSA_SCORES) {
            if (
              entityDateTime.isValid
              && (!mostRecentPSAEKID || !currentPSADateTime || currentPSADateTime < entityDateTime)
            ) {
              mostRecentPSAEKID = neighborEntityKeyId;
              currentPSADateTime = entityDateTime;
            }

            const psaDetails = neighbor.get(PSA_NEIGHBOR.DETAILS, Map());
            scoresAsMap = scoresAsMap.set(neighborEntityKeyId, psaDetails);
          }
          if (appTypeFqn === HEARINGS) {
            const {
              [HEARING_TYPE]: hearingType,
              [DATE_TIME]: hearingDateTime,
              [ENTITY_KEY_ID]: hearingEKID
            } = getEntityProperties(neighbor, [DATE_TIME, ENTITY_KEY_ID, HEARING_TYPE]);
            const hearingDetails = neighbor.get(PSA_NEIGHBOR.DETAILS, Map());
            const hearingExists = !!hearingDateTime && !!hearingEKID;
            const hearingIsInactive = hearingIsCancelled(hearingDetails);
            const hearingIsGeneric = hearingType.toLowerCase().trim() === HEARING_TYPES.ALL_OTHERS;
            const hearingIsADuplicate = hearingEKIDs.includes(neighborEntityKeyId);
            if (
              hearingExists
              && !hearingIsGeneric
              && !hearingIsInactive
              && !hearingIsADuplicate
            ) {
              neighborsByAppTypeFqn = neighborsByAppTypeFqn.set(
                appTypeFqn,
                neighborsByAppTypeFqn.get(appTypeFqn, List()).push(hearingDetails)
              );
            }
            hearingEKIDs = hearingEKIDs.add(neighborEntityKeyId);
          }
          else if (appTypeFqn === PRETRIAL_CASES) {
            const caseNum = neighbor.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.CASE_ID, 0]);
            if (!caseNums.has(caseNum)) {
              caseNums = caseNums.add(caseNum);
              neighborsByAppTypeFqn = neighborsByAppTypeFqn.set(
                appTypeFqn,
                neighborsByAppTypeFqn.get(appTypeFqn, List()).push(neighbor)
              );
            }
          }
          else if (LIST_FQNS.includes(appTypeFqn)) {
            neighborsByAppTypeFqn = neighborsByAppTypeFqn.set(
              appTypeFqn,
              neighborsByAppTypeFqn.get(appTypeFqn, List()).push(neighbor)
            );
          }
          else {
            neighborsByAppTypeFqn = neighborsByAppTypeFqn.set(
              appTypeFqn,
              neighbor
            );
          }
        });
        mutableMap.set(personEKID, neighborsByAppTypeFqn);
        if (mostRecentPSAEKID) mostRecentPSAEKIDs = mostRecentPSAEKIDs.add(mostRecentPSAEKID);
      });
    });

    loadPSAData({ psaIds: mostRecentPSAEKIDs.toJS(), scoresAsMap });

    yield put(getPeopleNeighbors.success(action.id, { peopleNeighborsById }));
  }
  catch (error) {
    LOG.error(action.type, error);
    yield put(getPeopleNeighbors.failure(action.id, { error }));
  }
  finally {
    yield put(getPeopleNeighbors.finally(action.id));
  }
}

function* getPeopleNeighborsWatcher() :Generator<*, *, *> {
  yield takeEvery(GET_PEOPLE_NEIGHBORS, getPeopleNeighborsWorker);
}

function* getEntityForPersonId(personId :string) :Generator<*, *, *> {
  const app = yield select(getApp);
  const edm = yield select(getEDM);
  const peopleEntitySetId = getEntitySetIdFromApp(app, PEOPLE);
  const personIdPropertyTypeId = getPropertyTypeId(edm, PROPERTY_TYPES.PERSON_ID);

  const searchOptions = {
    searchTerm: getSearchTerm(personIdPropertyTypeId, personId),
    start: 0,
    maxHits: 1
  };
  const response = yield call(
    searchEntitySetDataWorker,
    searchEntitySetData({ entitySetId: peopleEntitySetId, searchOptions })
  );
  if (response.error) throw response.error;
  const { hits } = response.data;
  const person = hits.length > 0 ? hits[0] : {};
  return person;
}

function* getPersonDataWorker(action) :Generator<*, *, *> {

  try {
    yield put(getPersonData.request(action.id));
    const person = yield getEntityForPersonId(action.value);
    const personEKID = person[OPENLATTICE_ID_FQN][0];
    yield put(getPersonData.success(action.id, { person, entityKeyId: personEKID }));
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

function* getStaffEKIDsWorker(action) :Generator<*, *, *> {

  try {
    yield put(getStaffEKIDs.request(action.id));
    let staffIdsToEKIDS = Map();

    const app = yield select(getApp);
    const staffESID = getEntitySetIdFromApp(app, STAFF);
    const staffEntities = yield call(
      getEntitySetDataWorker,
      getEntitySetData({ entitySetId: staffESID })
    );
    if (staffEntities.error) throw staffEntities.error;

    fromJS(staffEntities.data).forEach((staffMember) => {
      const {
        [ENTITY_KEY_ID]: staffEKID,
        [PERSON_ID]: staffId
      } = getEntityProperties(staffMember, [ENTITY_KEY_ID, PERSON_ID]);
      staffIdsToEKIDS = staffIdsToEKIDS.set(staffId, staffEKID);
    });


    yield put(getStaffEKIDs.success(action.id, staffIdsToEKIDS));
  }
  catch (error) {
    yield put(getStaffEKIDs.failure(action.id, error));
  }
  finally {
    yield put(getStaffEKIDs.finally(action.id));
  }
}

function* getStaffEKIDsWatcher() :Generator<*, *, *> {
  yield takeEvery(GET_STAFF_EKIDS, getStaffEKIDsWorker);
}

function* loadRequiresActionPeopleWorker(action :SequenceAction) :Generator<*, *, *> {
  let psaScoresWithNoPendingCharges = Set();
  let psaScoresWithNoHearings = Set();
  let psaScoresWithRecentFTAs = Set();
  let psaNeighborsById = Map();
  let peopleIds = Set();
  let peopleMap = Map();
  let peopleWithMultipleOpenPSAs = Set();
  let peopleWithRecentFTAs = Set();
  let peopleWithNoPendingCharges = Set();
  let peopleWithPSAsWithNoHearings = Set();
  let peopleNeighborsById = Map();

  try {
    yield put(loadRequiresActionPeople.request(action.id));
    const app = yield select(getApp);
    const edm = yield select(getEDM);
    const orgId = yield select(getOrgId);
    const entitySetIdsToAppType = app.getIn([APP_DATA.ENTITY_SETS_BY_ORG, orgId]);
    const hearingsESID = getEntitySetIdFromApp(app, HEARINGS);
    const psaScoresEntitySetId = getEntitySetIdFromApp(app, PSA_SCORES);
    const peopleEntitySetId = getEntitySetIdFromApp(app, PEOPLE);
    const manualPretrialCasesFqnEntitySetId = getEntitySetIdFromApp(app, MANUAL_PRETRIAL_CASES);
    const pretrialCasesEntitySetId = getEntitySetIdFromApp(app, PRETRIAL_CASES);
    const releaseRecommendationsEntitySetId = getEntitySetIdFromApp(app, RELEASE_RECOMMENDATIONS);
    const chargesEntitySetId = getEntitySetIdFromApp(app, CHARGES);
    const ftaEntitySetId = getEntitySetIdFromApp(app, FTAS);
    const staffEntitySetId = getEntitySetIdFromApp(app, STAFF);

    /* load all open PSAs */
    const statusPropertyTypeId = getPropertyTypeId(edm, PROPERTY_TYPES.STATUS);
    const searchTerm = action.value === '*' ? action.value : getSearchTerm(statusPropertyTypeId, PSA_STATUSES.OPEN);
    const openPSAData = yield call(getAllSearchResults, psaScoresEntitySetId, searchTerm);
    const { hits } = openPSAData.data;
    const psaScoreMap = Map().withMutations((mutableMap) => {
      fromJS(hits).forEach((psa) => {
        const psaId = psa.getIn([OPENLATTICE_ID_FQN, 0], '');
        if (psaId) mutableMap.set(psaId, psa);
      });
    });
    /* all PSA Ids */
    const psaIds = psaScoreMap.keySeq().toJS();

    /* get people and cases for all open PSAs */
    let openPSAIdsToPeopleAndCases = yield call(
      searchEntityNeighborsWithFilterWorker,
      searchEntityNeighborsWithFilter({
        entitySetId: psaScoresEntitySetId,
        filter: {
          entityKeyIds: psaIds,
          sourceEntitySetIds: [releaseRecommendationsEntitySetId],
          destinationEntitySetIds: [
            hearingsESID,
            peopleEntitySetId,
            staffEntitySetId,
            manualPretrialCasesFqnEntitySetId
          ]
        }
      })
    );
    if (openPSAIdsToPeopleAndCases.error) throw openPSAIdsToPeopleAndCases.error;
    openPSAIdsToPeopleAndCases = fromJS(openPSAIdsToPeopleAndCases.data);

    /* all people Ids */
    openPSAIdsToPeopleAndCases.entrySeq().forEach(([psaId, neighbors]) => {
      let psaNeighbors = Map();
      neighbors.forEach((neighbor) => {
        const neighborObj = neighbor.get(PSA_NEIGHBOR.DETAILS, Map());
        const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id'], '');
        const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
        const neighborId = neighborObj.getIn([OPENLATTICE_ID_FQN, 0], '');
        if (appTypeFqn === PEOPLE) {
          peopleMap = peopleMap.set(neighborId, neighborObj);
          peopleIds = peopleIds.add(neighborId);
        }
        if (LIST_FQNS.includes(appTypeFqn)) {
          psaNeighbors = psaNeighbors.set(
            appTypeFqn,
            psaNeighbors.get(appTypeFqn, List()).push(neighbor)
          );
        }
        else {
          psaNeighbors = psaNeighbors.set(appTypeFqn, neighbor);
        }
      });
      if (!psaNeighbors.get(HEARINGS, List()).size) psaScoresWithNoHearings = psaScoresWithNoHearings.add(psaId);
      psaNeighborsById = psaNeighborsById.set(psaId, psaNeighbors);
    });

    /* get filtered neighbors for all people with open PSAs */
    let peopleWithOpenPSANeighbors = yield call(
      searchEntityNeighborsWithFilterWorker,
      searchEntityNeighborsWithFilter({
        entitySetId: peopleEntitySetId,
        filter: {
          entityKeyIds: peopleIds.toJS(),
          sourceEntitySetIds: [psaScoresEntitySetId, ftaEntitySetId],
          destinationEntitySetIds: [chargesEntitySetId, pretrialCasesEntitySetId, ftaEntitySetId]
        }
      })
    );
    if (peopleWithOpenPSANeighbors.error) throw peopleWithOpenPSANeighbors.error;
    peopleWithOpenPSANeighbors = fromJS(peopleWithOpenPSANeighbors.data);

    /* map person neighbors by personId -> appTypeFqn -> neighbors */
    peopleWithOpenPSANeighbors.entrySeq().forEach(([personId, neighbors]) => {
      let personNeighbors = Map();
      neighbors.forEach((neighbor) => {
        const neighborObj = neighbor.get(PSA_NEIGHBOR.DETAILS, Map());
        const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id'], '');
        const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
        if (appTypeFqn === PSA_SCORES) {
          /* only open psas */
          const psaStatus = neighborObj.getIn([PROPERTY_TYPES.STATUS, 0], '');
          if (psaStatus === PSA_STATUSES.OPEN) {
            personNeighbors = personNeighbors.set(
              appTypeFqn,
              personNeighbors.get(appTypeFqn, List()).push(neighborObj)
            );
          }
        }
        else if (appTypeFqn === CHARGES) {
          personNeighbors = personNeighbors.set(
            appTypeFqn,
            personNeighbors.get(appTypeFqn, List()).push(neighborObj)
          );
        }
        else {
          personNeighbors = personNeighbors.set(
            appTypeFqn,
            personNeighbors.get(appTypeFqn, List()).push(neighborObj)
          );
        }
      });

      const personCaseHistory = getCaseHistory(personNeighbors);
      const personChargeHistory = getChargeHistory(personNeighbors);

      /* collect people Ids with multiple PSAs */
      const psaCount = personNeighbors.get(PSA_SCORES, List()).size;
      if (psaCount > 1) peopleWithMultipleOpenPSAs = peopleWithMultipleOpenPSAs.add(personId);

      /* collect people Ids with recent FTAs */

      /* collect people Ids with no pending charges */
      const personCharges = personNeighbors.get(CHARGES);
      if (personCharges) {
        personNeighbors.get(PSA_SCORES, List()).forEach((psa) => {
          const psaId = psa.getIn([OPENLATTICE_ID_FQN, 0], '');
          let hasPendingCharges = false;
          const psaDate = DateTime.fromISO(psa.getIn([PROPERTY_TYPES.DATE_TIME, 0], ''));
          const hasFTASincePSA = personNeighbors.get(FTAS, List()).some((fta) => {
            const ftaDateTime = DateTime.fromISO(fta.getIn([PROPERTY_TYPES.DATE_TIME, 0], ''));
            if (psaDate.isValid) {
              return psaDate < ftaDateTime;
            }
            return false;
          });
          if (hasFTASincePSA) {
            peopleWithRecentFTAs = peopleWithRecentFTAs.add(personId);
            psaScoresWithRecentFTAs = psaScoresWithRecentFTAs.add(psaId);
          }
          if (psaScoresWithNoHearings.includes(psaId)) {
            peopleWithPSAsWithNoHearings = peopleWithPSAsWithNoHearings.add(personId);
          }
          const arrestDate = DateTime.fromISO(psaNeighborsById
            .getIn([psaId, MANUAL_PRETRIAL_CASES, PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.ARREST_DATE_TIME, 0]));
          const { chargeHistoryForMostRecentPSA } = getCasesForPSA(
            personCaseHistory,
            personChargeHistory,
            psa,
            arrestDate,
            undefined
          );
          if (psaScoreMap.get(psaId)) {
            if (chargeHistoryForMostRecentPSA.size) {
              chargeHistoryForMostRecentPSA.entrySeq().forEach(([_, charges]) => {
                const pendingCharges = charges
                  .filter(charge => !charge.getIn([PROPERTY_TYPES.DISPOSITION_DATE, 0]));
                if (pendingCharges.size) hasPendingCharges = true;
              });
              if (!hasPendingCharges) {
                psaScoresWithNoPendingCharges = psaScoresWithNoPendingCharges.add(psaId);
                peopleWithNoPendingCharges = peopleWithNoPendingCharges.add(personId);
              }
            }
          }
        });
      }
      peopleNeighborsById = peopleNeighborsById.set(personId, personNeighbors);
    });

    yield put(loadRequiresActionPeople.success(action.id, {
      peopleNeighborsById,
      peopleWithMultipleOpenPSAs,
      peopleWithRecentFTAs,
      peopleWithNoPendingCharges,
      peopleWithPSAsWithNoHearings,
      peopleMap,
      psaScoreMap,
      psaNeighborsById,
      psaScoresWithNoPendingCharges,
      psaScoresWithNoHearings,
      psaScoresWithRecentFTAs
    }));
  }
  catch (error) {
    LOG.error(action.type, error);
    yield put(loadRequiresActionPeople.failure(action.id, { error }));
  }
  finally {
    yield put(loadRequiresActionPeople.finally(action.id));
  }
}

function* loadRequiresActionPeopleWatcher() :Generator<*, *, *> {
  yield takeEvery(LOAD_REQUIRES_ACTION_PEOPLE, loadRequiresActionPeopleWorker);
}

export {
  getPeopleNeighborsWatcher,
  getPersonDataWatcher,
  getStaffEKIDsWatcher,
  loadRequiresActionPeopleWatcher
};
