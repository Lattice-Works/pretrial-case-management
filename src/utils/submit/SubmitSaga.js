/*
 * @flow
 */

import { EntityDataModelApi, SyncApi, DataApi, Models } from 'lattice';
import { call, put, takeEvery, all } from 'redux-saga/effects';

import { SUBMIT, submit } from './SubmitActionFactory';

const {
  FullyQualifiedName
} = Models;

function getEntityId(primaryKey, propertyTypesById, values, fields) {
  const fieldNamesByFqn = {};
  Object.keys(fields).forEach((field) => {
    const fqn = fields[field];
    fieldNamesByFqn[fqn] = field;
  });
  const pKeyVals = [];
  primaryKey.forEach((pKey) => {
    const propertyTypeFqn = new FullyQualifiedName(propertyTypesById[pKey].type).getFullyQualifiedName();
    const fieldName = fieldNamesByFqn[propertyTypeFqn];
    const value = values[fieldName];
    const rawValues = [value] || [];
    const encodedValues = [];
    rawValues.forEach((rawValue) => {
      encodedValues.push(btoa(rawValue));
    });
    pKeyVals.push(btoa(encodeURI(encodedValues.join(','))));
  });
  return pKeyVals.join(',');
}

function getEntityDetails(entityDescription, propertyTypesByFqn, values) {
  const { fields } = entityDescription;
  const entityDetails = {};
  Object.keys(fields).forEach((field) => {
    const fqn = fields[field];
    const propertyTypeId = propertyTypesByFqn[fqn].id;
    const value = values[field];
    if (value instanceof Array) entityDetails[propertyTypeId] = value;
    else if (value !== null && value !== undefined && value !== '') entityDetails[propertyTypeId] = [value];
  });
  return entityDetails;
}

function shouldCreateEntity(entityDescription, values, details) {
  if (!Object.keys(details).length) return false;
  if (entityDescription.ignoreIfFalse) {
    let allFalse = true;
    entityDescription.ignoreIfFalse.forEach((field) => {
      if (values[field]) allFalse = false;
    });
    if (allFalse) return false;
  }
  return true;
}

function* submitWorker(action :SequenceAction) :Generator<*, *, *> {
  const { config, values } = action.value;

  try {
    yield put(submit.request(action.id));
    const allEntitySetIdsRequest = config.entitySets.map(entitySet =>
      call(EntityDataModelApi.getEntitySetId, entitySet.name));
    const allEntitySetIds = yield all(allEntitySetIdsRequest);

    const allSyncIdsRequest = allEntitySetIds.map(id =>
      call(SyncApi.getCurrentSyncId, id));
    const allSyncIds = yield all(allSyncIdsRequest);

    const edmDetailsRequest = allEntitySetIds.map(id => ({
      id,
      type: 'EntitySet',
      include: [
        'EntitySet',
        'EntityType',
        'PropertyTypeInEntitySet'
      ]
    }));
    const edmDetails = yield call(EntityDataModelApi.getEntityDataModelProjection, edmDetailsRequest);

    const propertyTypesByFqn = {};
    Object.values(edmDetails.propertyTypes).forEach((propertyType) => {
      const fqn = new FullyQualifiedName(propertyType.type).getFullyQualifiedName();
      propertyTypesByFqn[fqn] = propertyType;
    });

    const mappedEntities = {};
    config.entitySets.forEach((entityDescription, index) => {
      const entitySetId = allEntitySetIds[index];
      const primaryKey = edmDetails.entityTypes[edmDetails.entitySets[entitySetId].entityTypeId].key;
      const entityList = (entityDescription.multipleValuesField)
        ? values[entityDescription.multipleValuesField] : [values];
      if (entityList) {
        const entitiesForAlias = [];
        entityList.forEach((entityValues) => {
          const details = getEntityDetails(entityDescription, propertyTypesByFqn, entityValues);
          if (shouldCreateEntity(entityDescription, entityValues, details)) {
            let entityId;
            if (entityDescription.entityId) {
              let entityIdVal = entityValues[entityDescription.entityId];
              if (entityIdVal instanceof Array && entityIdVal.length) {
                [entityIdVal] = entityIdVal;
              }
              entityId = entityIdVal;
            }
            else {
              entityId = getEntityId(primaryKey, edmDetails.propertyTypes, entityValues, entityDescription.fields);
            }
            if (entityId && entityId.length) {
              const key = {
                entitySetId,
                syncId: allSyncIds[index],
                entityId
              };
              const entity = { key, details };
              entitiesForAlias.push(entity);
            }
          }
        });
        mappedEntities[entityDescription.alias] = entitiesForAlias;
      }
    });

    const associationAliases = {};
    config.associations.forEach((associationDescription) => {
      const { src, dst, association } = associationDescription;
      const completeAssociation = associationAliases[association] || {
        src: [],
        dst: []
      };
      if (!completeAssociation.src.includes(src)) completeAssociation.src.push(src);
      if (!completeAssociation.dst.includes(dst)) completeAssociation.dst.push(dst);
      associationAliases[association] = completeAssociation;
    });

    const entities = [];
    const associations = [];

    Object.keys(mappedEntities).forEach((alias) => {
      if (associationAliases[alias]) {
        mappedEntities[alias].forEach((associationEntityDescription) => {
          const associationDescription = associationAliases[alias];
          associationDescription.src.forEach((srcAlias) => {
            mappedEntities[srcAlias].forEach((srcEntity) => {
              associationDescription.dst.forEach((dstAlias) => {
                mappedEntities[dstAlias].forEach((dstEntity) => {
                  const src = srcEntity.key;
                  const dst = dstEntity.key;

                  if (src && dst) {
                    const association = Object.assign({}, associationEntityDescription, { src, dst });
                    associations.push(association);
                  }
                });
              });
            });
          });
        });
      }
      else {
        mappedEntities[alias].forEach((entity) => {
          entities.push(entity);
        });
      }
    });

    const ticketsRequest = allEntitySetIds.map((entitySetId, index) =>
      call(DataApi.acquireSyncTicket, entitySetId, allSyncIds[index]));
    const syncTickets = yield all(ticketsRequest);

    yield call(DataApi.createEntityAndAssociationData, { syncTickets, entities, associations });
    yield put(submit.success(action.id));
  }
  catch (error) {
    console.error(error)
    yield put(submit.failure(action.id, error));
  }
  finally {
    yield put(submit.finally(action.id));
  }
}

function* submitWatcher() :Generator<*, *, *> {
  yield takeEvery(SUBMIT, submitWorker);
}

export {
  submitWatcher
};
