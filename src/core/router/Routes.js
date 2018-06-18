/*
 * @flow
 */

export const ROOT :string = '/';
export const DASHBOARD :string = '/dashboard';
export const LOGIN :string = '/login';
export const NEW_PERSON :string = `${DASHBOARD}/new-person`;
export const PERSON_DETAILS_ROOT :string = `${DASHBOARD}/person-details`;
export const PERSON_DETAILS :string = `${PERSON_DETAILS_ROOT}/:personId`;

/* Reports */
export const FORMS :string = '/forms';

export const TERMS :string = '/terms';

const PSA :string = '/psa';
export const PSA_FORM :string = FORMS + PSA;

/* Create Report */
const CREATE :string = '/create';
export const CREATE_FORMS = DASHBOARD + CREATE;

/* Review Report */
const REVIEW :string = '/review';
export const REVIEW_FORMS = DASHBOARD + REVIEW;

/* Judge View */
const JUDGE :string = '/judges';
export const JUDGE_VIEW = DASHBOARD + JUDGE;

/* Download Reports */
const DOWNLOAD :string = '/download';
export const DOWNLOAD_FORMS = DASHBOARD + DOWNLOAD;

/* Visualize Stats */
const VISUALIZE :string = '/visualize';
export const VISUALIZE_DASHBOARD = DASHBOARD + VISUALIZE;

/* Enroll voice profile */
const VOICE :string = '/voice';
export const VOICE_ENROLLMENT = DASHBOARD + VOICE;

/* people */
export const PERSON = `${DASHBOARD}/person`;
export const PEOPLE = `${DASHBOARD}/people`;
export const CURRENT_PEOPLE = `${PEOPLE}/current`;
export const INCOMING_PEOPLE = `${PEOPLE}/incoming`;
export const PAST_PEOPLE = `${PEOPLE}/past`;

/* query params */
export const FIRST_NAME = 'fname';
export const LAST_NAME = 'lname';
export const DOB = 'dob';

/* Person Details */
export const ABOUT = 'about';
export const ABOUT_PERSON = `${PERSON_DETAILS}/${ABOUT}`;
