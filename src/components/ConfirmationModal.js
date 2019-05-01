/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import Modal, { ModalTransition } from '@atlaskit/modal-dialog';
import { Map } from 'immutable';

import BasicButton from './buttons/BasicButton';
import { Wrapper } from '../utils/Layout';
import { OL } from '../utils/consts/Colors';

const ModalBody = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  padding: 30px 0;
`;

const MessageBody = styled.div`
  text-align: center;
`;

const ButtonContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-items: center;
`;


const StyledBasicButton = styled(BasicButton)`
  width: 120px;
  height: 40px;
  background-color: ${props => (props.yes ? OL.PURPLE02 : OL.GREY08)};
  color: ${props => (props.yes ? OL.WHITE : OL.GREY02)};
`;

type Props = {
  confirmationType :string,
  confirmationAction :() => void,
  disabled :boolean,
  objectType :string,
  open :() => void,
  onClose :() => void,
  actions :{
    refreshPersonNeighbors :(values :{ personId :string }) => void,
    submit :(values :{
      config :Map<*, *>,
      values :Map<*, *>,
      callback :() => void
    }) => void,
  }
}

const MODAL_WIDTH = '300px';
const MODAL_HEIGHT = '200px';

const ManageSubscriptionModal = ({
  confirmationAction,
  confirmationType,
  disabled,
  open,
  onClose,
  objectType
} :Props) => (
  <Wrapper>
    <ModalTransition>
      {
        open
        && (
          <Modal
              scrollBehavior="outside"
              onClose={onClose}
              width={MODAL_WIDTH}
              height={MODAL_HEIGHT}
              max-height={MODAL_HEIGHT}
              shouldCloseOnOverlayClick
              stackIndex={30}>
            <ModalBody>
              <MessageBody>{`Are you sure you want to ${confirmationType} this ${objectType}?`}</MessageBody>
              <ButtonContainer>
                <StyledBasicButton disabled={disabled} onClick={confirmationAction} yes>Yes</StyledBasicButton>
                <StyledBasicButton disabled={disabled} onClick={onClose}>No</StyledBasicButton>
              </ButtonContainer>
            </ModalBody>
          </Modal>
        )
      }
    </ModalTransition>
  </Wrapper>
);

export default ManageSubscriptionModal;
