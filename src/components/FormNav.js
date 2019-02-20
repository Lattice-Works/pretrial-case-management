/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { Button } from 'react-bootstrap';

import { OL } from '../utils/consts/Colors';

const StyledNavBtnWrapper = styled.div`
  text-align: center;
  width: 100%;
`;

export const NavButton = styled(Button)`
  font-weight: medium;
  margin: 0 10px;
`;

export const NextButton = styled(NavButton)`
  background: ${OL.BLUE09};
  color: ${OL.WHITE};
`;

export const SubmitButton = styled(NextButton).attrs({
  type: (props) => {
    return props.type || 'submit';
  }
})`
`;

type Props = {
  prevPath? :string,
  nextPath? :string,
  submit? :boolean,
  handlePageChange :(path :string) => void,
  handleSubmit :(event :Object) => void
};

const FormNav = ({
  prevPath,
  nextPath,
  submit,
  handlePageChange,
  handleSubmit
} :Props) => {

  const renderNav = () => {
    return (
      <StyledNavBtnWrapper>
        {
          prevPath && prevPath.length
            ? <NavButton onClick={() => {
              handlePageChange(prevPath);
            }}>Prev</NavButton>
            : null
        }
        {
          nextPath && nextPath.length
            ? <NextButton onClick={() => {
              handlePageChange(nextPath);
            }}>Next</NextButton>
            : null
        }
      </StyledNavBtnWrapper>
    );
  };

  const renderSubmit = () => {
    return (
      <StyledNavBtnWrapper>
        <NavButton onClick={() => {
          handlePageChange(prevPath);
        }}>
          Prev
        </NavButton>
        <SubmitButton onClick={handleSubmit}>Submit</SubmitButton>
      </StyledNavBtnWrapper>
    );
  };

  return (
    <div>
      { submit ? renderSubmit() : renderNav() }
    </div>
  );
};

FormNav.defaultProps = {
  prevPath: null,
  nextPath: null,
  submit: null
};

export default FormNav;
