// Redux Reducer

export const STATE = {
  APP: 'app',
  AUTH: 'auth',
  CHARGES: 'charges',
  CHECK_INS: 'checkIns',
  CONTACT_INFO: 'contactInformation',
  COURT: 'court',
  DASHBOARD: 'dashboard',
  DOWNLOAD: 'download',
  EDM: 'edm',
  ENROLL: 'enroll',
  HEARINGS: 'hearings',
  MANUAL_REMINDERS: 'manualReminders',
  PSA_MODAL: 'psaModal',
  PSA: 'psa',
  PERSON: 'person',
  PEOPLE: 'people',
  RELEASE_CONDITIONS: 'releaseConditions',
  REMINDERS: 'reminders',
  REVIEW: 'review',
  ROUTER: 'router',
  SEARCH: 'search',
  SUBMIT: 'submit',
  SUBSCRIPTIONS: 'subscriptions'
};

// General PSA

export const PSA_NEIGHBOR = {
  ID: 'neighborId',
  DETAILS: 'neighborDetails',
  ENTITY_SET: 'neighborEntitySet'
};

export const PSA_ASSOCIATION = {
  DETAILS: 'associationDetails',
  ENTITY_SET: 'associationEntitySet'
};

// CHARGES
export const CHARGES = {
  ARREST: 'arrestCharges',
  ARREST_PERMISSIONS: 'arrestChargePermissions',
  ARRESTING_AGENCIES: 'arrestingAgencies',
  LOADING_AGENCIES: 'loadingAgencies',
  COURT: 'courtCharges',
  COURT_PERMISSIONS: 'courtChargePermissions',
  ARREST_VIOLENT: 'violentArrestCharges',
  COURT_VIOLENT: 'violentCourtCharges',
  DMF_STEP_2: 'dmfStep2Charges',
  DMF_STEP_4: 'dmfStep4Charges',
  BRE: 'bookingReleaseExceptionCharges',
  BHE: 'bookingHoldExceptionCharges',
  LOADING: 'loadingCharges',
  SUBMITTING_CHARGE: 'submittingCharge',
  UPDATING_CHARGE: 'updatingCharge'
};

// Check-Ins
export const CHECK_IN = {
  CHECK_INS_LOADED: 'checkInsLoaded',
  LOADING_CHECK_INS: 'loadingCheckIns',
  CHECK_IN_IDS: 'checkInIds',
  CHECK_INS_BY_ID: 'checkInsById',
  LOADING_CHECK_IN_NEIGHBORS: 'loadingCheckInNieghbors',
  CHECK_IN_NEIGHBORS_BY_ID: 'checkInNeighborsById',
  SUBMITTING_CHECKINS: 'submittingCheckins',
};

// Court

export const COURT = {
  COURT_DATE: 'courtDate',
  PEOPLE_WITH_OPEN_PSAS: 'peopleWithOpenPsas',
  PEOPLE_WITH_MULTIPLE_OPEN_PSAS: 'peopleWithMultipleOpenPsas',
  PEOPLE_RECEIVING_REMINDERS: 'peopleReceivingReminders',
  LOADING_PSAS: 'isLoadingPSAs',
  COUNTY: 'county',
  COURTROOM: 'courtroom',
  OPEN_PSAS: 'openPSAs',
  SCORES_AS_MAP: 'scoresAsMap',
  PSA_EDIT_DATES: 'psaEditDatesById',
  OPEN_PSA_IDS: 'openPSAIds',
  PEOPLE_IDS_TO_OPEN_PSA_IDS: 'peopleIdsToOpenPSAIds',

  // JUDGES
  ALL_JUDGES: 'allJudges',
  LOADING_JUDGES: 'isLoadingJudges',
  LOADING_JUDGES_ERROR: 'loadingJudgesError'
};

// Dashboard

export const DASHBOARD = {
  DATA: 'dashboardData',
  LOADING: 'isLoading',
  ERROR: 'error'
};

// Download

export const DOWNLOAD = {
  NO_RESULTS: 'noHearingResults',
  DOWNLOADING_REPORTS: 'downloadingReports',
  COURTROOM_OPTIONS: 'courtroomOptions',
  COURTROOM_TIMES: 'courtroomTimes',
  ALL_HEARING_DATA: 'allHearingData',
  ERROR: 'downloadError',
  HEARING_IDS: 'hearingIds'
};

// EDM

export const EDM = {
  FQN_TO_ID: 'fqnToIdMap',
  IS_FETCHING_PROPERTY_TYPES: 'isFetchingAllPropertyTypes',
  PROPERTY_TYPES_BY_ID: 'propertyTypesById'
};

// Enroll

