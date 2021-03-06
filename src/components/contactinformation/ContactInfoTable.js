/*
 * @flow
 */
import React, { Component } from 'react';
import styled from 'styled-components';
import { Table } from 'lattice-ui-kit';
import { List, Map, hasIn } from 'immutable';
import { connect } from 'react-redux';
import type { RequestState } from 'redux-reqseq';

import ContactInfoRow from './ContactInfoRow';
import { NoResults } from '../../utils/Layout';
import { OL } from '../../utils/consts/Colors';
import { APP_TYPES, PROPERTY_TYPES } from '../../utils/consts/DataModelConsts';
import { PSA_NEIGHBOR } from '../../utils/consts/FrontEndStateConsts';
import { STATE } from '../../utils/consts/redux/SharedConsts';
import { CONTACT_INFO_ACTIONS, CONTACT_INFO_DATA } from '../../utils/consts/redux/ContactInformationConsts';
import { SUBSCRIPTION_DATA } from '../../utils/consts/redux/SubscriptionConsts';
import { getEntityKeyId, getFirstNeighborValue } from '../../utils/DataUtils';
import { getReqState, requestIsFailure } from '../../utils/consts/redux/ReduxUtils';

const { REMINDER_OPT_OUTS } = APP_TYPES;

const cellStyle :Object = {
  backgroundColor: OL.GREY08,
  color: OL.GREY02,
  fontSize: '11px',
  fontWeight: 'normal',
  padding: '12px 0 12px 30px',
  textAlign: 'left',
};
const TABLE_HEADER_NAMES :string[] = ['CONTACT INFORMATION', 'TAGS'];
const TABLE_HEADERS :Object[] = TABLE_HEADER_NAMES.map((name :string) => ({
  cellStyle,
  key: name,
  label: name,
  sortable: false,
}));

const Error = styled.div`
  color: ${OL.RED01};
  font-size: 16px;
  padding: 20px 0;
  text-align: center;
  width: 100%;
`;

type Props = {
  contactInfo :List;
  contactNeighbors :Map;
  loading :boolean;
  noResults :boolean;
  personEKID :UUID;
  submittedContact :Map;
  updateContactReqState :RequestState;
};

class ContactInfoTable extends Component<Props> {

  aggregateContactTableData = () => {
    const { contactInfo, contactNeighbors, personEKID } = this.props;
    const contactList = contactInfo
      .sortBy(((contact) => getFirstNeighborValue(contact, PROPERTY_TYPES.PHONE, '')))
      .sortBy(((contact) => getFirstNeighborValue(contact, PROPERTY_TYPES.EMAIL, '')))
      .sortBy(((contact) => !getFirstNeighborValue(contact, PROPERTY_TYPES.IS_PREFERRED, false)))
      .map((contact :Map) => {
        const contactMethod = hasIn(contact, [PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.PHONE, 0])
          ? contact.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.PHONE, 0], '')
          : contact.getIn([PSA_NEIGHBOR.DETAILS, PROPERTY_TYPES.EMAIL, 0], '');
        const contactEKID = getEntityKeyId(contact);
        const isPreferred :boolean = getFirstNeighborValue(contact, PROPERTY_TYPES.IS_PREFERRED, false);
        const isMobile :boolean = getFirstNeighborValue(contact, PROPERTY_TYPES.IS_MOBILE, false);
        const hasOptedOut :boolean = !contactNeighbors.getIn([contactEKID, REMINDER_OPT_OUTS], List()).isEmpty();
        return {
          [TABLE_HEADER_NAMES[0]]: contactMethod,
          [TABLE_HEADER_NAMES[1]]: '',
          hasOptedOut,
          id: contactEKID,
          isMobile,
          isPreferred,
          personEKID,
        };
      })
      .toJS();
    return contactList;
  }

  render() {
    const {
      contactInfo,
      loading,
      noResults,
      submittedContact,
      updateContactReqState
    } = this.props;
    const contactList :Object[] = this.aggregateContactTableData();
    const contactsMarkedAsPreferred :List = contactInfo
      .filter((contact) => !getFirstNeighborValue(contact, PROPERTY_TYPES.IS_PREFERRED, false));
    const submittedContactIsPreferred :boolean = !submittedContact.isEmpty()
      && getFirstNeighborValue(submittedContact, PROPERTY_TYPES.IS_PREFERRED, false);
    const hasContactButNoPreferred :boolean = !noResults
      && contactsMarkedAsPreferred.isEmpty()
      && !submittedContactIsPreferred;
    const updateFailed :boolean = requestIsFailure(updateContactReqState);
    return (
      <>
        {
          noResults
            ? <NoResults>No contact information on file.</NoResults>
            : (
              <Table
                  components={{ Row: ContactInfoRow }}
                  data={contactList}
                  headers={TABLE_HEADERS}
                  isLoading={loading} />
            )
        }
        {
          updateFailed && (
            <Error>Update failed. Please try again.</Error>
          )
        }
        {
          hasContactButNoPreferred && (
            <NoResults>Existing contact info must be mark preferred.</NoResults>
          )
        }
      </>
    );
  }
}

const mapStateToProps = (state :Map) => {
  const contactInfo = state.get(STATE.CONTACT_INFO);
  const subscription = state.get(STATE.SUBSCRIPTIONS);
  return {
    [SUBSCRIPTION_DATA.CONTACT_INFO]: subscription.get(SUBSCRIPTION_DATA.CONTACT_INFO),
    [SUBSCRIPTION_DATA.CONTACT_NEIGHBORS]: subscription.get(SUBSCRIPTION_DATA.CONTACT_NEIGHBORS),
    [CONTACT_INFO_DATA.SUBMITTED_CONTACT_INFO]: contactInfo.get(CONTACT_INFO_DATA.SUBMITTED_CONTACT_INFO),
    updateContactReqState: getReqState(contactInfo, CONTACT_INFO_ACTIONS.UPDATE_CONTACT),
  };
};

// $FlowFixMe
export default connect(mapStateToProps)(ContactInfoTable);
