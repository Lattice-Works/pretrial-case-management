/*
 * @flow
 */

import React from 'react';
import styled from 'styled-components';

import StepOne from './DMFStepOne';
import StepTwo from './DMFStepTwo';
import StepThree from './DMFStepThree';
import StepFour from './DMFStepFour';
import StepFive from './DMFStepFive';
import { CONTEXT, DMF, NOTES, PSA } from '../../utils/consts/Consts';
import { PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';

const DMFWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const FLAG_DIMS = { height: 32, width: 156 };
const SCALE_DIMS = { height: 28, width: 136 };

const DMFExplanation = ({
  dmf,
  riskFactors,
  scores
} :Props) => {
  let context = riskFactors.get(DMF.COURT_OR_BOOKING);
  if (context === 'Court') {
    context = CONTEXT.COURT_PENN;
  }
  const extradited = riskFactors.get(DMF.EXTRADITED) === `${true}`;
  const extraditedNotes = riskFactors.get(NOTES[DMF.EXTRADITED]);
  const currentViolentOffense = riskFactors.get(PSA.CURRENT_VIOLENT_OFFENSE) === `${true}`;
  const stepTwoCharges = riskFactors.get(DMF.STEP_2_CHARGES) === `${true}`;
  const stepTwoNotes = riskFactors.get(NOTES[DMF.STEP_2_CHARGES]);
  const stepFourCharges = riskFactors.get(DMF.STEP_4_CHARGES) === `${true}`;
  const stepFourNotes = riskFactors.get(NOTES[DMF.STEP_4_CHARGES]);
  const secondaryReleaseVal = riskFactors.get(DMF.SECONDARY_RELEASE_CHARGES) === `${true}`;
  const secondaryReleaseNotes = riskFactors.get(NOTES[DMF.SECONDARY_RELEASE_CHARGES]);

  const nca = scores.getIn([PROPERTY_TYPES.NCA_SCALE, 0]);
  const fta = scores.getIn([PROPERTY_TYPES.FTA_SCALE, 0]);
  const nvca = scores.getIn([PROPERTY_TYPES.NVCA_FLAG, 0]);

  const stepTwoIncrease = extradited || stepTwoCharges || (nvca && currentViolentOffense);
  const stepFourIncrease = stepFourCharges || (nvca && !currentViolentOffense);

  return (
    <DMFWrapper>
      <StepOne
          nca={nca}
          fta={fta}
          nvca={nvca}
          context={context}
          scaleDims={SCALE_DIMS}
          flagDims={FLAG_DIMS} />
      <StepTwo
          extradited={extradited}
          extraditedNotes={extraditedNotes}
          stepTwoVal={stepTwoCharges}
          stepTwoNotes={stepTwoNotes}
          currentViolentOffense={currentViolentOffense}
          fta={fta}
          nvca={nvca}
          context={context}
          scaleDims={SCALE_DIMS}
          flagDims={FLAG_DIMS} />
      <StepThree shouldRender={!stepTwoIncrease} dmf={dmf} nca={nca} fta={fta} context={context} />
      <StepFour
          shouldRender={!stepTwoIncrease}
          dmf={dmf}
          stepFourVal={stepFourCharges}
          stepFourNotes={stepFourNotes}
          nca={nca}
          fta={fta}
          nvca={nvca}
          currentViolentOffense={currentViolentOffense}
          context={context}
          flagDims={FLAG_DIMS} />
      <StepFive
          shouldRender={!stepTwoIncrease && !stepFourIncrease}
          dmf={dmf}
          nca={nca}
          fta={fta}
          context={context}
          secondaryReleaseVal={secondaryReleaseVal}
          secondaryReleaseNotes={secondaryReleaseNotes} />
    </DMFWrapper>
  );
};

export default DMFExplanation;
