import { CONTEXT } from './DMFConsts';

export const COLORS = {
  DARK_GREEN: 'DARK_GREEN',
  LIGHT_GREEN: 'LIGHT_GREEN',
  YELLOW: 'YELLOW',
  ORANGE: 'ORANGE',
  RED: 'RED'
};

export const RELEASE_TYPES = {
  RELEASE: 'RELEASE',
  RELEASE_WITH_CONDITIONS: 'RELEASE_WITH_CONDITIONS',
  MAXIMUM_CONDITIONS: 'MAXIMUM_CONDITIONS'
};

export const CONDITION_TYPES = {
  PR: 'PR',
  PR_RELEASE: 'PR_RELEASE',
  EM_OR_BOND: 'EM_OR_BOND',
  EM_AND_BOND: 'EM_AND_BOND',
  CHECKIN_WEEKLY: 'CHECKIN_WEEKLY',
  CHECKIN_WEEKLY_AT_LEAST: 'CHECKIN_WEEKLY_AT_LEAST',
  CHECKIN_MONTHLY: 'CHECKIN_MONTHLY',
  CHECKIN_TWICE_MONTHLY: 'CHECKIN_TWICE_MONTHLY',
  IF_APPLICABLE_247: 'IF_APPLICABLE_247',
  HOLD_PENDING_JUDICIAL_REVIEW: 'HOLD_PENDING_JUDICIAL_REVIEW'
};
// TODO what are the exceptions list supplementary conditions?

export const RESULT_CATEGORIES = {
  COLOR: 'COLOR',
  RELEASE_TYPE: 'RELEASE_TYPE',
  CONDITIONS_LEVEL: 'CONDITIONS_LEVEL',
  CONDITION_1: 'CONDITION_1',
  CONDITION_2: 'CONDITION_2',
  CONDITION_3: 'CONDITION_3'
};

export const getHeaderText = (dmf) => {
  const releaseType = dmf[RESULT_CATEGORIES.RELEASE_TYPE];
  const conditionsLevel = dmf[RESULT_CATEGORIES.CONDITIONS_LEVEL];
  switch (releaseType) {
    case RELEASE_TYPES.RELEASE:
      return 'Release';
    case RELEASE_TYPES.RELEASE_WITH_CONDITIONS:
      return `Release with Conditions (Level ${conditionsLevel})`;
    case RELEASE_TYPES.MAXIMUM_CONDITIONS:
      return 'Maximum conditions for any Release';
    default:
      return '';
  }
};

export const getConditionText = (condition) => {
  switch (condition) {
    case CONDITION_TYPES.PR:
      return 'PR';

    case CONDITION_TYPES.PR_RELEASE:
      return 'PR - Release';

    case CONDITION_TYPES.EM_OR_BOND:
      return 'EM or $ Bond';

    case CONDITION_TYPES.EM_AND_BOND:
      return 'EM and $ Bond';

    case CONDITION_TYPES.CHECKIN_WEEKLY:
      return 'Weekly check-in';

    case CONDITION_TYPES.CHECKIN_WEEKLY_AT_LEAST:
      return 'At least weekly check-in';

    case CONDITION_TYPES.CHECKIN_MONTHLY:
      return '1/month check-in';

    case CONDITION_TYPES.CHECKIN_TWICE_MONTHLY:
      return '2/month check-in';

    case CONDITION_TYPES.IF_APPLICABLE_247:
      return '24/7, if applicable';

    case CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW:
      return 'Hold pending judicial review';

    default:
      return '';
  }
};

export const getConditionsTextList = (dmf) => {
  const condition1 = getConditionText(dmf[RESULT_CATEGORIES.CONDITION_1]);
  const condition2 = getConditionText(dmf[RESULT_CATEGORIES.CONDITION_2]);
  const condition3 = getConditionText(dmf[RESULT_CATEGORIES.CONDITION_3]);

  return [condition1, condition2, condition3].filter(val => val.length);
};

