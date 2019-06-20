/*
 * @flow
 */

import moment from 'moment';
import { SearchApiActions, SearchApiSagas } from 'lattice-sagas';
import {
  AuthorizationApi,
  Constants,
  DataApi,
  SearchApi
} from 'lattice';
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

import { getEntitySetIdFromApp } from '../../utils/AppUtils';
import { hearingIsCancelled } from '../../utils/HearingUtils';
import { getEntityProperties, getEntityKeyId } from '../../utils/DataUtils';
import { APP_TYPES, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import {
  APP,
  PSA_NEIGHBOR,
  PSA_ASSOCIATION,
  STATE
} from '../../utils/consts/FrontEndStateConsts';

import { LOAD_PSA_MODAL, loadPSAModal } from './PSAModalActionFactory';

const { searchEntityNeighborsWithFilter } = SearchApiActions;
const { searchEntityNeighborsWithFilterWorker } = SearchApiSagas;

const { DATE_TIME, HEARING_TYPE } = PROPERTY_TYPES;

const {
  CHECKIN_APPOINTMENTS,
  CONTACT_INFORMATION,
  DMF_RISK_FACTORS,
  HEARINGS,
  PEOPLE,
  PRETRIAL_CASES,
  MANUAL_PRETRIAL_COURT_CASES,
  MANUAL_PRETRIAL_CASES,
  PSA_SCORES,
  PSA_RISK_FACTORS,
  RELEASE_CONDITIONS,
  STAFF,
  SUBSCRIPTION
} = APP_TYPES;

/*
 * Selectors
 */
const getApp = state => state.get(STATE.APP, Map());
const getOrgId = state => state.getIn([STATE.APP, APP.SELECTED_ORG_ID], '');

const { OPENLATTICE_ID_FQN } = Constants;

const LIST_ENTITY_SETS = List.of(STAFF, RELEASE_CONDITIONS, HEARINGS, PRETRIAL_CASES, CHECKIN_APPOINTMENTS);

function* loadPSAModalWorker(action :SequenceAction) :Generator<*, *, *> {
  const { psaId, callback } = action.value; // Deconstruct action argument
  try {
    yield put(loadPSAModal.request(action.id));

    let scoresAsMap = Map();
    let allFilers = Set();
    let hearingIds = Set();
    let allDatesEdited = List();
    let neighborsByAppTypeFqn = Map();
    let psaPermissions = false;
    const app = yield select(getApp);
    const orgId = yield select(getOrgId);
    const entitySetIdsToAppType = app.getIn([APP.ENTITY_SETS_BY_ORG, orgId]);
    const checkInAppointmentEntitySetId = getEntitySetIdFromApp(app, CHECKIN_APPOINTMENTS);
    const hearingsEntitySetId = getEntitySetIdFromApp(app, HEARINGS);
    const psaScoresEntitySetId = getEntitySetIdFromApp(app, PSA_SCORES);
    const peopleEntitySetId = getEntitySetIdFromApp(app, PEOPLE);
    const subscriptionEntitySetId = getEntitySetIdFromApp(app, SUBSCRIPTION);
    const contactInformationEntitySetId = getEntitySetIdFromApp(app, CONTACT_INFORMATION);
    const dmfRiskFactorsEntitySetId = getEntitySetIdFromApp(app, DMF_RISK_FACTORS);
    const psaRiskFactorsEntitySetId = getEntitySetIdFromApp(app, PSA_RISK_FACTORS);
    const psaEntitySetId = getEntitySetIdFromApp(app, PSA_SCORES);
    const staffEntitySetId = getEntitySetIdFromApp(app, STAFF);
    const arrestCasesEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.ARREST_CASES);
    const pretrialCasesEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.PRETRIAL_CASES);
    const manualPretrialCasesEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.MANUAL_PRETRIAL_CASES);
    const manualPretrialCourtCasesEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.MANUAL_PRETRIAL_COURT_CASES);
    const releaseRecommendationsEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.RELEASE_RECOMMENDATIONS);
    const dmfResultsEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.DMF_RESULTS);
    const outcomesEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.OUTCOMES);
    const bondsEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.BONDS);
    const releaseConditionsEntitySetId = getEntitySetIdFromApp(app, APP_TYPES.RELEASE_CONDITIONS);

    /*
     * Get PSA Info
     */

    let scores = yield call(DataApi.getEntityData, psaScoresEntitySetId, psaId);
    scores = fromJS(scores);

    /*
     * Get PSA Neighbors
     */
    const psaNeighborsById = yield call(
      searchEntityNeighborsWithFilterWorker,
      searchEntityNeighborsWithFilter({
        entitySetId: psaEntitySetId,
        filter: {
          entityKeyIds: [psaId],
          sourceEntitySetIds: [
            dmfResultsEntitySetId,
            releaseRecommendationsEntitySetId,
            bondsEntitySetId,
            outcomesEntitySetId,
            releaseConditionsEntitySetId
          ],
          destinationEntitySetIds: [
            hearingsEntitySetId,
            peopleEntitySetId,
            psaRiskFactorsEntitySetId,
            dmfRiskFactorsEntitySetId,
            pretrialCasesEntitySetId,
            pretrialCasesEntitySetId,
            manualPretrialCasesEntitySetId,
            manualPretrialCourtCasesEntitySetId,
            arrestCasesEntitySetId,
            staffEntitySetId
          ]
        }
      })
    );
    if (psaNeighborsById.error) throw psaNeighborsById.error;
    console.log(psaId);
    console.log(psaNeighborsById);
    let psaNeighbors = fromJS(psaNeighborsById.data);
    psaNeighbors = psaNeighbors.get(psaId, List());
    console.log(psaNeighbors.toJS());

    /*
     * Check PSA Permissions
     */

    psaPermissions = yield call(AuthorizationApi.checkAuthorizations, [
      { aclKey: [psaScoresEntitySetId], permissions: ['WRITE'] }
    ]);
    psaPermissions = psaPermissions[0].permissions.WRITE;

    /*
     * Format Neighbors
     */

    psaNeighbors.forEach((neighbor) => {

      neighbor.getIn([PSA_ASSOCIATION.DETAILS, PROPERTY_TYPES.TIMESTAMP],
        neighbor.getIn([
          PSA_ASSOCIATION.DETAILS,
          PROPERTY_TYPES.DATE_TIME
        ], List.of(scores.getIn([PROPERTY_TYPES.DATE_TIME, 0])) || List())).forEach((timestamp) => {
        const timestampMoment = moment(timestamp);
        if (timestampMoment.isValid()) {
          allDatesEdited = allDatesEdited.push(timestampMoment.format('MM/DD/YYYY'));
        }
      });

      const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id']);
      const neighborDetails = neighbor.get(PSA_NEIGHBOR.DETAILS, Map());
      const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
      if (appTypeFqn) {
        if (appTypeFqn === STAFF) {
          neighbor.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.PERSON_ID], List())
            .forEach((filer) => {
              allFilers = allFilers.add(filer);
            });
        }

        if (LIST_ENTITY_SETS.includes(appTypeFqn)) {
          const hearingEntityKeyId = neighborDetails.getIn([OPENLATTICE_ID_FQN, 0]);
          if (appTypeFqn === HEARINGS) {
            if (hearingEntityKeyId) hearingIds = hearingIds.add(neighborDetails.getIn([OPENLATTICE_ID_FQN, 0]));
            const {
              [DATE_TIME]: hearingDateTime,
              [HEARING_TYPE]: hearingType
            } = getEntityProperties(neighbor, [
              DATE_TIME,
              HEARING_TYPE
            ]);
            const hearingIsInactive = hearingIsCancelled(neighbor);
            const hearingIsGeneric = hearingType.toLowerCase().trim() === 'all other hearings';
            if (hearingDateTime && !hearingIsGeneric && !hearingIsInactive) {
              neighborsByAppTypeFqn = neighborsByAppTypeFqn.set(
                appTypeFqn,
                neighborsByAppTypeFqn.get(appTypeFqn, List()).push(fromJS(neighborDetails))
              );
            }
          }
          else {
            neighborsByAppTypeFqn = neighborsByAppTypeFqn.set(
              appTypeFqn,
              neighborsByAppTypeFqn.get(appTypeFqn, List()).push(fromJS(neighbor))
            );
          }
        }
        else if (appTypeFqn === MANUAL_PRETRIAL_CASES || appTypeFqn === MANUAL_PRETRIAL_COURT_CASES) {
          neighborsByAppTypeFqn = neighborsByAppTypeFqn.set(MANUAL_PRETRIAL_CASES, neighbor);
        }
        else {
          neighborsByAppTypeFqn = neighborsByAppTypeFqn.set(appTypeFqn, fromJS(neighbor));
        }
      }
    });

    const personEntityKeyId = getEntityKeyId(neighborsByAppTypeFqn, PEOPLE);

    const personNeighborsById = yield call(
      searchEntityNeighborsWithFilterWorker,
      searchEntityNeighborsWithFilter({
        entitySetId: peopleEntitySetId,
        filter: {
          entityKeyIds: [personEntityKeyId],
          sourceEntitySetIds: [contactInformationEntitySetId, checkInAppointmentEntitySetId],
          destinationEntitySetIds: [subscriptionEntitySetId, contactInformationEntitySetId, hearingsEntitySetId]
        }
      })
    );
    if (personNeighborsById.error) throw personNeighborsById.error;
    let personNeighbors = fromJS(personNeighborsById.data);
    personNeighbors = personNeighbors.get(personEntityKeyId);

    let personNeighborsByFqn = Map();
    personNeighbors.forEach((neighbor) => {
      const entitySetId = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id'], '');
      const appTypeFqn = entitySetIdsToAppType.get(entitySetId, '');
      if (appTypeFqn === CONTACT_INFORMATION) {
        personNeighborsByFqn = personNeighborsByFqn.set(
          appTypeFqn,
          personNeighborsByFqn.get(appTypeFqn, List()).push(neighbor)
        );
      }
      else if (appTypeFqn === HEARINGS) {
        const neighborDetails = neighbor.get(PSA_NEIGHBOR.DETAILS, Map());
        const hearingEntityKeyId = neighborDetails.getIn([OPENLATTICE_ID_FQN, 0]);
        if (hearingEntityKeyId) hearingIds = hearingIds.add(hearingEntityKeyId);
        personNeighborsByFqn = personNeighborsByFqn.set(
          appTypeFqn,
          personNeighborsByFqn.get(appTypeFqn, List()).push(neighbor)
        );
      }
      else if (appTypeFqn === SUBSCRIPTION) {
        personNeighborsByFqn = personNeighborsByFqn.set(
          appTypeFqn,
          neighbor
        );
      }
    });

    if (callback) callback(personEntityKeyId, neighborsByAppTypeFqn);

    yield put(loadPSAModal.success(action.id, {
      psaId,
      scores,
      neighborsByAppTypeFqn,
      psaPermissions,
      personNeighborsByFqn,
      hearingIds,
      allFilers
    }));
  }

  catch (error) {
    console.error(error);
    yield put(loadPSAModal.failure(action.id, error));
  }
  finally {
    yield put(loadPSAModal.finally(action.id));
  }
}

export function* loadPSAModalWatcher() :Generator<*, *, *> {
  yield takeEvery(LOAD_PSA_MODAL, loadPSAModalWorker);
}
