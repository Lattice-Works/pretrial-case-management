/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import { fromJS, Map } from 'immutable';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Button,
  CardSegment,
  Checkbox,
  MinusButton,
  PlusButton
} from 'lattice-ui-kit';

import BookingHoldSection from './BookingHoldSection';
import ReleaseConditionsTable from '../../components/settings/ConditionsTable';
import ReleaseTypeTable from '../../components/settings/ReleaseTypeTable';
import { OL } from '../../utils/consts/Colors';
import { HeaderSection } from '../../components/settings/SettingsStyledComponents';
import {
  SETTINGS,
  BOOKING_LABELS,
  CONTEXTS,
  RCM,
  RCM_DATA
} from '../../utils/consts/AppSettingConsts';

import { STATE } from '../../utils/consts/redux/SharedConsts';
import { SETTINGS_DATA } from '../../utils/consts/redux/SettingsConsts';

import { submitSettings, updateSetting } from './SettingsActions';

const RCMGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-gap: 10px;
`;

const RCMCell = styled.div`
  min-height: 75px;
  font-family: 'Open Sans', sans-serif;
  font-weight: 600;
  font-size: 12px;
  padding: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  word-wrap: normal;
  background: ${props => props.color};
`;

const SubmitRow = styled.div`
  width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const StyledCell = styled.div`
  padding: 10px 10px;
  text-align: ${props => props.align || 'left'};
  word-wrap: break-word;
`;


type Props = {
  editing :boolean,
  settings :Object,
  actions :{
    updateSetting :RequestSequence;
  };
};

class RCMSettings extends React.Component<Props, State> {
  constructor(props :Props) {
    super(props);
    this.state = {
      bookingView: false
    };
  }

  getLevels = (all) => {
    const { settings } = this.props;
    const levels = settings[SETTINGS.RCM][RCM.LEVELS];
    if (all) return levels;
    const activeLevels = {};
    Object.keys(levels).forEach((idx) => {
      if (levels[idx].active) activeLevels[idx] = levels[idx];
    });
    return activeLevels;
  }

  getConditions = () => {
    const { settings } = this.props;
    return settings[SETTINGS.RCM][RCM.CONDITIONS];
  }

  getMatrix = () => {
    const { settings } = this.props;
    return settings[SETTINGS.RCM][RCM.MATRIX];
  }

  getConditionsForCell = (level) => {
    const conditions = this.getConditions();
    const cellConditions = [];
    Object.values(conditions).forEach((condition) => {
      const isCurrentLevel = condition[level];
      if (isCurrentLevel) {
        cellConditions.push(condition.description);
      }
    });
    return cellConditions;
  }

  getCellInfo = (ftaScore, ncaScore) => {
    const matrix = this.getMatrix();
    return matrix[ftaScore][ncaScore];
  }

  getCell = (ftaScore, ncaScore) => {
    const { bookingView } = this.state;
    const levels = this.getLevels();
    const cellInfo = this.getCellInfo(ftaScore, ncaScore);
    let cellConditions = [];
    let cellColor = '#8e929b';
    let label;
    let levelNumber;
    if (cellInfo) {
      levelNumber = cellInfo[RCM_DATA.LEVEL];
      cellColor = levels[levelNumber][RCM_DATA.COLOR];
      cellConditions = this.getConditionsForCell(levelNumber);
      label = cellConditions.join(', ');
    }
    if (levelNumber && bookingView) {
      label = levels[levelNumber][RCM_DATA.BOOKING_HOLD] ? BOOKING_LABELS.HOLD : BOOKING_LABELS.RELEASE;
    }
    return (
      <RCMCell
          key={`FTA ${ftaScore} NCA ${ncaScore}`}
          onClick={() => this.changeConditionLevel(ftaScore, ncaScore)}
          color={cellColor}>
        { label }
      </RCMCell>
    );
  }

  changeConditionLevel = (ftaScore, ncaScore) => {
    const { actions, editing } = this.props;
    const matrix = this.getMatrix();
    const levels = this.getLevels();
    const cellInfo = this.getCellInfo(ftaScore, ncaScore);
    if (editing && cellInfo) {
      const currentLevel = cellInfo[RCM_DATA.LEVEL];
      const nextLevel = (levels[currentLevel + 1] && levels[currentLevel + 1].active) ? currentLevel + 1 : 1;
      matrix[ftaScore][ncaScore][RCM_DATA.LEVEL] = nextLevel;
      actions.updateSetting({ path: [SETTINGS.RCM, RCM.MATRIX], value: matrix });
    }
  }

  getCells = () => {
    const rcmCells = [];
    for (let ftaScore = 1; ftaScore <= 6; ftaScore += 1) {
      rcmCells.push(<RCMCell key={`FTA ${ftaScore}`} color={OL.GREY07}>{`FTA ${ftaScore}`}</RCMCell>);
      for (let ncaScore = 1; ncaScore <= 6; ncaScore += 1) {
        const cell = this.getCell(ftaScore, ncaScore);
        rcmCells.push(cell);
      }
    }
    return rcmCells;
  }

  getHeaderRow = () => (
    <>
      <RCMCell color={OL.WHITE} />
      <RCMCell color={OL.GREY07}>NCA 1</RCMCell>
      <RCMCell color={OL.GREY07}>NCA 2</RCMCell>
      <RCMCell color={OL.GREY07}>NCA 3</RCMCell>
      <RCMCell color={OL.GREY07}>NCA 4</RCMCell>
      <RCMCell color={OL.GREY07}>NCA 5</RCMCell>
      <RCMCell color={OL.GREY07}>NCA 6</RCMCell>
    </>
  )

