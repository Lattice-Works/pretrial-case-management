/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import Immutable from 'immutable';
import moment from 'moment';
import { connect } from 'react-redux';
import { Modal } from 'react-bootstrap';
import { AuthUtils } from 'lattice-auth';
import { bindActionCreators } from 'redux';

import RadioButton from '../controls/StyledRadioButton';
import Checkbox from '../controls/StyledCheckbox';
import StyledInput from '../../components/controls/StyledInput';
import InfoButton from '../buttons/InfoButton';
import closeX from '../../assets/svg/close-x-gray.svg';
import psaEditedConfig from '../../config/formconfig/PsaEditedConfig';
import { CenteredContainer } from '../../utils/Layout';
import { OL } from '../../utils/consts/Colors';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { PSA_STATUSES, PSA_FAILURE_REASONS, EDIT_FIELDS } from '../../utils/consts/Consts';
import { stripIdField } from '../../utils/DataUtils';
import { toISODateTime } from '../../utils/FormattingUtils';

import * as FormActionFactory from '../../containers/psa/FormActionFactory';
import * as ReviewActionFactory from '../../containers/review/ReviewActionFactory';
import * as SubmitActionFactory from '../../utils/submit/SubmitActionFactory';
import * as DataActionFactory from '../../utils/data/DataActionFactory';

const ModalWrapper = styled(CenteredContainer)`
  margin-top: -15px;
  padding: 15px;
  width: 100%;
  color: ${OL.GREY01};
  font-family: 'Open Sans', sans-serif;
  justify-content: center;
  h1, h2, h3 {
    width: 100%;
    text-align: left;
  }
  h1 {
    font-size: 18px;
    margin: 30px 0;
  }
  h2 {
    font-size: 16px;
    margin: 20px 0;
  }
  h3 {
    font-size: 14px;
    margin: 10px 0;
  }
`;

const TitleWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const SubmitButton = styled(InfoButton)`
  width: 340px;
  height: 43px;
  margin-top: 30px;
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

const StatusNotes = styled.div`
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RadioWrapper = styled.div`
  display: flex;
  flex-grow: 1;
`;

export const OptionsGrid = styled.div`
  display: grid;
  grid-template-columns: ${props => (`repeat(${props.numColumns}, 1fr)`)};
  grid-gap: ${props => (`${props.gap}px`)};
`;

const FailureReasonsWrapper = styled.div`
  font-size: 16px;
  text-align: left;
  color: ${OL.GREY01};
`;

type Props = {
  open :boolean,
  scores :Immutable.Map<*, *>,
  onClose :() => void,
  defaultStatus? :?string,
  entityKeyId :?string,
  defaultFailureReasons? :string[],
  defaultStatusNotes? :?string,
  onSubmit :() => void,
  onStatusChangeCallback :() => void,
  actions :{
    clearSubmit :() => void,
    submit :(value :{ config :Object, values :Object, callback? :() => void }) => void,
    downloadPSAReviewPDF :(values :{
      neighbors :Immutable.Map<*, *>,
      scores :Immutable.Map<*, *>
    }) => void,
    changePSAStatus :(values :{
      scoresId :string,
      scoresEntity :Immutable.Map<*, *>
    }) => void
  }
};

type State = {
  status :?string,
  failureReason :string[],
  statusNotes :?string
};

class ClosePSAModal extends React.Component<Props, State> {
  constructor(props :Props) {
    super(props);
    this.state = {
      status: props.defaultStatus,
      failureReason: props.defaultFailureReasons,
      statusNotes: props.defaultStatusNotes
    };
  }

  static defaultProps = {
    defaultStatus: '',
    defaultFailureReasons: [],
    defaultStatusNotes: ''
  }

  mapOptionsToRadioButtons = (options :{}, field :string) => Object.values(options).map(option => (
    <RadioWrapper key={option}>
      <RadioButton
          name={field}
          value={option}
          checked={this.state[field] === option}
          onChange={this.onStatusChange}
          disabled={this.state.disabled}
          label={option} />
    </RadioWrapper>
  ))

  mapOptionsToCheckboxes = (options :{}, field :string) => Object.values(options).map(option => (
    <RadioWrapper key={option}>
      <Checkbox
          name={field}
          value={option}
          checked={this.state[field].includes(option)}
          onChange={this.handleCheckboxChange}
          disabled={this.state.disabled}
          label={option} />
    </RadioWrapper>
  ))


