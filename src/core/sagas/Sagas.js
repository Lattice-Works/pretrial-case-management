/*
 * @flow
 */

import { AuthSagas } from 'lattice-auth';
import { fork } from 'redux-saga/effects';

import * as AppSagas from '../../containers/app/AppSagas';
import * as ChargesSagas from '../../containers/charges/ChargesSagas';
import * as CourtSagas from '../../containers/court/CourtSagas';
import * as PersonSagas from '../../containers/person/PersonSagas';
import * as PeopleSagas from '../../containers/people/PeopleSagas';
import * as DashboardSagas from '../../containers/dashboard/DashboardSagas';
import * as DataSagas from '../../utils/data/DataSagas';
import * as PsaSagas from '../../containers/psa/FormSagas';
import * as ReviewSagas from '../../containers/review/ReviewSagas';
import * as DownloadSagas from '../../containers/download/DownloadSagas';
import * as EnrollSagas from '../../containers/enroll/EnrollSagas';
import * as SubmitSagas from '../../utils/submit/SubmitSaga';

export default function* sagas() :Generator<*, *, *> {

  yield [
    // AppSagas
    fork(AppSagas.authExpirationCleanupWatcher),
    fork(AppSagas.authFailureCleanupWatcher),
    fork(AppSagas.logoutCleanupWatcher),
    fork(AppSagas.loadAppWatcher),

    // AuthSagas
    fork(AuthSagas.watchAuthAttempt),
    fork(AuthSagas.watchAuthSuccess),
    fork(AuthSagas.watchAuthFailure),
    fork(AuthSagas.watchAuthExpired),
    fork(AuthSagas.watchLogout),

    // ChargesSagas
    fork(ChargesSagas.deleteChargesWatcher),
    fork(ChargesSagas.loadChargesWatcher),
    fork(ChargesSagas.updateChargesWatcher),

    // CourtSagas
    fork(CourtSagas.filterPeopleIdsWithOpenPSAsWatcher),
    fork(CourtSagas.loadHearingsForDateWatcher),
    fork(CourtSagas.loadHearingNeighborsWatcher),
    fork(CourtSagas.refreshHearingNeighborsWatcher),
    fork(CourtSagas.loadJudgesWatcher),

    // DashboardSagas
    fork(DashboardSagas.loadDashboardDataWatcher),

    // DataSagas
    fork(DataSagas.deleteEntityWatcher),
    fork(DataSagas.replaceEntityWatcher),

    // DownloadSagas
    fork(DownloadSagas.downloadPSAsWatcher),
    fork(DownloadSagas.downloadChargeListsWatcher),
    fork(DownloadSagas.downloadPSAsByHearingDateWatcher),
    fork(DownloadSagas.getDownloadFiltersWatcher),

    // EnrollSagas
    fork(EnrollSagas.enrollVoiceProfile),
    fork(EnrollSagas.getOrCreateProfile),

    // SubmitDataSaga
    fork(SubmitSagas.replaceAssociationWatcher),
    fork(SubmitSagas.replaceEntityWatcher),
    fork(SubmitSagas.submitWatcher),

    // PersonSagas
    fork(PersonSagas.loadPersonDetailsWatcher),
    fork(PersonSagas.newPersonSubmitWatcher),
    fork(PersonSagas.searchPeopleWatcher),
    fork(PersonSagas.updateCasesWatcher),

    // PeopleSagas
    fork(PeopleSagas.getPeopleWatcher),
    fork(PeopleSagas.getPersonDataWatcher),
    fork(PeopleSagas.getPersonNeighborsWatcher),
    fork(PeopleSagas.refreshPersonNeighborsWatcher),

    // PSA Sagas
    fork(PsaSagas.hardRestartWatcher),
    fork(PsaSagas.loadDataModelWatcher),
    fork(PsaSagas.loadNeighborsWatcher),

    // Review Sagas
    fork(ReviewSagas.bulkDownloadPSAReviewPDFWatcher),
    fork(ReviewSagas.changePSAStatusWatcher),
    fork(ReviewSagas.checkPSAPermissionsWatcher),
    fork(ReviewSagas.downloadPSAReviewPDFWatcher),
    fork(ReviewSagas.loadCaseHistoryWatcher),
    fork(ReviewSagas.loadPSADataWatcher),
    fork(ReviewSagas.loadPSAsByDateWatcher),
    fork(ReviewSagas.refreshPSANeighborsWatcher),
    fork(ReviewSagas.updateScoresAndRiskFactorsWatcher),
    fork(ReviewSagas.updateOutcomesAndReleaseCondtionsWatcher)
  ];
}
