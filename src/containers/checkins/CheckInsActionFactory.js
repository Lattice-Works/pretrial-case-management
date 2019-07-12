/*
 * @flow
 */

import { newRequestSequence } from 'redux-reqseq';
import type { RequestSequence } from 'redux-reqseq';

const CREATE_CHECK_IN_APPOINTMENTS :string = 'CREATE_CHECK_IN_APPOINTMENTS';
const createCheckinAppointments :RequestSequence = newRequestSequence(CREATE_CHECK_IN_APPOINTMENTS);

const LOAD_CHECKIN_APPOINTMENTS_FOR_DATE :string = 'LOAD_CHECKIN_APPOINTMENTS_FOR_DATE';
const loadCheckInAppointmentsForDate :RequestSequence = newRequestSequence(LOAD_CHECKIN_APPOINTMENTS_FOR_DATE);

const LOAD_CHECK_IN_NEIGHBORS :string = 'LOAD_CHECK_IN_NEIGHBORS';
const loadCheckInNeighbors :RequestSequence = newRequestSequence(LOAD_CHECK_IN_NEIGHBORS);

export {
  CREATE_CHECK_IN_APPOINTMENTS,
  LOAD_CHECKIN_APPOINTMENTS_FOR_DATE,
  LOAD_CHECK_IN_NEIGHBORS,
  createCheckinAppointments,
  loadCheckInAppointmentsForDate,
  loadCheckInNeighbors
};
