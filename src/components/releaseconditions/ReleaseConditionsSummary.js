/*
 * @flow
 */
import React from 'react';
import styled from 'styled-components';
import { List, Map } from 'immutable';
import { Constants } from 'lattice';

import HearingSummary from '../hearings/HearingSummary';
import { NoResults } from '../../utils/Layout';
import { formatJudgeName } from '../../utils/consts/HearingConsts';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { OL } from '../../utils/consts/Colors';
import { PSA_NEIGHBOR } from '../../utils/consts/FrontEndStateConsts';
import { formatDateTime } from '../../utils/FormattingUtils';

const Header = styled.div`
  padding: 30px 0 0 30px;
  font-family: 'Open Sans',sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: ${OL.GREY01};
`;

type Props = {
  completedHearings :List<*>,
  hearingNeighborsById :Map<*, *>
}
const { OPENLATTICE_ID_FQN } = Constants;

const ReleaseConditionsSummary = ({ completedHearings, hearingNeighborsById } :Props) => {
  const HearingSummaries = completedHearings.map((hearing) => {
    const entityKeyId = hearing.getIn([OPENLATTICE_ID_FQN, 0]);
    const hearingNeighbors = hearingNeighborsById.get(entityKeyId);
    const dateTime = formatDateTime(hearing.getIn([PROPERTY_TYPES.DATE_TIME, 0], '')).split(' ');
    const date = dateTime[0];
    const time = dateTime[1];
    const courtroom = hearing.getIn([PROPERTY_TYPES.COURTROOM, 0], '');
    const judge = formatJudgeName(hearingNeighbors.getIn([ENTITY_SETS.MIN_PEN_PEOPLE, PSA_NEIGHBOR.DETAILS]));
    const hearingOutcome = hearingNeighbors.getIn([ENTITY_SETS.OUTCOMES, PSA_NEIGHBOR.DETAILS]);
    const hearingBond = hearingNeighbors.getIn([ENTITY_SETS.BONDS, PSA_NEIGHBOR.DETAILS]);
    const hearingConditions = hearingNeighbors.get(ENTITY_SETS.RELEASE_CONDITIONS);
    const component = 'RELEASE_CONDTIONS_SUMMARY';

    const hearingObj = {
      date,
      time,
      courtroom,
      judge,
      hearingOutcome,
      hearingBond,
      hearingConditions,
      component
    };

    return <HearingSummary key={dateTime} hearing={hearingObj} />;
  });

  if (!completedHearings.size) {
    return (
      <NoResults>No outcomes have been submitted for hearings associated with this PSA.</NoResults>
    );
  }

  return (
    <div>
      <Header>Release Conditions By Hearing</Header>
      {HearingSummaries}
    </div>
  );

};

export default ReleaseConditionsSummary;
