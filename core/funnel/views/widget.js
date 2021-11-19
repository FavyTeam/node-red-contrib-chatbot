import React, { useState } from 'react';
import { Placeholder, SelectPicker, Toggle, Button } from 'rsuite';
import { useQuery, useMutation } from 'react-apollo';

import Panel from '../../../src/components/grid-panel';
import useSocket from '../../../src/hooks/socket';

import FunnelGraph from './funnel-graph';
import '../funnel.scss';
import { GROUPED_EVENTS, DELETE_FLOW } from '../queries';

const { Paragraph } = Placeholder;

const FunnelWidget = () => {
  const [flow, setFlow] = useState(undefined);
  const [version, setVersion] = useState(1);
  const { sendMessage } = useSocket();
  const [percentile, setPercentile] = useState(false);
  const { loading, error, data, refetch } = useQuery(GROUPED_EVENTS, {
    fetchPolicy: 'network-only',
    onCompleted: ({ counters: { events: { events }}}) => {
      setFlow(events.length !== 0 ? events[0].flow : null)
    }
  });
  const [
    deleteFlow,
    { loading: deleting },
  ] = useMutation(DELETE_FLOW, { });

  return (
    <Panel
      title="Funnel"
      className="widget-funnel"
    >
      {loading && <Paragraph rows={3}/>}
      {error && (
        <div>error</div>
      )}
      {!error && !loading && (
        <div>
          <div>
            <b>Flow</b>&nbsp;
            <SelectPicker
              value={flow}
              data={data.counters.events.events.map(event => ({ value: event.flow, label: event.flow }))}
              onChange={event => {
                setFlow(event)
              }}
              cleanable={false}
              searchable={false}
              placeholder="Select flow"
              size="md"
            />
            &nbsp;
            <Button
              onClick ={async () => {
                await refetch();
                setVersion(version + 1);
              }}>
              Reload
            </Button>
            &nbsp;
            <Button
              disabled={_.isEmpty(flow)}
              onClick={async () => {
                if (confirm('Clear events for this flow?')) {
                  await deleteFlow({ variables: { flow } });
                  setFlow(null);
                  sendMessage('mc.events.timestamp', { eventsTimestamp: (new Date()).toString() });
                  refetch();
                }
              }}>
              Clear
            </Button>
            <div className="perc-toggle">
              <b>%</b>&nbsp;
              <Toggle size="sm" checked={percentile} onChange={() => setPercentile(!percentile)}/>
            </div>
          </div>
          {flow != null && (
            <FunnelGraph
              key={`${flow}_${version}`}
              flow={flow}
              percentile={percentile}/>
          )}
          {flow == null && (
            <div className="empty">
              <div>No events</div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
};

export default FunnelWidget;