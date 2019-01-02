/*
 * @flow
 */

import React from 'react';
import Immutable from 'immutable';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import LoadingSpinner from '../../components/LoadingSpinner';
import PeopleList from '../../components/people/PeopleList';
import { getFormattedPeople } from '../../utils/PeopleUtils';
import {
  APP_TYPES_FQNS,
  PROPERTY_TYPES
} from '../../utils/consts/DataModelConsts';
import { PSA_STATUSES } from '../../utils/consts/Consts';
import {
  APP,
  PSA_NEIGHBOR,
  SEARCH,
  REVIEW,
  STATE,
} from '../../utils/consts/FrontEndStateConsts';

import * as ReviewActionFactory from '../review/ReviewActionFactory';

let { PEOPLE, STAFF } = APP_TYPES_FQNS;

PEOPLE = PEOPLE.toString();
STAFF = STAFF.toString();

type Props = {
  countyFilter :string,
  didMapPeopleToProps :boolean,
  isLoadingPeople :boolean,
  loadingPSAData :boolean,
  psaNeighborsById :Immutable.Map<*, *>,
  selectedOrganizationId :string,
  actions :{
    loadPSAsByDate :(filter :string) => void
  }
};

class RequiresActionList extends React.Component<Props, State> {

  componentDidMount() {
    const { actions, selectedOrganizationId } = this.props;
    if (selectedOrganizationId) {
      actions.loadPSAsByDate(PSA_STATUSES.OPEN);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { actions, selectedOrganizationId } = this.props;
    if (selectedOrganizationId !== nextProps.selectedOrganizationId) {
      actions.loadPSAsByDate(PSA_STATUSES.OPEN);
    }
  }

  getPeopleRequiringAction = () => {
    const { psaNeighborsById, countyFilter } = this.props;

    let peopleById = Immutable.Map();

    psaNeighborsById.valueSeq().forEach((neighbors) => {
      const staffMatchingFilter = neighbors
        .get(STAFF, Immutable.List()).filter(neighbor => neighbor
          .getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.PERSON_ID, 0], '').includes(countyFilter));

      if (!countyFilter.length || staffMatchingFilter.size) {
        const neighbor = neighbors.getIn([PEOPLE, PSA_NEIGHBOR.DETAILS], Immutable.Map());
        const personId = neighbor.get(PROPERTY_TYPES.PERSON_ID);
        if (personId) {
          peopleById = peopleById.set(personId, peopleById.get(personId, Immutable.List()).push(neighbor));
        }
      }
    });

    let people = Immutable.List();
    peopleById.valueSeq().forEach((personList) => {
      if (personList.size > 1) {
        people = people.push(personList.get(0));
      }
    });

    return getFormattedPeople(people);
  }

  render() {
    const { loadingPSAData, isLoadingPeople, didMapPeopleToProps } = this.props;

    if (loadingPSAData) {
      return <LoadingSpinner />;
    }
    const formattedPeople = this.getPeopleRequiringAction();
    return (
      <PeopleList
          people={formattedPeople}
          isLoadingPeople={isLoadingPeople}
          didMapPeopleToProps={didMapPeopleToProps} />
    );
  }
}

function mapStateToProps(state) {
  const app = state.get(STATE.APP);
  const review = state.get(STATE.REVIEW);
  const search = state.get(STATE.SEARCH);
  return {
    [APP.SELECTED_ORG_ID]: app.get(APP.SELECTED_ORG_ID),

    [SEARCH.LOADING]: search.get(SEARCH.LOADING),
    [REVIEW.LOADING_DATA]: review.get(REVIEW.LOADING_DATA),
    [REVIEW.SCORES]: review.get(REVIEW.SCORES),
    [REVIEW.NEIGHBORS_BY_ID]: review.get(REVIEW.NEIGHBORS_BY_ID)
  };
}

function mapDispatchToProps(dispatch) {
  const actions :{ [string] :Function } = {};

  Object.keys(ReviewActionFactory).forEach((action :string) => {
    actions[action] = ReviewActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(RequiresActionList);
