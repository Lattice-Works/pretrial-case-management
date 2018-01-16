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

const PSA :string = '/psa';
export const PSA_FORM :string = FORMS + PSA;

/* Create Report */
const CREATE :string = '/create';
export const CREATE_FORMS = DASHBOARD + CREATE;

/* Review Reports */
const REVIEW :string = '/review';
export const REVIEW_FORMS = DASHBOARD + REVIEW;

/* people */
export const PERSON = `${DASHBOARD}/person`;
export const PEOPLE = `${DASHBOARD}/people`;
export const CURRENT_PEOPLE = `${PEOPLE}/current`;
export const INCOMING_PEOPLE = `${PEOPLE}/incoming`;
export const PAST_PEOPLE = `${PEOPLE}/past`;

/* Person Details */
export const ABOUT_PERSON = `${PERSON_DETAILS}/about`;
export const ABOUT = 'about';
