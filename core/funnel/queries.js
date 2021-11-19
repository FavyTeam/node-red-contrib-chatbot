import gql from 'graphql-tag';

const EVENTS = gql`
query($flow: String) {
  events(flow: $flow) {
    id,
    count,
    name, 
    flow,
    source
  }
}
`;

const GROUPED_EVENTS = gql`
query {
  counters {
    events {
      events {
        flow,
        count
      }
    }
  }
}
`;

const DELETE_FLOW = gql`
mutation($flow: String!) {
  deleteEvent(flow: $flow) 
}
`;

export { EVENTS, GROUPED_EVENTS, DELETE_FLOW };