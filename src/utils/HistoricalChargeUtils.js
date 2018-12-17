/*
 * @flow
 */

import { Map, List, Set } from 'immutable';

import { PLEAS_TO_IGNORE } from './consts/PleaConsts';
import { PROPERTY_TYPES } from './consts/DataModelConsts';
import { formatValue, formatDateList } from './FormattingUtils';
import {
  GUILTY_DISPOSITIONS,
  MISDEMEANOR_CHARGE_LEVEL_CODES,
  ODYSSEY_VIOLENT_STATUTES,
  ODYSSEY_EXCEPTION_DESCRIPTIONS
} from './consts/ChargeConsts';


const {
  CHARGE_ID,
  CHARGE_DESCRIPTION,
  CHARGE_LEVEL,
  CHARGE_STATUTE,
  DISPOSITION,
  DISPOSITION_DATE,
  MOST_SERIOUS_CHARGE_NO,
  PLEA
} = PROPERTY_TYPES;

type ChargeDetails = {
  caseNum :string,
  dispositionDate :string,
  statute :string,
  description :string
};


const stripDegree = (chargeNum :string) :string => chargeNum.split('(')[0].trim();

export const getCaseNumFromCharge = (charge :Map<*, *>) => charge.getIn([CHARGE_ID, 0], '').split('|')[0];

export const getChargeDetails = (charge :Map<*, *>, ignoreCase? :boolean) :ChargeDetails => {
  const caseNum :string = ignoreCase ? null : getCaseNumFromCharge(charge);
  const statute :string = formatValue(charge.get(CHARGE_STATUTE, List()));
  const description :string = formatValue(charge.get(CHARGE_DESCRIPTION, List()));
  const dispositionDate :string = formatDateList(charge.get(DISPOSITION_DATE, List()));
  return {
    caseNum,
    statute,
    description,
    dispositionDate
  };
};

export const shouldIgnoreCharge = (charge :Map<*, *>) => {
  const severities = charge.get(CHARGE_LEVEL, List());
  const pleas = charge.get(PLEA, List());
  const poaCaseNums = charge.get(CHARGE_ID, List()).filter(caseNum => caseNum.includes('POA'));
  const poaPleas = pleas.filter(plea => PLEAS_TO_IGNORE.includes(plea));
  return severities.includes('MO')
    || severities.includes('PO')
    || severities.includes('P')
    || !!poaCaseNums.size
    || !!poaPleas.size;
};

export const chargeStatuteIsViolent = (chargeNum :string) :boolean => (
  ODYSSEY_VIOLENT_STATUTES.includes(stripDegree(chargeNum.toLowerCase()))
);

export const chargeIsViolent = (charge :Map<*, *>) :boolean => {
  if (shouldIgnoreCharge(charge)) return false;
  const { statute, description } = getChargeDetails(charge);
  const strippedStatute = stripDegree(statute.toLowerCase());
  const exception = (ODYSSEY_EXCEPTION_DESCRIPTIONS[strippedStatute])
    && ODYSSEY_EXCEPTION_DESCRIPTIONS[strippedStatute].includes(description);

  return !!(
    charge
    && chargeStatuteIsViolent(statute)
    && !exception
  );
};

export const chargeIsMostSerious = (charge :Map<*, *>, pretrialCase :Map<*, *>) => {
  let mostSerious = false;

  const statuteField = charge.get(CHARGE_STATUTE, List());
  const mostSeriousNumField = pretrialCase.get(MOST_SERIOUS_CHARGE_NO, List());
  statuteField.forEach((chargeNum) => {
    mostSeriousNumField.forEach((mostSeriousNum) => {
      if (mostSeriousNum === chargeNum) mostSerious = true;
    });
  });

  return mostSerious;
};

export const getUnique = (valueList :List<string>) :List<string> => (
  valueList.filter((val, index) => valueList.indexOf(val) === index)
);
export const getViolentChargeNums = (chargeFields :List<string>) :List<string> => (
  getUnique(chargeFields.filter(charge => charge && chargeStatuteIsViolent(charge)))
);
export const chargeFieldIsViolent = (chargeField :List<string>) => getViolentChargeNums(chargeField).size > 0;

