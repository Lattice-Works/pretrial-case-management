/*
 * @flow
 */

import React from 'react';
import Immutable, { Map } from 'immutable';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import BasicButton from '../buttons/BasicButton';
import InfoButton from '../buttons/InfoButton';
import DropdownButton from '../buttons/DropdownButton';
import LoadingSpinner from '../LoadingSpinner';
import DMFCell from '../dmf/DMFCell';
import ChargeTable from '../charges/ChargeTable';
import CaseHistoryTimeline from '../casehistory/CaseHistoryTimeline';
import RiskFactorsTable from '../riskfactors/RiskFactorsTable';
import NewHearingSection from '../hearings/NewHearingSection';
import SelectedHearingInfo from '../hearings/SelectedHearingInfo';
import psaSuccessIcon from '../../assets/svg/psa-success.svg';
import psaFailureIcon from '../../assets/svg/psa-failure.svg';
import closeXWhiteIcon from '../../assets/svg/close-x-white.svg';
import closeXGrayIcon from '../../assets/svg/close-x-gray.svg';
import closeXBlackIcon from '../../assets/svg/close-x-black.svg';
import { OL } from '../../utils/consts/Colors';
import { APP, CHARGES, STATE } from '../../utils/consts/FrontEndStateConsts';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { getHeaderText } from '../../utils/DMFUtils';
import { JURISDICTION } from '../../utils/consts/Consts';
import {
  ResultHeader,
  ScaleBlock,
  SelectedScaleBlock,
  ScaleWrapper
} from '../../utils/Layout';
import * as Routes from '../../core/router/Routes';

type Props = {
  isSubmitting :boolean,
  scores :Immutable.Map<*, *>,
  riskFactors :Object,
  dmf :Object,
  personId :string,
  psaId :string,
  submitSuccess :boolean,
  charges :Immutable.List<*>,
  notes :string,
  context :string,
  allCases :Immutable.List<*>,
  allCharges :Immutable.Map<*, *>,
  allHearings :Immutable.List<*>,
  getOnExport :(isCompact :boolean) => void,
  onClose :() => void,
  history :string[],
  violentArrestCharges :Immutable.Map<*, *>,
  selectedOrganizationId :string
};

type State = {
  settingHearing :boolean,
  selectedHearing :Object
};

const STATUSES = {
  SUBMITTING: 'SUBMITTING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE'
};

const WideContainer = styled.div`
  margin-left: -15px;
  width: 998px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const Banner = styled(WideContainer)`
  margin: 0 -20px;
  padding: 30px;
  background-color: ${(props) => {
    switch (props.status) {
      case STATUSES.SUCCESS:
        return OL.GREEN02;
      case STATUSES.FAILURE:
        return OL.YELLOW04;
      default:
        return OL.GREY08;
    }
  }};
  height: 80px;
  width: 1010px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;

  div {
    display: flex;
    flex-direction: row;
    align-items: center;

    span {
      font-family: 'Open Sans', sans-serif;
      font-size: 18px;
      font-weight: 600;
      color: ${props => (props.status === STATUSES.SUCCESS ? OL.WHITE : OL.GREY15)};
      margin-left: 15px;
    }
  }

  button {
    background: none;
    border: none;
    &:hover {
      cursor: pointer;
    }

    &:focus {
      outline: none;
    }
  }

`;

const Bookend = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
  padding: 0 15px;

`;

const HeaderRow = styled(Bookend)`
  margin-top: 60px;

  span {
    font-family: 'Open Sans', sans-serif;
    font-size: 18px;
    color: ${OL.GREY01};
  }
`;

const FooterRow = styled(Bookend)`
  margin: 50px 0 30px 0;

  div {
    align-items: center;
  }

  ${BasicButton}:last-child {
    width: 43px;
    padding: 0;
  }
`;

const Flag = styled.span`
  width: 86px;
  height: 32px;
  border-radius: 3px;
  border: solid 1px ${OL.GREY01};
  font-family: 'Open Sans', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: ${OL.GREY01};
  padding: 5px 30px;
`;

