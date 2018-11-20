import { ENTITY_SETS, PROPERTY_TYPES } from './DataModelConsts';

export const SUMMARY_REPORT = {
  [ENTITY_SETS.PEOPLE]: {
    [PROPERTY_TYPES.LAST_NAME]: 'Last Name',
    [PROPERTY_TYPES.FIRST_NAME]: 'First Name',
    [PROPERTY_TYPES.DOB]: 'Date of Birth'
  },
  [ENTITY_SETS.STAFF]: {
    [PROPERTY_TYPES.PERSON_ID]: 'Completed By'
  },
  [ENTITY_SETS.ASSESSED_BY]: {
    [PROPERTY_TYPES.COMPLETED_DATE_TIME]: 'Creation Date'
  },
  [ENTITY_SETS.PSA_SCORES]: {
    [PROPERTY_TYPES.NVCA_FLAG]: 'NVCA',
    [PROPERTY_TYPES.NCA_SCALE]: 'NCA',
    [PROPERTY_TYPES.FTA_SCALE]: 'FTA'
  },
  [ENTITY_SETS.DMF_RESULTS]: {
    S2: 'S2',
    S4: 'S4',
    [PROPERTY_TYPES.COLOR]: 'DMF Color',
    [PROPERTY_TYPES.CONDITION_1]: 'Condition 1',
    [PROPERTY_TYPES.CONDITION_2]: 'Condition 2',
    [PROPERTY_TYPES.CONDITION_3]: 'Condition 3'
  }
};

export const PSA_RESPONSE_TABLE = {
  [ENTITY_SETS.PEOPLE]: {
    [PROPERTY_TYPES.LAST_NAME]: 'Last Name',
    [PROPERTY_TYPES.FIRST_NAME]: 'First Name',
    [PROPERTY_TYPES.DOB]: 'Date of Birth'
  },
  [ENTITY_SETS.PSA_RISK_FACTORS]: {
    [PROPERTY_TYPES.AGE_AT_CURRENT_ARREST]: 'Q1',
    [PROPERTY_TYPES.CURRENT_VIOLENT_OFFENSE]: 'Q2',
    [PROPERTY_TYPES.PENDING_CHARGE]: 'Q3',
    [PROPERTY_TYPES.PRIOR_MISDEMEANOR]: 'Q4',
    [PROPERTY_TYPES.PRIOR_FELONY]: 'Q5',
    [PROPERTY_TYPES.PRIOR_VIOLENT_CONVICTION]: 'Q6',
    [PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_RECENT]: 'Q7',
    [PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_OLD]: 'Q8',
    [PROPERTY_TYPES.PRIOR_SENTENCE_TO_INCARCERATION]: 'Q9'
  },
  [ENTITY_SETS.RELEASE_RECOMMENDATIONS]: {
    [PROPERTY_TYPES.RELEASE_RECOMMENDATION]: 'Additional Notes'
  }
};

export const DOMAIN = {
  MINNEHAHA: '@minnehahacounty.org',
  PENNINGTON: '@pennco.org'
};

export const REPORT_TYPES = {
  BY_PSA: 'psas',
  BY_HEARING: 'hearings'
};
