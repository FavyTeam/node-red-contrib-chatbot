import gql from 'graphql-tag';

const SEARCH = gql`
query($id: Int,$username: String, $search: String) {
  users(id: $id,username: $username, search: $search) {
    id,
    userId,
    username,
    language,
    first_name,
    last_name,
    chatIds {
      chatId,
      transport
    }
  }
}`;



export { SEARCH };