const InlineScores = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 30px 0;

  div {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
`;

const ScoresContainer = styled.div`
  padding: 0 15px;
`;

const CreateHearingWrapper = styled.div`
  padding-top: 30px;
`;

const DMF = styled(WideContainer)`
  border-top: 1px solid ${OL.GREY11};
  border-bottom: 1px solid ${OL.GREY11};
  margin-top: 30px;
  padding: 15px 30px;

  section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;

    span {
      margin: 15px 0;
      font-family: 'Open Sans', sans-serif;
      font-size: 16px;
      font-weight: 600;
      color: ${OL.GREY01};
    }
  }
`;

const NotesContainer = styled(WideContainer)`
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  color: ${OL.GREY15};
  border-bottom: 1px solid ${OL.GREY11};
  padding-bottom: 30px;
  padding-left: 30px;
`;

const TimelineContainer = styled.div`
  padding: 0 15px;
`;

const PaddedResultHeader = styled(ResultHeader)`
  margin-top: 50px;
  margin-left: 15px;
`;

const MinimallyPaddedResultHeader = styled(PaddedResultHeader)`
  margin-top: 30px;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-direction: row;

  button {
    width: 154px !important;
    height: 43px;
    padding-left: 0;
    padding-right: 0;
    justify-content: center;
  }

  button:not(:first-child) {
    margin-left: 10px;
  }
`;

const FooterButtonGroup = styled.div`
  display: flex;
  flex-direction: row;

  button {
    height: 43px;
  }

  ${InfoButton} {
    width: 240px;
  }

  ${BasicButton} {
    margin-left: 30px;
    width: 43px;
  }
