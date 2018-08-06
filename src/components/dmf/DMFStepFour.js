/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';

import DMFCell from './DMFCell';
import ContentBlock from '../ContentBlock';
import ContentSection from '../ContentSection';
import BooleanFlag from '../BooleanFlag';
import rightArrow from '../../assets/svg/dmf-arrow.svg';
import {
  getDMFDecision,
  increaseDMFSeverity
} from '../../utils/consts/DMFResultConsts';

const StepWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 0 30px 30px;
  img {
    margin: 24.5px;
  }
`;

const ContentsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  margin-top: 7px;
`;

const StepFour = ({
  shouldRender,
  stepFourVal,
  nca,
  fta,
  nvca,
  currentViolentOffense,
  context,
  flagDims
} :Props) => {

// TODO: Show Pretrial FTA Flag

  const STEP4_VALS = [
    {
      label: 'Listed Charges',
      content: [<ContentsWrapper><BooleanFlag dims={flagDims} value={stepFourVal} /></ContentsWrapper>]
    },
    // {
    //   label: 'Pretrial FTA',
    //   content: [<ContentsWrapper><BooleanFlag dims={flagDims} value={fta} /></ContentsWrapper>]
    // },
    {
      label: 'NVCA',
      content: [<ContentsWrapper><BooleanFlag dims={flagDims} value={nvca} /></ContentsWrapper>]
    },
    {
      label: 'Violent Offense',
      content: [
        <ContentsWrapper><BooleanFlag dims={flagDims} value={currentViolentOffense} /></ContentsWrapper>
      ]
    }
  ];
  const content = STEP4_VALS.map(item => (
    <ContentBlock
        component="DMF"
        contentBlock={item}
        key={item.label} />
  ));

  const flags = () => (
    <ContentSection
        component="DMF"
        header="Step Four" >
      {content}
    </ContentSection>
  );

  if (!shouldRender) return null;
  const textArr = [];
  let dmfTransformation;

  const stepThreeDmf = getDMFDecision(nca, fta, context);

  const violentRisk = nvca && !currentViolentOffense;
  if (!stepFourVal && !violentRisk) {
    textArr.push('no charges meet the requirements to increase severity');
    dmfTransformation = (
      <StepWrapper>
        <DMFCell dmf={stepThreeDmf} selected large />
      </StepWrapper>
    );
  }
  else {
    dmfTransformation = (
      <StepWrapper>
        <DMFCell dmf={stepThreeDmf} selected large />
        <img src={rightArrow} alt="" />
        <DMFCell dmf={increaseDMFSeverity(stepThreeDmf, context)} selected large />
      </StepWrapper>
    );
    if (stepFourVal) {
      textArr.push('charges meet the requirements to increase severity');
    }
    if (violentRisk) {
      textArr.push('PSA resulted in NVCA flag and current offense is not violent');
    }
  }

  return (
    <div>
      <hr />
      {flags()}
      {dmfTransformation}
    </div>
  );
};

export default StepFour;
