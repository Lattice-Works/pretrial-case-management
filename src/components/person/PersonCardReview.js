/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import Immutable from 'immutable';
import { Constants } from 'lattice';

import defaultUserIcon from '../../assets/svg/profile-placeholder-round.svg';
import { formatValue, formatDate } from '../../utils/FormattingUtils';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import {
  Wrapper,
  DetailsWrapper,
  DetailRow,
  StyledTooltip,
  DetailItem
} from './PersonStyledTags';

const { OPENLATTICE_ID_FQN } = Constants;

const {
  DOB,
  FIRST_NAME,
  MIDDLE_NAME,
  LAST_NAME,
  MUGSHOT,
  PERSON_ID,
  PICTURE
} = PROPERTY_TYPES;

const StyledWrapper = styled(Wrapper)`
  width: 100%;
`;

const StyledDetailsWrapper = styled(DetailsWrapper)`
  flex-direction: row;
  width: 100%;
`;

const StyledDetailRow = styled(DetailRow)`
  flex-wrap: wrap;
  text-transform: uppercase;
`;

const StyledReviewTooltip = styled(StyledTooltip)`
  transform: translateX(-50%);
`;

const StyledDetailItem = styled(DetailItem)`
  width: 20%;
  position: relative;

  h1 {
    margin-bottom: 2px;
  }

  &:hover ${StyledReviewTooltip} {
    visibility: visible;
  }
`;

const PersonPicture = styled.img`
  height: 36px;
`;

type Props = {
  person :Immutable.Map<*, *>,
  handleSelect? :(person :Immutable.Map<*, *>, entityKeyId :string, id :string) => void
};

const Tooltip = ({ value }) => (
  value && value.length ? <StyledReviewTooltip>{value}</StyledReviewTooltip> : null
);

const PersonCard = ({ person, handleSelect } :Props) => {

  let pictureAsBase64 :string = person.getIn([MUGSHOT, 0]);
  if (!pictureAsBase64) pictureAsBase64 = person.getIn([PICTURE, 0]);
  const pictureImgSrc = pictureAsBase64 ? `data:image/png;base64,${pictureAsBase64}` : defaultUserIcon;

  const firstName = formatValue(person.get(FIRST_NAME, Immutable.List()));
  const middleName = formatValue(person.get(MIDDLE_NAME, Immutable.List()));
  const lastName = formatValue(person.get(LAST_NAME, Immutable.List()));
  const dob = formatDate(person.getIn([DOB, 0], ''), 'MM/DD/YYYY');
  const id :string = person.getIn([PERSON_ID, 0], '');
  const entityKeyId :string = person.getIn([OPENLATTICE_ID_FQN, 0], '');

  return (
    <StyledWrapper
        key={id}
        onClick={() => {
          if (handleSelect) {
            handleSelect(person, entityKeyId, id);
          }
        }}>
      <PersonPicture src={pictureImgSrc} role="presentation" />
      <StyledDetailsWrapper>
        <StyledDetailRow>
          <StyledDetailItem>
            <h1>LAST NAME</h1>
            <div>{lastName}</div>
            <Tooltip value={lastName} />
          </StyledDetailItem>

          <StyledDetailItem>
            <h1>FIRST NAME</h1>
            <div>{firstName}</div>
            <Tooltip value={firstName} />
          </StyledDetailItem>

          <StyledDetailItem>
            <h1>MIDDLE NAME</h1>
            <div>{middleName}</div>
            <Tooltip value={middleName} />
          </StyledDetailItem>

          <StyledDetailItem>
            <h1>DATE OF BIRTH</h1>
            <div>{dob}</div>
            <Tooltip value={dob} />
          </StyledDetailItem>

          <StyledDetailItem>
            <h1>IDENTIFIER</h1>
            <div>{id}</div>
            <Tooltip value={id} />
          </StyledDetailItem>
        </StyledDetailRow>
      </StyledDetailsWrapper>
    </StyledWrapper>
  );
};

PersonCard.defaultProps = {
  handleSelect: () => {}
};

export default PersonCard;
