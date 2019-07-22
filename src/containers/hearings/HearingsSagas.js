/*
 * @flow
 */

import { DateTime } from 'luxon';
import randomUUID from 'uuid/v4';
import { Types } from 'lattice';
import {
  fromJS,
  List,
  Map,
  Set
} from 'immutable';
import {
  DataApiActions,
  DataApiSagas,
  SearchApiActions,
  SearchApiSagas
} from 'lattice-sagas';
import {
  call,
  put,
  takeEvery,
  select
} from '@redux-saga/core/effects';
import type { SequenceAction } from 'redux-reqseq';

import { getEntitySetIdFromApp } from '../../utils/AppUtils';
import { createIdObject, getEntityProperties } from '../../utils/DataUtils';
import { getPropertyTypeId, getPropertyIdToValueMap } from '../../edm/edmUtils';
import { SETTINGS } from '../../utils/consts/AppSettingConsts';
import { APP_TYPES, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { HEARING_TYPES, PSA_STATUSES } from '../../utils/consts/Consts';
import { APP, PSA_NEIGHBOR, STATE } from '../../utils/consts/FrontEndStateConsts';

import { filterPeopleIdsWithOpenPSAs } from '../court/CourtActionFactory';
import {
  LOAD_HEARING_NEIGHBORS,
  REFRESH_HEARING_AND_NEIGHBORS,
  SUBMIT_EXISTING_HEARING,
  SUBMIT_HEARING,
  UPDATE_HEARING,
  loadHearingNeighbors,
  refreshHearingAndNeighbors,
  submitExistingHearing,
  submitHearing,
  updateHearing
} from './HearingsActionFactory';

const { DeleteTypes } = Types;

const {
  createAssociations,
  createEntityAndAssociationData,
  deleteEntity,
  getEntityData,
  updateEntityData
} = DataApiActions;
const {
  createAssociationsWorker,
  createEntityAndAssociationDataWorker,
  deleteEntityWorker,
  getEntityDataWorker,
  updateEntityDataWorker
} = DataApiSagas;
const { searchEntityNeighborsWithFilter } = SearchApiActions;
const { searchEntityNeighborsWithFilterWorker } = SearchApiSagas;

const { PREFERRED_COUNTY } = SETTINGS;

const {
  APPEARS_IN,
  APPEARS_IN_STATE,
  ASSESSED_BY,
  BONDS,
  CHECKIN_APPOINTMENTS,
  CHARGES,
  CONTACT_INFORMATION,
  COUNTIES,
  HEARINGS,
  JUDGES,
  MANUAL_REMINDERS,
  OUTCOMES,
  PEOPLE,
  PRETRIAL_CASES,
  PSA_SCORES,
  RELEASE_CONDITIONS,
  REMINDERS,
  STAFF
} = APP_TYPES;

const {
  CASE_ID,
  COMPLETED_DATE_TIME,
  DATE_TIME,
  ENTITY_KEY_ID,
  COURTROOM,
  HEARING_TYPE,
  HEARING_COMMENTS,
  STRING_ID
} = PROPERTY_TYPES;


/*
 * Selectors
 */
const getApp = state => state.get(STATE.APP, Map());
const getEDM = state => state.get(STATE.EDM, Map());
const getOrgId = state => state.getIn([STATE.APP, APP.SELECTED_ORG_ID], '');

const LIST_ENTITY_SETS = List.of(
  CHARGES,
  CHECKIN_APPOINTMENTS,
  CONTACT_INFORMATION,
  HEARINGS,
  PRETRIAL_CASES,
  RELEASE_CONDITIONS,
  REMINDERS,
  STAFF
);

function* getHearingAndNeighbors(hearingEntityKeyId :string) :Generator<*, *, *> {
  let hearing = Map();
  let hearingNeighborsByAppTypeFqn = Map();

  if (hearingEntityKeyId) {
    const app = yield select(getApp);
    const orgId = yield select(getOrgId);
    const entitySetIdsToAppType = app.getIn([APP.ENTITY_SETS_BY_ORG, orgId]);

    /*
    * Get Entity Set Ids
    */
    const bondsEntitySetId = getEntitySetIdFromApp(app, BONDS);
    const checkInAppointmentsEntitySetId = getEntitySetIdFromApp(app, CHECKIN_APPOINTMENTS);
    const hearingsEntitySetId = getEntitySetIdFromApp(app, HEARINGS);
    const judgesEntitySetId = getEntitySetIdFromApp(app, JUDGES);
    const manualRemindersEntitySetId = getEntitySetIdFromApp(app, MANUAL_REMINDERS);
    const outcomesEntitySetId = getEntitySetIdFromApp(app, OUTCOMES);
    const peopleEntitySetId = getEntitySetIdFromApp(app, PEOPLE);
    const psaEntitySetId = getEntitySetIdFromApp(app, PSA_SCORES);
    const releaseConditionsEntitySetId = getEntitySetIdFromApp(app, RELEASE_CONDITIONS);

    /*
    * Get Hearing Info
    */
    const hearingIdObject = createIdObject(hearingEntityKeyId, hearingsEntitySetId);
    const hearingResponse = yield call(
      getEntityDataWorker,
      getEntityData(hearingIdObject)
    );
    if (hearingResponse.error) throw hearingResponse.error;
    hearing = fromJS(hearingResponse.data);

    /*
    * Get Neighbors
    */
    let hearingNeighborsById = yield call(
      searchEntityNeighborsWithFilterWorker,
      searchEntityNeighborsWithFilter({
        entitySetId: hearingsEntitySetId,
        filter: {
          entityKeyIds: [hearingEntityKeyId],
          sourceEntitySetIds: [
            bondsEntitySetId,
            checkInAppointmentsEntitySetId,
            manualRemindersEntitySetId,
            outcomesEntitySetId,
            peopleEntitySetId,
            psaEntitySetId,
            releaseConditionsEntitySetId
          ],
          destinationEntitySetIds: [judgesEntitySetId]
        }
      })
    );
    if (hearingNeighborsById.error) throw hearingNeighborsById.error;
    hearingNeighborsById = fromJS(hearingNeighborsById.data);
    const hearingNeighbors = hearingNeighborsById.get(hearingEntityKeyId, List());
    /*
    * Format Neighbors
    */

    hearingNeighbors.forEach((neighbor) => {

      const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id']);
      const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
      if (appTypeFqn) {

        if (LIST_ENTITY_SETS.includes(appTypeFqn)) {
          hearingNeighborsByAppTypeFqn = hearingNeighborsByAppTypeFqn.set(
            appTypeFqn,
            hearingNeighborsByAppTypeFqn.get(appTypeFqn, List()).push(neighbor)
          );
        }
        else {
          hearingNeighborsByAppTypeFqn = hearingNeighborsByAppTypeFqn.set(appTypeFqn, neighbor);
        }
      }
    });

  }

  return { hearing, hearingNeighborsByAppTypeFqn };
}


function* loadHearingNeighborsWorker(action :SequenceAction) :Generator<*, *, *> {
  try {
    yield put(loadHearingNeighbors.request(action.id));

    const { hearingIds, hearingDateTime } = action.value;

    let hearingNeighborsById = Map();
    let personIdsToHearingIds = Map();
    let personIds = Set();
    let scoresAsMap = Map();

    if (hearingIds.length) {
      const app = yield select(getApp);
      const orgId = yield select(getOrgId);
      const entitySetIdsToAppType = app.getIn([APP.ENTITY_SETS_BY_ORG, orgId]);

      /*
       * Get Entity Set Ids
       */
      const bondsEntitySetId = getEntitySetIdFromApp(app, BONDS);
      const checkInAppointmentsEntitySetId = getEntitySetIdFromApp(app, CHECKIN_APPOINTMENTS);
      const hearingsEntitySetId = getEntitySetIdFromApp(app, HEARINGS);
      const judgesEntitySetId = getEntitySetIdFromApp(app, JUDGES);
      const manualRemindersEntitySetId = getEntitySetIdFromApp(app, MANUAL_REMINDERS);
      const outcomesEntitySetId = getEntitySetIdFromApp(app, OUTCOMES);
      const peopleEntitySetId = getEntitySetIdFromApp(app, PEOPLE);
      const releaseConditionsEntitySetId = getEntitySetIdFromApp(app, RELEASE_CONDITIONS);
      const psaEntitySetId = getEntitySetIdFromApp(app, PSA_SCORES);

      let neighborsById = yield call(
        searchEntityNeighborsWithFilterWorker,
        searchEntityNeighborsWithFilter({
          entitySetId: hearingsEntitySetId,
          filter: {
            entityKeyIds: hearingIds,
            sourceEntitySetIds: [
              bondsEntitySetId,
              checkInAppointmentsEntitySetId,
              manualRemindersEntitySetId,
              outcomesEntitySetId,
              peopleEntitySetId,
              psaEntitySetId,
              releaseConditionsEntitySetId
            ],
            destinationEntitySetIds: [judgesEntitySetId]
          }
        })
      );
      if (neighborsById.error) throw neighborsById.error;
      neighborsById = fromJS(neighborsById.data);

      neighborsById.entrySeq().forEach(([hearingId, neighbors]) => {
        if (neighbors) {
          let hasPerson = false;
          let hasPSA = false;
          let personId;
          let hearingNeighborsMap = Map();
          neighbors.forEach(((neighbor) => {
            const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id']);
            const appTypeFqn = entitySetIdsToAppType.get(entitySetId, JUDGES);
            const { [ENTITY_KEY_ID]: entityKeyId } = getEntityProperties(neighbor, [ENTITY_KEY_ID]);
            if (appTypeFqn === PEOPLE) {
              hasPerson = true;
              personId = entityKeyId;
              personIds = personIds.add(personId);
            }
            if (appTypeFqn === PSA_SCORES
                && neighbor.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.STATUS, 0]) === PSA_STATUSES.OPEN) {
              hasPSA = true;
              scoresAsMap = scoresAsMap.set(
                entityKeyId,
                fromJS(neighbor.get(PSA_NEIGHBOR.DETAILS))
              );
            }
            if (LIST_ENTITY_SETS.includes(appTypeFqn)) {
              hearingNeighborsMap = hearingNeighborsMap.set(
                appTypeFqn,
                hearingNeighborsMap.get(appTypeFqn, List()).push(neighbor)
              );
            }
            else {
              hearingNeighborsMap = hearingNeighborsMap.set(appTypeFqn, neighbor);
            }
          }));
          if (hasPerson && !hasPSA) {
            personIdsToHearingIds = personIdsToHearingIds.set(
              personId,
              hearingId
            );
          }
          hearingNeighborsById = hearingNeighborsById.set(hearingId, hearingNeighborsMap);
        }
      });
    }
    yield put(loadHearingNeighbors.success(action.id, { hearingNeighborsById, hearingDateTime }));

    if (hearingDateTime) {
      const peopleIdsWithOpenPSAs = filterPeopleIdsWithOpenPSAs({
        personIds,
        hearingDateTime,
        scoresAsMap,
        personIdsToHearingIds,
        hearingNeighborsById
      });
      yield put(peopleIdsWithOpenPSAs);
    }

  }
  catch (error) {
    console.error(error);
    yield put(loadHearingNeighbors.failure(action.id, error));
  }
  finally {
    yield put(loadHearingNeighbors.finally(action.id));
  }
}

