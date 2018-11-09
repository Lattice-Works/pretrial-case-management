/*
 * @flow
 */

import { DataApi } from 'lattice';
import {
  call,
  put,
  select,
  takeEvery
} from 'redux-saga/effects';

import {
  DELETE_ENTITY,
  REPLACE_ENTITY_DATA,
  deleteEntity,
  replaceEntity
} from './DataActionFactory';

import { loadPersonDetails } from '../../containers/person/PersonActionFactory';
import { STATE, SEARCH } from '../consts/FrontEndStateConsts';

function* deleteEntityWorker(action :SequenceAction) :Generator<*, *, *> {
  const {
    entitySetId,
    entityKeyId
  } = action.value;

  try {
    yield put(deleteEntity.request(action.id));
    yield call(DataApi.clearEntityFromEntitySet, entitySetId, entityKeyId);
    yield put(deleteEntity.success(action.id, { entityKeyId }));

    const state = yield select();
    const personId = state.getIn([STATE.SEARCH, SEARCH.SELECTED_PERSON_ID], '');
    if (personId) yield put(loadPersonDetails({ entityKeyId: personId, shouldLoadCases: false }));
  }
  catch (error) {
    yield put(deleteEntity.failure(action.id, { entityKeyId, error }));
  }
  finally {
    yield put(deleteEntity.finally(action.id));
  }
}

function* deleteEntityWatcher() :Generator<*, *, *> {
  yield takeEvery(DELETE_ENTITY, deleteEntityWorker);
}

function* replaceEntityWorker(action :SequenceAction) :Generator<*, *, *> {
  const {
    entitySetId,
    entityKeyId,
    entity
  } = action.value;

  try {
    yield put(replaceEntity.request(action.id));
    yield call(DataApi.replaceEntityInEntitySet, entitySetId, entityKeyId, entity);
    yield put(replaceEntity.success(action.id, { entityKeyId }));

    const state = yield select();
    const personId = state.getIn([STATE.SEARCH, SEARCH.SELECTED_PERSON_ID], '');
    if (personId) yield put(loadPersonDetails({ entityKeyId: personId, shouldLoadCases: false }));
  }
  catch (error) {
    yield put(replaceEntity.failure(action.id, { entityKeyId, error }));
  }
  finally {
    yield put(replaceEntity.finally(action.id));
  }
}

function* replaceEntityWatcher() :Generator<*, *, *> {
  yield takeEvery(REPLACE_ENTITY_DATA, replaceEntityWorker);
}

export {
  deleteEntityWatcher,
  replaceEntityWatcher
};
