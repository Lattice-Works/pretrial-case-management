/*
 * @flow
 */

import React from 'react';
import Immutable from 'immutable';
import FontAwesome from 'react-fontawesome';
import styled from 'styled-components';
import moment from 'moment';
import { Collapse } from 'react-bootstrap';

import PSAInputForm from '../psainput/PSAInputForm';
import PersonCard from '../person/PersonCard';
import StyledButton from '../buttons/StyledButton';
import { getScoresAndRiskFactors } from '../../utils/ScoringUtils';
import { PSA } from '../../utils/consts/Consts';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';

const ScoresTable = styled.table`
  margin: 0 50px;
`;

const ReviewRowContainer = styled.div`
  width: 100%;
  text-align: center;
  &:hover {
    background: #f7f8f9;
  }
  padding: 20px;
`;

const DetailsRowContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const ReviewRowWrapper = styled.div`
  display: inline-flex;
  flex-direction: row;
  align-items: flex-end;
  margin: 20px 0;
  justify-content: center;
`;

const ScoreHeader = styled.th`
  text-align: center;
  height: 15px;
  transform: scaleY(0.7);
  min-width: 50px;
`;

const ScoreItem = styled.td`
  font-weight: bold;
  font-size: 16px;
  text-align: center;
`;

const Scale = styled.div`
  width: 30px;
  display: inline-block;
  border-radius: 3px 3px 0 0;
  margin-bottom: -5px;
`;

const ScaleRow = styled.tr`
  vertical-align: bottom;
  border-bottom: 1px solid black;
  text-align: center;
`;

const DownloadButtonContainer = styled.div`
  height: 100%;
  display: flex;
  align-items: center !important;
`;

const DownloadButton = styled(StyledButton)`
  height: 50px;
`;

const EditButton = styled.button`
  display: inline-block;
  background: none;
  text-align: center;
  border: none;
`;

const EditButtonText = styled.div`
  font-size: 16px;
`;

const EditButtonSymbol = styled(FontAwesome).attrs({
  size: '2x'
})`
  margin-top: -15px;
`;

const MetadataText = styled.div`
  width: 100%;
  font-style: italic;
  font-size: 12px;
  margin-bottom: -15px;
  color: #bbb;
`;

const ImportantMetadataText = styled.span`
  color: black;
`;

const colorsByScale = {
  1: '#3494E6',
  2: '#598CDB',
  3: '#7A85D0',
  4: '#A37DC4',
  5: '#CA75B8',
  6: '#EC6EAD'
};

const HEIGHT_MULTIPLIER = 10;

type Props = {
  entityKeyId :string,
  scores :Immutable.Map<*, *>,
  neighbors :Immutable.Map<*, *>,
  downloadFn :(values :{
    neighbors :Immutable.Map<*, *>,
    scores :Immutable.Map<*, *>
  }) => void,
  updateScoresAndRiskFactors :(
    scoresId :string,
    scoresEntity :Object,
    riskFactorsEntitySetId :string,
    riskFactorsId :string,
    riskFactorsEntity :Object
  ) => void
};

type State = {
  open :boolean,
  riskFactors :Immutable.Map<*, *>
};

