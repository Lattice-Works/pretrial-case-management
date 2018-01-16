import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';

const StyledNavBtnWrapper = styled.div`
  text-align: center;
  width: 100%;
`;

export const NavButton = styled(Button)`
  font-weight: medium;
  margin: 0 10px;
`;

export const NextButton = NavButton.extend`
  background: #5bc0de;
  color: #fff;
`;

export const SubmitButton = NextButton.extend.attrs({
  type: (props) => {
    return props.type || 'submit';
  }
})`
`;

const FormNav = ({ prevPath, nextPath, submit, handlePageChange, handleSubmit }) => {

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

FormNav.propTypes = {
  prevPath: PropTypes.string,
  nextPath: PropTypes.string,
  submit: PropTypes.bool,
  handlePageChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired
};

export default FormNav;
