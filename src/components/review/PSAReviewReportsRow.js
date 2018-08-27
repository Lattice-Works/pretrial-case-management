/*
 * @flow
 */

import React from 'react';
import Immutable from 'immutable';
import styled from 'styled-components';
import moment from 'moment';

import PSAModal from '../../containers/review/PSAModal';
import ClosePSAModal from '../../components/review/ClosePSAModal';
import BasicButton from '../../components/buttons/StyledButton';
import PersonCard from '../person/PersonCardReview';
import PSAReportDownloadButton from './PSAReportDownloadButton';
import PSAStats from './PSAStats';
import CONTENT_CONSTS from '../../utils/consts/ContentConsts';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { psaIsClosed } from '../../utils/PSAUtils';
import { getEntityKeyId } from '../../utils/DataUtils';
import { PSA_NEIGHBOR, PSA_ASSOCIATION } from '../../utils/consts/FrontEndStateConsts';


const ReviewRowContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 58px;
`;

const DetailsRowContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  cursor: pointer;
`;

const ReviewRowWrapper = styled.div`
  width: 100%;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 20px 30px;
  justify-content: center;
  background-color: #ffffff;
  border-radius: 5px;
  border: solid 1px #e1e1eb;
  &:hover {
    background: #f7f8f9;
  }
  hr {
    height: 1px;
    margin: -20px -30px -20px -30px;
    margin-top: 13px;
    margin-bottom: 13px;
  }
`;

const PersonCardWrapper = styled.div`
  width: 100%;
  margin: 0 auto;
`;

const StatsForReview = styled.div`
  padding-left: 56px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
`;

const StatsForProfile = styled.div`
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
`;

const MetadataWrapper = styled.div`
  width: 100%;
`;
const MetadataSubWrapper = styled.div`
  width: 100%;
`;
const MetadataText = styled.div`
  width: 100%;
  font-family: 'Open Sans', sans-serif;
  font-size: 13px;
  font-weight: 300;
  text-align: right;
  margin: 10px 0 -30px -30px;
  color: #8e929b;
`;

const ImportantMetadataText = styled.span`
  color: #2e2e34;
`;

const MetadataItem = styled.div`
  height: 10px;
  display: block;
`;

const ClosePSAButton = styled(BasicButton)`
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: #6124e2;
  width: 162px;
  height: 40px;
  border: none;
  border-radius: 3px;
  background-color: #f0f0f7;
  color: #8e929b;
  z-index: 10;
`;

type Props = {
  entityKeyId :string,
  scores :Immutable.Map<*, *>,
  neighbors :Immutable.Map<*, *>,
  hideCaseHistory? :boolean,
  hideProfile? :boolean,
  onStatusChangeCallback? :() => void,
  caseHistory :Immutable.List<*>,
  manualCaseHistory :Immutable.List<*>,
  chargeHistory :Immutable.Map<*, *>,
  manualChargeHistory :Immutable.Map<*, *>,
  sentenceHistory :Immutable.Map<*, *>,
  ftaHistory :Immutable.Map<*, *>,
  readOnly :boolean,
  personId? :string,
  component :string,
  submitting :boolean,
  downloadFn :(values :{
    neighbors :Immutable.Map<*, *>,
    scores :Immutable.Map<*, *>
  }) => void,
  loadCaseHistoryFn :(values :{
    personId :string,
    neighbors :Immutable.Map<*, *>
  }) => void,
  submitData :(value :{ config :Object, values :Object }) => void,
  replaceEntity :(value :{ entitySetName :string, entityKeyId :string, values :Object }) => void,
  deleteEntity :(value :{ entitySetName :string, entityKeyId :string }) => void,
  refreshPSANeighbors :({ id :string }) => void
};

type State = {
  open :boolean,
  closing :boolean,
  closePSAButtonActive :boolean
};

export default class PSAReviewReportsRow extends React.Component<Props, State> {

  static defaultProps = {
    hideCaseHistory: false,
    hideProfile: false,
    onStatusChangeCallback: () => {}
  }

  constructor(props :Props) {
    super(props);
    this.state = {
      open: false,
      closing: false,
      closePSAButtonActive: false
    };
  }

  renderPersonCard = () => {
    const { neighbors, hideProfile } = this.props;
    if (hideProfile) return null;

    const personDetails = neighbors.getIn([ENTITY_SETS.PEOPLE, PSA_NEIGHBOR.DETAILS], Immutable.Map());
    if (!personDetails.size) return <div>Person details unknown.</div>;
    return (
      <PersonCardWrapper>
        <PersonCard person={personDetails} />
        <hr />
      </PersonCardWrapper>
    );
  }

  renderStats = () => {
    const { hideProfile } = this.props;
    const StatsWrapper = hideProfile ? StatsForProfile : StatsForReview;

    return (
      <StatsWrapper>
        <PSAStats scores={this.props.scores} downloadButton={this.renderDownloadButton} />
      </StatsWrapper>
    );
  }

  handleStatusChange = () => {
    this.setState({ closing: false });
  }

