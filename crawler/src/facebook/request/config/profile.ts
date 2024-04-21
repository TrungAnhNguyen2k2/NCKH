export default {
  firstDocId: '5336916719709247',
  nextDocId: '5762145303872494',

  firstVariables: {
    UFI2CommentsProvider_commentsKey: 'ProfileCometTimelineRoute',
    count: 1,
    feedbackSource: 0,
    feedLocation: 'TIMELINE',
    omitPinnedPost: true,
    privacySelectorRenderLocation: 'COMET_STREAM',
    renderLocation: 'timeline',
    scale: 1,
    userID: '', // profileId
    __relay_internal__pv__FBReelsEnableDeferrelayprovider: true,
  },

  nextVariables: {
    //   ...firstVariables, // merge with firstVariable
    afterTime: null,
    beforeTime: null,
    count: 3,
    displayCommentsContextEnableComment: null,
    displayCommentsContextIsAdPreview: null,
    displayCommentsContextIsAggregatedShare: null,
    displayCommentsContextIsStorySet: null,
    displayCommentsFeedbackContext: null,
    focusCommentID: null,
    memorializedSplitTimeFilter: null,
    postedBy: null,
    privacy: null,
    scale: 1,
    stream_count: 1,
    taggedInOnly: null,
    useDefaultActor: false,
    id: '', // profileId
  },

  firstBody: {
    fb_api_req_friendly_name: 'ProfileCometTimelineFeedQuery',
    doc_id: '5336916719709247', // doc_id
  },

  nextBody: {
    fb_api_req_friendly_name: 'ProfileCometTimelineFeedQuery',
    doc_id: '5762145303872494',
  },

  firstOptions: {
    headers: {
      'x-fb-friendly-name': 'ProfileCometTimelineFeedQuery',
    },
    method: 'POST',
    // throwHttpErrors: false,
  },

  nextOptions: {
    headers: {
      'x-fb-friendly-name': 'ProfileCometTimelineFeedQuery',
    },
  },
}
