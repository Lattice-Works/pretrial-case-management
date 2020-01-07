/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import type { Dispatch } from 'redux';
import type { RequestSequence } from 'redux-reqseq';
import { List, Map, fromJS } from 'immutable';
import Modal, { ModalTransition } from '@atlaskit/modal-dialog';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import RadioButton from '../controls/StyledRadioButton';
import Checkbox from '../controls/StyledCheckbox';
import StyledInput from '../controls/StyledInput';
import InfoButton from '../buttons/InfoButton';
import closeX from '../../assets/svg/close-x-gray.svg';
import { CenteredContainer } from '../../utils/Layout';
import { OL } from '../../utils/consts/Colors';
import { MODULE, SETTINGS } from '../../utils/consts/AppSettingConsts';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { PSA_STATUSES, PSA_FAILURE_REASONS } from '../../utils/consts/Consts';
import { getEntityKeyId, stripIdField } from '../../utils/DataUtils';

import { STATE } from '../../utils/consts/redux/SharedConsts';
import { APP_DATA } from '../../utils/consts/redux/AppConsts';

import { editPSA } from '../../containers/psa/PSAFormActions';
import { changePSAStatus } from '../../containers/review/ReviewActions';


const CloseModalX = styled.img.attrs({
  alt: '',
  src: closeX
})`
  height: 16px;
  margin-left: 40px;
  width: 16px;

  &:hover {
    cursor: pointer;
  }
`;

const FailureReasonsWrapper = styled.div`
  color: ${OL.GREY01};
  font-size: 16px;
  text-align: left;
`;

const ModalWrapper = styled(CenteredContainer)`
  color: ${OL.GREY01};
  font-family: 'Open Sans', sans-serif;
  justify-content: center;
  margin-top: -15px;
  padding: 15px;
  width: 100%;

  h1,
  h2,
  h3 {
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

export const OptionsGrid = styled.div`
  display: grid;
  grid-gap: ${(props) => (`${props.gap}px`)};
  grid-template-columns: ${(props) => (`repeat(${props.numColumns}, 1fr)`)};
`;

const RadioWrapper = styled.div`
  display: flex;
  flex-grow: 1;
`;

const StatusNotes = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  text-align: left;
`;

const SubmitButton = styled(InfoButton)`
  height: 43px;
  margin-top: 30px;
  width: 340px;
`;

const TitleWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

type Props = {
  actions :{
    changePSAStatus :RequestSequence;
    editPSA :RequestSequence;
  },
  app :Map;
  defaultFailureReasons? :string[];
  defaultStatus? :?string;
  defaultStatusNotes? :?string;
  entityKeyId :?string;
  onClose :() => void;
  onSubmit :() => void;
  open :boolean;
  scores :Map;
  selectedOrganizationSettings :Map;
};

type State = {
  status :?string;
  failureReason :string[];
  statusNotes :?string;
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

  mapOptionsToRadioButtons = (options :{}, field :string) => {
    const {
      [field]: fieldOption,
      disabled
    } = this.state;
    return Object.values(options).map((option) => (
      <RadioWrapper key={option}>
        <RadioButton
            hieght={56}
            name={field}
            value={option}
            checked={fieldOption === option}
            onChange={this.onStatusChange}
            disabled={disabled}
            label={option} />
      </RadioWrapper>
    ));
  }
  mapOptionsToCheckboxes = (options :{}, field :string) => {
    const {
      [field]: fieldOptions,
      disabled
    } = this.state;
    return Object.values(options).map((option) => (
      <RadioWrapper key={option}>
        <Checkbox
            name={field}
            value={option}
            checked={fieldOptions.includes(option)}
            onChange={this.handleCheckboxChange}
            disabled={disabled}
            label={option} />
      </RadioWrapper>
    ));
  }

  onStatusChange = (e) => {
    const { status } = this.state;
    let { failureReason } = this.state;
    const { name, value } = e.target;
    if (status !== PSA_STATUSES.FAILURE) failureReason = [];
    const state :State = {
      ...this.state,
      [name]: value,
      failureReason
    };
    this.setState(state);
  }

  handleCheckboxChange = (e) => {
    const { name, value, checked } = e.target;
    const { [name]: values } = this.state;

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

  handleStatusChange = (app :Map<*, *>, status :string, failureReason :string[], statusNotes :?string) => {
    const {
      actions,
      scores,
      onSubmit,
      entityKeyId
    } = this.props;
    if (!actions.changePSAStatus) return;
    const statusNotesList = (statusNotes && statusNotes.length) ? List.of(statusNotes) : List();
    const psaEKID = getEntityKeyId(scores);

    const scoresEntity = stripIdField(scores
      .set(PROPERTY_TYPES.STATUS, List.of(status))
      .set(PROPERTY_TYPES.FAILURE_REASON, fromJS(failureReason))
      .set(PROPERTY_TYPES.STATUS_NOTES, statusNotesList));
    actions.changePSAStatus({
      scoresId: entityKeyId,
      scoresEntity
    });

    actions.editPSA({ psaEKID });
    onSubmit();
    this.setState({ editing: false });
  }

  submit = () => {
    const { app, onClose } = this.props;
    const { status, failureReason } = this.state;
    let { statusNotes } = this.state;
    if (!status) return;
    if (!statusNotes || !statusNotes.length) {
      statusNotes = null;
    }

    this.handleStatusChange(app, status, failureReason, statusNotes);
    onClose();
  }

  render() {
    const { open, onClose, selectedOrganizationSettings } = this.props;
    const includesPretrialModule = selectedOrganizationSettings.getIn([SETTINGS.MODULES, MODULE.PRETRIAL], '');
    const { status, statusNotes } = this.state;
    return (
      <ModalTransition>
        { open
          && (
            <Modal
                onClose={() => onClose()}
                shouldCloseOnOverlayClick
                stackIndex={2}
                scrollBehavior="outside">
              <ModalWrapper>
                <TitleWrapper>
                  <h1>Select PSA Resolution</h1>
                  <CloseModalX onClick={() => onClose()} />
                </TitleWrapper>
                <OptionsGrid numColumns={includesPretrialModule ? 3 : 2} gap={5}>
                  {
                    includesPretrialModule
                      ? this.mapOptionsToRadioButtons(PSA_STATUSES, 'status')
                      : this.mapOptionsToRadioButtons(
                        fromJS(PSA_STATUSES)
                          .filter((value) => value === PSA_STATUSES.OPEN || value === PSA_STATUSES.CANCELLED)
                          .toJS(),
                        'status'
                      )
                  }
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
                  : null}
                <h3>Notes</h3>
                <StatusNotes>
                  <StyledInput value={statusNotes} onChange={this.onStatusNotesChange} />
                </StatusNotes>
                <SubmitButton disabled={!this.isReadyToSubmit()} onClick={this.submit}>Update</SubmitButton>
              </ModalWrapper>
            </Modal>
          )}
      </ModalTransition>
    );
  }
}

function mapStateToProps(state) {
  const app = state.get(STATE.APP);
  return {
    app,
    [APP_DATA.SELECTED_ORG_SETTINGS]: app.get(APP_DATA.SELECTED_ORG_SETTINGS)
  };
}

const mapDispatchToProps = (dispatch :Dispatch<any>) => ({
  actions: bindActionCreators({
    // Review Actions
    changePSAStatus,
    // Form Actions
    editPSA
  }, dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(ClosePSAModal);
