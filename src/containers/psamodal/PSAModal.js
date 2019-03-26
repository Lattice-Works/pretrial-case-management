/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import { Constants } from 'lattice';
import Immutable, { List, Map } from 'immutable';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Modal, { ModalTransition } from '@atlaskit/modal-dialog';
import { AuthUtils } from 'lattice-auth';
import { Link } from 'react-router-dom';

import CustomTabs from '../../components/tabs/Tabs';
import CourtCaseForPSAConfig from '../../config/formconfig/CourtCaseForPSAConfig';
import LogoLoader from '../../components/LogoLoader';
import PSAInputForm from '../../components/psainput/PSAInputForm';
import PersonCard from '../../components/person/PersonCardReview';
import StyledButton from '../../components/buttons/StyledButton';
import DropdownButton from '../../components/buttons/DropdownButton';
import CaseHistory from '../../components/casehistory/CaseHistory';
import CaseHistoryTimeline from '../../components/casehistory/CaseHistoryTimeline';
import DMFExplanation from '../../components/dmf/DMFExplanation';
import SelectHearingsContainer from '../hearings/SelectHearingsContainer';
import PSAModalSummary from '../../components/review/PSAModalSummary';
import ReleaseConditionsSummary from '../../components/releaseconditions/ReleaseConditionsSummary';
import ClosePSAModal from '../../components/review/ClosePSAModal';
import psaEditedConfig from '../../config/formconfig/PsaEditedConfig';
import closeX from '../../assets/svg/close-x-gray.svg';
import LoadPersonCaseHistoryButton from '../person/LoadPersonCaseHistoryButton';
import { getScoresAndRiskFactors, calculateDMF } from '../../utils/ScoringUtils';
import { getEntityKeyId, getEntitySetId, getIdOrValue } from '../../utils/DataUtils';
import { CenteredContainer, Title } from '../../utils/Layout';
import { toISODateTime } from '../../utils/FormattingUtils';
import { getCasesForPSA, currentPendingCharges } from '../../utils/CaseUtils';
import { RESULT_CATEGORIES } from '../../utils/consts/DMFResultConsts';
import { formatDMFFromEntity } from '../../utils/DMFUtils';
import { OL } from '../../utils/consts/Colors';
import { psaIsClosed } from '../../utils/PSAUtils';
import { APP_TYPES_FQNS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import {
  CASE_CONTEXTS,
  CONTEXTS,
  MODULE,
  SETTINGS
} from '../../utils/consts/AppSettingConsts';
import {
  APP,
  PSA_NEIGHBOR,
  PSA_ASSOCIATION,
  PSA_MODAL,
  STATE
} from '../../utils/consts/FrontEndStateConsts';
import {
  CONTEXT,
  DMF,
  EDIT_FIELDS,
  ID_FIELD_NAMES,
  NOTES,
  PSA
} from '../../utils/consts/Consts';

import * as Routes from '../../core/router/Routes';
import * as FormActionFactory from '../psa/FormActionFactory';
import * as ReviewActionFactory from '../review/ReviewActionFactory';
import * as PSAModalActionFactory from './PSAModalActionFactory';
import * as CourtActionFactory from '../court/CourtActionFactory';
import * as SubmitActionFactory from '../../utils/submit/SubmitActionFactory';
import * as DataActionFactory from '../../utils/data/DataActionFactory';

let {
  BONDS,
  CALCULATED_FOR,
  DMF_RESULTS,
  DMF_RISK_FACTORS,
  HEARINGS,
  MANUAL_PRETRIAL_CASES,
  OUTCOMES,
  PEOPLE,
  PRETRIAL_CASES,
  PSA_RISK_FACTORS,
  RELEASE_CONDITIONS,
  RELEASE_RECOMMENDATIONS,
  STAFF
} = APP_TYPES_FQNS;

BONDS = BONDS.toString();
CALCULATED_FOR = CALCULATED_FOR.toString();
DMF_RESULTS = DMF_RESULTS.toString();
DMF_RISK_FACTORS = DMF_RISK_FACTORS.toString();
HEARINGS = HEARINGS.toString();
MANUAL_PRETRIAL_CASES = MANUAL_PRETRIAL_CASES.toString();
OUTCOMES = OUTCOMES.toString();
PEOPLE = PEOPLE.toString();
PRETRIAL_CASES = PRETRIAL_CASES.toString();
PSA_RISK_FACTORS = PSA_RISK_FACTORS.toString();
RELEASE_CONDITIONS = RELEASE_CONDITIONS.toString();
RELEASE_RECOMMENDATIONS = RELEASE_RECOMMENDATIONS.toString();
STAFF = STAFF.toString();

const { OPENLATTICE_ID_FQN } = Constants;

const StyledLink = styled(Link)`
  color: ${OL.GREY01};
  :hover {
    color: ${OL.PURPLE02};
  }
`;

const DownloadButtonContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center !important;
`;

const ModalWrapper = styled.div`
  max-height: 100%;
  padding: ${props => (props.withPadding ? '30px' : '0')};
  hr {
    margin: ${props => (props.withPadding ? '30px -30px' : '15px 0')};
    width: ${props => (props.withPadding ? 'calc(100% + 60px)' : '100%')};
  }
`;

const NoDMFContainer = styled(CenteredContainer)`
  margin: 30px;
  font-size: 18px;
`;

const TitleWrapper = styled.div`
  padding: 35px 15px;
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;
const TitleHeader = styled.span`
  margin-right: 15px;
  font-size: 18px;
  font-weight: 600;
  color: ${OL.GREY01};
  span {
    text-transform: uppercase;
  }
`;

const ClosePSAButton = styled(StyledButton)`
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: ${OL.PURPLE02};
  width: 162px;
  height: 40px;
  border: none;
  border-radius: 3px;
  background-color: ${OL.PURPLE06};
`;
const EditPSAButton = styled(StyledButton)`
  margin: ${props => (props.footer ? '-20px 0 30px' : '0')};
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: ${OL.GREY02};
  width: ${props => (props.footer ? '340px' : '142px')};
  height: ${props => (props.footer ? '42px' : '40px')};
  border: none;
  border-radius: 3px;
  background-color: ${OL.GREY08};
`;

const PSAFormHeader = styled.div`
  padding: 30px;
  font-family: 'Open Sans', sans-serif;
  font-size: 18px;
  color: ${OL.GREY01};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: solid 1px ${OL.GREY11} !important;
`;

const CloseModalX = styled.img.attrs({
  alt: '',
  src: closeX
})`
  height: 16px;
  width: 16px;
  margin-left: 40px;
  &:hover {
    cursor: pointer;
  }
`;

type Props = {
  app :Map<*, *>,
  caseHistory :List<*>,
  chargeHistory :Map<*, *>,
  entityKeyId :string,
  ftaHistory :Map<*, *>,
  fqnsToEntitySetIds :Map<*, *>,
  hearings :List<*>,
  hearingNeighborsById :Map<*, *>,
  hideProfile? :boolean,
  loadingPSAModal :boolean,
  loadingCaseHistory :boolean,
  manualCaseHistory :List<*>,
  manualChargeHistory :Map<*, *>,
  onClose :() => {},
  open :boolean,
  readOnly :boolean,
  personId :string,
  personHearings :Map<*, *>,
  personNeighbors :Map<*, *>,
  psaId :Map<*, *>,
  psaNeighbors :Map<*, *>,
  psaPermissions :boolean,
  refreshingNeighbors :boolean,
  scores :Map<*, *>,
  scoresEntitySetId :string,
  selectedOrganizationId :string,
  selectedOrganizationSettings :Map<*, *>,
  sentenceHistory :Map<*, *>,
  submitting :boolean,
  judgesview :boolean,
  actions :{
    clearSubmit :() => void,
    deleteEntity :(value :{ entitySetId :string, entityKeyId :string }) => void,
    downloadPSAReviewPDF :(values :{
      neighbors :Map<*, *>,
      scores :Map<*, *>
    }) => void,
    refreshPSANeighbors :({ id :string }) => void,
    replaceEntity :(value :{ entitySetName :string, entityKeyId :string, values :Object }) => void,
    submit :(value :{ config :Object, values :Object, callback? :() => void }) => void,
    submitData :(value :{ config :Object, values :Object }) => void,
    updateScoresAndRiskFactors :(values :{
      scoresEntitySetId :string,
      scoresId :string,
      scoresEntity :Map<*, *>,
      riskFactorsEntitySetId :string,
      riskFactorsId :string,
      riskFactorsEntity :Map<*, *>,
      dmfEntitySetId :string,
      dmfId :string,
      dmfEntity :Object,
      dmfRiskFactorsEntitySetId :string,
      dmfRiskFactorsId :string,
      dmfRiskFactorsEntity :Object
    }) => void,
    updateOutcomesAndReleaseCondtions :(values :{
      allEntitySetIds :string[]
    }) => void,
    changePSAStatus :(values :{
      scoresId :string,
      scoresEntity :Map<*, *>
    }) => void,
    loadHearingNeighbors :(hearingIds :string[]) => void
  }
};

const MODAL_WIDTH = '975px';
const MODAL_HEIGHT = 'max-content';

type State = {
  closingPSAModalOpen :boolean,
  dmf :Object,
  editing :boolean,
  hearingExists :boolean,
  riskFactors :Map<*, *>,
  view :string,
};

class PSAModal extends React.Component<Props, State> {

  static defaultProps = {
    hideProfile: false
  }

  constructor(props :Props) {
    super(props);
    this.state = {
      editing: false,
      closingPSAModalOpen: false,
      riskFactors: this.getRiskFactors(props.psaNeighbors),
      dmf: this.getDMF(props.psaNeighbors)
    };
  }

  componentWillReceiveProps(nextProps :Props) {
    this.setState({
      dmf: this.getDMF(nextProps.psaNeighbors),
      riskFactors: this.getRiskFactors(nextProps.psaNeighbors)
    });
  }

  exitEdit = () => {
    this.setState({ editing: false });
  }

  onClose() {
    const { onClose } = this.props;
    this.exitEdit();
    onClose();
  }

  getNotesFromNeighbors = neighbors => neighbors.getIn([
    RELEASE_RECOMMENDATIONS,
    PSA_NEIGHBOR.DETAILS,
    PROPERTY_TYPES.RELEASE_RECOMMENDATION,
    0
  ], '');

  getRiskFactors = (neighbors :Map<*, *>) => {
    const { selectedOrganizationSettings } = this.props;
    const includesPretrialModule = selectedOrganizationSettings.getIn([SETTINGS.MODULES, MODULE.PRETRIAL], '');
    const riskFactors = neighbors.getIn([PSA_RISK_FACTORS, PSA_NEIGHBOR.DETAILS], Map());
    const dmfRiskFactors = neighbors.getIn([DMF_RISK_FACTORS, PSA_NEIGHBOR.DETAILS], Map());
    const ageAtCurrentArrestVal = riskFactors.getIn([PROPERTY_TYPES.AGE_AT_CURRENT_ARREST, 0]);
    let ageAtCurrentArrest = 0;
    if (ageAtCurrentArrestVal === '21 or 22') ageAtCurrentArrest = 1;
    else if (ageAtCurrentArrestVal === '23 or Older') ageAtCurrentArrest = 2;
    const priorViolentConvictionVal = riskFactors.getIn([PROPERTY_TYPES.PRIOR_VIOLENT_CONVICTION, 0]);
    const priorViolentConviction = (priorViolentConvictionVal === '3 or more') ? 3 : priorViolentConvictionVal;
    const priorFTAVal = riskFactors.getIn([PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_RECENT, 0]);
    const priorFTA = (priorFTAVal === '2 or more') ? 2 : priorFTAVal;

    let newRiskFactors = {
      [PSA.NOTES]: this.getNotesFromNeighbors(neighbors),
      [PSA.AGE_AT_CURRENT_ARREST]: `${ageAtCurrentArrest}`,
      [PSA.CURRENT_VIOLENT_OFFENSE]: `${riskFactors.getIn([PROPERTY_TYPES.CURRENT_VIOLENT_OFFENSE, 0])}`,
      [PSA.PENDING_CHARGE]: `${riskFactors.getIn([PROPERTY_TYPES.PENDING_CHARGE, 0])}`,
      [PSA.PRIOR_MISDEMEANOR]: `${riskFactors.getIn([PROPERTY_TYPES.PRIOR_MISDEMEANOR, 0])}`,
      [PSA.PRIOR_FELONY]: `${riskFactors.getIn([PROPERTY_TYPES.PRIOR_FELONY, 0])}`,
      [PSA.PRIOR_VIOLENT_CONVICTION]: `${priorViolentConviction}`,
      [PSA.PRIOR_FAILURE_TO_APPEAR_RECENT]: `${priorFTA}`,
      [PSA.PRIOR_FAILURE_TO_APPEAR_OLD]: `${riskFactors.getIn([PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_OLD, 0])}`,
      [PSA.PRIOR_SENTENCE_TO_INCARCERATION]:
      `${riskFactors.getIn([PROPERTY_TYPES.PRIOR_SENTENCE_TO_INCARCERATION, 0])}`,
      [NOTES[PSA.AGE_AT_CURRENT_ARREST]]: riskFactors.getIn([PROPERTY_TYPES.AGE_AT_CURRENT_ARREST_NOTES, 0], ''),
      [NOTES[PSA.CURRENT_VIOLENT_OFFENSE]]: riskFactors.getIn([PROPERTY_TYPES.CURRENT_VIOLENT_OFFENSE_NOTES, 0], ''),
      [NOTES[PSA.PENDING_CHARGE]]: riskFactors.getIn([PROPERTY_TYPES.PENDING_CHARGE_NOTES, 0], ''),
      [NOTES[PSA.PRIOR_MISDEMEANOR]]: riskFactors.getIn([PROPERTY_TYPES.PRIOR_MISDEMEANOR_NOTES, 0], ''),
      [NOTES[PSA.PRIOR_FELONY]]: riskFactors.getIn([PROPERTY_TYPES.PRIOR_FELONY_NOTES, 0], ''),
      [NOTES[PSA.PRIOR_VIOLENT_CONVICTION]]: riskFactors.getIn([PROPERTY_TYPES.PRIOR_VIOLENT_CONVICTION_NOTES, 0], ''),
      [NOTES[PSA.PRIOR_FAILURE_TO_APPEAR_RECENT]]:
      riskFactors.getIn([PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_RECENT_NOTES, 0], ''),
      [NOTES[PSA.PRIOR_FAILURE_TO_APPEAR_OLD]]:
      riskFactors.getIn([PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_OLD_NOTES, 0], ''),
      [NOTES[PSA.PRIOR_SENTENCE_TO_INCARCERATION]]:
      riskFactors.getIn([PROPERTY_TYPES.PRIOR_SENTENCE_TO_INCARCERATION_NOTES, 0], ''),
    };

    if (includesPretrialModule) {
      newRiskFactors = Object.assign({}, newRiskFactors, {
        [DMF.EXTRADITED]: `${dmfRiskFactors.getIn([PROPERTY_TYPES.EXTRADITED, 0])}`,
        [DMF.STEP_2_CHARGES]: `${dmfRiskFactors.getIn([PROPERTY_TYPES.DMF_STEP_2_CHARGES, 0])}`,
        [DMF.STEP_4_CHARGES]: `${dmfRiskFactors.getIn([PROPERTY_TYPES.DMF_STEP_4_CHARGES, 0])}`,
        [DMF.COURT_OR_BOOKING]: `${dmfRiskFactors.getIn([PROPERTY_TYPES.CONTEXT, 0])}`,
        [DMF.SECONDARY_RELEASE_CHARGES]: `${dmfRiskFactors.getIn([PROPERTY_TYPES.DMF_SECONDARY_RELEASE_CHARGES, 0])}`,
        [DMF.SECONDARY_HOLD_CHARGES]: `${dmfRiskFactors.getIn([PROPERTY_TYPES.DMF_SECONDARY_HOLD_CHARGES, 0])}`,
        [NOTES[DMF.EXTRADITED]]: `${dmfRiskFactors.getIn([PROPERTY_TYPES.EXTRADITED_NOTES, 0], '')}`,
        [NOTES[DMF.STEP_2_CHARGES]]: `${dmfRiskFactors.getIn([PROPERTY_TYPES.DMF_STEP_2_CHARGES_NOTES, 0], '')}`,
        [NOTES[DMF.STEP_4_CHARGES]]: `${dmfRiskFactors.getIn([PROPERTY_TYPES.DMF_STEP_4_CHARGES_NOTES, 0], '')}`,
        [NOTES[DMF.SECONDARY_RELEASE_CHARGES]]:
          `${dmfRiskFactors.getIn([PROPERTY_TYPES.DMF_SECONDARY_RELEASE_CHARGES_NOTES, 0], '')}`,
        [NOTES[DMF.SECONDARY_HOLD_CHARGES]]:
          `${dmfRiskFactors.getIn([PROPERTY_TYPES.DMF_SECONDARY_HOLD_CHARGES_NOTES, 0], '')}`
      });
    }
    return Immutable.fromJS(newRiskFactors);
  }

  getDMF = (neighbors :Map<*, *>) => {
    const { selectedOrganizationSettings } = this.props;
    const includesPretrialModule = selectedOrganizationSettings.getIn([SETTINGS.MODULES, MODULE.PRETRIAL], '');
    return includesPretrialModule
      ? formatDMFFromEntity(neighbors.getIn([DMF_RESULTS, PSA_NEIGHBOR.DETAILS], Map()))
      : Map();
  };

  downloadRow = (e, isCompact) => {
    e.stopPropagation();
    const { actions, psaNeighbors, scores } = this.props;
    actions.downloadPSAReviewPDF({ neighbors: psaNeighbors, scores, isCompact });
  }

  renderPersonCard = () => {
    const { psaNeighbors, hideProfile } = this.props;
    if (hideProfile) return null;

    const personDetails = psaNeighbors.getIn([PEOPLE, PSA_NEIGHBOR.DETAILS], Map());
    if (!personDetails.size) return <div>Person details unknown.</div>;
    return <PersonCard person={personDetails} />;
  }

  renderDownloadButton = () => (
    <DownloadButtonContainer>
      <DropdownButton
          title="PDF Report"
          options={[{
            label: 'Export compact version',
            onClick: e => this.downloadRow(e, true)
          }, {
            label: 'Export full version',
            onClick: e => this.downloadRow(e, false)
          }]} />
    </DownloadButtonContainer>
  )

  handleRiskFactorChange = (e :Object) => {
    const {
      PRIOR_MISDEMEANOR,
      PRIOR_FELONY,
      PRIOR_VIOLENT_CONVICTION,
      PRIOR_SENTENCE_TO_INCARCERATION
    } = PSA;
    let { riskFactors } = this.state;
    riskFactors = riskFactors.set(e.target.name, e.target.value);
    if (riskFactors.get(PRIOR_MISDEMEANOR) === 'false' && riskFactors.get(PRIOR_FELONY) === 'false') {
      riskFactors = riskFactors.set(PRIOR_VIOLENT_CONVICTION, '0').set(PRIOR_SENTENCE_TO_INCARCERATION, 'false');
    }
    this.setState({ riskFactors });
  }

  getDMFEntity = (dmf, dmfId) => {
    const result = {
      [PROPERTY_TYPES.GENERAL_ID]: [dmfId],
      [PROPERTY_TYPES.COLOR]: [dmf[RESULT_CATEGORIES.COLOR]],
      [PROPERTY_TYPES.RELEASE_TYPE]: [dmf[RESULT_CATEGORIES.RELEASE_TYPE]]
    };
    if (dmf[RESULT_CATEGORIES.CONDITIONS_LEVEL]) {
      result[PROPERTY_TYPES.CONDITIONS_LEVEL] = [dmf[RESULT_CATEGORIES.CONDITIONS_LEVEL]];
    }
    if (dmf[RESULT_CATEGORIES.CONDITION_1]) {
      result[PROPERTY_TYPES.CONDITION_1] = [dmf[RESULT_CATEGORIES.CONDITION_1]];
    }
    if (dmf[RESULT_CATEGORIES.CONDITION_2]) {
      result[PROPERTY_TYPES.CONDITION_2] = [dmf[RESULT_CATEGORIES.CONDITION_2]];
    }
    if (dmf[RESULT_CATEGORIES.CONDITION_3]) {
      result[PROPERTY_TYPES.CONDITION_3] = [dmf[RESULT_CATEGORIES.CONDITION_3]];
    }
    return result;
  }

  getDMFRiskFactorsEntity = (riskFactors, dmfRiskFactorsId) => {
    const result = {
      [PROPERTY_TYPES.GENERAL_ID]: [dmfRiskFactorsId],
      [PROPERTY_TYPES.EXTRADITED]: [riskFactors.get(DMF.EXTRADITED)],
      [PROPERTY_TYPES.DMF_STEP_2_CHARGES]: [riskFactors.get(DMF.STEP_2_CHARGES)],
      [PROPERTY_TYPES.DMF_STEP_4_CHARGES]: [riskFactors.get(DMF.STEP_4_CHARGES)],
      [PROPERTY_TYPES.CONTEXT]: [riskFactors.get(DMF.COURT_OR_BOOKING)],
      [PROPERTY_TYPES.EXTRADITED_NOTES]: [riskFactors.get(NOTES[DMF.EXTRADITED])],
      [PROPERTY_TYPES.DMF_STEP_2_CHARGES_NOTES]: [riskFactors.get(NOTES[DMF.STEP_2_CHARGES])],
      [PROPERTY_TYPES.DMF_STEP_4_CHARGES_NOTES]: [riskFactors.get(NOTES[DMF.STEP_4_CHARGES])]
    };
    if (riskFactors.get(DMF.COURT_OR_BOOKING) === CONTEXT.BOOKING) {
      result[PROPERTY_TYPES.DMF_SECONDARY_RELEASE_CHARGES] = [riskFactors.get(DMF.SECONDARY_RELEASE_CHARGES)];
      result[PROPERTY_TYPES.DMF_SECONDARY_RELEASE_CHARGES_NOTES] = [
        riskFactors.get(NOTES[DMF.SECONDARY_RELEASE_CHARGES])
      ];
      result[PROPERTY_TYPES.DMF_SECONDARY_HOLD_CHARGES] = [riskFactors.get(DMF.SECONDARY_HOLD_CHARGES)];
      result[PROPERTY_TYPES.DMF_SECONDARY_HOLD_CHARGES_NOTES] = [riskFactors.get(NOTES[DMF.SECONDARY_HOLD_CHARGES])];
    }
    return result;
  };

  getNotesEntity = (riskFactors, notesId) => ({
    [PROPERTY_TYPES.GENERAL_ID]: [notesId],
    [PROPERTY_TYPES.RELEASE_RECOMMENDATION]: [riskFactors.get(PSA.NOTES)]
  });

  getEntitySetId = (name) :string => {
    const { psaNeighbors } = this.props;
    return getEntitySetId(psaNeighbors, name);
  };

  getEntityKeyId = (name) :string => {
    const { psaNeighbors } = this.props;
    return getEntityKeyId(psaNeighbors, name);
  };

  getIdOrValue = (name, optionalFQN) :string => {
    const { psaNeighbors } = this.props;
    return getIdOrValue(psaNeighbors, name, optionalFQN);
  };

  refreshPSANeighborsCallback = () => {
    const { actions, entityKeyId } = this.props;
    actions.refreshPSANeighbors({ id: entityKeyId });
  }

  onRiskFactorEdit = (e :Object) => {
    e.preventDefault();
    const {
      actions,
      app,
      entityKeyId,
      psaNeighbors,
      scores,
      selectedOrganizationSettings
    } = this.props;
    let dmfIdValue;
    let dmfId;
    let dmfEntity;
    let dmfRiskFactorsIdValue;
    let dmfRiskFactorsId;
    let dmfRiskFactorsEntity;

    const { riskFactors } = this.state;
    // import module settings
    const includesPretrialModule = selectedOrganizationSettings.getIn([SETTINGS.MODULES, MODULE.PRETRIAL], false);
    const scoresAndRiskFactors = getScoresAndRiskFactors(riskFactors);
    const riskFactorsEntity = Object.assign({}, scoresAndRiskFactors.riskFactors);
    const dmf = includesPretrialModule ? calculateDMF(riskFactors, scoresAndRiskFactors.scores) : {};

    const scoreId = scores.getIn([PROPERTY_TYPES.GENERAL_ID, 0]);
    const riskFactorsIdValue = this.getIdOrValue(PSA_RISK_FACTORS);
    if (includesPretrialModule) {
      dmfIdValue = this.getIdOrValue(DMF_RESULTS);
      dmfId = this.getEntityKeyId(DMF_RESULTS);
      dmfEntity = this.getDMFEntity(dmf, dmfIdValue);

      dmfRiskFactorsIdValue = this.getIdOrValue(DMF_RISK_FACTORS);
      dmfRiskFactorsId = this.getEntityKeyId(DMF_RISK_FACTORS);
      dmfRiskFactorsEntity = this.getDMFRiskFactorsEntity(riskFactors, dmfRiskFactorsIdValue);
    }


    const newScores = scoresAndRiskFactors.scores;
    const scoresEntity = scores
      .set(PROPERTY_TYPES.FTA_SCALE, newScores.get(PROPERTY_TYPES.FTA_SCALE))
      .set(PROPERTY_TYPES.NCA_SCALE, newScores.get(PROPERTY_TYPES.NCA_SCALE))
      .set(PROPERTY_TYPES.NVCA_FLAG, newScores.get(PROPERTY_TYPES.NVCA_FLAG))
      .toJS();

    if (riskFactorsIdValue) riskFactorsEntity[PROPERTY_TYPES.GENERAL_ID] = [riskFactorsIdValue];

    const scoresId = entityKeyId;
    const riskFactorsId = this.getEntityKeyId(PSA_RISK_FACTORS);

    let notesIdValue = this.getIdOrValue(RELEASE_RECOMMENDATIONS);
    const notesId = this.getEntityKeyId(RELEASE_RECOMMENDATIONS);
    if (this.getNotesFromNeighbors(psaNeighbors) !== notesIdValue) {
      notesIdValue = riskFactors.get(PSA.NOTES);
    }
    const notesEntity = this.getNotesEntity(riskFactors, notesId);

    actions.updateScoresAndRiskFactors({
      scoresId,
      scoresEntity,
      riskFactorsId,
      riskFactorsEntity,
      dmfId,
      dmfEntity,
      dmfRiskFactorsId,
      dmfRiskFactorsEntity,
      notesId,
      notesEntity
    });

    const values = {
      [EDIT_FIELDS.PSA_ID]: [scoreId],
      [EDIT_FIELDS.RISK_FACTORS_ID]: [riskFactorsId],
      [EDIT_FIELDS.DMF_ID]: [dmfId],
      [EDIT_FIELDS.DMF_RISK_FACTORS_ID]: [dmfRiskFactorsId],
      [EDIT_FIELDS.NOTES_ID]: [notesId],
      [EDIT_FIELDS.TIMESTAMP]: [toISODateTime(moment())],
      [EDIT_FIELDS.PERSON_ID]: [AuthUtils.getUserInfo().email]
    };

    if (!includesPretrialModule) {
      delete values[EDIT_FIELDS.DMF_ID];
      delete values[EDIT_FIELDS.DMF_RISK_FACTORS_ID];
    }

    if (scoreId) {
      actions.submit({
        app,
        config: psaEditedConfig,
        values
      });
    }

    this.setState({ editing: false });
  }

  handleStatusChange = () => {
    this.setState({ editing: false });
  }

  deleteHearing = () => {
    const { actions, entityKeyId } = this.props;
    actions.deleteEntity({
      entitySetId: this.getEntitySetId(HEARINGS),
      entityKeyId: this.getEntityKeyId(HEARINGS)
    });
    actions.refreshPSANeighbors({ id: entityKeyId });
  }

  getName = () => {
    const { psaNeighbors, loadingPSAModal, loadingCaseHistory } = this.props;
    const person = psaNeighbors.getIn([PEOPLE, PSA_NEIGHBOR.DETAILS], Map());
    const firstName = person.getIn([PROPERTY_TYPES.FIRST_NAME, 0], '');
    const lastName = person.getIn([PROPERTY_TYPES.LAST_NAME, 0], '');
    if (loadingPSAModal || loadingCaseHistory) return 'Loading...';
    return `${firstName} ${lastName}`;
  }

  renderSummary = () => {
    const {
      loadingPSAModal,
      loadingCaseHistory,
      psaNeighbors,
      scores,
      manualCaseHistory,
      chargeHistory,
      caseHistory,
      manualChargeHistory,
      psaPermissions,
      actions,
      selectedOrganizationSettings
    } = this.props;
    const { riskFactors } = this.state;
    let caseNumbersToAssociationId = Map();
    psaNeighbors.get(PRETRIAL_CASES, List()).forEach((pretrialCase) => {
      const caseNum = pretrialCase.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.CASE_ID, 0]);
      const associationEntityKeyId = pretrialCase.getIn([PSA_ASSOCIATION.DETAILS, OPENLATTICE_ID_FQN, 0]);
      caseNumbersToAssociationId = caseNumbersToAssociationId.set(caseNum, associationEntityKeyId);
    });

    if (loadingPSAModal || loadingCaseHistory) return <LogoLoader loadingText="Loading person details..." />;

    const arrestDate = psaNeighbors.getIn(
      [MANUAL_PRETRIAL_CASES, PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.ARREST_DATE_TIME, 0],
      ''
    );
    const lastEditDateForPSA = psaNeighbors.getIn(
      [STAFF, 0, PSA_ASSOCIATION.DETAILS, PROPERTY_TYPES.DATE_TIME, 0],
      ''
    );
    const {
      chargeHistoryForMostRecentPSA,
      caseHistoryForMostRecentPSA,
    } = getCasesForPSA(
      caseHistory,
      chargeHistory,
      scores,
      arrestDate,
      lastEditDateForPSA
    );

    const psaContext = psaNeighbors.getIn([PSA_RISK_FACTORS, PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.CONTEXT, 0], '');
    const caseContext = psaContext === CONTEXT.BOOKING ? CONTEXTS.BOOKING : CONTEXTS.COURT;
    // Get Case Context from settings and pass to config
    let chargeType = selectedOrganizationSettings.getIn([SETTINGS.CASE_CONTEXTS, caseContext], '');
    chargeType = chargeType.slice(0, 1).toUpperCase() + chargeType.slice(1);

    const pendingCharges = currentPendingCharges(chargeHistoryForMostRecentPSA);

    return (
      <PSAModalSummary
          chargeType={chargeType}
          caseNumbersToAssociationId={caseNumbersToAssociationId}
          chargeHistoryForMostRecentPSA={chargeHistoryForMostRecentPSA}
          caseHistoryForMostRecentPSA={caseHistoryForMostRecentPSA}
          addCaseToPSA={this.addCaseToPSA}
          removeCaseFromPSA={this.removeCaseFromPSA}
          downloadFn={actions.downloadPSAReviewPDF}
          scores={scores}
          neighbors={psaNeighbors}
          manualCaseHistory={manualCaseHistory}
          chargeHistory={chargeHistory}
          manualChargeHistory={manualChargeHistory}
          notes={riskFactors.get(PSA.NOTES)}
          pendingCharges={pendingCharges}
          psaPermissions={psaPermissions} />
    );
  }

  renderPSADetails = () => {
    const {
      caseHistory,
      manualCaseHistory,
      chargeHistory,
      manualChargeHistory,
      sentenceHistory,
      ftaHistory,
      psaNeighbors,
      scores,
      psaPermissions
    } = this.props;
    const psaDate = scores.getIn([PROPERTY_TYPES.DATE_TIME, 0], '');
    const { editing, riskFactors } = this.state;
    const editHeader = (editing || !psaPermissions || psaIsClosed(scores)) ? null : (
      <CenteredContainer>
        <PSAFormHeader>
          Public Safety Assessment
          <EditPSAButton onClick={() => {
            this.setState({ editing: true });
          }}>
            Edit PSA
          </EditPSAButton>
        </PSAFormHeader>
      </CenteredContainer>
    );
    const editButton = (editing || !psaPermissions || psaIsClosed(scores)) ? null : (
      <CenteredContainer>
        <EditPSAButton
            footer
            onClick={() => {
              this.setState({ editing: true });
            }}>
          Edit PSA
        </EditPSAButton>
      </CenteredContainer>
    );

    const caseNum = psaNeighbors.getIn(
      [PRETRIAL_CASES, PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.CASE_ID, 0],
      psaNeighbors.getIn(
        [MANUAL_PRETRIAL_CASES, PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.CASE_ID, 0],
        ''
      )
    );
    const currCase = manualCaseHistory
      .filter(caseObj => caseObj.getIn([PROPERTY_TYPES.CASE_ID, 0], '') === caseNum)
      .get(0, Map());
    const currCharges = manualChargeHistory.get(caseNum, List());
    const allCharges = chargeHistory.toList().flatMap(list => list);
    const allSentences = sentenceHistory.toList().flatMap(list => list);
    return (
      <ModalWrapper>
        {editHeader}
        <PSAInputForm
            section="review"
            input={riskFactors}
            handleInputChange={this.handleRiskFactorChange}
            handleSubmit={this.onRiskFactorEdit}
            currCase={currCase}
            currCharges={currCharges}
            allCharges={allCharges}
            allCases={caseHistory}
            allSentences={allSentences}
            allFTAs={ftaHistory}
            viewOnly={!editing || psaIsClosed(scores)}
            exitEdit={this.exitEdit}
            modal
            psaDate={psaDate} />
        {editButton}
      </ModalWrapper>
    );
  }

  renderDMFExplanation = () => {
    const { scores, psaNeighbors } = this.props;
    const { dmf, riskFactors } = this.state;
    if (!psaNeighbors.getIn([DMF_RESULTS, PSA_NEIGHBOR.DETAILS], Map()).size) {
      return <NoDMFContainer>A DMF was not calculated for this PSA.</NoDMFContainer>;
    }

    return (
      <ModalWrapper>
        <DMFExplanation scores={scores} dmf={dmf} riskFactors={riskFactors} />
      </ModalWrapper>
    );
  }

  addCaseToPSA = (values) => {
    const { actions, app, scores } = this.props;
    const psaId = scores.getIn([PROPERTY_TYPES.GENERAL_ID, 0]);

    const caseToPSAValues = Object.assign({}, values, {
      [PROPERTY_TYPES.TIMESTAMP]: moment().toISOString(true),
      [ID_FIELD_NAMES.PSA_ID]: psaId
    });

    actions.submit({
      app,
      config: CourtCaseForPSAConfig,
      values: caseToPSAValues,
      callback: this.refreshPSANeighborsCallback
    });
  }

  removeCaseFromPSA = (associationEntityKeyId) => {
    const { actions, fqnsToEntitySetIds, selectedOrganizationId } = this.props;
    const { deleteEntity } = actions;
    const entitySetId = fqnsToEntitySetIds.getIn([selectedOrganizationId, CALCULATED_FOR]);

    deleteEntity({
      entitySetId,
      entityKeyId: associationEntityKeyId,
      callback: this.refreshPSANeighborsCallback
    });
  }

  renderCaseHistory = () => {
    const {
      caseHistory,
      chargeHistory,
      scores,
      psaNeighbors,
      psaPermissions
    } = this.props;
    const arrestDate = psaNeighbors.getIn(
      [MANUAL_PRETRIAL_CASES, PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.ARREST_DATE_TIME, 0],
      ''
    );
    const lastEditDateForPSA = psaNeighbors.getIn(
      [STAFF, 0, PSA_ASSOCIATION.DETAILS, PROPERTY_TYPES.DATE_TIME, 0],
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
    let caseNumbersToAssociationId = Map();
    psaNeighbors.get(PRETRIAL_CASES, List()).forEach((pretrialCase) => {
      const caseNum = pretrialCase.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.CASE_ID, 0]);
      const associationEntityKeyId = pretrialCase.getIn([PSA_ASSOCIATION.DETAILS, OPENLATTICE_ID_FQN, 0]);
      caseNumbersToAssociationId = caseNumbersToAssociationId.set(caseNum, associationEntityKeyId);
    });
    const personEntityKeyId = getIdOrValue(psaNeighbors, PEOPLE, OPENLATTICE_ID_FQN);

    return (
      <ModalWrapper withPadding>
        <TitleWrapper>
          <Title withSubtitle>
            <span>Timeline</span>
            <span>Convictions in past two years</span>
          </Title>
          <LoadPersonCaseHistoryButton personEntityKeyId={personEntityKeyId} psaNeighbors={psaNeighbors} />
        </TitleWrapper>
        <CaseHistoryTimeline caseHistory={caseHistory} chargeHistory={chargeHistory} />
        <hr />
        <CaseHistory
            modal
            addCaseToPSA={this.addCaseToPSA}
            caseNumbersToAssociationId={caseNumbersToAssociationId}
            removeCaseFromPSA={this.removeCaseFromPSA}
            caseHistoryForMostRecentPSA={caseHistoryForMostRecentPSA}
            chargeHistoryForMostRecentPSA={chargeHistoryForMostRecentPSA}
            caseHistoryNotForMostRecentPSA={caseHistoryNotForMostRecentPSA}
            chargeHistoryNotForMostRecentPSA={chargeHistoryNotForMostRecentPSA}
            chargeHistory={chargeHistory}
            psaPermissions={psaPermissions} />
      </ModalWrapper>
    );
  };

  renderReleaseCondtionsSummary = () => {
    const { psaNeighbors, hearingNeighborsById } = this.props;
    const psaHearings = psaNeighbors.get(HEARINGS, List());
    const hearingsWithOutcomes = psaHearings.filter((hearing) => {
      const entityKeyId = hearing.getIn([OPENLATTICE_ID_FQN, 0]);
      return !!hearingNeighborsById.getIn([entityKeyId, OUTCOMES]);
    }).sort((h1, h2) => (moment(h1.getIn([PROPERTY_TYPES.DATE_TIME, 0], ''))
      .isBefore(h2.getIn([PROPERTY_TYPES.DATE_TIME, 0], '')) ? 1 : -1));

    return (
      <ReleaseConditionsSummary
          completedHearings={hearingsWithOutcomes}
          hearingNeighborsById={hearingNeighborsById} />
    );
  }

  renderHearings = () => {
    const {
      chargeHistory,
      hearings,
      psaNeighbors,
      submitting,
      refreshingNeighbors,
      scores,
      entityKeyId,
      personHearings,
      personNeighbors,
      personId,
      psaPermissions
    } = this.props;

    return (
      <ModalWrapper withPadding>
        <SelectHearingsContainer
            {...this.props}
            chargeHistory={chargeHistory}
            psaHearings={hearings}
            submitting={submitting}
            refreshingNeighbors={refreshingNeighbors}
            dmfId={this.getIdOrValue(DMF_RESULTS)}
            personId={personId}
            personNeighbors={personNeighbors}
            psaEntityKeyId={entityKeyId}
            deleteHearing={this.deleteHearing}
            refreshPSANeighborsCallback={this.refreshPSANeighborsCallback}
            hearingId={this.getEntityKeyId(HEARINGS)}
            personHearings={personHearings}
            readOnly={!psaPermissions}
            psaNeighbors={psaNeighbors}
            neighbors={psaNeighbors}
            defaultOutcome={psaNeighbors.getIn([OUTCOMES, PSA_NEIGHBOR.DETAILS], Map())}
            defaultDMF={psaNeighbors.getIn([DMF_RESULTS, PSA_NEIGHBOR.DETAILS], Map())}
            defaultBond={psaNeighbors.getIn([BONDS, PSA_NEIGHBOR.DETAILS], Map())}
            defaultConditions={psaNeighbors.get(RELEASE_CONDITIONS, List())
              .map(neighbor => neighbor.get(PSA_NEIGHBOR.DETAILS, Map()))}
            psaId={scores.getIn([PROPERTY_TYPES.GENERAL_ID, 0])} />
      </ModalWrapper>
    );
  }

  render() {
    const {
      loadingPSAModal,
      loadingCaseHistory,
      scores,
      open,
      psaPermissions,
      psaId,
      personId,
      selectedOrganizationSettings
    } = this.props;

    const includesPretrialModule = selectedOrganizationSettings.getIn([SETTINGS.MODULES, MODULE.PRETRIAL], '');

    const { closingPSAModalOpen } = this.state;

    if (!scores) return null;
    const changeStatusText = psaIsClosed(scores) ? 'Change PSA Status' : 'Close PSA';

    const modalHasLoaded = !loadingPSAModal && !loadingCaseHistory;

    let tabs = [
      {
        title: 'Summary',
        content: this.renderSummary
      },
      {
        title: 'PSA',
        content: this.renderPSADetails
      },
      {
        title: 'RCM',
        content: this.renderDMFExplanation
      },
      {
        title: 'Case History',
        content: this.renderCaseHistory
      },
      {
        title: 'Release Conditions',
        content: this.renderReleaseCondtionsSummary
      }
    ];

    const hearingTab = {
      title: 'Hearings',
      content: this.renderHearings
    };

    if (!psaIsClosed(scores)) {
      tabs.splice(4, 0, hearingTab);
    }

    if (!includesPretrialModule) {
      tabs = tabs.slice(0, 2);
    }

    return (
      <ModalTransition>
        { open && (
          <Modal
              scrollBehavior="outside"
              onClose={() => this.onClose()}
              width={MODAL_WIDTH}
              height={MODAL_HEIGHT}
              max-height={MODAL_HEIGHT}
              shouldCloseOnOverlayClick
              stackIndex={1}>
            { psaPermissions && modalHasLoaded
              ? (
                <ClosePSAModal
                    open={closingPSAModalOpen}
                    defaultStatus={scores.getIn([PROPERTY_TYPES.STATUS, 0], '')}
                    defaultStatusNotes={scores.getIn([PROPERTY_TYPES.STATUS_NOTES, 0], '')}
                    defaultFailureReasons={scores.get(PROPERTY_TYPES.FAILURE_REASON, List()).toJS()}
                    onClose={() => this.setState({ closingPSAModalOpen: false })}
                    onSubmit={this.handleStatusChange}
                    scores={scores}
                    entityKeyId={psaId} />
              )
              : null
            }
            <TitleWrapper>
              <TitleHeader>
                PSA Details:
                <StyledLink to={`${Routes.PERSON_DETAILS_ROOT}/${personId}${Routes.OVERVIEW}`}>
                  {`  ${this.getName()}`}
                </StyledLink>
              </TitleHeader>
              <div>
                { psaPermissions && modalHasLoaded
                  ? (
                    <ClosePSAButton onClick={() => this.setState({ closingPSAModalOpen: true })}>
                      {changeStatusText}
                    </ClosePSAButton>
                  )
                  : null
                }
                <CloseModalX onClick={() => this.onClose()} />
              </div>
            </TitleWrapper>
            <CustomTabs panes={tabs} />
          </Modal>
        )}
      </ModalTransition>
    );
  }
}

