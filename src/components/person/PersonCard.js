/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import Immutable from 'immutable';

import defaultUserIcon from '../../assets/svg/profile-placeholder-rectangle.svg';
import { formatValue, formatDate } from '../../utils/Utils';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';

const {
  DOB,
  FIRST_NAME,
  MIDDLE_NAME,
  LAST_NAME,
  SUFFIX,
  MUGSHOT,
  PERSON_ID,
  PICTURE
} = PROPERTY_TYPES;

const Wrapper = styled.div`
  width: 410px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const DetailsWrapper = styled.div`
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const DetailRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  width: 33%;

  h1 {
    font-family: 'Open Sans', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: #8e929b;
    text-transform: uppercase;
  }

  div {
    font-family: 'Open Sans', sans-serif;
    font-size: 14px;
    color: #2e2e34;
  }
`;

const DetailItemWide = styled(DetailItem)`
  width: 66%;
`;


const PersonPicture = styled.img`
  max-height: 115px;
`;

type Props = {
  person :Immutable.Map<*, *>,
  handleSelect? :(person :Immutable.Map<*, *>, entityKeyId :string, id :string) => void
};

const PersonCard = ({ person, handleSelect } :Props) => {

  let pictureAsBase64 :string = person.getIn([MUGSHOT, 0]);
  if (!pictureAsBase64) pictureAsBase64 = person.getIn([PICTURE, 0]);
  const pictureImgSrc = pictureAsBase64 ? `data:image/png;base64,${pictureAsBase64}` : defaultUserIcon;

  const firstName = formatValue(person.get(FIRST_NAME, Immutable.List()));
  const middleName = formatValue(person.get(MIDDLE_NAME, Immutable.List()));
  const lastName = formatValue(person.get(LAST_NAME, Immutable.List()));
  const dob = formatDate(person.getIn([DOB, 0], ''), 'MM/DD/YYYY');
  const suffix = formatValue(person.get(SUFFIX, Immutable.List()));
  const id :string = person.getIn([PERSON_ID, 0], '');
  const formattedId = id.length > 24 ? `${id.substr(0, 22)}...` : id;
  const entityKeyId :string = person.getIn(['id', 0], '');

  return (
    <Wrapper
        key={id}
        onClick={() => {
          if (handleSelect) {
            handleSelect(person, entityKeyId, id);
          }
        }}>
      <PersonPicture src={pictureImgSrc} role="presentation" />
      <DetailsWrapper>
        <DetailRow>
          <DetailItem>
            <h1>LAST NAME</h1>
            <div>{lastName}</div>
          </DetailItem>
          <DetailItem>
            <h1>FIRST NAME</h1>
            <div>{firstName}</div>
          </DetailItem>
          <DetailItem>
            <h1>MIDDLE NAME</h1>
            <div>{middleName}</div>
          </DetailItem>
        </DetailRow>
        <DetailRow>
          <DetailItem>
            <h1>DATE OF BIRTH</h1>
            <div>{dob}</div>
          </DetailItem>
          <DetailItemWide>
            <h1>IDENTIFIER</h1>
            <div>{formattedId}</div>
          </DetailItemWide>
        </DetailRow>
      </DetailsWrapper>

    </Wrapper>
  );
};

PersonCard.defaultProps = {
  handleSelect: () => {}
};

export default PersonCard;
