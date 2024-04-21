export default {
  firstDocId: '5370275323016235',
  nextDocId: '5526725137340208',

  firstVariables: {
    UFI2CommentsProvider_commentsKey: 'CometSinglePageContentContainerFeedQuery',
    displayCommentsContextEnableComment: null,
    displayCommentsContextIsAdPreview: null,
    displayCommentsContextIsAggregatedShare: null,
    displayCommentsContextIsStorySet: null,
    displayCommentsFeedbackContext: null,
    feedbackSource: 22,
    feedLocation: 'PAGE_TIMELINE',
    omitPinnedPost: true,
    privacySelectorRenderLocation: 'COMET_STREAM',
    renderLocation: 'timeline',
    scale: 1,
    pageID: '', // pageId,
    useDefaultActor: false,
    __relay_internal__pv__FBReelsEnableDeferrelayprovider: true,
  },

  nextVariables: {
    //   ...firstVariables, // merge with firstVariable
    UFI2CommentsProvider_commentsKey: 'CometSinglePageContentContainerFeedQuery',
    count: 3,
    focusCommentID: null,
    scale: 1,
    id: '', // pageId
  },

  firstBody: {
    fb_api_req_friendly_name: 'CometSinglePageContentContainerFeedQuery',
    doc_id: '5370275323016235', // doc_id
  },

  nextBody: {
    fb_api_req_friendly_name: 'CometModernPageFeedPaginationQuery',
    doc_id: '5526725137340208',
  },

  firstOptions: {
    headers: {
      'x-fb-friendly-name': 'CometSinglePageContentContainerFeedQuery',
    },
    method: 'POST',
    // throwHttpErrors: false,
  },

  nextOptions: {
    headers: {
      'x-fb-friendly-name': 'CometModernPageFeedPaginationQuery',
    },
  },
}
