/*
 * @flow
 */
/* eslint max-len: 0 */ // --> OFF

import {
  call,
  put,
  select,
  takeEvery
} from '@redux-saga/core/effects';
import { List, Map, fromJS } from 'immutable';
import { SearchApiActions, SearchApiSagas } from 'lattice-sagas';
import type { SequenceAction } from 'redux-reqseq';

import {
  GET_IN_CUSTODY_DATA,
  getInCustodyData
} from './InCustodyActions';

import Logger from '../../utils/Logger';
import { getSimpleConstraintGroup } from '../../core/sagas/constants';
import { getPropertyTypeId } from '../../edm/edmUtils';
import { getEntitySetIdFromApp } from '../../utils/AppUtils';
import { getEntityKeyId } from '../../utils/DataUtils';
import { MAX_HITS } from '../../utils/consts/Consts';
import { APP_TYPES, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { PSA_NEIGHBOR } from '../../utils/consts/FrontEndStateConsts';
import { APP_DATA } from '../../utils/consts/redux/AppConsts';
import { STATE } from '../../utils/consts/redux/SharedConsts';
import { getPeopleNeighbors } from '../people/PeopleActions';

const {
  CHARGES,
  ARREST_BONDS,
  JAIL_STAYS,
  PEOPLE,
  PRETRIAL_CASES,
  PSA_SCORES
} = APP_TYPES;

const { RELEASE_DATE_TIME, START_DATE_TIME } = PROPERTY_TYPES;

const LOG :Logger = new Logger('InCustodySagas');

const { searchEntitySetData, searchEntityNeighborsWithFilter } = SearchApiActions;
const { searchEntitySetDataWorker, searchEntityNeighborsWithFilterWorker } = SearchApiSagas;

/*
 * Selectors
 */
const getApp = (state) => state.get(STATE.APP, Map());
const getEDM = (state) => state.get(STATE.EDM, Map());
const getOrgId = (state) => state.getIn([STATE.APP, APP_DATA.SELECTED_ORG_ID], '');

function* getInCustodyDataWorker(action :SequenceAction) :Generator<*, *, *> {

  try {
    yield put(getInCustodyData.request(action.id));
    let peopleInCustody = Map();
    const app = yield select(getApp);
    const edm = yield select(getEDM);
    const orgId = yield select(getOrgId);
    const entitySetIdsToAppType = app.getIn([APP_DATA.ENTITY_SETS_BY_ORG, orgId]);

    const arrestBondsESID :UUID = getEntitySetIdFromApp(app, ARREST_BONDS);
    const jailStaysESID :UUID = getEntitySetIdFromApp(app, JAIL_STAYS);
    const peopleESID :UUID = getEntitySetIdFromApp(app, PEOPLE);

    const startDatePropertyTypeId :UUID = getPropertyTypeId(edm, START_DATE_TIME);
    const releaseDatePropertyTypeId :UUID = getPropertyTypeId(edm, RELEASE_DATE_TIME);

    const searchTerm = `_exists_:entity.${startDatePropertyTypeId} AND NOT _exists_:entity.${releaseDatePropertyTypeId}`;
    const constraints = getSimpleConstraintGroup(searchTerm);
    const options = {
      constraints,
      entitySetIds: [jailStaysESID],
      start: 0,
      maxHits: MAX_HITS
    };
    /* get all judge data */
    const jailStayResponse = yield call(
      searchEntitySetDataWorker,
      searchEntitySetData(options)
    );
    if (jailStayResponse.error) throw jailStayResponse.error;
    const activeJailStays = fromJS(jailStayResponse.data.hits);
    const jailStaysById = Map().withMutations((mutableMap) => {
      activeJailStays.forEach((jailStay) => {
        const jailStayEKID = getEntityKeyId(jailStay);
        mutableMap.set(jailStayEKID, jailStay);
      });
    });
    let neighborsByAppTypeFqn = Map();
    if (jailStaysById.size) {
      let neighborsById = yield call(
        searchEntityNeighborsWithFilterWorker,
        searchEntityNeighborsWithFilter({
          entitySetId: jailStaysESID,
          filter: {
            entityKeyIds: jailStaysById.keySeq().toJS(),
            sourceEntitySetIds: [peopleESID],
            destinationEntitySetIds: [arrestBondsESID]
          }
        })
      );
      if (neighborsById.error) throw neighborsById.error;
      neighborsById = fromJS(neighborsById.data);

      neighborsByAppTypeFqn = neighborsByAppTypeFqn.withMutations((mutableMap) => {
        neighborsById.entrySeq().forEach(([id, neighbors]) => {
          neighbors.forEach((neighbor) => {
            const entityKeyId = getEntityKeyId(neighbor);
            const neighborESID = neighbor.getIn([PSA_NEIGHBOR.ENTITY_SET, 'id'], '');
            const appTypeFqn = entitySetIdsToAppType.get(neighborESID, '');
            if (appTypeFqn === PEOPLE) {
              mutableMap.setIn([id, PEOPLE], neighbor);
              peopleInCustody = peopleInCustody.set(entityKeyId, neighbor);
            }
            else if (appTypeFqn === ARREST_BONDS) {
              mutableMap.setIn(
                [id, ARREST_BONDS],
                mutableMap.getIn([id, ARREST_BONDS], List()).push(neighbor)
              );
            }
          });
        });
      });
    }
    if (peopleInCustody.size) {
      const loadPersonNeighborsRequest = getPeopleNeighbors({
        peopleEKIDs: peopleInCustody.keySeq().toJS(),
        srcEntitySets: [PSA_SCORES],
        dstEntitySets: [CHARGES, PRETRIAL_CASES],
        dontLoadPSANeighbors: true
      });
      yield put(loadPersonNeighborsRequest);
    }

    yield put(getInCustodyData.success(action.id, {
      jailStaysById,
      neighborsByAppTypeFqn,
      peopleInCustody
    }));
  }
  catch (error) {
    LOG.error(error);
    yield put(getInCustodyData.failure(action.id, { error }));
  }
  finally {
    yield put(getInCustodyData.finally(action.id));
  }
}

function* getInCustodyDataWatcher() :Generator<*, *, *> {
  yield takeEvery(GET_IN_CUSTODY_DATA, getInCustodyDataWorker);
}

export {
  // eslint-disable-next-line import/prefer-default-export
  getInCustodyDataWatcher
};
