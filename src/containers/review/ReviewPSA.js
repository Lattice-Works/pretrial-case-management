/*
 * @flow
 */

import React from 'react';
import FontAwesome from 'react-fontawesome';
import DatePicker from 'react-bootstrap-date-picker';
import Immutable from 'immutable';
import moment from 'moment';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  ButtonToolbar,
  DropdownButton,
  MenuItem,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup
} from 'react-bootstrap';

import PSAReviewRowList from './PSAReviewRowList';
import LoadingSpinner from '../../components/LoadingSpinner';
import PersonSearchFields from '../../components/person/PersonSearchFields';
import { ENTITY_SETS, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { PSA_STATUSES, SORT_TYPES } from '../../utils/consts/Consts';
import { DOMAIN } from '../../utils/consts/ReportDownloadTypes';
import { PaddedRow, TitleLabel, StyledSelect } from '../../utils/Layout';
import * as FormActionFactory from '../psa/FormActionFactory';
import * as ReviewActionFactory from './ReviewActionFactory';
import * as Routes from '../../core/router/Routes';

const StyledFormViewWrapper = styled.div`
  display: flex;
  width: 100%;
`;

const StyledFormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 960px;
`;

const StyledTitleWrapper = styled.div`
  align-items: center;
  color: #37454a;
  display: flex;
  font-size: 32px;
  justify-content: space-between;
  margin-bottom: 30px;
  width: 100%;
`;

const StyledSectionWrapper = styled.div`
  color: #555e6f;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 960px;
`;

const StyledFiltersWrapper = styled.div`
  background: #fff;
  border-radius: 5px;
  border: solid 1px #e1e1eb;
  margin-bottom: 20px;
`

const CloseX = styled(FontAwesome)`
  cursor: pointer;
`;

const StyledTopFormNavBuffer = styled.div`
  height: 55px;
`;

const DatePickerTitle = styled.div`
  font-size: 18px;
  margin: 15px 0;
  text-align: center;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  div {
    margin: 0 5px;
  }
`;

const DateRangeContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  max-width: 123px;
  max-height: 32px;
`;

const DatePickerGroupContainer = styled.div`
  max-width: 300px;
  margin: 10px;
`;

const NoResults = styled.div`
  width: 100%;
  font-size: 16px;
  text-align: center;
`;

const ErrorText = styled.div`
  width: 100%;
  text-align: center;
  font-size: 16px;
  color: firebrick;
  margin-top: 15px;
`;

const LoadingText = styled.div`
  font-size: 20px;
  margin: 15px;
`;

const SearchRow = styled(PaddedRow)`
  align-items: flex-end;
  justify-content: center;
  margin: 10px;
`;

const SortContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SortText = styled.div`
  font-size: 14px;
  margin: -5px 0 5px 0;
`;

const Toggle = styled(ToggleButton)`
  -webkit-appearance: none !important;
  margin: 15px 0;
`;

const DATE_FORMAT = 'MM/DD/YYYY';

const STATUS_OPTIONS = {
  OPEN: {
    value: PSA_STATUSES.OPEN,
    label: 'All Open'
  },
  SUCCESS: {
    value: PSA_STATUSES.SUCCESS,
    label: 'Successful'
  },
  FAILURE: {
    value: PSA_STATUSES.FAILURE,
    label: 'Failed'
  },
  CANCELLED: {
    value: PSA_STATUSES.CANCELLED,
    label: 'Cancelled'
  },
  DECLINED: {
    value: PSA_STATUSES.DECLINED,
    label: 'Declined'
  },
  DISMISSED: {
    value: PSA_STATUSES.DISMISSED,
    label: 'Dismissed'
  },
  ALL: {
    value: '*',
    label: 'All'
  },
  REQUIRES_ACTION: {
    value: PSA_STATUSES.OPEN,
    label: 'Requires Action'
  }
};

type Props = {
  history :string[],
  scoresAsMap :Immutable.Map<*, *>,
  psaNeighborsByDate :Immutable.Map<*, Immutable.Map<*, *>>,
  loadingResults :boolean,
  errorMessage :string,
  actions :{
    loadPSAsByDate :(filter :string) => void
  },
  psaNeighborsById :Immutable.Map<*, *>,
  allFilers :Immutable.Set<*>
}

type State = {
  activeFilterKey :number,
  filters :{
    date :string,
    firstName :string,
    lastName :string,
    dob :string,
    filer :string
  },
  sort :string,
  status :string,
  domain :string
};

class ReviewPSA extends React.Component<Props, State> {

  constructor(props :Props) {
    super(props);
    this.state = {
      activeFilterKey: 1,
      filters: {
        date: moment().format(),
        firstName: '',
        lastName: '',
        dob: '',
        filer: '',
        searchExecuted: false
      },
      sort: SORT_TYPES.NAME,
      status: 'OPEN',
      domain: ''
    };
  }

  componentDidMount() {
    this.props.actions.loadPSAsByDate(STATUS_OPTIONS[this.state.status].value);
  }

  updateFilters = (newFilters :Object) => {
    const filters = Object.assign({}, {
      date: '',
      firstName: '',
      lastName: '',
      dob: '',
      filer: '',
      searchExecuted: true
    }, newFilters);
    this.setState({ filters });
  }

  handleClose = () => {
    this.updateFilters({ date: moment().format() });
    this.props.history.push(Routes.DASHBOARD);
  }

  renderDateRangePicker = () => {
    const { date } = this.state.filters;

    return (
      <DateRangeContainer>
        <DatePickerGroupContainer>
          <DatePicker
              value={date}
              onChange={(newDate) => {
                this.updateFilters({ date: newDate });
              }} />
        </DatePickerGroupContainer>
      </DateRangeContainer>
    );
  }

  renderPersonFilter = () => {
    const handleSubmit = (firstName, lastName, dob) => {
      this.updateFilters({ firstName, lastName, dob });
    };
    return <PersonSearchFields handleSubmit={handleSubmit} />;
  }

  renderFilerFilter = () => {
    const filerOptions = this.props.allFilers.map(filer => <option key={filer} value={filer}>{filer}</option>);

    return (
      <SearchRow>
        <StyledSelect
            value={this.state.filters.filer}
            onChange={(e) => {
              this.updateFilters({ filer: e.target.value });
            }}>
          <option value="">Select</option>
          { filerOptions }
        </StyledSelect>
      </SearchRow>
    );
  }

  renderSpinner = () => (
    <div>
      <LoadingText>Loading past reports...</LoadingText>
      <LoadingSpinner />
    </div>
  )

  onInputChange = (e) => {
    this.setState({ [e.target.name]: e.target.value });
  }

  handleFilterRequest = () => {
    const { activeFilterKey, filters } = this.state;
    const { scoresAsMap } = this.props;
    const expiredView = this.state.status === 'REQUIRES_ACTION';
    let items = null;
    if (expiredView) {
      items = this.filterExpired(items);
    }
    else if (activeFilterKey === 1) {
      items = this.filterByDate();
    }
    else if (activeFilterKey === 2) {
      items = this.filterByPerson();
    }
    else if (activeFilterKey === 3) {
      items = this.filterByFiler();
    }

    if ((!items || !items.count()) && filters.searchExecuted) {
      return <NoResults>No results.</NoResults>;
    }

    const sort = expiredView ? null : this.state.sort;
    return <PSAReviewRowList scoreSeq={items.map(([id]) => ([id, scoresAsMap.get(id)]))} sort={sort} />;
  }

  renderError = () => <ErrorText>{this.props.errorMessage}</ErrorText>

  filterExpired = (items) => {
    let rowsByName = Immutable.Map();

    this.props.psaNeighborsById.entrySeq().forEach(([scoreId, neighbors]) => {
      if (!this.domainMatch(neighbors)) return false;

      const personId = neighbors.getIn([ENTITY_SETS.PEOPLE, 'neighborDetails', PROPERTY_TYPES.PERSON_ID]);
      if (personId) {
        rowsByName = rowsByName.set(personId, rowsByName.get(personId, Immutable.List()).push([scoreId, neighbors]));
      }
    });

    let results = [];
    rowsByName.valueSeq().forEach((psaRowList) => {
      if (psaRowList.size > 1) {
        results = [...results, ...psaRowList.toJS()];
      }
    });

    return Immutable.Seq(results);
  }

  domainMatch = neighbors => (
    !this.state.domain.length
      || neighbors.get(ENTITY_SETS.STAFF, Immutable.List()).filter((neighbor) => {
        if (!neighbor.getIn(['neighborDetails', PROPERTY_TYPES.PERSON_ID, 0], '').endsWith(this.state.domain)) {
          return false;
        }

        return true;
      }).size
  )

  filterByFiler = () => {
    const { filer } = this.state.filters;
    if (!filer.length) return Immutable.Collection();
    const { psaNeighborsById } = this.props;

    return psaNeighborsById.entrySeq().filter(([scoreId, neighbors]) => {
      if (!this.domainMatch(neighbors)) return false;
      let includesFiler = false;
      neighbors.get(ENTITY_SETS.STAFF, Immutable.List()).forEach((neighbor) => {
        if (neighbor.getIn(['neighborDetails', PROPERTY_TYPES.PERSON_ID], Immutable.List()).includes(filer)) {
          includesFiler = true;
        }
      });
      return includesFiler;
    });
  }

  filterByPerson = () => {
    const { firstName, lastName, dob } = this.state.filters;
    if (!firstName.length && !lastName.length) return Immutable.Collection();
    const { psaNeighborsById } = this.props;

    return psaNeighborsById.entrySeq().filter(([scoreId, neighbors]) => {
      if (!this.domainMatch(neighbors)) return false;

      const neighborFirst = neighbors.getIn(
        [ENTITY_SETS.PEOPLE, 'neighborDetails', PROPERTY_TYPES.FIRST_NAME],
        Immutable.List()
      );
      const neighborLast = neighbors.getIn(
        [ENTITY_SETS.PEOPLE, 'neighborDetails', PROPERTY_TYPES.LAST_NAME],
        Immutable.List()
      );
      const neighborDob = neighbors.getIn(
        [ENTITY_SETS.PEOPLE, 'neighborDetails', PROPERTY_TYPES.DOB],
        Immutable.List()
      );

      if (!neighborFirst.filter(val => val.toLowerCase().includes(firstName.toLowerCase())).size) return false;
      if (!neighborLast.filter(val => val.toLowerCase().includes(lastName.toLowerCase())).size) return false;
      if (dob && dob.length
        && !neighborDob.filter(val => val.toLowerCase().includes(dob.split('T')[0])).size) return false;

      return true;
    });
  }

  filterByDate = () => {
    const { psaNeighborsByDate } = this.props;

    const date = moment(this.state.filters.date).format(DATE_FORMAT);
    return psaNeighborsByDate.get(date, Immutable.Map())
      .entrySeq()
      .filter(([scoreId, neighbors]) => this.domainMatch(neighbors));
  }

  onFilterSelect = (activeFilterKey) => {
    this.setState({ activeFilterKey });
    this.updateFilters({ searchExecuted: false });
  }

  changeStatus = (status) => {
    if (status !== this.state.status) {
      this.setState({
        status,
        activeFilterKey: 1
      });
      this.props.actions.loadPSAsByDate(STATUS_OPTIONS[status].value);
      this.updateFilters({ date: moment().format() });
    }
  }

  renderStatusItem = key =>
    <MenuItem key={key} eventKey={key} onClick={() => this.changeStatus(key)}>{STATUS_OPTIONS[key].label}</MenuItem>

  renderStatusDropdown = () => (
    <DropdownButton title={STATUS_OPTIONS[this.state.status].label} id="statusDropdown">
      {this.renderStatusItem('ALL')}
      <MenuItem divider />
      <MenuItem header>Open</MenuItem>
      {this.renderStatusItem('OPEN')}
      {this.renderStatusItem('REQUIRES_ACTION')}
      <MenuItem divider />
      <MenuItem header>Closed</MenuItem>
      {this.renderStatusItem('SUCCESS')}
      {this.renderStatusItem('FAILURE')}
      {this.renderStatusItem('CANCELLED')}
      {this.renderStatusItem('DECLINED')}
      {this.renderStatusItem('DISMISSED')}
    </DropdownButton>
  )

  onDomainChange = (domain) => {
    this.setState({ domain });
  }

  renderDomainChoices = () => (
    <ButtonToolbar>
      <ToggleButtonGroup type="radio" name="domainPicker" value={this.state.domain} onChange={this.onDomainChange}>
        <Toggle value="">All</Toggle>
        <Toggle value={DOMAIN.PENNINGTON}>Pennington</Toggle>
        <Toggle value={DOMAIN.MINNEHAHA}>Minnehaha</Toggle>
      </ToggleButtonGroup>
    </ButtonToolbar>
  )

  renderFilters = () => (
    <div>
      <DatePickerTitle>
        <span>PSA Status </span>
        {this.renderStatusDropdown()}
        <span>County </span>
        {this.renderDomainChoices()}
        <span>PSA Date </span>
        {this.renderDateRangePicker()}
        <span>Filer </span>
        {this.renderFilerFilter()}
      </DatePickerTitle>
      <hr />
    </div>
  )

  onSortChange = (sort) => {
    this.setState({ sort });
  }

  renderSortChoices = () => (this.state.status === 'REQUIRES_ACTION' ? null : (
    <SortContainer>
      <SortText>Sort by:</SortText>
      <ButtonToolbar>
        <ToggleButtonGroup type="radio" name="sortPicker" value={this.state.sort} onChange={this.onSortChange}>
          <Toggle value={SORT_TYPES.NAME}>Name</Toggle>
          <Toggle value={SORT_TYPES.DATE}>Date</Toggle>
        </ToggleButtonGroup>
      </ButtonToolbar>
    </SortContainer>
  ))

  renderContent = () => {
    if (this.props.loadingResults) {
      return <StyledSectionWrapper>{this.renderSpinner()}</StyledSectionWrapper>;
    }
    return (
      <StyledSectionWrapper>
        <StyledFiltersWrapper>
          {this.renderError()}
          {this.renderFilters()}
          {this.renderSortChoices()}
        </StyledFiltersWrapper>
        {this.handleFilterRequest()}
        <StyledTopFormNavBuffer />
      </StyledSectionWrapper>
    );
  }

  render() {
    return (
      <StyledFormViewWrapper>
        <StyledFormWrapper>
          <StyledTitleWrapper>
            <div>Review PSA Forms</div>
            <CloseX name="close" onClick={this.handleClose} />
          </StyledTitleWrapper>
          {this.renderContent()}
        </StyledFormWrapper>
      </StyledFormViewWrapper>
    );
  }
}

function mapStateToProps(state) {
  const review = state.get('review');
  return {
    scoresAsMap: review.get('scoresAsMap'),
    psaNeighborsByDate: review.get('psaNeighborsByDate'),
    psaNeighborsById: review.get('psaNeighborsById'),
    allFilers: review.get('allFilers'),
    loadingResults: review.get('loadingResults') || review.get('loadingPSAData'),
    errorMessage: review.get('errorMessage')
  };
}

function mapDispatchToProps(dispatch :Function) :Object {
  const actions :{ [string] :Function } = {};

  Object.keys(FormActionFactory).forEach((action :string) => {
    actions[action] = FormActionFactory[action];
  });

  Object.keys(ReviewActionFactory).forEach((action :string) => {
    actions[action] = ReviewActionFactory[action];
  });

  return {
    actions: {
      ...bindActionCreators(actions, dispatch)
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ReviewPSA);
