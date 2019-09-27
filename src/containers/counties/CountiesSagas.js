/*
 * @flow
 */

import { fromJS, Map } from 'immutable';
import { SearchApiActions, SearchApiSagas } from 'lattice-sagas';
import type { SequenceAction } from 'redux-reqseq';
import {
  call,
  put,
  takeEvery,
  select
} from '@redux-saga/core/effects';

import { getEntitySetIdFromApp } from '../../utils/AppUtils';
import { MAX_HITS } from '../../utils/consts/Consts';
import { getEntityKeyId } from '../../utils/DataUtils';

import { APP_TYPES } from '../../utils/consts/DataModelConsts';
import { STATE } from '../../utils/consts/redux/SharedConsts';

import { LOAD_COUNTIES, loadCounties } from './CountiesActions';

const { COUNTIES } = APP_TYPES;

const { searchEntitySetData } = SearchApiActions;
const { searchEntitySetDataWorker } = SearchApiSagas;

/*
 * Selectors
 */
const getApp = state => state.get(STATE.APP, Map());

function* loadCountiesWorker(action :SequenceAction) :Generator<*, *, *> {

  try {
    yield put(loadCounties.request(action.id));
    const app = yield select(getApp);
    const countiesESID = getEntitySetIdFromApp(app, COUNTIES);
    const options = {
      searchTerm: '*',
      start: 0,
      maxHits: MAX_HITS
    };
    /* get all judge data */
    const allCountyData = yield call(
      searchEntitySetDataWorker,
      searchEntitySetData({ entitySetId: countiesESID, searchOptions: options })
    );
    if (allCountyData.error) throw allCountyData.error;
    const allCounties = fromJS(allCountyData.data.hits);
    const countiesById = Map().withMutations((mutableMap) => {
      allCounties.forEach((county) => {
        const countyEKID = getEntityKeyId(county);
        mutableMap.set(countyEKID, county);
      });
    });

    yield put(loadCounties.success(action.id, {
      countiesById
    }));

  }
  catch (error) {
    console.error(error);
    yield put(loadCounties.failure(action.id, { error }));
  }
  finally {
    yield put(loadCounties.finally(action.id));
  }
}

function* loadCountiesWatcher() :Generator<*, *, *> {
  yield takeEvery(LOAD_COUNTIES, loadCountiesWorker);
}


export {
  loadCountiesWatcher
};