export default class PSAReviewRow extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);
    this.state = {
      open: false,
      riskFactors: this.getRiskFactors(props.neighbors)
    };
  }

  getRiskFactors = (neighbors :Immutable.Map<*, *>) => {
    const riskFactors = neighbors.getIn([ENTITY_SETS.PSA_RISK_FACTORS, 'neighborDetails'], Immutable.Map());
    const ageAtCurrentArrestVal = riskFactors.getIn([PROPERTY_TYPES.AGE_AT_CURRENT_ARREST, 0]);
    let ageAtCurrentArrest = 0;
    if (ageAtCurrentArrestVal === '21 or 22') ageAtCurrentArrest = 1;
    else if (ageAtCurrentArrestVal === '23 or Older') ageAtCurrentArrest = 2;
    const priorViolentConvictionVal = riskFactors.getIn([PROPERTY_TYPES.PRIOR_VIOLENT_CONVICTION, 0]);
    const priorViolentConviction = (priorViolentConvictionVal === '3 or more') ? 3 : priorViolentConvictionVal;
    const priorFTAVal = riskFactors.getIn([PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_RECENT, 0]);
    const priorFTA = (priorFTAVal === '2 or more') ? 2 : priorFTAVal;

    return Immutable.fromJS({
      [PSA.AGE_AT_CURRENT_ARREST]: `${ageAtCurrentArrest}`,
      [PSA.CURRENT_VIOLENT_OFFENSE]: `${riskFactors.getIn([PROPERTY_TYPES.CURRENT_VIOLENT_OFFENSE, 0])}`,
      [PSA.PENDING_CHARGE]: `${riskFactors.getIn([PROPERTY_TYPES.PENDING_CHARGE, 0])}`,
      [PSA.PRIOR_MISDEMEANOR]: `${riskFactors.getIn([PROPERTY_TYPES.PRIOR_MISDEMEANOR, 0])}`,
      [PSA.PRIOR_FELONY]: `${riskFactors.getIn([PROPERTY_TYPES.PRIOR_FELONY, 0])}`,
      [PSA.PRIOR_VIOLENT_CONVICTION]: `${priorViolentConviction}`,
      [PSA.PRIOR_FAILURE_TO_APPEAR_RECENT]: `${priorFTA}`,
      [PSA.PRIOR_FAILURE_TO_APPEAR_OLD]: `${riskFactors.getIn([PROPERTY_TYPES.PRIOR_FAILURE_TO_APPEAR_OLD, 0])}`,
      [PSA.PRIOR_SENTENCE_TO_INCARCERATION]:
        `${riskFactors.getIn([PROPERTY_TYPES.PRIOR_SENTENCE_TO_INCARCERATION, 0])}`
    });
  }

  downloadRow = () => {
    const { downloadFn, neighbors, scores } = this.props;
    downloadFn({ neighbors, scores });
  }

  renderPersonCard = () => {
    const { neighbors } = this.props;
    const personDetails = neighbors.getIn([ENTITY_SETS.PEOPLE, 'neighborDetails'], Immutable.Map());
    if (!personDetails.size) return <div>Person details unknown.</div>;
    return <PersonCard person={personDetails.set('id', neighbors.getIn([ENTITY_SETS.PEOPLE, 'neighborId']))} />;
  }

  getScaleForScore = (score :number) => styled(Scale)`
      height: ${HEIGHT_MULTIPLIER * score}px;
      background: ${colorsByScale[score]};
    `

  renderScores = () => {
    const { scores } = this.props;
    const ftaVal = scores.getIn([PROPERTY_TYPES.FTA_SCALE, 0]);
    const ncaVal = scores.getIn([PROPERTY_TYPES.NCA_SCALE, 0]);
    const nvcaVal = scores.getIn([PROPERTY_TYPES.NVCA_FLAG, 0]);
    const nvcaScaleVal = nvcaVal ? 6 : 1;

    const FtaScale = styled(Scale)`
      height: ${HEIGHT_MULTIPLIER * ftaVal}px;
      background: ${colorsByScale[ftaVal]};
    `;
    const NcaScale = styled(Scale)`
      height: ${HEIGHT_MULTIPLIER * ncaVal}px;
      background: ${colorsByScale[ncaVal]};
    `;
    const NvcaScale = styled(Scale)`
      height: ${HEIGHT_MULTIPLIER * nvcaScaleVal}px;
      background: ${colorsByScale[nvcaScaleVal]};
    `;
    return (
      <ScoresTable>
        <tbody>
          <tr>
            <ScoreHeader>FTA</ScoreHeader>
            <ScoreHeader>NCA</ScoreHeader>
            <ScoreHeader>NVCA</ScoreHeader>
          </tr>
          <ScaleRow>
            <ScoreItem><FtaScale /></ScoreItem>
            <ScoreItem><NcaScale /></ScoreItem>
            <ScoreItem><NvcaScale /></ScoreItem>
          </ScaleRow>
          <tr>
            <ScoreItem>{ftaVal}</ScoreItem>
            <ScoreItem>{ncaVal}</ScoreItem>
            <ScoreItem>{nvcaVal ? 'YES' : 'NO'}</ScoreItem>
          </tr>
        </tbody>
      </ScoresTable>
    );
  }

  renderDownloadButton = () => (
    <DownloadButtonContainer>
      <DownloadButton onClick={this.downloadRow}>Download PDF Report</DownloadButton>
    </DownloadButtonContainer>
  )

  handleRiskFactorChange = (e :Object) => {
    const {
      PRIOR_MISDEMEANOR,
      PRIOR_FELONY,
      PRIOR_VIOLENT_CONVICTION,
      PRIOR_SENTENCE_TO_INCARCERATION
    } = PSA;
    let { riskFactors } = this.state;
    riskFactors = riskFactors.set(e.target.name, e.target.value);
    if (riskFactors.get(PRIOR_MISDEMEANOR) === 'false' && riskFactors.get(PRIOR_FELONY) === 'false') {
      riskFactors = riskFactors.set(PRIOR_VIOLENT_CONVICTION, '0').set(PRIOR_SENTENCE_TO_INCARCERATION, 'false');
    }
    this.setState({ riskFactors });
  }

  onRiskFactorEdit = (e :Object) => {
    e.preventDefault();
    const { scores, riskFactors } = getScoresAndRiskFactors(this.state.riskFactors);
    const scoresEntity = {
      [PROPERTY_TYPES.NCA_SCALE]: [scores.ncaScale],
      [PROPERTY_TYPES.FTA_SCALE]: [scores.ftaScale],
      [PROPERTY_TYPES.NVCA_FLAG]: [scores.nvcaFlag]
    };

    const scoresId = this.props.entityKeyId;
    const riskFactorsEntitySetId = this.props.neighbors.getIn([
      ENTITY_SETS.PSA_RISK_FACTORS,
      'neighborEntitySet',
      'id'
    ]);
    const riskFactorsId = this.props.neighbors.getIn([ENTITY_SETS.PSA_RISK_FACTORS, 'neighborId']);
    this.props.updateScoresAndRiskFactors(
      scoresId,
      scoresEntity,
      riskFactorsEntitySetId,
      riskFactorsId,
      riskFactors
    );
    this.setState({ open: false });
  }

  renderEdit = () => {
    const { open, riskFactors } = this.state;
    const Symbol = styled(EditButtonSymbol).attrs({
      name: open ? 'angle-up' : 'angle-down'
    })`
      margin-top: ${open ? '20px' : '0'}
    `;
    const buttonContents = open ? (
      <div>
        <Symbol />
        <br />
        <EditButtonText>Close</EditButtonText>
      </div>
    ) : (
      <div>
        <EditButtonText>Edit</EditButtonText>
        <br />
        <Symbol />
      </div>
    );
    return (
      <div>
        <Collapse in={open}>
          <div>
            <PSAInputForm
                section="review"
                input={riskFactors}
                handleSingleSelection={this.handleRiskFactorChange}
                handleSubmit={this.onRiskFactorEdit}
                incompleteError={false} />
          </div>
        </Collapse>
        <EditButton onClick={() => {
          this.setState({ open: !open });
        }}>
          {buttonContents}
        </EditButton>
      </div>
    );
  }

  renderMetadata = () => {
    const staff = this.props.neighbors.get(ENTITY_SETS.STAFF, Immutable.Map());
    const dateCreated = moment(staff.getIn(['associationDetails', PROPERTY_TYPES.COMPLETED_DATE_TIME, 0], ''));
    const dateCreatedText = dateCreated.isValid() ? dateCreated.format('MMMM D, YYYY hh:mm a') : '';
    const creator = staff.getIn(['neighborDetails', PROPERTY_TYPES.PERSON_ID, 0], '');
    if (!dateCreatedText.length && !creator.length) return null;

    const text = ['Created'];
    if (dateCreatedText.length) {
      text.push(' on ')
      text.push(<ImportantMetadataText>{dateCreatedText}</ImportantMetadataText>);
    }
    if (creator.length) {
      text.push(' by ');
      text.push(<ImportantMetadataText>{creator}</ImportantMetadataText>);
    }
    return <MetadataText>{text}</MetadataText>;
  }

  render() {
    return (
      <ReviewRowContainer>
        {this.renderMetadata()}
        <DetailsRowContainer>
          <ReviewRowWrapper>
            {this.renderPersonCard()}
            {this.renderScores()}
            {this.renderDownloadButton()}
          </ReviewRowWrapper>
        </DetailsRowContainer>
        {this.renderEdit()}
      </ReviewRowContainer>
    );
  }
}
