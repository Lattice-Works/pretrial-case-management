/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';

import StyledButton from '../../components/buttons/StyledButton';
import { acceptTerms, termsAreAccepted } from '../../utils/consts/Consts';
import * as Routes from '../../core/router/Routes';

type Props = {
  history :string[]
}

const TermsContainer = styled.div`
  width: 100%;
  padding: 50px;
  text-align: center;
`;

const TermsWrapper = styled.div`
  max-width: 600px;
  display: inline-block;
`;

const TermsTitle = styled.div`
  font-size: 18px;
  margin-bottom: 20px;
`;

const TermsText = styled.div`
  font-size: 14px;
  margin-bottom: 20px;
`;

const TERMS = `By logging into this system you acknowledge you are accessing a restricted information system. Your usage may be monitored,
recorded, and is subject to an audit. Unauthorized use of the system is strictly prohibited and you may be subject to criminal and/or civil penalties.
By clicking Sign In, you consent to any monitoring and recording performed by this system.`;

export default class AppConsent extends React.Component<Props> {

  componentDidMount() {
    if (termsAreAccepted()) {
      this.redirect();
    }
  }

  redirect = () => {
    this.props.history.push(Routes.DASHBOARD);
  }

  acceptTerms = () => {
    acceptTerms();
    this.redirect();
  }

  render() {
    return (
      <TermsContainer>
        <TermsWrapper>
          <TermsTitle>System Use Agreement:</TermsTitle>
          <TermsText>{TERMS}</TermsText>
          <StyledButton onClick={this.acceptTerms}>Accept</StyledButton>
        </TermsWrapper>
      </TermsContainer>
    );
  }

}
