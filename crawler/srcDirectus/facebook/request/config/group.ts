export default {
  firstDocId: '5294690270657804',
  nextDocId: '7660871813985142',

  firstVariables: {
    UFI2CommentsProvider_commentsKey: 'CometGroupDiscussionRootSuccessQuery',
    displayCommentsContextEnableComment: null,
    displayCommentsContextIsAdPreview: null,
    displayCommentsContextIsAggregatedShare: null,
    displayCommentsContextIsStorySet: null,
    displayCommentsFeedbackContext: null,
    feedbackSource: 0,
    feedLocation: 'GROUP',
    feedType: 'DISCUSSION',
    focusCommentID: null,
    omitPinnedPost: true,
    hasHoistStories: false,
    hoistedSectionHeaderType: 'notifications',
    hoistStories: [],
    hoistStoriesCount: 0,
    privacySelectorRenderLocation: 'COMET_STREAM',
    regular_stories_count: 1,
    regular_stories_stream_initial_count: 1,
    renderLocation: 'group',
    scale: 1,
    shouldDeferMainFeed: false,
    sortingSetting: 'CHRONOLOGICAL',
    useDefaultActor: false,
    __relay_internal__pv__FBReelsEnableDeferrelayprovider: true,
  },

  nextVariables: {
    //   ...firstVariables, // merge with firstVariable
    UFI2CommentsProvider_commentsKey: 'CometGroupDiscussionRootSuccessQuery',
    count: 3,
    scale: 1,
    stream_count: 1,
    id: '', // pageId
  },

  firstBody: {
    fb_api_req_friendly_name: 'CometGroupDiscussionRootSuccessQuery',
    doc_id: '5294690270657804', // doc_id
  },

  nextBody: {
    fb_api_req_friendly_name: 'GroupsCometFeedRegularStoriesPaginationQuery',
    doc_id: '7660871813985142',
  },

  firstOptions: {
    headers: {
      'x-fb-friendly-name': 'CometGroupDiscussionRootSuccessQuery',
    },
    method: 'POST',
    // throwHttpErrors: false,
  },

  nextOptions: {
    headers: {
      'x-fb-friendly-name': 'GroupsCometFeedRegularStoriesPaginationQuery',
    },
  },
}