function mapStateToProps(state) {
  const app = state.get(STATE.APP);
  const psaModal = state.get(STATE.PSA_MODAL);
  return {
    app,
    [APP.FQN_TO_ID]: app.get(APP.FQN_TO_ID),
    [APP.SELECTED_ORG_ID]: app.get(APP.SELECTED_ORG_ID),
    [APP.SELECTED_ORG_SETTINGS]: app.get(APP.SELECTED_ORG_SETTINGS),

    [PSA_MODAL.SCORES]: psaModal.get(PSA_MODAL.SCORES),
    [PSA_MODAL.PSA_ID]: psaModal.get(PSA_MODAL.PSA_ID),
    [PSA_MODAL.LOADING_PSA_MODAL]: psaModal.get(PSA_MODAL.LOADING_PSA_MODAL),
    [PSA_MODAL.PSA_NEIGHBORS]: psaModal.get(PSA_MODAL.PSA_NEIGHBORS),
    [PSA_MODAL.PSA_PERMISSIONS]: psaModal.get(PSA_MODAL.PSA_PERMISSIONS),
    [PSA_MODAL.HEARINGS]: psaModal.get(PSA_MODAL.HEARINGS),
    [PSA_MODAL.HEARING_IDS]: psaModal.get(PSA_MODAL.HEARING_IDS),
    [PSA_MODAL.HEARINGS_NEIGHBORS_BY_ID]: psaModal.get(PSA_MODAL.HEARINGS_NEIGHBORS_BY_ID),
    [PSA_MODAL.LOADING_HEARING_NEIGHBORS]: psaModal.get(PSA_MODAL.LOADING_HEARING_NEIGHBORS),
    [PSA_MODAL.PERSON_HEARINGS]: psaModal.get(PSA_MODAL.PERSON_HEARINGS),
    [PSA_MODAL.PERSON_NEIGHBORS]: psaModal.get(PSA_MODAL.PERSON_NEIGHBORS),
    [PSA_MODAL.PERSON_ID]: psaModal.get(PSA_MODAL.PERSON_ID),
    [PSA_MODAL.LOADING_CASES]: psaModal.get(PSA_MODAL.LOADING_CASES),
    [PSA_MODAL.CASE_HISTORY]: psaModal.get(PSA_MODAL.CASE_HISTORY),
    [PSA_MODAL.MANUAL_CASE_HISTORY]: psaModal.get(PSA_MODAL.MANUAL_CASE_HISTORY),
    [PSA_MODAL.CHARGE_HISTORY]: psaModal.get(PSA_MODAL.CHARGE_HISTORY),
    [PSA_MODAL.MANUAL_CHARGE_HISTORY]: psaModal.get(PSA_MODAL.MANUAL_CHARGE_HISTORY),
    [PSA_MODAL.SENTENCE_HISTORY]: psaModal.get(PSA_MODAL.SENTENCE_HISTORY),
    [PSA_MODAL.FTA_HISTORY]: psaModal.get(PSA_MODAL.FTA_HISTORY)

  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(FormActionFactory).forEach((action :string) => {
    actions[action] = FormActionFactory[action];
  });

  Object.keys(ReviewActionFactory).forEach((action :string) => {
    actions[action] = ReviewActionFactory[action];
  });

  Object.keys(PSAModalActionFactory).forEach((action :string) => {
    actions[action] = PSAModalActionFactory[action];
  });

  Object.keys(CourtActionFactory).forEach((action :string) => {
    actions[action] = CourtActionFactory[action];
  });

  Object.keys(DataActionFactory).forEach((action :string) => {
    actions[action] = DataActionFactory[action];
  });

  Object.keys(SubmitActionFactory).forEach((action :string) => {
    actions[action] = SubmitActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(PSAModal);