  renderMatrix = () => (
    <CardSegment vertical>
      <RCMGrid>
        { this.getHeaderRow() }
        { this.getCells() }
      </RCMGrid>
    </CardSegment>
  )

  renderConditionsTable = () => {
    const { editing } = this.props;
    const conditions = this.getConditions();
    const levels = this.getLevels();
    const conditionValues = Object.values(conditions);
    if (editing) conditionValues.push({});
    return (
      <ReleaseConditionsTable
          editing={editing}
          conditions={conditionValues}
          levels={levels} />
    );
  }

  addLevel = () => {
    const { actions } = this.props;
    const levels = this.getLevels();
    const nextLevel = Object.keys(levels).length + 1;
    if (nextLevel <= 6) {
      actions.updateSetting({ path: [SETTINGS.RCM, RCM.LEVELS, `${nextLevel}`, RCM_DATA.ACTIVE], value: true });
    }
  }

  removeLevel = () => {
    const { actions } = this.props;
    const allLevels = this.getLevels(true);
    const activeLevels = this.getLevels();
    const matrix = this.getMatrix();
    const conditions = this.getConditions();
    const lastLevel = Object.keys(activeLevels).length;
    if (lastLevel > 3) {
      allLevels[lastLevel][RCM_DATA.ACTIVE] = false;
      const nextConditions = Map().withMutations((mutableMap) => {
        Object.values(conditions).forEach((condition) => {
          if (condition.description) {
            const nextCondition = condition;
            nextCondition[lastLevel] = false;
            mutableMap.set(condition.description, nextCondition);
          }
        });
      });
      for (let ftaScore = 1; ftaScore <= 6; ftaScore += 1) {
        for (let ncaScore = 1; ncaScore <= 6; ncaScore += 1) {
          if (matrix[ftaScore][ncaScore]) {
            const currentLevel = matrix[ftaScore][ncaScore][RCM_DATA.LEVEL];
            if (currentLevel === lastLevel) {
              matrix[ftaScore][ncaScore][RCM_DATA.LEVEL] = lastLevel - 1;
            }
          }
        }
      }
      const nextRCM = fromJS({
        [RCM.CONDITIONS]: nextConditions,
        [RCM.MATRIX]: matrix,
        [RCM.LEVELS]: allLevels,
      });
      actions.updateSetting({ path: [SETTINGS.RCM], value: nextRCM });
    }
  }

  renderBookingViewCheckbox = () => {
    const { bookingView } = this.state;
    const { settings } = this.props;
    const includesBookingContext = settings[SETTINGS.CONTEXTS][CONTEXTS.BOOKING];
    return includesBookingContext
      ? (
        <StyledCell align="center">
          <Checkbox
              checked={bookingView}
              label="Booking View"
              onChange={({ target }) => {
                this.setState({ bookingView: target.checked });
              }} />
        </StyledCell>
      ) : null;
  }

  renderBookingHoldSection = () => {
    const { editing } = this.props;
    const { settings } = this.props;
    const levels = this.getLevels();
    const includesBookingContext = settings[SETTINGS.CONTEXTS][CONTEXTS.BOOKING];
    return includesBookingContext
      ? <CardSegment><BookingHoldSection editing={editing} levels={levels} /></CardSegment> : null;
  }

  renderReleaseTypeTable = () => {
    const { editing, settings } = this.props;
    const includesBookingContext = settings[SETTINGS.CONTEXTS][CONTEXTS.BOOKING];
    const levels = this.getLevels();
    return includesBookingContext
      ? (
        <ReleaseTypeTable
            includesBookingContext={includesBookingContext}
            editing={editing}
            levels={levels} />
      ) : null;
  }

  renderHeader = () => {
    const { editing } = this.props;
    const numOfActiveLevels = Object.values(this.getLevels()).length;
    return (
      <CardSegment>
        <HeaderSection>Manage RCM</HeaderSection>
        <HeaderSection>
          <div>
            {
              editing
                ? (
                  <>
                    <PlusButton
                        mode="positive"
                        disabled={numOfActiveLevels === 6}
                        onClick={this.addLevel}>
                        Level
                    </PlusButton>
                    <MinusButton
                        mode="negative"
                        disabled={numOfActiveLevels === 3}
                        onClick={this.removeLevel}>
                        Level
                    </MinusButton>
                  </>
                )
                : <div />
            }
          </div>
        </HeaderSection>
      </CardSegment>
    );
  }

  render() {
    const { actions, editing } = this.props;
    return (
      <>
        {this.renderHeader()}
        {this.renderBookingHoldSection()}
        {this.renderReleaseTypeTable()}
        {this.renderConditionsTable()}
        {this.renderBookingViewCheckbox()}
        {this.renderMatrix()}
        {
          editing
            ? (
              <SubmitRow>
                <Button mode="primary" onClick={actions.submitSettings}>Submit</Button>
              </SubmitRow>
            ) : null
        }
      </>
    );
  }
}


function mapStateToProps(state) {
  const settings = state.get(STATE.SETTINGS);
  return {
    settings: settings.get(SETTINGS_DATA.APP_SETTINGS).toJS()
  };
}

const mapDispatchToProps = (dispatch :Dispatch<any>) => ({
  actions: bindActionCreators({
    submitSettings,
    updateSetting
  }, dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(RCMSettings);