export const dispositionIsGuilty = (disposition :string) :boolean => GUILTY_DISPOSITIONS.includes(disposition);

export const dispositionFieldIsGuilty = (dispositionField :List<string>) :boolean => {
  let guilty = false;
  if (dispositionField.size) {
    dispositionField.forEach((disposition) => {
      if (dispositionIsGuilty(disposition)) guilty = true;
    });
  }
  return guilty;
};

export const chargeIsGuilty = (charge :Map<*, *>) => {
  if (shouldIgnoreCharge(charge)) return false;
  return dispositionFieldIsGuilty(charge.get(DISPOSITION, List()));
};

export const degreeFieldIsMisdemeanor = (degreeField :List<string>) :boolean => {

  if (!degreeField || degreeField.isEmpty()) {
    return false;
  }

  return degreeField.filter(val => val).reduce(
    (isMisdemeanor :boolean, degree :string) => (
      MISDEMEANOR_CHARGE_LEVEL_CODES.has(degree.toUpperCase()) || isMisdemeanor
    ),
    false
  );
};

export const chargeIsMisdemeanor = (charge :Map<*, *>) => {
  if (shouldIgnoreCharge(charge)) return false;
  return degreeFieldIsMisdemeanor(charge.get(PROPERTY_TYPES.CHARGE_LEVEL, List()));
};

export const degreeFieldIsFelony = (degreeField :List<string>) :boolean => {
  let result = false;
  degreeField.forEach((degree) => {
    if (degree && degree.toLowerCase().startsWith('f')) result = true;
  });
  return result;
};

export const chargeIsFelony = (charge :Map<*, *>) => {
  if (shouldIgnoreCharge(charge)) return false;
  return degreeFieldIsFelony(charge.get(PROPERTY_TYPES.CHARGE_LEVEL, List()));
};

export const getChargeTitle = (charge :Map<*, *>, hideCase :boolean) :string => {
  const {
    caseNum,
    statute,
    description,
    dispositionDate
  } = getChargeDetails(charge);

  let val = '';
  if (!hideCase && caseNum.length) val = `${caseNum} `;
  val = `${val}${statute}`;
  if (description) {
    val = `${val} ${description}`;
  }
  if (dispositionDate && dispositionDate.length) val = `${val} (${dispositionDate})`;
  return val;
};

export const getSummaryStats = (chargesByCaseNum :Map<*>) => {
  let numMisdemeanorCharges = 0;
  let numMisdemeanorConvictions = 0;
  let numFelonyCharges = 0;
  let numFelonyConvictions = 0;
  let numViolentCharges = 0;
  let numViolentConvictions = 0;

  chargesByCaseNum.valueSeq().forEach((chargeList) => {
    chargeList.forEach((charge) => {
      const degreeField = charge.get(CHARGE_LEVEL, List()).filter(val => !!val);
      const chargeField = charge.get(CHARGE_STATUTE, List()).filter(val => !!val);
      const convicted = dispositionFieldIsGuilty(
        charge.get(DISPOSITION, List()).filter(val => !!val)
      );
      if (degreeFieldIsMisdemeanor(degreeField)) {
        numMisdemeanorCharges += 1;
        if (convicted) numMisdemeanorConvictions += 1;
      }
      else if (degreeFieldIsFelony(degreeField)) {
        numFelonyCharges += 1;
        if (convicted) numFelonyConvictions += 1;
      }

      if (chargeFieldIsViolent(chargeField)) {
        numViolentCharges += 1;
        if (convicted) numViolentConvictions += 1;
      }
    });
  });

  return {
    numMisdemeanorCharges,
    numMisdemeanorConvictions,
    numFelonyCharges,
    numFelonyConvictions,
    numViolentCharges,
    numViolentConvictions
  };
};

export const historicalChargeIsViolent = ({
  charge,
  violentChargeList
}) => {
  const statute = charge.getIn([PROPERTY_TYPES.CHARGE_STATUTE, 0], '');
  const description = charge.getIn([PROPERTY_TYPES.CHARGE_DESCRIPTION, 0], '');

  const isViolent = violentChargeList.get(statute, Set()).includes(description);

  return isViolent;
};
