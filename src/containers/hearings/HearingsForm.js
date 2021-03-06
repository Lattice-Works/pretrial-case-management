/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import type { Dispatch } from 'redux';
import type { RequestSequence, RequestState } from 'redux-reqseq';
import { DateTime } from 'luxon';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  Button,
  DateTimePicker,
  Input,
  Select
} from 'lattice-ui-kit';
import {
  fromJS,
  Map,
  List,
  Set
} from 'immutable';

import ConfirmationModal from '../../components/ConfirmationModal';
import LogoLoader from '../../components/LogoLoader';
import { formatDateTime } from '../../utils/FormattingUtils';
import { APP_TYPES, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { CONFIRMATION_ACTION_TYPES, CONFIRMATION_OBJECT_TYPES } from '../../utils/consts/Consts';
import { OL } from '../../utils/consts/Colors';
import { HEARING_CONSTS } from '../../utils/consts/HearingConsts';
import { COURTROOM_OPTIOINS, getJudgeOptions, formatJudgeName } from '../../utils/HearingUtils';
import { PSA_ASSOCIATION } from '../../utils/consts/FrontEndStateConsts';
import { SETTINGS } from '../../utils/consts/AppSettingConsts';
import { Data, Field, Header } from '../../utils/Layout';
import {
  getEntityKeyId,
  getEntityProperties,
  getNeighborDetailsForEntitySet,
  isUUID
} from '../../utils/DataUtils';

// Redux State Imports
import JUDGES_DATA from '../../utils/consts/redux/JudgeConsts';
import { getReqState, requestIsPending, requestIsSuccess } from '../../utils/consts/redux/ReduxUtils';
import { STATE } from '../../utils/consts/redux/SharedConsts';
import { APP_DATA } from '../../utils/consts/redux/AppConsts';
import { HEARINGS_ACTIONS, HEARINGS_DATA } from '../../utils/consts/redux/HearingsConsts';

// Action Imports
import { clearSubmittedHearing, submitHearing, updateHearing } from './HearingsActions';

const { PREFERRED_COUNTY } = SETTINGS;

const { JUDGES } = APP_TYPES;
const {
  CASE_ID,
  DATE_TIME,
  COURTROOM,
  ENTITY_KEY_ID,
} = PROPERTY_TYPES;

const HearingFormSection = styled.div`
  padding: 30px;
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-gap: 10px;
  border-bottom: 1px solid ${OL.GREY11};
`;

const HearingFormHeaderWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  padding-bottom: 20px;
  justify-content: space-between;
  grid-column-start: 1;
  grid-column-end: 4;
`;

const HearingFormHeader = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${OL.GREY15};
`;

const HearingInfoButtons = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  button {
    margin-left: 10px;
  }
`;

const INITIAL_STATE = {
  confirmationModalOpen: false,
  modifyingHearing: false,
  newHearingCourtroom: '',
  newHearingDateTime: DateTime.local().toISO(),
  judge: '',
  judgeEKID: '',
  otherJudgeText: '',
};

type Props = {
  actions :{
    clearSubmittedHearing :() => void;
    submitHearing :RequestSequence,
    updateHearing :RequestSequence,
  };
  allJudges :List;
  app :Map;
  backToSelection :() => void;
  hearing :Map;
  hearingCourtroom :string;
  hearingDateTime :string;
  hearingJudgeEKID :string;
  hearingNeighbors :Map;
  judgesByCounty :Map;
  judgesById :Map;
  updateHearingReqState :RequestState;
  psaEKID :string;
  personEKID :string;
}

type State = {
  confirmationModalOpen :boolean;
  modifyingHearing :boolean;
  newHearingCourtroom :string;
  newHearingDateTime :string;
  judge :string;
  judgeEKID :string;
  otherJudgeText :string;
}

class HearingForm extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);
    this.state = INITIAL_STATE;
  }

  componentDidMount() {
    const { allJudges, hearing } = this.props;
    let judge = '';
    let modifyingHearing = true;
    let {
      [HEARINGS_DATA.DATE_TIME]: newHearingDateTime,
      [HEARINGS_DATA.COURTROOM]: newHearingCourtroom,
      [HEARINGS_DATA.JUDGE]: judgeEKID
    } = this.props;
    if (hearing) {
      modifyingHearing = false;
      const {
        hearingCourtroom,
        hearingDateTime
      } = this.getHearingInfo();
      newHearingCourtroom = hearingCourtroom;
      newHearingDateTime = hearingDateTime;
    }
    const { judgeEntity } = this.getJudgeEntity();
    if (judgeEntity.size) {
      judgeEKID = getEntityKeyId(judgeEntity);
    }

    allJudges.forEach((judgeObj) => {
      const hearingJudgeEKID = getEntityKeyId(judgeObj);
      const fullNameString = formatJudgeName(judgeObj);
      if (judgeEKID === hearingJudgeEKID) judge = fullNameString;
    });

    this.setState({
      modifyingHearing,
      newHearingCourtroom,
      newHearingDateTime,
      judge,
      judgeEKID
    });
  }

  componentDidUpdate(prevProps :Props) {
    const { updateHearingReqState } = this.props;
    const wasPending = requestIsPending(prevProps.updateHearingReqState);
    const isSuccess = requestIsSuccess(updateHearingReqState);
    if (wasPending && isSuccess) {
      this.closeConfirmationModal();
    }
  }

  componentWillUnmount() {
    const { actions } = this.props;
    actions.clearSubmittedHearing();
    this.closeConfirmationModal();
  }

  openConfirmationModal = () => this.setState({
    confirmationModalOpen: true
  });

  closeConfirmationModal = () => this.setState({
    confirmationModalOpen: false
  });

  renderConfirmationModal = () => {
    const { updateHearingReqState } = this.props;
    const hearingCancellationIsPending = requestIsPending(updateHearingReqState);
    const { confirmationModalOpen } = this.state;

    return (
      <ConfirmationModal
          disabled={hearingCancellationIsPending}
          customText=""
          confirmationType={CONFIRMATION_ACTION_TYPES.CANCEL}
          objectType={CONFIRMATION_OBJECT_TYPES.HEARING}
          onClose={this.closeConfirmationModal}
          open={confirmationModalOpen}
          confirmationAction={this.cancelHearing} />
    );
  }

  submitHearing = () => {
    const {
      actions,
      personEKID,
      psaEKID,
      backToSelection
    } = this.props;
    const {
      newHearingDateTime,
      newHearingCourtroom,
      otherJudgeText,
      judge,
      judgeEKID
    } = this.state;
    const datetime = DateTime.fromISO(newHearingDateTime);
    if (datetime.isValid) {
      if (judge === 'Other') {
        this.setState({ judgeEKID: '' });
      }
      const hearingDateTime = datetime.toISO();
      const hearingCourtroom = newHearingCourtroom;
      const hearingComments = otherJudgeText;
      actions.submitHearing({
        hearingDateTime,
        hearingCourtroom,
        hearingComments,
        judgeEKID,
        personEKID,
        psaEKID
      });
      this.setState(INITIAL_STATE);
    }
    if (backToSelection) backToSelection();
  }

  getHearingInfo = () => {
    const { hearing } = this.props;
    let hearingDateTime = '';
    let hearingCourtroom = '';
    if (hearing) {
      const {
        [DATE_TIME]: existingHearingDateTime,
        [COURTROOM]: existingHearingCourtroom,
      } = getEntityProperties(hearing, [DATE_TIME, COURTROOM]);
      hearingDateTime = existingHearingDateTime;
      hearingCourtroom = existingHearingCourtroom;
    }
    return { hearingDateTime, hearingCourtroom };
  }

  getJudgeEntity = () => {
    const { hearing, hearingNeighbors } = this.props;
    let judgeEntity = Map();
    let judgeAssociationEKID;
    let judgesNameFromHearingComments;
    let judgeName;
    if (hearing && hearingNeighbors) {
      judgeEntity = getNeighborDetailsForEntitySet(hearingNeighbors, JUDGES);
      judgeAssociationEKID = hearingNeighbors.getIn([JUDGES, PSA_ASSOCIATION.DETAILS, ENTITY_KEY_ID, 0], '');
      judgesNameFromHearingComments = hearing.getIn([PROPERTY_TYPES.HEARING_COMMENTS, 0], 'N/A');
      judgeName = judgeEntity.size ? formatJudgeName(judgeEntity) : judgesNameFromHearingComments;
    }

    return {
      judgeEntity,
      judgeName,
      judgeAssociationEKID
    };
  }

  updateHearing = () => {
    const {
      actions,
      hearing
    } = this.props;
    const {
      judge,
      judgeEKID,
      newHearingDateTime,
      newHearingCourtroom,
      otherJudgeText
    } = this.state;
    let judgeText;
    const judgeIsOther = (judge === 'Other');

    const { judgeEntity, judgeAssociationEKID } = this.getJudgeEntity();
    if (judgeIsOther) {
      this.setState({ judgeEKID: '' });
      judgeText = [otherJudgeText];
    }
    const { [DATE_TIME]: existingHearingDateTime } = getEntityProperties(hearing, [DATE_TIME]);

    const dateTime = newHearingDateTime || existingHearingDateTime;
    const hearingDateTime = DateTime.fromISO(dateTime);

    const oldJudgeEKID = getEntityKeyId(judgeEntity);
    const judgeHasChanged = oldJudgeEKID !== judgeEKID;

    const associationEntityKeyId = judgeHasChanged ? judgeAssociationEKID : null;
    const newHearing = {};
    if (hearingDateTime.isValid) newHearing[PROPERTY_TYPES.DATE_TIME] = [hearingDateTime.toISO()];
    if (newHearingCourtroom) newHearing[PROPERTY_TYPES.COURTROOM] = [newHearingCourtroom];
    if (judgeText) newHearing[PROPERTY_TYPES.HEARING_COMMENTS] = judgeText;

    actions.updateHearing({
      newHearing,
      oldHearing: hearing,
      judgeEKID,
      oldJudgeAssociationEKID: associationEntityKeyId
    });

    this.setState({ modifyingHearing: false });
  }

  isReadyToSubmit = () => {
    const {
      newHearingCourtroom,
      newHearingDateTime,
      judgeEKID,
      otherJudgeText
    } = this.state;
    const judgeInfoPresent = (judgeEKID || otherJudgeText);
    return (
      newHearingCourtroom
      && newHearingDateTime
      && judgeInfoPresent
    );
  }

  onInputChange = (e :SyntheticInputEvent<HTMLElement>) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  onDateChange = (hearingDateTime :string) => {
    this.setState({ [HEARING_CONSTS.NEW_HEARING_DATE_TIME]: hearingDateTime });
  }

  renderDateTimePicker = () => {
    const { newHearingDateTime, modifyingHearing } = this.state;
    const { hearingDateTime } = this.getHearingInfo();
    return modifyingHearing
      ? (
        <DateTimePicker
            ampm={false}
            onChange={this.onDateChange}
            value={newHearingDateTime || DateTime.local().toISODate()} />
      ) : formatDateTime(hearingDateTime);
  }

  onSelectChange = (option :Object) => {
    const optionMap = fromJS(option);
    switch (optionMap.get(HEARING_CONSTS.FIELD)) {
      case HEARING_CONSTS.JUDGE: {
        this.setState({
          [HEARING_CONSTS.JUDGE]: optionMap.getIn([HEARING_CONSTS.FULL_NAME]),
          [HEARING_CONSTS.JUDGE_ID]: optionMap.getIn([ENTITY_KEY_ID, 0])
        });
        break;
      }
      case HEARING_CONSTS.NEW_HEARING_COURTROOM: {
        this.setState({
          [HEARING_CONSTS.NEW_HEARING_COURTROOM]: optionMap.get(HEARING_CONSTS.NEW_HEARING_COURTROOM)
        });
        break;
      }
      default:
        break;
    }
  }

  renderCourtoomOptions = () => {
    const { newHearingCourtroom, modifyingHearing } = this.state;
    const { hearingCourtroom } = this.getHearingInfo();
    return modifyingHearing
      ? (
        <Select
            options={COURTROOM_OPTIOINS}
            value={{ label: newHearingCourtroom, value: newHearingCourtroom }}
            onChange={(courtroom) => this.onSelectChange({
              [HEARING_CONSTS.FIELD]: HEARING_CONSTS.NEW_HEARING_COURTROOM,
              [HEARING_CONSTS.NEW_HEARING_COURTROOM]: courtroom.label
            })}
            short />
      ) : hearingCourtroom;
  }

  renderJudgeOptions = () => {
    const { app, judgesById, judgesByCounty } = this.props;
    const { judge, modifyingHearing } = this.state;
    const { judgeName } = this.getJudgeEntity();
    const preferredCountyEKID = app.getIn([APP_DATA.SELECTED_ORG_SETTINGS, PREFERRED_COUNTY], '');
    const judgeIdsForCounty = judgesByCounty.get(preferredCountyEKID, Set());
    return modifyingHearing
      ? (
        <Select
            options={getJudgeOptions(judgeIdsForCounty, judgesById, true)}
            value={{ label: judge, value: judge }}
            onChange={(judgeOption) => this.onSelectChange(judgeOption.value)}
            short />
      ) : judgeName;
  }

  renderOtherJudgeTextField = () => {
    const { otherJudgeText, modifyingHearing } = this.state;
    return modifyingHearing
      ? (
        <Input
            onChange={this.onInputChange}
            name="otherJudgeText"
            value={otherJudgeText} />
      ) : otherJudgeText;
  }

  renderCreateHearingButton = () => (
    <Button color="primary" disabled={!this.isReadyToSubmit()} onClick={this.submitHearing}>
      Create New
    </Button>
  );

  renderUpdateAndCancelButtons = () => {
    const { hearing } = this.props;
    const { modifyingHearing } = this.state;
    const { [CASE_ID]: hearingId } = getEntityProperties(hearing, [CASE_ID, DATE_TIME]);
    if (hearingId && !isUUID(hearingId)) return null;
    return modifyingHearing
      ? (
        <HearingInfoButtons modifyingHearing>
          <Button onClick={() => this.setState({ modifyingHearing: false })}>Cancel</Button>
          <Button color="secondary" onClick={this.openConfirmationModal}>Cancel Hearing</Button>
          <Button color="secondary" update onClick={this.updateHearing}>Update</Button>
          {this.renderConfirmationModal()}
        </HearingInfoButtons>
      )
      : (
        <HearingInfoButtons>
          <Button color="secondary" onClick={() => this.setState({ modifyingHearing: true })}>
            Edit
          </Button>
        </HearingInfoButtons>
      );
  }

  cancelHearing = () => {
    const {
      actions,
      backToSelection,
      hearing,
      personEKID
    } = this.props;
    const newHearing = { [PROPERTY_TYPES.HEARING_INACTIVE]: [true] };
    actions.updateHearing({
      newHearing,
      oldHearing: hearing,
      personEKID
    });
    if (backToSelection) backToSelection();
  }

  renderBackToSelectionButton = () => {
    const { backToSelection } = this.props;
    return backToSelection
      ? <Button color="secondary" onClick={backToSelection}>Back to Selection</Button>
      : null;
  }

  renderCreateOrEditButtonGroups = () => {
    const { hearing } = this.props;
    let buttonGroup = null;
    if (hearing) {
      buttonGroup = (
        <>
          { this.renderUpdateAndCancelButtons() }
        </>
      );
    }
    else {
      buttonGroup = this.renderCreateHearingButton();
    }
    return buttonGroup;
  }

  render() {
    const { updateHearingReqState } = this.props;
    const updatingHearing = requestIsPending(updateHearingReqState);
    if (updatingHearing) return <LogoLoader size={30} loadingText="Updating Hearing" />;
    const { judge } = this.state;
    const dateTime = this.renderDateTimePicker();
    const courtroom = this.renderCourtoomOptions();
    const judgeSelect = this.renderJudgeOptions();
    const otherJudge = this.renderOtherJudgeTextField();

    const HEARING_ARR = [
      {
        label: 'Date',
        content: dateTime
      },
      {
        label: 'Courtroom',
        content: courtroom
      },
      {
        label: 'Judge',
        content: judgeSelect
      }
    ];
    if (judge === 'Other') {
      HEARING_ARR.push(
        {
          label: "Other Judge's Name",
          content: otherJudge
        }
      );
    }

    const hearingInfoContent = HEARING_ARR.map((hearingItem) => (
      <Field key={hearingItem.label}>
        <Header>{hearingItem.label}</Header>
        <Data>{hearingItem.content}</Data>
      </Field>
    ));

    return (
      <HearingFormSection>
        <HearingFormHeaderWrapper>
          <HearingFormHeader>Hearing</HearingFormHeader>
          { this.renderCreateOrEditButtonGroups() }
        </HearingFormHeaderWrapper>
        {hearingInfoContent}
      </HearingFormSection>
    );
  }
}

function mapStateToProps(state) {
  const app = state.get(STATE.APP);
  const hearings = state.get(STATE.HEARINGS);
  const judges = state.get(STATE.JUDGES);
  return {
    app,

    [JUDGES_DATA.ALL_JUDGES]: judges.get(JUDGES_DATA.ALL_JUDGES),
    [JUDGES_DATA.JUDGES_BY_COUNTY]: judges.get(JUDGES_DATA.JUDGES_BY_COUNTY),
    [JUDGES_DATA.JUDGES_BY_ID]: judges.get(JUDGES_DATA.JUDGES_BY_ID),
    [HEARINGS_DATA.DATE_TIME]: hearings.get(HEARINGS_DATA.DATE_TIME),
    [HEARINGS_DATA.COURTROOM]: hearings.get(HEARINGS_DATA.COURTROOM),
    [HEARINGS_DATA.JUDGE]: hearings.get(HEARINGS_DATA.JUDGE),
    submitExistingHearingReqState: getReqState(hearings, HEARINGS_ACTIONS.SUBMIT_EXISTING_HEARING),
    updateHearingReqState: getReqState(hearings, HEARINGS_ACTIONS.UPDATE_HEARING)
  };
}

const mapDispatchToProps = (dispatch :Dispatch<any>) => ({
  actions: bindActionCreators({
    // Hearings Actions
    clearSubmittedHearing,
    submitHearing,
    updateHearing
  }, dispatch)
});

// $FlowFixMe
export default connect(mapStateToProps, mapDispatchToProps)(HearingForm);
