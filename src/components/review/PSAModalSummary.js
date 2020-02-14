/*
 * @flow
 */
import React from 'react';
import { DateTime } from 'luxon';
import { List, Map } from 'immutable';
import styled from 'styled-components';
import { connect } from 'react-redux';

import CaseHistoryList from '../casehistory/CaseHistoryList';
import ChargeHistoryStats from '../casehistory/ChargeHistoryStats';
import ChargeTable from '../charges/ChargeTable';
import SummaryDMFDetails from '../dmf/SummaryDMFDetails';
import { CASE_CONTEXTS, MODULE, SETTINGS } from '../../utils/consts/AppSettingConsts';
import { OL } from '../../utils/consts/Colors';
import { APP_TYPES, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { DATE_FORMAT, TIME_FORMAT } from '../../utils/consts/DateTimeConsts';
import { getEntityProperties, getNeighborDetailsForEntitySet } from '../../utils/DataUtils';
import {
  AlternateSectionHeader,
  Count,
  Content,
  ContentBlock,
  ContentHeader,
  ContentLabel,
  SummaryRowWrapper
} from '../../utils/Layout';

import { PSA_NEIGHBOR } from '../../utils/consts/FrontEndStateConsts';

import { STATE } from '../../utils/consts/redux/SharedConsts';
import { APP_DATA } from '../../utils/consts/redux/AppConsts';
import { CHARGE_DATA } from '../../utils/consts/redux/ChargeConsts';

const { MANUAL_PRETRIAL_CASES } = APP_TYPES;

const { ARREST_DATE_TIME, ARRESTING_AGENCY } = PROPERTY_TYPES;

const SectionoWrapper = styled.div`
  width: 100%;
`;

const RCMWrapper = styled(SectionoWrapper)`
  padding-left: 30px;

`;
const ArrestAndNotes = styled(SectionoWrapper)`
  border-right: 1px solid ${OL.GREY11};
`;

const StyledRow = styled(SummaryRowWrapper)`
  grid-template-columns: 60% 40%;
  padding: 0 30px 30px;
  margin: 30px 0 0;
  border-bottom: 1px solid ${OL.GREY11};
`;

const SummaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ChargeTableContainer = styled.div`
  text-align: center;
  width: 100%;
  margin: 0;
`;

const ArrestWrapper = styled.div`
  width: 100%;
  display: grid;
  padding-bottom: 15px;
  margin-bottom: 15px;
  border-bottom: 1px solid ${OL.GREY11};
  grid-template-columns: repeat(3, 1fr);
`;

type Props = {
  addCaseToPSA :() => void;
  removeCaseFromPSA :() => void;
  caseContext :string;
  caseNumbersToAssociationId :List;
  chargeHistoryForMostRecentPSA :Map;
  caseHistoryForMostRecentPSA :List;
  notes :string;
  scores :Map;
  neighbors :Map;
  manualCaseHistory :List;
  chargeHistory :List;
  manualChargeHistory :Map;
  pendingCharges :List;
  selectedOrganizationId :string;
  selectedOrganizationSettings :Map;
  violentArrestCharges :Map;
  violentCourtCharges :Map;
  psaPermissions :boolean;
};

class PSAModalSummary extends React.Component<Props, *> {

  renderCaseInfo = () => {
    const {
      addCaseToPSA,
      caseHistoryForMostRecentPSA,
      caseNumbersToAssociationId,
      chargeHistoryForMostRecentPSA,
      caseContext,
      manualCaseHistory,
      manualChargeHistory,
      neighbors,
      psaPermissions,
      removeCaseFromPSA,
      selectedOrganizationId,
      selectedOrganizationSettings,
      violentArrestCharges,
      violentCourtCharges
    } = this.props;
    const includesPretrialModule = selectedOrganizationSettings.getIn([SETTINGS.MODULES, MODULE.PRETRIAL], false);
    const violentArrestChargeList = violentArrestCharges.get(selectedOrganizationId, Map());
    const violentCourtChargesList = violentCourtCharges.get(selectedOrganizationId, Map());
    const violentChargeList = (caseContext === CASE_CONTEXTS.ARREST)
      ? violentArrestChargeList : violentCourtChargesList;
    const caseContextHeader = caseContext.slice(0, 1).toUpperCase() + caseContext.slice(1);
    const caseNum = neighbors.getIn(
      [MANUAL_PRETRIAL_CASES, PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.CASE_ID, 0], ''
    );
    const pretrialCase = manualCaseHistory
      .filter((caseObj) => caseObj.getIn([PROPERTY_TYPES.CASE_ID, 0], '') === caseNum);
    const charges = manualChargeHistory.get(caseNum, List());

    const associatedCasesForForPSA = caseHistoryForMostRecentPSA.filter((caseObj) => {
      const caseNo = caseObj.getIn([PROPERTY_TYPES.CASE_ID, 0]);
      return caseNumbersToAssociationId.get(caseNo);
    });

    return (
      <>
        <hr />
        <ChargeTableContainer>
          <AlternateSectionHeader>
            {`${caseContextHeader} Charges`}
            <Count>{charges.size}</Count>
          </AlternateSectionHeader>
          <ChargeTable charges={charges} violentChargeList={violentChargeList} pretrialCase={pretrialCase} />
        </ChargeTableContainer>
        {
          includesPretrialModule
            ? (
              <>
                <hr />
                <ChargeTableContainer>
                  <CaseHistoryList
                      psaPermissions={psaPermissions}
                      pendingCases
                      addCaseToPSA={addCaseToPSA}
                      removeCaseFromPSA={removeCaseFromPSA}
                      caseNumbersToAssociationId={caseNumbersToAssociationId}
                      title="Court Charges"
                      caseHistory={associatedCasesForForPSA}
                      chargeHistory={chargeHistoryForMostRecentPSA} />
                </ChargeTableContainer>
              </>
            ) : null
        }
      </>
    );
  }

  renderArrestaInfoAndPSANotes = () => {
    const { neighbors } = this.props;
    const pretrialCase = getNeighborDetailsForEntitySet(neighbors, MANUAL_PRETRIAL_CASES);
    const {
      [ARREST_DATE_TIME]: arrestDateTime,
      [ARRESTING_AGENCY]: arrestingAgency
    } = getEntityProperties(
      pretrialCase,
      [ARREST_DATE_TIME, ARRESTING_AGENCY]
    );
    const arrestDate = DateTime.fromISO(arrestDateTime).toFormat(DATE_FORMAT);
    const arrestTime = DateTime.fromISO(arrestDateTime).toFormat(TIME_FORMAT);

    const generalContent = [
      {
        label: 'Arrest Date',
        content: [arrestDate]
      },
      {
        label: 'Arrest Time',
        content: [arrestTime]
      },
      {
        label: 'Arresting Agency',
        content: [arrestingAgency]
      }
    ];

    const content = generalContent.map((item) => (
      <ContentBlock key={item.label}>
        <ContentLabel>{ item.label }</ContentLabel>
        <Content>{ item.content }</Content>
      </ContentBlock>
    ));
    return (
      <ArrestAndNotes>
        <ContentHeader>Arrest</ContentHeader>
        <ArrestWrapper>
          {content}
        </ArrestWrapper>
        {this.renderNotes()}
      </ArrestAndNotes>
    );
  };

  renderNotes = () => {
    const { notes } = this.props;
    return (
      <>
        <ContentHeader>Notes</ContentHeader>
        {notes || 'No Notes'}
      </>
    );
  }

  renderRCM = () => {
    const { neighbors, scores } = this.props;
    return (
      <RCMWrapper>
        <ContentHeader>RCM</ContentHeader>
        <SummaryDMFDetails neighbors={neighbors} scores={scores} />
      </RCMWrapper>
    );
  }

  render() {
    const {
      chargeHistory,
      pendingCharges,
      selectedOrganizationSettings
    } = this.props;

    const includesPretrialModule = selectedOrganizationSettings.getIn([SETTINGS.MODULES, MODULE.PRETRIAL], false);

    return (
      <SummaryWrapper>
        <StyledRow>
          {this.renderArrestaInfoAndPSANotes()}
          {this.renderRCM()}
        </StyledRow>
        {
          includesPretrialModule
            ? (
              <ChargeHistoryStats
                  padding
                  pendingCharges={pendingCharges}
                  chargeHistory={chargeHistory} />

            ) : null
        }
        {this.renderCaseInfo()}
      </SummaryWrapper>
    );
  }
}

function mapStateToProps(state :Map) :Object {
  const app = state.get(STATE.APP);
  const charges = state.get(STATE.CHARGES);
  return {
    // App
    [APP_DATA.SELECTED_ORG_ID]: app.get(APP_DATA.SELECTED_ORG_ID),
    [APP_DATA.SELECTED_ORG_TITLE]: app.get(APP_DATA.SELECTED_ORG_TITLE),
    [APP_DATA.SELECTED_ORG_SETTINGS]: app.get(APP_DATA.SELECTED_ORG_SETTINGS),

    // Charges
    [CHARGE_DATA.ARREST_VIOLENT]: charges.get(CHARGE_DATA.ARREST_VIOLENT),
    [CHARGE_DATA.COURT_VIOLENT]: charges.get(CHARGE_DATA.COURT_VIOLENT)
  };
}

export default connect(mapStateToProps, null)(PSAModalSummary);
