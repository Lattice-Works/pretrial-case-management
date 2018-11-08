/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { Map } from 'immutable';

import CaseHistoryTimeline from '../casehistory/CaseHistoryTimeline';
import ChargeHistoryStats from '../casehistory/ChargeHistoryStats';
import CaseHistoryList from '../casehistory/CaseHistoryList';
import LoadingSpinner from '../LoadingSpinner';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { getIdOrValue } from '../../utils/DataUtils';
import {
  Title,
  StyledColumn,
  StyledColumnRow,
  StyledColumnRowWrapper,
  Wrapper
} from '../../utils/Layout';
import {
  currentPendingCharges,
  getChargeHistory,
  getCaseHistory,
  getCasesForPSA,
} from '../../utils/CaseUtils';
import {
  PSA_NEIGHBOR,
  PSA_ASSOCIATION
} from '../../utils/consts/FrontEndStateConsts';

const PaddedStyledColumnRow = styled(StyledColumnRow)`
  padding: 30px;
`;

type Props = {
  psaNeighborsById :Map<*, *>,
  neighbors :Map<*, *>,
  mostRecentPSA :Map<*, *>,
  mostRecentPSAEntityKeyId :string,
  loading :boolean,
  actions :{
    downloadPSAReviewPDF :(values :{
      neighbors :Map<*, *>,
      scores :Map<*, *>
    }) => void,
  }
}

const PersonCases = ({
  loading,
  mostRecentPSA,
  mostRecentPSAEntityKeyId,
  neighbors,
  psaNeighborsById
} :Props) => {
  const chargeHistory = getChargeHistory(neighbors);
  const mostRecentPSANeighbors = psaNeighborsById.get(mostRecentPSAEntityKeyId, Map());
  const scores = mostRecentPSA.get(PSA_NEIGHBOR.DETAILS, Map());
  const caseHistory = getCaseHistory(neighbors);
  const arrestDate = getIdOrValue(
    mostRecentPSANeighbors, ENTITY_SETS.MANUAL_PRETRIAL_CASES, PROPERTY_TYPES.ARREST_DATE_TIME
  );
  const lastEditDateForPSA = psaNeighborsById.getIn(
    [mostRecentPSAEntityKeyId, ENTITY_SETS.STAFF, 0, PSA_ASSOCIATION.DETAILS, PROPERTY_TYPES.DATE_TIME, 0],
    ''
  );
  const {
    caseHistoryForMostRecentPSA,
    chargeHistoryForMostRecentPSA,
    caseHistoryNotForMostRecentPSA,
    chargeHistoryNotForMostRecentPSA
  } = getCasesForPSA(
    caseHistory,
    chargeHistory,
    scores,
    arrestDate,
    lastEditDateForPSA
  );
  const pendingCharges = currentPendingCharges(chargeHistory);
  if (loading) {
    return <LoadingSpinner />;
  }
  return (
    <Wrapper>
      <StyledColumn>
        <StyledColumnRowWrapper>
          <PaddedStyledColumnRow>
            <Title withSubtitle>
              <span>Timeline</span>
              <span>Convictions in the past two years</span>
            </Title>
            <CaseHistoryTimeline caseHistory={caseHistory} chargeHistory={chargeHistory} />
            <ChargeHistoryStats chargeHistory={chargeHistory} pendingCharges={pendingCharges} />
          </PaddedStyledColumnRow>
        </StyledColumnRowWrapper>
        <StyledColumnRowWrapper>
          <StyledColumnRow>
            <CaseHistoryList
                loading={loading}
                title="Pending Cases on Arrest Date for Current PSA"
                caseHistory={caseHistoryForMostRecentPSA}
                chargeHistory={chargeHistoryForMostRecentPSA} />
          </StyledColumnRow>
        </StyledColumnRowWrapper>
        <StyledColumnRowWrapper>
          <StyledColumnRow>
            <CaseHistoryList
                loading={loading}
                title="Case History"
                caseHistory={caseHistoryNotForMostRecentPSA}
                chargeHistory={chargeHistoryNotForMostRecentPSA} />
          </StyledColumnRow>
        </StyledColumnRowWrapper>
      </StyledColumn>
    </Wrapper>
  );
};

export default PersonCases;
