/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import randomUUID from 'uuid/v4';
import { Map } from 'immutable';
import { Modal } from 'react-bootstrap';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import PersonContactInfo from '../../components/person/PersonContactInfo';
import InfoButton from '../../components/buttons/InfoButton';
import addPersonContactInfoConfig from '../../config/formconfig/PersonAddContactInfoConfig';
import { getEntityKeyId } from '../../utils/DataUtils';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { FORM_IDS } from '../../utils/consts/Consts';
import {
  STATE,
  PEOPLE,
  SUBMIT,
  PSA_NEIGHBOR
} from '../../utils/consts/FrontEndStateConsts';
import {
  Wrapper,
  TitleWrapper,
  CloseModalX
} from '../../utils/Layout';

import * as OverrideClassNames from '../../utils/styleoverrides/OverrideClassNames';
import * as SubmitActionFactory from '../../utils/submit/SubmitActionFactory';

const CreateButton = styled(InfoButton)`
  width: 210px;
  height: 40px;
  margin: 30px;
  padding-left: 0;
  padding-right: 0;
`;
const Body = styled.div`
  border: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 -15px;
  width: calc(100% + 30px);
`;

type Props = {
  contactEntity :Map<*, *>,
  email :string,
  isCreatingPerson :boolean,
  isMobile :boolean,
  open :boolean,
  onClose :() => void,
  personId :string,
  phone :string,
  updatingExisting :boolean,
  actions :{
    submit :(values :{
      config :Map<*, *>,
      values :Map<*, *>,
      callback :() => void
    }) => void,
    replaceEntity :(value :{ entitySetName :string, entityKeyId :string, values :Object }) => void,
  },
}

class NewHearingSection extends React.Component<Props, State> {

  static defaultProps = {
    onSubmit: () => {}
  }

  constructor(props :Props) {
    super(props);
    this.state = {
      [PROPERTY_TYPES.EMAIL]: '',
      [PROPERTY_TYPES.PHONE]: '',
      [PROPERTY_TYPES.IS_MOBILE]: false
    };
  }

  componentWillReceiveProps(nextProps) {
    const { phone, email, isMobile } = this.props;
    const areDifferent = !(phone === nextProps.phone)
      || !(email === nextProps.email)
      || !(isMobile === nextProps.isMobile);
    if (areDifferent) {
      this.updateState(nextProps.phone, nextProps.email, nextProps.isMobile);
    }
  }

  updateState = (phone, email, isMobile) => {
    this.setState({
      [PROPERTY_TYPES.EMAIL]: email,
      [PROPERTY_TYPES.PHONE]: phone,
      [PROPERTY_TYPES.IS_MOBILE]: isMobile
    });
  }

  updateContact = () => {
    const { state } = this;
    const {
      actions,
      contactEntity,
      onClose,
      updatingExisting,
      personId
    } = this.props;
    const { replaceEntity, submit } = actions;
    const entityKeyId = getEntityKeyId(contactEntity.get(PSA_NEIGHBOR.DETAILS, Map()));
    const email = state[PROPERTY_TYPES.EMAIL];
    const phone = state[PROPERTY_TYPES.PHONE];
    const isMobile = state[PROPERTY_TYPES.IS_MOBILE];
    let newContactFields = {
      [PROPERTY_TYPES.EMAIL]: [email],
      [PROPERTY_TYPES.PHONE]: [phone],
      [PROPERTY_TYPES.IS_MOBILE]: [isMobile]
    };

    if (updatingExisting) {
      replaceEntity({
        entityKeyId,
        entitySetName: ENTITY_SETS.CONTACT_INFORMATION,
        values: newContactFields
      });
    }
    else {
      newContactFields = Object.assign({}, newContactFields, {
        [PROPERTY_TYPES.GENERAL_ID]: randomUUID(),
        [PROPERTY_TYPES.CONTACT_INFO_GIVEN_ID]: randomUUID(),
        [FORM_IDS.PERSON_ID]: personId
      });
      submit({
        config: addPersonContactInfoConfig,
        values: newContactFields,
      });
    }
    onClose();
  }


  phoneIsValid = () => {
    const { state } = this;
    const phone = state[PROPERTY_TYPES.PHONE];
    return (
      phone ? !phone.match(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/) : false
    );
  }

  emailIsValid = () => {
    const { state } = this;
    const email = state[PROPERTY_TYPES.EMAIL];
    return (
      email ? !email.match(/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/) : false
    );
  }

  isReadyToSubmit = () :boolean => {
    const { isCreatingPerson } = this.props;
    const { state } = this;
    const phoneFormatIsCorrect = state[PROPERTY_TYPES.PHONE]
      ? !this.phoneIsValid()
      : true;
    const emailFormatIsCorrect = state[PROPERTY_TYPES.EMAIL]
      ? !this.emailIsValid()
      : true;
    return !isCreatingPerson && phoneFormatIsCorrect && emailFormatIsCorrect;
  }

  onInputChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleCheckboxChange = (e) => {
    this.setState({
      [PROPERTY_TYPES.IS_MOBILE]: e.target.checked || false
    });
  }

  renderSubmitButton = () => (
    <CreateButton disabled={!this.isReadyToSubmit()} onClick={this.updateContact}>
      Submit
    </CreateButton>
  );

  render() {
    const { open, onClose, personId } = this.props;
    const { state } = this;
    return (
      <Wrapper>
        <Modal
            show={open}
            onHide={onClose}
            dialogClassName={OverrideClassNames.PSA_REVIEW_MODAL}>
          <Modal.Body>
            <TitleWrapper>
              <h1>Edit Contact Information</h1>
              <div>
                <CloseModalX onClick={onClose} />
              </div>
            </TitleWrapper>
            <Body>
              <PersonContactInfo
                  phone={state[PROPERTY_TYPES.PHONE]}
                  phoneIsValid={this.phoneIsValid()}
                  email={state[PROPERTY_TYPES.EMAIL]}
                  emailIsValid={this.emailIsValid()}
                  isMobile={state[PROPERTY_TYPES.IS_MOBILE]}
                  handleOnChangeInput={this.onInputChange}
                  handleCheckboxChange={this.handleCheckboxChange}
                  noBorder />
              { this.renderSubmitButton() }
            </Body>
          </Modal.Body>
        </Modal>
      </Wrapper>
    );
  }
}

function mapStateToProps(state) {
  const people = state.get(STATE.PEOPLE);
  const submit = state.get(STATE.SUBMIT);

  return {
    [PEOPLE.FETCHING_PERSON_DATA]: people.get(PEOPLE.FETCHING_PERSON_DATA),
    [PEOPLE.PERSON_DATA]: people.get(PEOPLE.PERSON_DATA),

    [SUBMIT.SUBMITTING]: submit.get(SUBMIT.SUBMITTING, false)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(SubmitActionFactory).forEach((action :string) => {
    actions[action] = SubmitActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NewHearingSection);
