/*
 * @flow
 */

import React from 'react';

export const CURRENT_AGE_PROMPT =
  '1. What was the defendant’s age at the time of the arrest or administering the PSA – Court?';
export const CURRENT_VIOLENT_OFFENSE_PROMPT = '2. Is any current charge considered violent?';
export const PENDING_CHARGE_PROMPT =
  '3. Did the defendant have at least one other pending charge at the time of the alleged offense?';
export const PRIOR_MISDEMEANOR_PROMPT = '4. Does the defendant have any prior misdemeanor convictions?';
export const PRIOR_FELONY_PROMPT = '5. Does the defendant have any prior felony convictions?';
export const PRIOR_VIOLENT_CONVICTION_PROMPT = '6. How many prior violent convictions does the defendant have?';
export const PRIOR_FAILURE_TO_APPEAR_RECENT_PROMPT =
  '7. How many prior pretrial failures to appear does the defendant have in the past 2 years?';
export const PRIOR_FAILURE_TO_APPEAR_OLD_PROMPT =
  '8. Does the defendant have any prior pretrial failures to appear that are older than 2 years?';
export const PRIOR_SENTENCE_TO_INCARCERATION_PROMPT = '9. Does the defendant have any prior sentence to incarceration?';

export const EXTRADITED_PROMPT = '10. Was the defendant extradited for any current charge?';
export const COURT_OR_BOOKING_PROMPT = '13. Is the PSA being administered at the time of booking or court date?';
export const SECONDARY_RELEASE_CHARGES_PROMPT = '14. Does the booking hold exception list apply?';

export const STEP_2_CHARGES_PROMPT = (
  <div>
    <div>11. Determine if any current charge is:</div>
    <ul>
      <li>Escape 1st</li>
      <li>Espace 2nd</li>
      <li>Murder 1st Degree</li>
      <li>Murder 2st Degree</li>
      <li>Manslaughter 1st Degree</li>
      <li>1st Degree Rape</li>
      <li>2nd Degree Rape</li>
      <li>3rd Degree Rape</li>
      <li>1st Degree Kidnapping</li>
      <li>1st Degree Robbery</li>
      <li>An attempt to commit any of these charges</li>
      <li>A pretrial FTA for any of these charges</li>
    </ul>
  </div>
);

export const STEP_4_CHARGES_PROMPT = (
  <div>
    <div>12. Determine if any current charge is:</div>
    <ul>
      <li>Domestic Violence</li>
      <li>Stalking</li>
      <li>Violation of a Protection Order</li>
      <li>Violation of a No Contact Order</li>
      <li>Aggravated Assault</li>
      <li>A person to person sex crime (includes 22-24a-5)</li>
      <li>4th Degree Rape</li>
      <li>Arson</li>
      <li>2nd Degree Robbery</li>
      <li>2nd Degree Kidnapping</li>
      <li>Any offense that results in the death of a human</li>
      <li>Involved the use of a weapon</li>
      <li>An attempt to commit any of these charges</li>
      <li>A pretrial FTA for any of these charges</li>
    </ul>
  </div>
);