function* loadHearingNeighborsWatcher() :Generator<*, *, *> {
  yield takeEvery(LOAD_HEARING_NEIGHBORS, loadHearingNeighborsWorker);
}


function* refreshHearingAndNeighborsWorker(action :SequenceAction) :Generator<*, *, *> {
  const { hearingEntityKeyId } = action.value; // Deconstruct action argument
  try {
    yield put(refreshHearingAndNeighbors.request(action.id));

    /*
     * Get Hearing and Hearing Neighbors
     */

    const { hearing, hearingNeighborsByAppTypeFqn } = yield call(getHearingAndNeighbors, hearingEntityKeyId);

    yield put(refreshHearingAndNeighbors.success(action.id, {
      hearingEntityKeyId,
      hearing,
      hearingNeighborsByAppTypeFqn
    }));
  }

  catch (error) {
    console.error(error);
    yield put(refreshHearingAndNeighbors.failure(action.id, error));
  }
  finally {
    yield put(refreshHearingAndNeighbors.finally(action.id));
  }
}

function* refreshHearingAndNeighborsWatcher() :Generator<*, *, *> {
  yield takeEvery(REFRESH_HEARING_AND_NEIGHBORS, refreshHearingAndNeighborsWorker);
}

function* submitExistingHearingWorker(action :SequenceAction) :Generator<*, *, *> {
  const {
    caseId,
    hearingEKID,
    personEKID,
    psaEKID
  } = action.value;
  try {
    yield put(submitExistingHearing.request(action.id));
    /*
     * Get Property Type Ids
     */
    const app = yield select(getApp);
    const edm = yield select(getEDM);
    const stringIdPTID = getPropertyTypeId(edm, STRING_ID);

    /*
     * Get Entity Set Ids
     */
    const appearsInESID = getEntitySetIdFromApp(app, APPEARS_IN);
    const hearingsESID = getEntitySetIdFromApp(app, HEARINGS);
    const psaScoresESID = getEntitySetIdFromApp(app, PSA_SCORES);
    /*
     * Assemble Assoociations
     */
    const associations = {
      [appearsInESID]: [
        {
          data: { [stringIdPTID]: [caseId] },
          dst: {
            entityKeyId: hearingEKID,
            entitySetId: hearingsESID
          },
          src: {
            entityKeyId: psaEKID,
            entitySetId: psaScoresESID
          }
        }
      ]
    };

    /*
     * Submit Associations
     */
    const response = yield call(
      createAssociationsWorker,
      createAssociations(associations)
    );

    if (response.error) throw response.error;

    /*
     * Get Hearing and Hearing Neighbors
     */

    const { hearing, hearingNeighborsByAppTypeFqn } = yield call(getHearingAndNeighbors, hearingEKID);

    yield put(submitExistingHearing.success(action.id, {
      personEKID,
      psaEKID,
      hearingEntityKeyId: hearingEKID,
      hearing,
      hearingNeighborsByAppTypeFqn
    }));
  }

  catch (error) {
    console.error(error);
    yield put(submitExistingHearing.failure(action.id, error));
  }
  finally {
    yield put(submitExistingHearing.finally(action.id));
  }
}

