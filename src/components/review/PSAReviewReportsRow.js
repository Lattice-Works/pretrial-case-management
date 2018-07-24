/*
 * @flow
 */

import React from 'react';
import Immutable from 'immutable';
import styled from 'styled-components';
import moment from 'moment';

import PSAModal from './PSAModal';
import PersonCard from './PersonCardReview';
import DropdownButton from '../buttons/DropdownButton';
import PSAStats from './PSAStats';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { psaIsClosed } from '../../utils/PSAUtils';

const ReviewRowContainer = styled.div`
  width: 100%;
  background-color: #ffffff;
  border-radius: 5px;
  border: solid 1px #e1e1eb;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 58px;
  &:hover {
    background: #f7f8f9;
  }
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
  overflow: hidden;
  hr {
    margin-top: 13px;
    margin-bottom: 13px;
    transform: translateX(-25%);
    width: 150%;
  }
`;

const PersonCardWrapper = styled.div`
  width: 100%;
  margin: 0 auto;
`;

const StatsWrapper1 = styled.div`
  padding-left: 36px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
`;

const StatsWrapper2 = styled.div`
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: row;
`;

const DownloadButtonContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center !important;
`;

const MetadataWrapper = styled.div`
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
  display: block;
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
  submitting :boolean,
  downloadFn :(values :{
    neighbors :Immutable.Map<*, *>,
    scores :Immutable.Map<*, *>
  }) => void,
  loadCaseHistoryFn :(values :{
    personId :string,
    neighbors :Immutable.Map<*, *>
  }) => void,
  updateScoresAndRiskFactors? :(values :{
    scoresEntitySetId :string,
    scoresId :string,
    scoresEntity :Immutable.Map<*, *>,
    riskFactorsEntitySetId :string,
    riskFactorsId :string,
    riskFactorsEntity :Immutable.Map<*, *>,
    dmfEntitySetId :string,
    dmfId :string,
    dmfEntity :Object,
    dmfRiskFactorsEntitySetId :string,
    dmfRiskFactorsId :string,
    dmfRiskFactorsEntity :Object
  }) => void,
  changePSAStatus? :(values :{
    scoresId :string,
    scoresEntity :Immutable.Map<*, *>
  }) => void,
  submitData :(value :{ config :Object, values :Object }) => void,
  replaceEntity :(value :{ entitySetName :string, entityKeyId :string, values :Object }) => void,
  refreshPSANeighbors :({ id :string }) => void
};

type State = {
  open :boolean
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
      open: false
    };
  }

  downloadRow = (e, isCompact) => {
    e.stopPropagation();
    const { downloadFn, neighbors, scores } = this.props;
    downloadFn({ neighbors, scores, isCompact });
  }

  renderPersonCard = () => {
    const { neighbors, hideProfile } = this.props;
    if (hideProfile) return null;

    const personDetails = neighbors.getIn([ENTITY_SETS.PEOPLE, 'neighborDetails'], Immutable.Map());
    if (!personDetails.size) return <div>Person details unknown.</div>;
    return (
      <PersonCardWrapper>
        <PersonCard
            person={personDetails.set('id', neighbors.getIn([ENTITY_SETS.PEOPLE, 'neighborId']))} />
        <hr />
      </PersonCardWrapper>
    );
  }

  renderStats = () => {
    const { hideProfile } = this.props;

    if (hideProfile) {
      return (
        <StatsWrapper2>
          <PSAStats scores={this.props.scores} downloadButton={this.renderDownloadButton} />
        </StatsWrapper2>
      );
    }
    return (
      <StatsWrapper1>
        <PSAStats scores={this.props.scores} downloadButton={this.renderDownloadButton} />
      </StatsWrapper1>
    );
  }

  renderDownloadButton = () => (
    <DownloadButtonContainer>
      <DropdownButton
          title="PDF Report"
          options={[{
            label: 'Export compact version',
            onClick: e => this.downloadRow(e, true)
          }, {
            label: 'Export full version',
            onClick: e => this.downloadRow(e, false)
          }]} />
    </DownloadButtonContainer>
  )

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
    const dateFormat = 'MM/DD/YYYY hh:mm a';
    let dateCreated;
    let creator;
    let dateEdited;
    let editor;

    this.props.neighbors.get(ENTITY_SETS.STAFF, Immutable.List()).forEach((neighbor) => {
      const associationEntitySetName = neighbor.getIn(['associationEntitySet', 'name']);
      const personId = neighbor.getIn(['neighborDetails', PROPERTY_TYPES.PERSON_ID, 0], '');
      if (associationEntitySetName === ENTITY_SETS.ASSESSED_BY) {
        creator = personId;
        const maybeDate = moment(neighbor.getIn(['associationDetails', PROPERTY_TYPES.COMPLETED_DATE_TIME, 0], ''));
        if (maybeDate.isValid()) dateCreated = maybeDate;
      }
      if (associationEntitySetName === ENTITY_SETS.EDITED_BY) {
        const maybeDate = moment(neighbor.getIn(['associationDetails', PROPERTY_TYPES.DATE_TIME, 0], ''));
        if (maybeDate.isValid()) {
          if (!dateEdited || dateEdited.isBefore(maybeDate)) {
            dateEdited = maybeDate;
            editor = personId;
          }
        }
      }
    });

    const editLabel = psaIsClosed(this.props.scores) ? 'Closed' : 'Edited';

    if (!dateCreated && !creator) return null;

    const dateCreatedText = dateCreated ? dateCreated.format(dateFormat) : '';
    const dateEditedText = dateEdited ? dateEdited.format(dateFormat) : '';

    return (
      <MetadataWrapper>
        { dateEdited || editor
          ? <MetadataItem>{this.renderMetadataText(editLabel, dateEditedText, editor)}</MetadataItem>
          : <MetadataItem>{this.renderMetadataText('Created', dateCreatedText, creator)}</MetadataItem>
        }
      </MetadataWrapper>
    );
  }

  openDetailsModal = () => {
    const { neighbors, loadCaseHistoryFn } = this.props;
    const personId = neighbors.getIn([ENTITY_SETS.PEOPLE, 'neighborId'], '');
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
          <PSAModal open={this.state.open} onClose={() => this.setState({ open: false })} {...this.props} />
        </DetailsRowContainer>
        {this.renderMetadata()}
      </ReviewRowContainer>
    );
  }
}
