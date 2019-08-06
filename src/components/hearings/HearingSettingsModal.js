/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import Modal, { ModalTransition } from '@atlaskit/modal-dialog';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import HearingSettingsForm from '../../containers/hearings/HearingSettingsForm';
import { STATE } from '../../utils/consts/FrontEndStateConsts';
import { HEARINGS_DATA } from '../../utils/consts/redux/HearingsConsts';
import {
  CloseModalX,
  PaddedStyledColumnRow,
  TitleWrapper,
  Wrapper
} from '../../utils/Layout';

import { closeHearingSettingsModal } from '../../containers/hearings/HearingsActions';


const ModalBody = styled.div`
  width: 100%;
  padding: 0 30px;
`;

const ColumnRow = styled(PaddedStyledColumnRow)`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
`;

type Props = {
  hearingSettingsModalOpen :boolean,
  actions :{
    closeHearingSettingsModal :() => void
  }
}

const MODAL_WIDTH = '875px';
const MODAL_HEIGHT = 'max-content';

class HearingSettingsModal extends React.Component<Props, State> {

  onClose = () => {
    const { actions } = this.props;
    actions.closeHearingSettingsModal();
  }

  render() {
    const { hearingSettingsModalOpen: open } = this.props;
    return (
      <Wrapper>
        <ModalTransition>
          {
            open
            && (
              <Modal
                  scrollBehavior="outside"
                  onClose={this.onClose}
                  width={MODAL_WIDTH}
                  height={MODAL_HEIGHT}
                  max-height={MODAL_HEIGHT}
                  shouldCloseOnOverlayClick
                  stackIndex={20}>
                <ModalBody>
                  <ColumnRow>
                    <TitleWrapper noPadding>
                      <h2>Hearing Settings</h2>
                      <div>
                        <CloseModalX onClick={this.onClose} />
                      </div>
                    </TitleWrapper>
                  </ColumnRow>
                  <ColumnRow>
                    <HearingSettingsForm />
                  </ColumnRow>
                </ModalBody>
              </Modal>
            )
          }
        </ModalTransition>
      </Wrapper>
    );
  }
}

function mapStateToProps(state) {
  const hearings = state.get(STATE.HEARINGS);
  return {
    [HEARINGS_DATA.SETTINGS_MODAL_OPEN]: hearings.get(HEARINGS_DATA.SETTINGS_MODAL_OPEN)
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  actions.closeHearingSettingsModal = closeHearingSettingsModal;

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(HearingSettingsModal);