export const increaseDMFSeverity = (dmfResult) => {
  const increasedValues = {};
  let newColor = dmfResult[RESULT_CATEGORIES.COLOR];
  let conditionsLevel;
  switch (newColor) {
    case COLORS.DARK_GREEN:
      newColor = COLORS.LIGHT_GREEN;
      conditionsLevel = 1;
      break;

    case COLORS.LIGHT_GREEN:
      newColor = COLORS.YELLOW;
      conditionsLevel = 2;
      break;

    case COLORS.YELLOW:
      newColor = COLORS.ORANGE;
      conditionsLevel = 3;
      break;

    case COLORS.ORANGE:
      newColor = COLORS.RED;
      break;

    default:
      break;
  }
  if (newColor) {
    increasedValues[RESULT_CATEGORIES.COLOR] = newColor;
  }
  increasedValues[RESULT_CATEGORIES.CONDITIONS_LEVEL] = conditionsLevel;

  let releaseType = dmfResult[RESULT_CATEGORIES.RELEASE_TYPE];
  switch (releaseType) {
    case RELEASE_TYPES.RELEASE:
      releaseType = RELEASE_TYPES.RELEASE_WITH_CONDITIONS;
      break;

    case RELEASE_TYPES.RELEASE_WITH_CONDITIONS:
      releaseType = RELEASE_TYPES.MAXIMUM_CONDITIONS;
      break;

    default:
      break;
  }
  if (releaseType) {
    increasedValues[RESULT_CATEGORIES.RELEASE_TYPE] = releaseType;
  }

  return Object.assign({}, dmfResult, increasedValues);
};

// NCA score -> FTA score -> PSA CONTEXT
export const DMF_RESULTS = {
  1: {
    1: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 0,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    2: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 0,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    }
  },
  2: {
    1: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 0,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    2: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 0,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    3: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 0,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    4: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.DARK_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 0,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    5: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    }
  },
  3: {
    2: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.LIGHT_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 1,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_MONTHLY
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.LIGHT_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 1,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    3: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.LIGHT_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 1,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_MONTHLY
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.LIGHT_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 1,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    4: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.LIGHT_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 1,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_MONTHLY
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.LIGHT_GREEN,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 1,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    5: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    }
  },
  4: {
    2: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_TWICE_MONTHLY,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    3: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_TWICE_MONTHLY,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    4: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_TWICE_MONTHLY,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.YELLOW,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 2,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.PR_RELEASE
      }
    },
    5: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_OR_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    },
    6: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_AND_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY_AT_LEAST,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    }
  },
  5: {
    2: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_OR_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    },
    3: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_OR_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    },
    4: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_OR_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    },
    5: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_OR_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.ORANGE,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.RELEASE_WITH_CONDITIONS,
        [RESULT_CATEGORIES.CONDITIONS_LEVEL]: 3,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    },
    6: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_AND_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY_AT_LEAST,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    }
  },
  6: {
    3: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_AND_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY_AT_LEAST,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    },
    4: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_AND_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY_AT_LEAST,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    },
    5: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_AND_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY_AT_LEAST,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    },
    6: {
      [CONTEXT.COURT]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.EM_AND_BOND,
        [RESULT_CATEGORIES.CONDITION_2]: CONDITION_TYPES.CHECKIN_WEEKLY_AT_LEAST,
        [RESULT_CATEGORIES.CONDITION_3]: CONDITION_TYPES.IF_APPLICABLE_247
      },
      [CONTEXT.BOOKING]: {
        [RESULT_CATEGORIES.COLOR]: COLORS.RED,
        [RESULT_CATEGORIES.RELEASE_TYPE]: RELEASE_TYPES.MAXIMUM_CONDITIONS,
        [RESULT_CATEGORIES.CONDITION_1]: CONDITION_TYPES.HOLD_PENDING_JUDICIAL_REVIEW
      }
    }
  }
};

export const getDMFDecision = (ncaScore, ftaScore, context) => {
  if (!DMF_RESULTS[ncaScore] || !DMF_RESULTS[ncaScore][ftaScore]) return null;
  return DMF_RESULTS[ncaScore][ftaScore][context];
};
