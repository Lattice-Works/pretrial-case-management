
// @flow

import React from 'react';
import styled from 'styled-components';
import { Map } from 'immutable';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Checkbox,
  Input,
  MinusButton,
  PlusButton
} from 'lattice-ui-kit';


import { SETTINGS, RCM, RCM_DATA } from '../../utils/consts/AppSettingConsts';
import { OL } from '../../utils/consts/Colors';
import { STATE } from '../../utils/consts/redux/SharedConsts';
import { SETTINGS_DATA } from '../../utils/consts/redux/SettingsConsts';


import { updateSetting, deleteRCMCondition } from './SettingsActions';

const ConditionsRowWrapper = styled.tr.attrs(() => ({ tabIndex: '1' }))`
  border-bottom: 1px solid ${OL.GREY11};
`;

const CellContent = styled.div`
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const StyledCell = styled.td`
  padding: 5px 5px;
  text-align: ${props => props.align || 'left'};
  word-wrap: break-word;
`;

type Props = {
  settings :Map<*, *>,
  data :Object,
  editing :boolean,
  levels :Object,
  actions :{
    addCondition :() => void,
    updateCondition :() => void,
    removeCondition :() => void,
  }
};

class ConditionsRow extends React.Component<Props, *> {
  constructor(props :Props) {
    super(props);
    this.state = {
      newCondition: ''
    };
  }

  addCondition = (condition) => {
    const { actions, settings } = this.props;
    const conditions = settings.getIn([SETTINGS.RCM, RCM.CONDITIONS], Map());
    const nextConditions = conditions.setIn([condition, RCM_DATA.DESCRIPTION], condition);
    actions.updateSetting({ path: [SETTINGS.RCM, RCM.CONDITIONS], value: nextConditions });
  }

  updateCondition = (description, levelIdx, value) => {
    const { actions, settings } = this.props;
    const conditions = settings.getIn([SETTINGS.RCM, RCM.CONDITIONS], Map());
    const { target } = value;
    const nextConditions = conditions.setIn([description, levelIdx], target.checked);
    actions.updateSetting({ path: [SETTINGS.RCM, RCM.CONDITIONS], value: nextConditions });
  }

  removeCondition = (condition) => {
    const { actions } = this.props;
    actions.deleteRCMCondition({ condition });
  }

  getColumns = () => {
    const {
      data,
      levels,
      editing
    } = this.props;
    const columns = Object.keys(levels)
      .map(idx => (
        <StyledCell key={`${data.description}-LEVEL${idx}`} align="center">
          <Checkbox
              disabled={!editing || !data.description}
              defaultChecked={data[idx]}
              color={levels[idx][RCM_DATA.COLOR]}
              onChange={value => this.updateCondition(data[RCM_DATA.DESCRIPTION], idx, value)} />
        </StyledCell>
      ));
    return columns;
  }

  handleInputUpdate = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  render() {
    const {
      editing,
      data
    } = this.props;
    const { newCondition } = this.state;

    const columns = this.getColumns();

    return (
      <ConditionsRowWrapper onClick={() => {}}>
        <StyledCell>
          <CellContent>
            {
              data.description || <Input name="newCondition" value={newCondition} onChange={this.handleInputUpdate} />
            }
          </CellContent>
        </StyledCell>
        { columns }
        {
          editing ? (
            <StyledCell align="center">
              {
                data.description
                  ? <MinusButton mode="negative" onClick={() => this.removeCondition(data.description)} />
                  : <PlusButton mode="positive" onClick={() => this.addCondition(newCondition)} />
              }
            </StyledCell>
          ) : null
        }
      </ConditionsRowWrapper>
    );
  }
}

function mapStateToProps(state) {
  const settings = state.get(STATE.SETTINGS);
  return {
    settings: settings.get(SETTINGS_DATA.APP_SETTINGS)
  };
}

const mapDispatchToProps = (dispatch :Dispatch<any>) => ({
  actions: bindActionCreators({
    updateSetting,
    deleteRCMCondition
  }, dispatch)
});

export default connect(mapStateToProps, mapDispatchToProps)(ConditionsRow);