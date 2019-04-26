import { Map, List } from 'immutable';
import moment from 'moment';

import { PSA_STATUSES } from './consts/Consts';
import { APP_TYPES, PROPERTY_TYPES } from './consts/DataModelConsts';
import { PSA_NEIGHBOR } from './consts/FrontEndStateConsts';
import { getChargeFields } from './ArrestChargeUtils';
import { getFirstNeighborValue } from './DataUtils';
import { getPSAFields } from './PSAUtils';

const { CHARGES, PRETRIAL_CASES } = APP_TYPES;

export const getMapByCaseId = (list, fqn) => {
  let objMap = Map();
  list.forEach((obj) => {
    const objIdArr = obj.getIn([fqn, 0], '').split('|');
    if (objIdArr.length > 1) {
      const caseId = objIdArr[0];
      objMap = objMap.set(caseId, objMap.get(caseId, List()).push(obj));
    }
  });
  return objMap;
};

export const getChargeHistory = (neighbors) => {
  let chargeHistory = Map();
  neighbors.get(CHARGES, List())
    .forEach((chargeNeighbor) => {
      const { chargeId } = getChargeFields(chargeNeighbor);
      const chargeIdArr = chargeId.split('|');
      if (chargeIdArr.length) {
        const caseId = chargeIdArr[0];
        chargeHistory = chargeHistory.set(
          caseId,
          chargeHistory.get(caseId, List()).push(chargeNeighbor.get(
            PSA_NEIGHBOR.DETAILS,
            chargeNeighbor
          ))
        );
      }
    });
  return chargeHistory;
};

export const getCaseHistory = (neighbors) => {
  const caseHistory = neighbors.get(PRETRIAL_CASES, List())
    .map(neighborObj => neighborObj.get(
      PSA_NEIGHBOR.DETAILS,
      neighborObj
    ));
  return caseHistory;
};


export const getPendingCharges = (caseNum, chargeHistory, arrestDate, psaClosureDate) => {
  let pendingCharges = Map();
  if (chargeHistory.get(caseNum)) {
    pendingCharges = chargeHistory.get(caseNum)
      .filter((charge) => {
        let { dispositionDate } = getChargeFields(charge);
        dispositionDate = moment(dispositionDate);
        return dispositionDate.isBetween(arrestDate, psaClosureDate, null, []);
      });
  }
  return pendingCharges;
};

const getNonPendingCharges = (caseNum, chargeHistory, arrestDate, psaClosureDate) => {
  let nonPendingCharges = Map();
  if (chargeHistory.get(caseNum)) {
    nonPendingCharges = chargeHistory.get(caseNum)
      .filter((charge) => {
        let { dispositionDate } = getChargeFields(charge);
        dispositionDate = moment(dispositionDate);
        return !dispositionDate.isBetween(arrestDate, psaClosureDate, null, []);
      });
  }
  return nonPendingCharges;
};

export const currentPendingCharges = (charges) => {
  let pendingCharges = List();
  charges.forEach(caseObj => caseObj.forEach((charge) => {
    const { dispositionDate } = getChargeFields(charge);
    const chargeHasDisposition = !!dispositionDate;
    if (!chargeHasDisposition) pendingCharges = pendingCharges.push(charge);
  }));
  return pendingCharges;
};

export const getCasesForPSA = (
  caseHistory,
  chargeHistory,
  scores,
  arrestDate,
  lastEditDateForPSA
) => {
  let caseHistoryForMostRecentPSA = List();
  let chargeHistoryForMostRecentPSA = Map();
  let caseHistoryNotForMostRecentPSA = List();
  let chargeHistoryNotForMostRecentPSA = Map();
  const { status } = getPSAFields(scores);
  const psaIsClosed = status !== PSA_STATUSES.OPEN;

  const psaArrestDateTime = moment(arrestDate || undefined);
  const psaClosureDate = psaIsClosed ? moment(lastEditDateForPSA) : moment().add(1, 'day');


  if (psaArrestDateTime.isValid()) {
    caseHistory.forEach((caseObj) => {
      const caseNum = getFirstNeighborValue(caseObj, PROPERTY_TYPES.CASE_ID);
      const pendingCharges = getPendingCharges(caseNum, chargeHistory, psaArrestDateTime, psaClosureDate);
      const nonPendingCharges = getNonPendingCharges(caseNum, chargeHistory, psaArrestDateTime, psaClosureDate);
      const isPending = !!pendingCharges.size;

      if (isPending) {
        caseHistoryForMostRecentPSA = caseHistoryForMostRecentPSA.push(caseObj);
        chargeHistoryForMostRecentPSA = chargeHistoryForMostRecentPSA.set(caseNum, pendingCharges);
        if (nonPendingCharges.size) caseHistoryNotForMostRecentPSA = caseHistoryNotForMostRecentPSA.push(caseObj);
      }
      else {
        caseHistoryNotForMostRecentPSA = caseHistoryNotForMostRecentPSA.push(caseObj);
        chargeHistoryNotForMostRecentPSA = chargeHistoryNotForMostRecentPSA.set(caseNum, nonPendingCharges);
      }
    });
  }

  return {
    caseHistoryForMostRecentPSA,
    chargeHistoryForMostRecentPSA,
    caseHistoryNotForMostRecentPSA,
    chargeHistoryNotForMostRecentPSA
  };
};