  onStatusChange = (e) => {
    const { status } = this.state;
    const { name, value } = e.target;
    const failureReason = status !== PSA_STATUSES.FAILURE ? [] : this.state.failureReason;
    const state :State = Object.assign({}, this.state, {
      [name]: value,
      failureReason
    });
    this.setState(state);
  }

  handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    const values = this.state[name];

    if (checked && !values.includes(value)) {
      values.push(value);
    }
    if (!checked && values.includes(value)) {
      values.splice(values.indexOf(value), 1);
    }

    this.setState({ [name]: values });
  }

  onStatusNotesChange = (e) => {
    this.setState({ statusNotes: e.target.value });
  }

  isReadyToSubmit = () => {
    const { status, failureReason } = this.state;
    let isReady = !!status;
    if (status === PSA_STATUSES.FAILURE && !failureReason.length) {
      isReady = false;
    }
    return isReady;
  }

  handleStatusChange = (status :string, failureReason :string[], statusNotes :?string) => {
    if (!this.props.actions.changePSAStatus) return;
    const statusNotesList = (statusNotes && statusNotes.length) ? Immutable.List.of(statusNotes) : Immutable.List();

    const scoresEntity = stripIdField(this.props.scores
      .set(PROPERTY_TYPES.STATUS, Immutable.List.of(status))
      .set(PROPERTY_TYPES.FAILURE_REASON, Immutable.fromJS(failureReason))
      .set(PROPERTY_TYPES.STATUS_NOTES, statusNotesList));

    const scoresId = this.props.entityKeyId;
    this.props.actions.changePSAStatus({
      scoresId,
      scoresEntity,
      callback: this.props.onStatusChangeCallback
    });

    this.props.actions.submit({
      config: psaEditedConfig,
      values: {
        [EDIT_FIELDS.PSA_ID]: [scoresEntity.getIn([PROPERTY_TYPES.GENERAL_ID, 0])],
        [EDIT_FIELDS.TIMESTAMP]: [toISODateTime(moment())],
        [EDIT_FIELDS.PERSON_ID]: [AuthUtils.getUserInfo().email]
      },
      callback: this.props.actions.clearSubmit
    });
    this.props.onSubmit();
    this.setState({ editing: false });
  }

  submit = () => {
    if (!this.state.status) return;
    let { statusNotes } = this.state;
    if (!statusNotes || !statusNotes.length) {
      statusNotes = null;
    }

    this.handleStatusChange(this.state.status, this.state.failureReason, this.state.statusNotes);
    this.props.onClose();
  }

  render() {
    const { status, statusNotes } = this.state;
    return (
      <Modal show={this.props.open} onHide={this.props.onClose}>
        <Modal.Body>
          <ModalWrapper>
            <TitleWrapper>
              <h1>Select PSA Resolution</h1>
              <CloseModalX onClick={this.props.onClose} />
            </TitleWrapper>
            <OptionsGrid numColumns={3} gap={5}>
              {this.mapOptionsToRadioButtons(PSA_STATUSES, 'status')}
            </OptionsGrid>
            { status === PSA_STATUSES.FAILURE
              ? (
                <FailureReasonsWrapper>
                  <h2>Reason(s) for failure</h2>
                  <OptionsGrid numColumns={2} gap={10}>
                    {this.mapOptionsToCheckboxes(PSA_FAILURE_REASONS, 'failureReason')}
                  </OptionsGrid>
                </FailureReasonsWrapper>
              )
              : null
            }
            <h3>Notes</h3>
            <StatusNotes>
              <StyledInput value={statusNotes} onChange={this.onStatusNotesChange} />
            </StatusNotes>
            <SubmitButton disabled={!this.isReadyToSubmit()} onClick={this.submit}>Update</SubmitButton>
          </ModalWrapper>
        </Modal.Body>
      </Modal>
    );
  }
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(FormActionFactory).forEach((action :string) => {
    actions[action] = FormActionFactory[action];
  });

  Object.keys(ReviewActionFactory).forEach((action :string) => {
    actions[action] = ReviewActionFactory[action];
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

export default connect(null, mapDispatchToProps)(ClosePSAModal);
