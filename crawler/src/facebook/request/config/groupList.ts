export default {
  firstDocId: '5013454192068461',
  nextDocId: '4525573520882601',

  firstVariables: {
    ordering: ['viewer_added'],
    cursor: null,
    scale: 1,
  },

  nextVariables: {
    count: 10,
    cursor: '',
  },

  firstBody: {
    fb_api_req_friendly_name: 'GroupsCometTabGroupMembershipDialogQuery',
  },

  nextBody: {
    fb_api_req_friendly_name: 'GroupsCometTabGroupMembershipListPaginationQuery',
  },

  firstOptions: {
    headers: {
      'x-fb-friendly-name': 'GroupsCometTabGroupMembershipDialogQuery',
    },
    method: 'POST',
    // throwHttpErrors: false,
  },

  nextOptions: {
    headers: {
      'x-fb-friendly-name': 'GroupsCometTabGroupMembershipListPaginationQuery',
    },
  },
}
