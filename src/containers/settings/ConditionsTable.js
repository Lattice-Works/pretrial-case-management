/*
 * @flow
 */

import React from 'react';
import { Map } from 'immutable';
import { CardSegment, Table } from 'lattice-ui-kit';

import ConditionsRow from './ConditionsRow';

type Props = {
  editing :boolean,
  conditions :Object[],
  levels :Map<*, *>
};

class ReleaseConditionsTable extends React.Component<Props, State> {

  getHeaders = () => {
    const { editing, levels } = this.props;
    const headers :Object[] = [{ key: 'description', label: 'Description' }];
    for (let level = 1; level <= Object.keys(levels).length; level += 1) {
      if (levels[level].active) headers.push({ key: `Level ${level}`, label: `Level ${level}` });
    }
    if (editing) headers.push({ key: 'removerow', label: '' });
    return headers;
  }

  render() {
    const {
      editing,
      conditions,
      levels
    } = this.props;

    const headers = this.getHeaders();
    const components :Object = {
      Row: ({ data } :any) => (
        <ConditionsRow
            editing={editing}
            levels={levels}
            data={data} />
      )
    };

    if (editing) {
      conditions.push(
        {}
      );
    }

    return (
      <CardSegment vertical>
        <Table
            components={components}
            headers={headers}
            data={conditions}
            rowsPerPageOptions={[6, 8, 10, 12]}
            paginated />
      </CardSegment>
    );
  }
}

export default ReleaseConditionsTable;
