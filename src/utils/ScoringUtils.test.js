import Immutable from 'immutable';
import scenarios from './consts/ScoringTestConsts';
import { getScoresAndRiskFactors } from './ScoringUtils';

describe('ScoringUtils', () => {

  describe('Score values', () => {

    describe('Provided scenarios', () => {
      scenarios.forEach((scenario) => {
        const getBoolString = val => ((val === 'Yes') ? 'true' : 'false');
        const scenarioName = scenario.scenario;

        test(`should correctly score ${scenarioName}`, () => {
          const scenarioValues = {};
          const providedValues = {};
          providedValues.ageAtCurrentArrest = scenario.ageAtCurrentArrest;
          providedValues.currentViolentOffense = scenario.currentViolentOffense;
          providedValues.currentViolentOffenseAndYoung = scenario.currentViolentOffenseAndYoung;
          providedValues.pendingCharge = scenario.pendingCharge;
          providedValues.priorMisdemeanor = scenario.priorMisdemeanor;
          providedValues.priorFelony = scenario.priorFelony;
          providedValues.priorViolentConviction = scenario.priorViolentConviction;
          providedValues.priorFailureToAppearRecent = scenario.priorFailureToAppearRecent;
          providedValues.priorFailureToAppearOld = scenario.priorFailureToAppearOld;
          providedValues.priorSentenceToIncarceration = scenario.priorSentenceToIncarceration;

          let ageAtCurrentArrest = '0';
          if (scenario.ageAtCurrentArrest === 22) ageAtCurrentArrest = '1';
          else if (scenario.ageAtCurrentArrest === 23) ageAtCurrentArrest = '2';
          const currentViolentOffense = getBoolString(scenario.currentViolentOffense);
          const currentViolentOffenseAndYoung = getBoolString(scenario.currentViolentOffenseAndYoung);
          const pendingCharge = getBoolString(scenario.pendingCharge);
          const priorMisdemeanor = getBoolString(scenario.priorMisdemeanor);
          const priorConviction = getBoolString(scenario.priorConviction);
          const priorFelony = getBoolString(scenario.priorFelony);
          const priorViolentConviction = scenario.priorViolentConviction.toString();
          const priorFailureToAppearRecent = scenario.priorFailureToAppearRecent.toString();
          const priorFailureToAppearOld = getBoolString(scenario.priorFailureToAppearOld);
          const priorSentenceToIncarceration = getBoolString(scenario.priorSentenceToIncarceration);

          const nvcaFlag = scenario.nvcaFlag === 'Yes';

          const formValues = Immutable.fromJS({
            ageAtCurrentArrest,
            currentViolentOffense,
            pendingCharge,
            priorMisdemeanor,
            priorFelony,
            priorViolentConviction,
            priorFailureToAppearRecent,
            priorFailureToAppearOld,
            priorSentenceToIncarceration,
            priorConviction,
            currentViolentOffenseAndYoung
          });

          const expectedResults = {};
          expectedResults.ncaScale = scenario.ncaScale;
          expectedResults.ftaScale = scenario.ftaScale;
          expectedResults.nvcaFlag = nvcaFlag;
          expectedResults.ncaScore = scenario.ncaScore;
          expectedResults.ftaScore = scenario.ftaScore;
          expectedResults.nvcaScore = scenario.nvcaScore;

          const calculatedResults = {};
          Object.assign(scenarioValues, { providedValues, expectedResults, calculatedResults });

          if (scenario.logic === 'ILLOGICAL') {
            expect(() => {
              getScoresAndRiskFactors(formValues);
            }).toThrow();
          }
          else {
            const { scores } = getScoresAndRiskFactors(formValues);
            scenarioValues.calculatedResults = scores;
            expect(scores.ncaScale).toEqual(scenario.ncaScale);
            expect(scores.ftaScale).toEqual(scenario.ftaScale);
            expect(scores.nvcaFlag).toEqual(nvcaFlag);
            expect(scores.ncaTotal).toEqual(scenario.ncaScore);
            expect(scores.ftaTotal).toEqual(scenario.ftaScore);
            expect(scores.nvcaTotal).toEqual(scenario.nvcaScore);
            if (scores.ncaScale === scenario.ncaScale && scores.ftaScale === scenario.ftaScale
              && scores.nvcaFlag === nvcaFlag && scores.ncaTotal === scenario.ncaScore
              && scores.ftaTotal === scenario.ftaScore && scores.nvcaTotal === scenario.nvcaScore) {
              scenarioValues.passed = true;
            }
            else scenarioValues.passed = false;
          }
          // console.log(scenarioValues);
        });
      });
    });
  });
});