export const ENROLL = {
  LOADING_PROFILE: 'loadingProfile',
  ENTITY_KEY_ID: 'profileEntityKeyId',
  PIN: 'pin',
  SUBMITTING_AUDIO: 'submittingAudio',
  NUM_SUBMISSIONS: 'numSubmissions',
  ERROR: 'errorMessage'
};


// Manual Reminders

export const MANUAL_REMINDERS = {
  FAILED_REMINDER_IDS: 'failedManualReminderIds',
  LOADED: 'manualRemindersLoaded',
  LOADING_FORM: 'loadingManualReminderForm',
  LOADING_MANUAL_REMINDERS: 'loadingManualReminders',
  LOADING_REMINDER_NEIGHBORS: 'loadingManualReminderNeighbors',
  MANUAL_REMINDER_NEIGHBORS: 'manualReminderNeighborsById',
  PEOPLE_NEIGHBORS: 'peopleNeighborsForManualReminder',
  PEOPLE_RECEIVING_REMINDERS: 'peopleReceivingManualReminders',
  REMINDER_IDS: 'manualReminderIds',
  REMINDERS_BY_ID: 'manualRemindersById',
  SUCCESSFUL_REMINDER_IDS: 'successfulManualReminderIds',
  SUBMITTED_MANUAL_REMINDER: 'submittedManualReminder',
  SUBMITTED_MANUAL_REMINDER_NEIGHBORS: 'submittedManualReminderNeighbors',
  SUBMITTING_MANUAL_REMINDER: 'submittingManualReminder',
  SUBMISSION_ERROR: 'manualReminderSubmissionError',
  UPDATING_HEARING: 'updatingHearing'
};

// PSA Modal

export const PSA_MODAL = {
  LOADING_PSA_MODAL: 'loadingPSAModal',

  // PSA
  PSA_ID: 'psaId',
  SCORES: 'scores',
  PSA_NEIGHBORS: 'psaNeighbors',
  PSA_PERMISSIONS: 'psaPermissions',

  // HEARINGS
  HEARINGS: 'hearings',
  HEARING_IDS: 'hearingIds',
  LOADING_HEARING_NEIGHBORS: 'loadingHearingNeighbors',
  HEARINGS_NEIGHBORS_BY_ID: 'hearingNeighborsById',

  // Person
  PERSON_ID: 'personId',
  PERSON_NEIGHBORS: 'personNeighbors',
  LOADING_CASES: 'loadingCaseHistory',
  CASE_HISTORY: 'caseHistory',
  MANUAL_CASE_HISTORY: 'manualCaseHistory',
  CHARGE_HISTORY: 'chargeHistory',
  MANUAL_CHARGE_HISTORY: 'manualChargeHistory',
  SENTENCE_HISTORY: 'sentenceHistory',
  FTA_HISTORY: 'ftaHistory',
  PERSON_HEARINGS: 'personHearings',
  ERROR: 'errorMessage'
};

// PSA

export const PSA_FORM = {
  ADDING_CASE_TO_PSA: 'addingCaseToPSA',
  ARREST_ID: 'arrestId',
  ARREST_OPTIONS: 'arrestOptions',
  ALL_CASES: 'allCasesForPerson',
  ALL_CHARGES: 'allChargesForPerson',
  ALL_SENTENCES: 'allSentencesForPerson',
  ALL_ARREST_CHARGES: 'allArrestCharges',
  ALL_FTAS: 'allFTAs',
  ALL_PSAS: 'allPSAs',
  ALL_MANUAL_CASES: 'allManualCases',
  ALL_MANUAL_CHARGES: 'allManualCharges',
  ALL_HEARINGS: 'allHearings',
  ALL_CONTACTS: 'allContacts',
  CHARGES: 'charges',
  EDITING_PSA: 'editingPSA',
  ENTITY_SET_LOOKUP: 'entitySetLookup',
  LOADING_NEIGHBORS: 'isLoadingNeighbors',
  OPEN_PSAS: 'openPSAs',
  PSA: 'psa',
  PSA_SUBMISSION_COMPLETE: 'psaSubmissionComplete',
  REMOVING_CASE_FROM_PSA: 'removingCaseFromPSA',
  SELECT_PRETRIAL_CASE: 'selectedPretrialCase',
  SELECT_PERSON: 'selectedPerson',
  SUBMIT_ERROR: 'submitError',
  SUBMITTED_PSA: 'submittedPSA',
  SUBMITTED_PSA_NEIGHBORS: 'submittedPSANeighbors',
  SUBMITTING_PSA: 'submittingPSA',
  SUBSCRIPTION: 'subscription'
};

// People