function* submitExistingHearingWatcher() :Generator<*, *, *> {
  yield takeEvery(SUBMIT_EXISTING_HEARING, submitExistingHearingWorker);
}

function* submitHearingWorker(action :SequenceAction) :Generator<*, *, *> {
  try {
    yield put(submitHearing.request(action.id));
    const {
      hearingDateTime,
      hearingCourtroom,
      hearingComments,
      judgeEKID,
      personEKID,
      psaEKID
    } = action.value;

    const hearingId = randomUUID();

    /*
     * Get Property Type Ids
     */
    const app = yield select(getApp);
    const edm = yield select(getEDM);
    const caseIdPTID = getPropertyTypeId(edm, CASE_ID);
    const completedDatetimePTID = getPropertyTypeId(edm, COMPLETED_DATE_TIME);
    const dateTimePTID = getPropertyTypeId(edm, DATE_TIME);
    const courtroomPTID = getPropertyTypeId(edm, COURTROOM);
    const hearingTypePTID = getPropertyTypeId(edm, HEARING_TYPE);
    const hearingCommentsPTID = getPropertyTypeId(edm, HEARING_COMMENTS);
    const stringIdPTID = getPropertyTypeId(edm, STRING_ID);

    /*
     * Get Preferred County from app settings
     */
    const preferredCountyEntityKeyId = app.getIn([APP.SELECTED_ORG_SETTINGS, PREFERRED_COUNTY], '');
    /*
     * Get Entity Set Ids
     */
    const appearsInESID = getEntitySetIdFromApp(app, APPEARS_IN);
    const appearsInStateESID = getEntitySetIdFromApp(app, APPEARS_IN_STATE);
    const assessedByESID = getEntitySetIdFromApp(app, ASSESSED_BY);
    const countiesESID = getEntitySetIdFromApp(app, COUNTIES);
    const hearingsESID = getEntitySetIdFromApp(app, HEARINGS);
    const judgesESID = getEntitySetIdFromApp(app, JUDGES);
    const peopleESID = getEntitySetIdFromApp(app, PEOPLE);
    const psaScoresESID = getEntitySetIdFromApp(app, PSA_SCORES);

    /*
     * Assemble Assoociations
     */
    const associations = {
      [assessedByESID]: [{
        data: { [completedDatetimePTID]: [DateTime.local().toISO()] },
        srcEntityIndex: 0,
        srcEntitySetId: hearingsESID,
        dstEntityKeyId: judgeEKID,
        dstEntitySetId: judgesESID
      }],
      [appearsInStateESID]: [{
        data: {},
        srcEntityIndex: 0,
        srcEntitySetId: hearingsESID,
        dstEntityKeyId: preferredCountyEntityKeyId,
        dstEntitySetId: countiesESID
      }],
      [appearsInESID]: [
        {
          data: { [stringIdPTID]: [hearingId] },
          dstEntityIndex: 0,
          dstEntitySetId: hearingsESID,
          srcEntityKeyId: psaEKID,
          srcEntitySetId: psaScoresESID
        },
        {
          data: { [stringIdPTID]: [hearingId] },
          dstEntityIndex: 0,
          dstEntitySetId: hearingsESID,
          srcEntityKeyId: personEKID,
          srcEntitySetId: peopleESID
        }
      ]
    };

    /*
     * Assemble Entities
     */
    const entities = {
      [hearingsESID]: [{
        [caseIdPTID]: [hearingId],
        [dateTimePTID]: [hearingDateTime],
        [courtroomPTID]: [hearingCourtroom],
        [hearingTypePTID]: [HEARING_TYPES.INITIAL_APPEARANCE],
        [hearingCommentsPTID]: [hearingComments]
      }]
    };
    /*
     * Submit data and collect response
     */
    const response = yield call(
      createEntityAndAssociationDataWorker,
      createEntityAndAssociationData({ associations, entities })
    );
    if (response.error) throw response.error;

    const entityKeyIds = fromJS(response.data.entityKeyIds);

    const hearingEntityKeyId = entityKeyIds.getIn([hearingsESID, 0], '');
    /*
     * Collect Hearing and Neighbors
     */
    const { hearing, hearingNeighborsByAppTypeFqn } = yield call(getHearingAndNeighbors, hearingEntityKeyId);

    yield put(submitHearing.success(action.id, {
      hearing,
      hearingNeighborsByAppTypeFqn,
      psaEKID,
      personEKID
    }));
  }

  catch (error) {
    console.error(error);
    yield put(submitHearing.failure(action.id, error));
  }
  finally {
    yield put(submitHearing.finally(action.id));
  }
}