`;

class PSASubmittedPage extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);
    this.state = {
      settingHearing: false,
      selectedHearing: undefined
    };
  }

  renderBanner = () => {
    const { submitSuccess, isSubmitting, onClose } = this.props;
    let status = null;
    let content = null;
    let closeIconSrc = closeXBlackIcon;
    if (isSubmitting) {
      status = STATUSES.SUBMITTING;
      content = (
        <div>
          <LoadingSpinner />
          <span>Loading...</span>
        </div>
      );
    }
    else {
      const headerText = submitSuccess ? 'PSA Successfully Submitted!' : 'An error occurred: unable to submit PSA.';
      const iconSrc = submitSuccess ? psaSuccessIcon : psaFailureIcon;
      status = submitSuccess ? STATUSES.SUCCESS : STATUSES.FAILURE;
      if (submitSuccess) {
        closeIconSrc = closeXWhiteIcon;
      }

      content = (
        <div>
          <img src={iconSrc} alt="" />
          <span>{headerText}</span>
        </div>
      );
    }

    return (
      <Banner status={status}>
        <span />
        {content}
        <button onClick={onClose}>
          <img src={closeIconSrc} alt="" />
        </button>
      </Banner>
    );
  }

  renderNvca = () => {
    const { scores } = this.props;
    return (
      <div>
        <ResultHeader>New Violent Criminal Activity Flag</ResultHeader>
        <Flag>{scores.getIn([PROPERTY_TYPES.NVCA_FLAG, 0]) ? 'Yes' : 'No'}</Flag>
      </div>
    )
  }

  renderScale = (val :number) => {
    const scale = [];
    for (let i = 1; i < 7; i += 1) {
      const block = (i <= val)
        ? <SelectedScaleBlock key={i} isScore={i === val}>{i}</SelectedScaleBlock>
        : <ScaleBlock key={i}>{i}</ScaleBlock>;
      scale.push(block);
    }
    return <ScaleWrapper>{scale}</ScaleWrapper>;
  }

  renderScaleItem = (fqn, label) => {
    const { scores } = this.props;
    return (
      <div>
        <ResultHeader>{label}</ResultHeader>
        {this.renderScale(scores.getIn([fqn, 0]))}
      </div>
    )
  }

  renderScores = () => {
    return (
      <ScoresContainer>
        {this.renderNvca()}
        <InlineScores>
          {this.renderScaleItem(PROPERTY_TYPES.NCA_SCALE, 'New Criminal Activity Scale')}
          {this.renderScaleItem(PROPERTY_TYPES.FTA_SCALE, 'Failure to Appear Scale')}
        </InlineScores>
      </ScoresContainer>
    );
  }

  renderDMF = () => {
    const { dmf } = this.props;

    return (
      <DMF>
        <ResultHeader>DMF Result</ResultHeader>
        <section>
          <DMFCell dmf={dmf} selected large />
          <span>{getHeaderText(dmf)}</span>
        </section>
      </DMF>
    );
  }

  renderRiskFactorsTable = () => {
    const { riskFactors } = this.props;

    const format = (valList) => {
      if (!valList.length) return '';
      const val = valList[0];
      if (val.length) return val;
      return val ? 'Yes' : 'No';
    };

    const rows = Immutable.fromJS([
      {
        number: 1,
        riskFactor: 'Age at Current Arrest',
        response: format(riskFactors[PROPERTY_TYPES.AGE_AT_CURRENT_ARREST])
      },
      {
        number: 2,
        riskFactor: 'Current Violent Offense',
        response: format(riskFactors[PROPERTY_TYPES.CURRENT_VIOLENT_OFFENSE])
      },
      {
        number: '2a',
        riskFactor: 'Current Violent Offense & 20 Years Old or Younger',
        italicText: '(calculated from 1 and 2)',
        response: format(riskFactors[PROPERTY_TYPES.CURRENT_VIOLENT_OFFENSE_AND_YOUNG])
      },
      {
        number: 3,
        riskFactor: 'Pending Charge at the Time of the Offense',
        response: format(riskFactors[PROPERTY_TYPES.PENDING_CHARGE])
      },
      {
        number: 4,
        riskFactor: 'Prior Misdemeanor Conviction',
        response: format(riskFactors[PROPERTY_TYPES.PRIOR_MISDEMEANOR])
      },
      {
        number: 5,
        riskFactor: 'Prior Felony Conviction',
        response: format(riskFactors[PROPERTY_TYPES.PRIOR_FELONY])
      },
      {
        number: '5a',
        riskFactor: 'Prior Conviction',
        italicText: '(calculated from 4 and 5)',
        response: format(riskFactors[PROPERTY_TYPES.PRIOR_CONVICTION])
      },
      {
        number: 6,
        riskFactor: 'Prior Violent Conviction',
        response: format(riskFactors[PROPERTY_TYPES.PRIOR_VIOLENT_CONVICTION])
      },
      {
        number: 7,
        riskFactor: 'Prior Pretrial Failure to Appear in Past 2 Years',
        response: format(riskFactors[PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_RECENT])
      },
      {
        number: 8,
        riskFactor: 'Prior Pretrial Failure to Appear Older than 2 Years',
        response: format(riskFactors[PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_OLD])
      },
      {
        number: 9,
        riskFactor: 'Prior Sentence to Incarceration',
        response: format(riskFactors[PROPERTY_TYPES.PRIOR_SENTENCE_TO_INCARCERATION])
      }
    ]);

    return <RiskFactorsTable rows={rows} disabled />;
  }

  renderExportButton = (openAbove) => {
    const { getOnExport } = this.props;
    return (
      <div>
        <DropdownButton
            title="PDF Report"
            openAbove={openAbove}
            options={[{
              label: 'Export compact version',
              onClick: () => getOnExport(true)
            }, {
              label: 'Export full version',
              onClick: () => getOnExport(false)
            }]} />
      </div>
    );
  }

  renderProfileButton = () => {
    const { history, personId } = this.props;
    return (
      <BasicButton
          onClick={() => {
            history.push(Routes.PERSON_DETAILS.replace(':personId', personId));
          }}>
        Go to Profile
      </BasicButton>
    );
  }

  setHearing = () => this.setState({
    settingHearing: true,
    selectedHearing: undefined
  });

  renderSetHearingButton = () => {
    const { settingHearing, selectedHearing } = this.state;
    return (
      <InfoButton
          onClick={() => this.setState({ settingHearing: true })}
          disabled={settingHearing}>
        {selectedHearing ? 'View Hearing' : 'Set Hearing'}
      </InfoButton>
    );
  };

  renderHearingNewHearingSection = () => {
    const {
      allHearings,
      personId,
      psaId,
      isSubmitting,
      context
    } = this.props;
    const { selectedHearing } = this.state;
    const jurisdiction = JURISDICTION[context];
    if (!selectedHearing) {
      return (
        <CreateHearingWrapper>
          <NewHearingSection
              submitting={isSubmitting}
              jurisdiction={jurisdiction}
              personId={personId}
              psaId={psaId}
              hearings={allHearings}
              manuallyCreatingHearing
              onSubmit={hearing => this.setState({ selectedHearing: hearing })} />
        </CreateHearingWrapper>
      );
    }
    return (
      <SelectedHearingInfo
          hearing={selectedHearing}
          setHearing={this.setHearing}
          onClose={() => this.setState({
            settingHearing: false,
            selectedHearing: undefined
          })} />
    );
  }

  renderContent = () => {
    const {
      notes,
      charges,
      allCases,
      allCharges,
      violentArrestCharges,
      selectedOrganizationId
    } = this.props;

    return (
      <div>
        <div>
          <MinimallyPaddedResultHeader>Charges</MinimallyPaddedResultHeader>
          <WideContainer>
            <ChargeTable
                charges={charges}
                violentChargeList={violentArrestCharges.get(selectedOrganizationId, Map())}
                disabled />
          </WideContainer>
          <PaddedResultHeader>Risk Factors</PaddedResultHeader>
          <WideContainer>
            {this.renderRiskFactorsTable()}
          </WideContainer>
          <PaddedResultHeader>Notes</PaddedResultHeader>
          <NotesContainer>{notes}</NotesContainer>
          <MinimallyPaddedResultHeader>Timeline</MinimallyPaddedResultHeader>
          <TimelineContainer>
            <CaseHistoryTimeline caseHistory={allCases} chargeHistory={allCharges} />
          </TimelineContainer>
        </div>
      </div>
    );
  }

  render() {
    const { onClose } = this.props;
    const { settingHearing } = this.state;

    return (
      <Wrapper>
        {this.renderBanner()}
        <HeaderRow>
          <span>Public Safety Assessment</span>
          <ButtonRow>
            {this.renderExportButton()}
            {this.renderProfileButton()}
            {this.renderSetHearingButton()}
          </ButtonRow>
        </HeaderRow>
        {this.renderScores()}
        {this.renderDMF()}
        {
          settingHearing
            ? this.renderHearingNewHearingSection()
            : this.renderContent()
        }
        <FooterRow>
          <ButtonRow>
            {this.renderExportButton(true)}
            {this.renderProfileButton()}
          </ButtonRow>
          <FooterButtonGroup>
            {this.renderSetHearingButton()}
            <BasicButton onClick={onClose}><img src={closeXGrayIcon} alt="" /></BasicButton>
          </FooterButtonGroup>
        </FooterRow>
      </Wrapper>
    );
  }
}

function mapStateToProps(state :Immutable.Map<*, *>) :Object {
  const app = state.get(STATE.APP);
  const charges = state.get(STATE.CHARGES);
  return {
    // App
    [APP.SELECTED_ORG_ID]: app.get(APP.SELECTED_ORG_ID),
    [APP.SELECTED_ORG_TITLE]: app.get(APP.SELECTED_ORG_TITLE),

    // Charges
    [CHARGES.ARREST_VIOLENT]: charges.get(CHARGES.ARREST_VIOLENT),
    [CHARGES.COURT_VIOLENT]: charges.get(CHARGES.COURT_VIOLENT)
  };
}

export default withRouter(connect(mapStateToProps, null)(PSASubmittedPage));
