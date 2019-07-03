/*
 * @flow
 */

import { newRequestSequence } from 'redux-reqseq';
import type { RequestSequence } from 'redux-reqseq';

const CLEAR_HEARING_SETTINGS :string = 'CLEAR_HEARING_SETTINGS';
const clearHearingSettings :RequestSequence = newRequestSequence(CLEAR_HEARING_SETTINGS);

const CLEAR_SUBMITTED_HEARING :string = 'CLEAR_SUBMITTED_HEARING';
const clearSubmittedHearing :RequestSequence = newRequestSequence(CLEAR_SUBMITTED_HEARING);

const CLOSE_HEARING_SETTINGS_MODAL :string = 'CLOSE_HEARING_SETTINGS_MODAL';
const closeHearingSettingsModal :RequestSequence = newRequestSequence(CLOSE_HEARING_SETTINGS_MODAL);

const LOAD_HEARING_NEIGHBORS :string = 'LOAD_HEARING_NEIGHBORS';
const loadHearingNeighbors :RequestSequence = newRequestSequence(LOAD_HEARING_NEIGHBORS);

const REFRESH_HEARING_AND_NEIGHBORS :string = 'REFRESH_HEARING_AND_NEIGHBORS';
const refreshHearingAndNeighbors :RequestSequence = newRequestSequence(REFRESH_HEARING_AND_NEIGHBORS);

const OPEN_HEARING_SETTINGS_MODAL :string = 'OPEN_HEARING_SETTINGS_MODAL';
const openHearingSettingsModal :RequestSequence = newRequestSequence(OPEN_HEARING_SETTINGS_MODAL);

const SET_HEARING_SETTINGS :string = 'SET_HEARING_SETTINGS';
const setHearingSettings :RequestSequence = newRequestSequence(SET_HEARING_SETTINGS);

const SUBMIT_EXISTING_HEARING :string = 'SUBMIT_EXISTING_HEARING';
const submitExistingHearing :RequestSequence = newRequestSequence(SUBMIT_EXISTING_HEARING);

const SUBMIT_HEARING :string = 'SUBMIT_HEARING';
const submitHearing :RequestSequence = newRequestSequence(SUBMIT_HEARING);

export {
  CLEAR_HEARING_SETTINGS,
  CLEAR_SUBMITTED_HEARING,
  CLOSE_HEARING_SETTINGS_MODAL,
  LOAD_HEARING_NEIGHBORS,
  REFRESH_HEARING_AND_NEIGHBORS,
  OPEN_HEARING_SETTINGS_MODAL,
  SET_HEARING_SETTINGS,
  SUBMIT_EXISTING_HEARING,
  SUBMIT_HEARING,
  clearHearingSettings,
  clearSubmittedHearing,
  closeHearingSettingsModal,
  loadHearingNeighbors,
  refreshHearingAndNeighbors,
  openHearingSettingsModal,
  setHearingSettings,
  submitExistingHearing,
  submitHearing
};