function* submitHearingWatcher() :Generator<*, *, *> {
  yield takeEvery(SUBMIT_HEARING, submitHearingWorker);
}

function* updateHearingWorker(action :SequenceAction) :Generator<*, *, *> {
  try {
    yield put(updateHearing.request(action.id));
    const {
      hearingEntity,
      hearingEKID,
      judgeEKID,
      oldJudgeAssociationEKID,
      personEKID
    } = action.value;

    const app = yield select(getApp);
    const edm = yield select(getEDM);
    const orgId = yield select(getOrgId);
    const entitySetIdsToAppType = app.getIn([APP.ENTITY_SETS_BY_ORG, orgId]);

    /*
    * Get Property Type Ids
    */
    const completedDatetimePTID = getPropertyTypeId(edm, COMPLETED_DATE_TIME);
    const updatedHearingObject = getPropertyIdToValueMap(hearingEntity, edm);

    /*
     * Get Entity Set Ids
     */
    const assessedByESID = getEntitySetIdFromApp(app, ASSESSED_BY);
    const hearingsESID = getEntitySetIdFromApp(app, HEARINGS);
    const judgesESID = getEntitySetIdFromApp(app, JUDGES);

    /*
     * Delete old association to Judge
     */
    if (oldJudgeAssociationEKID) {
      const deleteResponse = yield call(
        deleteEntityWorker,
        deleteEntity({
          entityKeyId: oldJudgeAssociationEKID,
          entitySetId: assessedByESID,
          deleteType: DeleteTypes.Soft
        })
      );
      if (deleteResponse.error) throw deleteResponse.error;
    }

    /*
     * Assemble and Submit New Judge Association
     */
    if (judgeEKID) {
      const data = { [completedDatetimePTID]: [DateTime.local().toISO()] };
      const src = createIdObject(hearingEKID, hearingsESID);
      const dst = createIdObject(judgeEKID, judgesESID);
      const associations = { [assessedByESID]: [{ data, src, dst }] };

      const associationsResponse = yield call(
        createAssociationsWorker,
        createAssociations(associations)
      );
      if (associationsResponse.error) throw associationsResponse.error;
    }

    /*
     * Update Hearing Data
     */

    const updateResponse = yield call(
      updateEntityDataWorker,
      updateEntityData({
        entitySetId: hearingsESID,
        entities: { [hearingEKID]: updatedHearingObject },
        updateType: 'PartialReplace'
      })
    );
    if (updateResponse.error) throw updateResponse.error;

    /*
     * Get updated hearing
     */
    const hearingIdObject = createIdObject(hearingEKID, hearingsESID);
    const hearingResponse = yield call(
      getEntityDataWorker,
      getEntityData(hearingIdObject)
    );
    if (hearingResponse.error) throw hearingResponse.error;
    const hearing = fromJS(hearingResponse.data);

    /*
     * Get hearing judge neighbors
     */
    let hearingNeighborsById = yield call(
      searchEntityNeighborsWithFilterWorker,
      searchEntityNeighborsWithFilter({
        entitySetId: hearingsESID,
        filter: {
          entityKeyIds: [hearingEKID],
          sourceEntitySetIds: [],
          destinationEntitySetIds: [judgesESID]
        }
      })
    );
    if (hearingNeighborsById.error) throw hearingNeighborsById.error;
    hearingNeighborsById = fromJS(hearingNeighborsById.data);
    const hearingNeighbors = hearingNeighborsById.get(hearingEKID, List());

    let hearingJudge = Map();
    if (hearingNeighbors) {
      hearingNeighbors.forEach(((neighbor) => {
        const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id']);
        const appTypeFqn = entitySetIdsToAppType.get(entitySetId, JUDGES);
        if (appTypeFqn === JUDGES) {
          hearingJudge = neighbor;
        }
      }));
    }

    yield put(updateHearing.success(action.id, {
      hearingEKID,
      hearing,
      hearingJudge,
      personEKID
    }));
  }

  catch (error) {
    console.error(error);
    yield put(updateHearing.failure(action.id, error));
  }
  finally {
    yield put(updateHearing.finally(action.id));
  }
}

function* updateHearingWatcher() :Generator<*, *, *> {
  yield takeEvery(UPDATE_HEARING, updateHearingWorker);
}

export {
  loadHearingNeighborsWatcher,
  refreshHearingAndNeighborsWatcher,
  submitExistingHearingWatcher,
  submitHearingWatcher,
  updateHearingWatcher
};
