/*
 * @flow
 */
import React from 'react';
import Immutable from 'immutable';
import styled from 'styled-components';
import moment from 'moment';

import ChargeList from '../charges/ChargeList';
import LoadingSpinner from '../LoadingSpinner';
import StyledButton from '../buttons/StyledButton';
import { OL } from '../../utils/consts/Colors';
import { formatDateList } from '../../utils/FormattingUtils';
import { getEntityProperties } from '../../utils/DataUtils';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { ID_FIELD_NAMES } from '../../utils/consts/Consts';
import {
  NoResults,
  Title,
  Count,
  PendingChargeStatus
} from '../../utils/Layout';

const InfoRow = styled.div`
  background-color: ${OL.GREY09};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px 15px 0;
  margin: ${props => (props.modal ? '0 -30px' : 0)};
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  border-bottom: ${props => (props.modal ? `1px solid ${OL.GREY01}` : 'none')};
  border-top: ${props => (props.modal ? `1px solid ${OL.GREY01}` : 'none')};
  padding-left: 30px;
  margin: ${props => (props.modal ? '20px -30px 0' : 0)};
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  margin: ${props => (props.modal ? '0 30px' : 0)};
  padding: ${props => (props.modal ? 0 : '0 30px')};
  color: ${OL.GREY01};
`;

const CaseHistoryContainer = styled.div`
  width: ${props => (props.modal ? 'auto' : '100%')};
  height: 100%;
`;

const StyledSpinner = styled(LoadingSpinner)`
  margin: ${props => (props.modal ? '0 -30px 30px' : 0)};
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  width: 100%;
`;

const InfoRowContainer = styled.div`
  display: flex;
  flex-direction: row;
`;

type Props = {
  addCaseToPSA :() => void,
  removeCaseFromPSA :() => void,
  caseHistory :Immutable.List<*>,
  chargeHistory :Immutable.Map<*, *>,
  caseNumbersToAssociationId? :Immutable.Map<*, *>,
  loading :boolean,
  modal :boolean,
  pendingCases :boolean,
  psaPermissions :boolean,
  title :string,
  isCompact :boolean
};

const CaseHistoryList = ({
  addCaseToPSA,
  removeCaseFromPSA,
  caseNumbersToAssociationId,
  title,
  caseHistory,
  chargeHistory,
  loading,
  pendingCases,
  psaPermissions,
  modal,
  isCompact
} :Props) => {
  const addCaseToPSAButton = (caseNum) => {
    const associationEntityKeyId = caseNumbersToAssociationId.get(caseNum);
    let onClick = () => addCaseToPSA({ [ID_FIELD_NAMES.CASE_ID]: caseNum });
    let buttonText = 'Add to PSA';
    if (associationEntityKeyId) {
      onClick = () => removeCaseFromPSA(associationEntityKeyId);
      buttonText = 'Remove From PSA';
    }
    return (psaPermissions && caseNum && pendingCases)
      ? (
        <StyledButton
            onClick={onClick}>
          {buttonText}
        </StyledButton>
      ) : null;
  };

  const caseCount = caseHistory.size;
  const oneWeekAgo = moment().subtract(1, 'week');
  const cases = caseHistory
    .sort((c1, c2) => {
      const date1 = moment(c1.getIn([PROPERTY_TYPES.FILE_DATE, 0], ''));
      const date2 = moment(c2.getIn([PROPERTY_TYPES.FILE_DATE, 0], ''));
      return date1.isBefore(date2) ? 1 : -1;
    })
    .filter(caseObj => caseObj.getIn([PROPERTY_TYPES.CASE_ID, 0], '').length)
    .map((caseObj) => {
      const {
        [PROPERTY_TYPES.CASE_ID]: caseId,
        [PROPERTY_TYPES.FILE_DATE]: fileDate
      } = getEntityProperties(caseObj, [PROPERTY_TYPES.CASE_ID, PROPERTY_TYPES.FILE_DATE]);
      const formattedFileDate = formatDateList(fileDate);
      const charges = chargeHistory.get(caseId);
      const dateList = caseObj.get(PROPERTY_TYPES.FILE_DATE, Immutable.List());
      const hasBeenUpdated = dateList.some(date => oneWeekAgo.isBefore(date));
      return (
        <div key={caseId}>
          <InfoRow modal={modal}>
            <InfoRowContainer>
              <InfoItem modal={modal}>{`Case Number: ${caseId}`}</InfoItem>
              <InfoItem modal={modal}>{`File Date: ${formattedFileDate}`}</InfoItem>
              <InfoItem modal={modal}>
                { (psaPermissions && hasBeenUpdated)
                  ? <PendingChargeStatus pendingCharges>Updated</PendingChargeStatus>
                  : null
                }
              </InfoItem>
            </InfoRowContainer>
            { caseNumbersToAssociationId ? addCaseToPSAButton(caseId) : null }
          </InfoRow>
          <ChargeList
              isCompact={isCompact}
              modal={modal}
              pretrialCaseDetails={caseObj}
              charges={charges}
              detailed
              historical />
        </div>
      );
    });

  const instructionsText = cases.size
    ? 'Navigate to Case History tab to add more court cases to this PSA.'
    : 'Navigate to Case History tab to add court cases to this PSA.';
  const noResultsText = psaPermissions ? instructionsText : 'No Cases Found';
  const casesDisplay = (
    <>
      {cases}
      { (cases.size) ? null : <NoResults>{noResultsText}</NoResults> }
    </>
  );

  return (
    <CaseHistoryContainer>
      {
        title
          ? (
            <TitleWrapper modal={modal}>
              <Title withSubtitle>
                <span>{title}</span>
              </Title>
              <Count>{caseCount}</Count>
            </TitleWrapper>
          ) : null
      }
      {
        loading
          ? <StyledSpinner />
          : casesDisplay
      }
    </CaseHistoryContainer>
  );
};

export default CaseHistoryList;