export const PEOPLE = {
  SCORES_ENTITY_SET_ID: 'scoresEntitySetId',
  RESULTS: 'peopleResults',
  PERSON_DATA: 'selectedPersonData',
  VOICE_ENROLLMENT_PROGRESS: 'voiceEnrollmentProgress',
  PERSON_ENTITY_KEY_ID: 'selectedPersonEntityKeyId',
  FETCHING_PEOPLE: 'isFetchingPeople',
  FETCHING_PERSON_DATA: 'isFetchingPersonData',
  NEIGHBORS: 'neighbors',
  REFRESHING_PERSON_NEIGHBORS: 'refreshingPersonNeighbors',
  MOST_RECENT_PSA: 'mostRecentPSA',
  MOST_RECENT_PSA_NEIGHBORS: 'mostRecentPSANeighbors',
  REQUIRES_ACTION_PEOPLE: 'requiresActionPeople',
  REQUIRES_ACTION_SCORES: 'requiresActionPSAScores',
  NO_PENDING_CHARGES_PSA_SCORES: 'psaScoresWithNoPendingCharges',
  NO_HEARINGS_PSA_SCORES: 'psaScoresWithNoHearings',
  RECENT_FTA_PSA_SCORES: 'psaScoresWithRecentFTAs',
  REQUIRES_ACTION_NEIGHBORS: 'requiresActionPeopleNeighbors',
  PSA_NEIGHBORS_BY_ID: 'psaNeighborsById',
  MULTIPLE_PSA_PEOPLE: 'peopleWithMultiplePSAs',
  RECENT_FTA_PEOPLE: 'peopleWithRecentFTAs',
  NO_PENDING_CHARGES_PEOPLE: 'peopleWithNoPendingCharges',
  NO_HEARINGS_PEOPLE: 'peopleWithPSAsWithNoHearings',
  REQUIRES_ACTION_LOADING: 'loadingRequiresActionPeople',
  ERROR: 'errorMessage'
};

// Review

export const REVIEW = {
  ENTITY_SET_ID: 'scoresEntitySetId',
  SCORES: 'scoresAsMap',
  NEIGHBORS_BY_ID: 'psaNeighborsById',
  NEIGHBORS_BY_DATE: 'psaNeighborsByDate',
  LOADING_DATA: 'loadingPSAData',
  LOADING_RESULTS: 'loadingResults',
  ERROR: 'errorMessage',
  ALL_FILERS: 'allFilers',
  CASE_HISTORY: 'caseHistory',
  MANUAL_CASE_HISTORY: 'manualCaseHistory',
  CHARGE_HISTORY: 'chargeHistory',
  MANUAL_CHARGE_HISTORY: 'manualChargeHistory',
  SENTENCE_HISTORY: 'sentenceHistory',
  FTA_HISTORY: 'ftaHistory',
  HEARINGS: 'hearings',
  READ_ONLY: 'readOnly',
  PSA_IDS_REFRESHING: 'psaIdsRefreshing'
};

// Search

export const SEARCH = {
  LOADING: 'isLoadingPeople',
  SEARCH_RESULTS: 'searchResults',
  CONTACTS: 'contactResults',
  RESULTS_TO_CONTACTS: 'peopleIdsToContactIds',
  SEARCH_ERROR: 'searchError',
  SELECTED_PERSON_ID: 'selectedPersonId',
  PERSON_DETAILS: 'personDetails',
  LOADING_PERSON_DETAILS: 'loadingPersonDetails',
  PERSON_DETAILS_LOADED: 'personDetailsLoaded',
  LOADING_CASES: 'loadingCases',
  NUM_CASES_TO_LOAD: 'numCasesToLoad',
  NUM_CASES_LOADED: 'numCasesLoaded',
  SEARCH_HAS_RUN: 'searchHasRun',
  CREATING_PERSON: 'isCreatingPerson',
  CREATE_PERSON_ERROR: 'createPersonError',
  CASE_LOADS_COMPLETE: 'caseLoadsComplete'
};

// Submit

export const SUBMIT = {
  CREATING_ASSOCIATIONS: 'creatingAssociations',
  CREATE_ASSOCIATIONS_COMPLETE: 'createAssociationComplete',
  REPLACING_ENTITY: 'replacingEntity',
  REPLACE_ENTITY_SUCCESS: 'replaceEntitySuccess',
  UPDATING_ENTITY: 'updatingEntity',
  UPDATE_ENTITY_SUCCESS: 'updateEntitySuccess',
  REPLACING_ASSOCIATION: 'replacingAssociation',
  REPLACE_ASSOCIATION_SUCCESS: 'replaceAssociationSuccess',
  SUBMITTING: 'submitting',
  SUCCESS: 'submitSuccess',
  SUBMITTED: 'submitted',
  ERROR: 'errorMessage'
};

// Subscriptions

export const SUBSCRIPTIONS = {
  LOADING_SUBSCRIPTION_MODAL: 'loadingSubscriptionInfo',
  CONTACT_INFO: 'contactInfo',
  PERSON_NEIGHBORS: 'personNeighbors',
  SUBSCRIPTION: 'subscription'
};
