const Statistical = ({
  totalTopic,
  totalTodayTopic,
  totalPostFollow,
  totalContentToday,
  totalFBFollow,
  totalPostToday,
  totalWebFollow,
}) => {
  return (
    <>
      <div className="col-12 lg:col-6 xl:col-3">
        <div className="card mb-0">
          <div className="flex justify-content-between mb-3">
            <div>
              <span className="block text-500 font-medium mb-3">Chủ đề</span>
              <div className="text-900 font-medium text-xl">
                {Number(totalTopic?.data?.total || 0).toLocaleString('vi')}
              </div>
            </div>
            <div
              className="flex align-items-center justify-content-center bg-blue-100 border-round"
              style={{width: '2.5rem', height: '2.5rem'}}
            >
              <i className="pi pi-comments text-blue-500 text-xl" />
            </div>
          </div>
          <span className="text-green-500 font-medium">
            {Number(totalTodayTopic?.data?.total || 0).toLocaleString('vi')} chủ đề{' '}
          </span>
          <span className="text-500">được cập nhật hôm nay</span>
        </div>
      </div>
      <div className="col-12 lg:col-6 xl:col-3">
        <div className="card mb-0">
          <div className="flex justify-content-between mb-3">
            <div>
              <span className="block text-500 font-medium mb-3">Bài viết</span>
              <div className="text-900 font-medium text-xl">
                {Number(totalPostFollow?.data?.total || 0).toLocaleString('vi')} được theo dõi
              </div>
            </div>
            <div
              className="flex align-items-center justify-content-center bg-orange-100 border-round"
              style={{width: '2.5rem', height: '2.5rem'}}
            >
              <i className="pi pi-hashtag text-orange-500 text-xl" />
            </div>
          </div>
          <span className="text-green-500 font-medium">
            {Number(totalContentToday?.data?.total || 0).toLocaleString('vi')} bài viết{' '}
          </span>
          <span className="text-500">mới hôm nay</span>
        </div>
      </div>
      <div className="col-12 lg:col-6 xl:col-3">
        <div className="card mb-0">
          <div className="flex justify-content-between mb-3">
            <div>
              <span className="block text-500 font-medium mb-3">Trang Facebook</span>
              <div className="text-900 font-medium text-xl">
                {Number(totalFBFollow?.data?.total || 0).toLocaleString('vi')} được theo dõi
              </div>
            </div>
            <div
              className="flex align-items-center justify-content-center bg-cyan-100 border-round"
              style={{width: '2.5rem', height: '2.5rem'}}
            >
              <i className="pi pi-facebook text-cyan-500 text-xl" />
            </div>
          </div>
          <span className="text-green-500 font-medium">
            {Number(totalPostToday?.data?.doc?.totalFacebookSource || 0).toLocaleString('vi')} trang{' '}
          </span>
          <span className="text-500">có bài viết mới hôm nay</span>
        </div>
      </div>
      <div className="col-12 lg:col-6 xl:col-3">
        <div className="card mb-0">
          <div className="flex justify-content-between mb-3">
            <div>
              <span className="block text-500 font-medium mb-3">Trang tin tức</span>
              <div className="text-900 font-medium text-xl">
                {Number(totalWebFollow?.data?.total || 0).toLocaleString('vi')} được theo dõi
              </div>
            </div>
            <div
              className="flex align-items-center justify-content-center bg-purple-100 border-round"
              style={{width: '2.5rem', height: '2.5rem'}}
            >
              <i className="pi pi-globe text-purple-500 text-xl" />
            </div>
          </div>
          <span className="text-green-500 font-medium">
            {Number(totalPostToday?.data?.doc?.totalWebsiteSource || 0).toLocaleString('vi')} trang{' '}
          </span>
          <span className="text-500">có bài viết mới hôm nay</span>
        </div>
      </div>
    </>
  )
}

export default Statistical
