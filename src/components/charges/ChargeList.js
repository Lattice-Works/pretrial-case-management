/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';
import Immutable from 'immutable';

import { chargeFieldIsViolent } from '../../utils/consts/ChargeConsts';
import { formatValue, formatDateList } from '../../utils/Utils';
import {
  ChargeItem,
  ChargeRow,
  ChargesTable,
  ChargesWrapper,
  ChargeTag,
  ChargeTagWrapper,
  InlineBold,
  InfoSubHeader
} from '../../utils/Layout';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';

const {
  MOST_SERIOUS_CHARGE_NO,
  CHARGE_STATUTE,
  CHARGE_DESCRIPTION,
  CHARGE_DEGREE
} = PROPERTY_TYPES;

const MostSeriousTag = styled(ChargeTag)`
  background-color: #393a3b;
`;

const ViolentTag = styled(ChargeTag)`
  background-color: #992619;
`;

const ChargeHeaderItem = styled(ChargeItem)`
  width: 100px;
  font-weight: bold;
`;

type Props = {
  charges :Immutable.List<*>,
  pretrialCaseDetails :Immutable.Map<*, *>,
  detailed? :boolean
};

export default class ChargeList extends React.Component<Props, *> {

  static defaultProps = {
    detailed: false
  };

  renderTags = (chargeNumField :string[]) => {
    let mostSerious = false;
    let violent = false;

    const mostSeriousNumField = this.props.pretrialCaseDetails.get(MOST_SERIOUS_CHARGE_NO, Immutable.List());
    chargeNumField.forEach((chargeNum) => {
      mostSeriousNumField.forEach((mostSeriousNum) => {
        if (mostSeriousNum === chargeNum) mostSerious = true;
      });
    });
    if (chargeFieldIsViolent(chargeNumField)) violent = true;

    return (
      <ChargeTagWrapper>
        { (mostSerious) ? <MostSeriousTag>MOST SERIOUS</MostSeriousTag> : null }
        { (violent) ? <ViolentTag>VIOLENT</ViolentTag> : null }
      </ChargeTagWrapper>
    );
  }

  renderChargeDetails = (charge :Immutable.Map<*, *>) => {
    if (!this.props.detailed) return null;

    const plea = formatValue(charge.get(PROPERTY_TYPES.PLEA, Immutable.List()));
    const pleaDate = formatDateList(charge.get(PROPERTY_TYPES.PLEA_DATE, Immutable.List()));
    const disposition = formatValue(charge.get(PROPERTY_TYPES.DISPOSITION, Immutable.List()));
    const dispositionDate = formatDateList(charge.get(PROPERTY_TYPES.DISPOSITION_DATE, Immutable.List()));
    return (
      <div>
        <div><InlineBold>Plea: </InlineBold>{plea}</div>
        <div><InlineBold>Plea Date: </InlineBold>{pleaDate}</div>
        <div><InlineBold>Disposition: </InlineBold>{disposition}</div>
        <div><InlineBold>Disposition Date: </InlineBold>{dispositionDate}</div>
      </div>
    );
  }

  getChargeList = () => {
    const rows = this.props.charges.map((charge, index) => {
      if (!charge.get(CHARGE_STATUTE, Immutable.List()).size) {
        return (
          <ChargeRow key={index}><ChargeItem /></ChargeRow>
        );
      }
      const chargeDescription = charge.get(CHARGE_DESCRIPTION, Immutable.List());
      const chargeDegree = charge.get(CHARGE_DEGREE, Immutable.List());
      const chargeNum = charge.get(CHARGE_STATUTE, Immutable.List());

      const description = (
        <div>
          { chargeDescription.size ? <span> {formatValue(chargeDescription)}</span> : null }
          { chargeDegree.size ? <i> ({formatValue(chargeDegree)})</i> : null }
        </div>
      );

      const styledDescription = this.props.detailed
        ? <InlineBold>{description}</InlineBold> : <span>{description}</span>;

      return (
        <ChargeRow key={index}>
          <ChargeHeaderItem>{formatValue(chargeNum.toJS())}</ChargeHeaderItem>
          <ChargeItem>
            {styledDescription}
            {this.renderChargeDetails(charge)}
            {this.renderTags(chargeNum)}
          </ChargeItem>
        </ChargeRow>
      );
    });
    return (
      <ChargesTable>
        <tbody>
          {rows}
        </tbody>
      </ChargesTable>
    );
  }

  render = () => {
    if (!this.props.charges.size) return null;
    return (
      <div>
        <InfoSubHeader>Charges:</InfoSubHeader>
        <ChargesWrapper>
          {this.getChargeList()}
        </ChargesWrapper>
        <br />
      </div>
    );
  }
}