  renderDownloadButton = () => {
    const { component } = this.props;

    const button = component === CONTENT_CONSTS.PENDING_PSAS
      ?
      (
        <ClosePSAButton
            onClick={() => this.setState({ closePSAButtonActive: true, closing: true })}>
          Close PSA
        </ClosePSAButton>
      )
      :
      (
        <PSAReportDownloadButton
            downloadFn={this.props.downloadFn}
            neighbors={this.props.neighbors}
            scores={this.props.scores} />
      );
    return button;
  }

  renderModal = () => {
    const { closePSAButtonActive } = this.state;

    const modal = closePSAButtonActive === true
      ?
      (
        <ClosePSAModal
            scores={this.props.scores}
            entityKeyId={this.props.entityKeyId}
            open={this.state.closing}
            defaultStatus={this.props.scores.getIn([PROPERTY_TYPES.STATUS, 0])}
            defaultStatusNotes={this.props.scores.getIn([PROPERTY_TYPES.STATUS_NOTES, 0])}
            defaultFailureReasons={this.props.scores.get(PROPERTY_TYPES.FAILURE_REASON, Immutable.List()).toJS()}
            onClose={() => this.setState({ closePSAButtonActive: false, closing: false, open: false })}
            onSubmit={this.handleStatusChange} />
      )
      :
      (
        <PSAModal open={this.state.open} onClose={() => this.setState({ open: false })} {...this.props} />
      );
    return modal;
  }

  renderMetadataText = (actionText, dateText, user) => {
    const text = [actionText];

    if (dateText.length) {
      text.push(' on ');
      text.push(<ImportantMetadataText key={`${actionText}-${dateText}`}>{dateText}</ImportantMetadataText>);
    }
    if (user.length) {
      text.push(' by ');
      text.push(<ImportantMetadataText key={`${actionText}-${user}`}>{user}</ImportantMetadataText>);
    }
    return <MetadataText>{text}</MetadataText>;
  }

  renderMetadata = () => {
    const { component } = this.props;
    const dateFormat = 'MM/DD/YYYY hh:mm a';
    let dateCreated;
    let creator;
    let dateEdited;
    let editor;

    this.props.neighbors.get(ENTITY_SETS.STAFF, Immutable.List()).forEach((neighbor) => {
      const associationEntitySetName = neighbor.getIn([PSA_ASSOCIATION.ENTITY_SET, 'name']);
      const personId = neighbor.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.PERSON_ID, 0], '');

      if (associationEntitySetName === ENTITY_SETS.ASSESSED_BY) {
        creator = personId;
        const maybeDate = moment(neighbor.getIn([PSA_ASSOCIATION.DETAILS, PROPERTY_TYPES.COMPLETED_DATE_TIME, 0], ''));

        if (maybeDate.isValid()) dateCreated = maybeDate;
      }
      if (associationEntitySetName === ENTITY_SETS.EDITED_BY) {
        const maybeDate = moment(neighbor.getIn([PSA_ASSOCIATION.DETAILS, PROPERTY_TYPES.DATE_TIME, 0], ''));
        if (maybeDate.isValid()) {
          if (!dateEdited || dateEdited.isBefore(maybeDate)) {
            dateEdited = maybeDate;
            editor = personId;
          }
        }
      }
    });

    const isClosed = psaIsClosed(this.props.scores);
    const editLabel = psaIsClosed(this.props.scores) ? 'Closed' : 'Edited';
    if (!(dateCreated || dateEdited) && !(creator || editor)) return null;

    const dateCreatedText = dateCreated ? dateCreated.format(dateFormat) : '';
    const dateEditedText = dateEdited ? dateEdited.format(dateFormat) : '';

    const openMetadata = (dateEdited || editor)
      ? <MetadataItem>{this.renderMetadataText(editLabel, dateEditedText, editor)}</MetadataItem>
      : <MetadataItem>{this.renderMetadataText('Created', dateCreatedText, creator)}</MetadataItem>;

    return (
      <MetadataWrapper>
        {
          isClosed && (component === CONTENT_CONSTS.PENDING_PSAS) ?
            <MetadataSubWrapper>
              <MetadataItem>{this.renderMetadataText('Created', dateCreatedText, creator)}</MetadataItem>
              <MetadataItem>{this.renderMetadataText(editLabel, dateEditedText, editor)}</MetadataItem>
            </MetadataSubWrapper>
            :
            <MetadataSubWrapper>
              {openMetadata}
            </MetadataSubWrapper>
        }
      </MetadataWrapper>
    );
  }

  openDetailsModal = () => {
    const { neighbors, loadCaseHistoryFn } = this.props;
    const personId = getEntityKeyId(neighbors, ENTITY_SETS.PEOPLE);
    loadCaseHistoryFn({ personId, neighbors });
    this.setState({
      open: true
    });
  }

  render() {
    if (!this.props.scores) return null;
    return (
      <ReviewRowContainer>
        <DetailsRowContainer onClick={this.openDetailsModal}>
          <ReviewRowWrapper>
            {this.renderPersonCard()}
            {this.renderStats()}
          </ReviewRowWrapper>
          {this.renderModal()}
        </DetailsRowContainer>
        {this.renderMetadata()}
      </ReviewRowContainer>
    );
  }
}
