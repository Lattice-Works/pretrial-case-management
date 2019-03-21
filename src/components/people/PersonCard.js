/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClone } from '@fortawesome/pro-light-svg-icons';
import { faBell } from '@fortawesome/pro-solid-svg-icons';

import defaultProfile from '../../assets/svg/profile-placeholder-avatar.svg';
import StyledCard from '../StyledCard';
import { OL } from '../../utils/consts/Colors';
import { UndecoratedLink } from '../../utils/Layout';

import * as Routes from '../../core/router/Routes';

const StyledUndecoratedLink = styled(UndecoratedLink)`
  display: flex;
  flex-direction: column;
`;

const CardWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const StyledPersonCard = styled(StyledCard)`
  box-shadow: ${props => (props.hasOpenPSA ? `0 0 5px 5px ${OL.PURPLE06}` : 'none')};
  width: 100%;
`;

const PersonInfoSection = styled.div`
  margin-left: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Name = styled.div`
  font-family: 'Open Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: ${OL.GREY15};
  margin-bottom: 5px 0 4px;
  text-transform: uppercase;
`;

const DobLabel = styled.span`
  font-family: 'Open Sans', sans-serif;
  font-size: 13px;
  color: ${OL.GREY02};
`;

const Dob = styled.span`
  font-family: 'Open Sans', sans-serif;
  font-size: 13px;
  color: ${OL.GREY15};
  margin-right: 5px;
`;

const OpenPSATag = styled.span`
  z-index: 1;
  margin-left: 100px;
  margin-bottom: -8px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 75px;
  height: 16px;
  border-radius: 3px;
  background-color: ${OL.PURPLE07};
  padding: 5px 0;
  text-transform: uppercase;
  color: ${OL.WHITE};
  font-family: 'Open Sans', sans-serif;
  font-size: 11px;
  font-weight: 600;
`;

const MultiIconWrapper = styled.span`
  width: 30px;
  display: flex;
  justify-content: flex-end;
  z-index: 1;
  position: absolute;
  transform: translateX(192px) translateY(0px);
  svg {
    margin-left: 5px;
  }
`;

const TagPlaceholder = styled.span`
  height: 8px;
`;

const MugShot = styled.img`
  height: 100%;
  border-radius: 7px 0 0 7px;
`;

type Props = {
  personObj :{
    firstName :string,
    middleName :string,
    lastName :string,
    dob :string,
    photo :string,
    identification :string
  },
  psaId :string,
  editDate :string,
  hasOpenPSA? :boolean,
  multipleOpenPSAs? :boolean,
  judgesview? :boolean,
  openPSAModal :(psaId :string, callback :() => void) => void,
};

type State = {
  psaModalOpen :boolean,
  closingPSAModalOpen :boolean,
  closePSAButtonActive :boolean
};

class PersonCard extends React.Component<Props, State> {

  static defaultProps = {
    hasOpenPSA: false,
    judgesview: false,
    multipleOpenPSAs: false
  }

  renderContent = () => {
    const {
      editDate,
      personObj,
      openPSAModal,
      psaId
    } = this.props;
    const {
      firstName,
      middleName,
      lastName,
      dob,
      photo,
      identification
    } = personObj;
    const {
      multipleOpenPSAs,
      hasOpenPSA,
      isReceivingReminders,
      judgesview
    } = this.props;

    const midName = middleName ? ` ${middleName}` : '';
    const name = `${lastName}, ${firstName}${midName}`;

    return hasOpenPSA && judgesview
      ? (
        <CardWrapper>
          <OpenPSATag includesDate>{editDate}</OpenPSATag>
          {
            multipleOpenPSAs || isReceivingReminders
              ? (
                <MultiIconWrapper>
                  { isReceivingReminders ? <FontAwesomeIcon color={OL.ORANGE01} icon={faBell} /> : null }
                  { multipleOpenPSAs ? <FontAwesomeIcon color={OL.PURPLE02} icon={faClone} /> : null }
                </MultiIconWrapper>
              ) : null
          }
          <StyledPersonCard hasOpenPSA={hasOpenPSA} onClick={() => openPSAModal({ psaId })}>
            <MugShot src={photo || defaultProfile} />
            <PersonInfoSection>
              <Name>{name}</Name>
              <div>
                <DobLabel>DOB  </DobLabel>
                <Dob>{dob}</Dob>
              </div>
            </PersonInfoSection>
          </StyledPersonCard>
        </CardWrapper>
      )
      : (
        <StyledUndecoratedLink to={`${Routes.PERSON_DETAILS_ROOT}/${identification}`}>
          <TagPlaceholder />
          <StyledPersonCard hasOpenPSA={hasOpenPSA} >
            <MugShot src={photo || defaultProfile} />
            <PersonInfoSection>
              <Name>{name}</Name>
              <div>
                <DobLabel>DOB  </DobLabel>
                <Dob>{dob}</Dob>
              </div>
            </PersonInfoSection>
          </StyledPersonCard>
        </StyledUndecoratedLink>
      );
  }

  render() {
    return (
      <div>
        {this.renderContent()}
      </div>
    );
  }
}


export default PersonCard;
