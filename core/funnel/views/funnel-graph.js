
import React from 'react';
import { Placeholder } from 'rsuite';
import { useQuery } from 'react-apollo';
import { ResponsiveSankey } from '@nivo/sankey'

import { EVENTS } from '../queries';
import toFunnel from '../helpers/to-funnel';

const { Paragraph } = Placeholder;

const FunnelGraph = ({ flow, percentile = false }) => {
  const { loading, error, data } = useQuery(EVENTS, {
    fetchPolicy: 'network-only',
    variables: { flow }
  });

  return (
    <div style={{ width: '100%', height: '300px' }}>
      {loading && <Paragraph rows={3} />}
      {!loading && !error && (
        <ResponsiveSankey
          data={toFunnel(data, { percentile })}
          margin={{ top: 20, right: 160, bottom: 0, left: 0 }}          
          colors={{ scheme: 'dark2' }}
          nodeOpacity={1}
          nodeThickness={18}
          nodeInnerPadding={3}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderColor={{ from: 'color', modifiers: [ [ 'darker', '1.6' ] ] }}
          linkOpacity={0.7}
          linkHoverOthersOpacity={0.1}
          labelPosition="outside"
          labelOrientation="vertical"
          labelPadding={16}
          labelTextColor={{ from: 'color', modifiers: [ [ 'darker', 1 ] ] }}
          animate={true}
          motionStiffness={140}
          motionDamping={13}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              translateX: 130,
              itemWidth: 100,
              itemHeight: 14,
              itemDirection: 'right-to-left',
              itemsSpacing: 2,
              itemTextColor: '#999',
              symbolSize: 14,
              effects: [
                {
                  on: 'hover',
                  style: { itemTextColor: '#000' }
                }
              ]
            }
          ]}
        />
      )}
    </div>
  );
};

export default FunnelGraph;