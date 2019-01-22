/*
 * @flow
 */

import moment from 'moment';
import { FORM_LENGTHS } from './consts/Consts';

type Location = {
  hash :string
};

const getSplitStr = (location :Location) :string[] => {
  const splitStr = location ? location.hash.split('/') : [];
  if (splitStr[0] && splitStr[0] === '#') splitStr[0] = '';
  return splitStr;
};

const getPage = (splitStr :string[]) :number => {
  const page = splitStr[splitStr.length - 1];
  return parseInt(page, 10);
};

export const getCurrentPage = (location :Location) :number => getPage(getSplitStr(location));

export const getNextPath = (location :Location, numPages :number, skipLoad :?boolean) :?string => {
  const splitStr = getSplitStr(location);
  const page = getPage(splitStr);
  const nextPage = (page === 1 && skipLoad) ? (page + 2) : (page + 1);
  splitStr[splitStr.length - 1] = `${nextPage}`;
  return nextPage <= numPages ? splitStr.join('/') : null;
};

export const getPrevPath = (location :Location) :?string => {
  const splitStr = getSplitStr(location);
  const page = getPage(splitStr);
  const prevPage = page - 1;
  splitStr[splitStr.length - 1] = `${prevPage}`;
  return prevPage >= 1 ? splitStr.join('/') : null;
};

export const getIsLastPage = (location :Location, optionalNumPages :?number) :boolean => {
  const splitStr = getSplitStr(location);
  const formName = splitStr[splitStr.length - 2];
  const numPages = optionalNumPages || FORM_LENGTHS[formName];
  return getPage(splitStr) === numPages;
};

export const formatDOB = (dob :string) :string => {
  const dobMoment = moment(dob);
  if (dob === undefined) return 'N/A';
  if (!dobMoment.isValid()) return dob;
  return dobMoment.format('MM/DD/YYYY');
};

export const isNotNumber = (number :string | number) :boolean => {
  if (number === null || number === undefined) return true;
  let formattedStr = `${number}`;
  const suffix = formattedStr.match(/\.0*$/);
  if (suffix) {
    formattedStr = formattedStr.slice(0, suffix.index);
  }
  const floatVal = parseFloat(formattedStr);
  return Number.isNaN(floatVal) || floatVal.toString() !== formattedStr;
};

export const isNotInteger = (number :string | number) :boolean => {
  if (number === null || number === undefined) return true;
  const numberStr = `${number}`;
  const intVal = parseInt(numberStr, 10);
  return Number.isNaN(intVal) || intVal.toString() !== numberStr;
};
