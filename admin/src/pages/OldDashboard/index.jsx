import moment from 'moment'
import {Button} from 'primereact/button'
import {Menu} from 'primereact/menu'
import React, {useEffect, useRef, useState} from 'react'
import {useMutation, useQuery} from 'react-query'
import PostReview from './DashboardComponents/PostReview'
import {getAllPosts, getAllPostsDashboard} from '../../service/postAPI'
import {getAllSources, getAllSourcesDashboard} from '../../service/sourceAPI'
import {getAllTopics, getAllTopicsDashboard} from '../../service/topicAPI'
import socket from '../../service/socket.js'
import {createHistory} from '../../service/historyAPI'
import {useSelector} from 'react-redux'
const Dashboard = (props) => {
  const menu2 = useRef(null)
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user?.userData?.id || '')

  const [lineOptions, setLineOptions] = useState(null)
  const keyNewPosts = `${process.env.REACT_APP_API_URL}/content?page=1&pageSize=10&sortBy=postedAt&desc=true`
  const keyTopPosts = `${
    process.env.REACT_APP_API_URL
  }/content?page=1&pageSize=10&sortBy=totalReactions&desc=true&fromDate=${moment()
    .startOf('day')
    .toISOString()}&toDate=${moment().endOf('day').toISOString()}`
  const keyFollowPosts = `${process.env.REACT_APP_API_URL}/content?page=1&pageSize=10&tagIds=878aa7a3-8691-49b9-8018-2159a8b55175&desc=true`
  const keyTotalTopic = `${process.env.REACT_APP_API_URL}/topic?page=1&pageSize=1`
  const keyTotalPostFollow = `${process.env.REACT_APP_API_URL}/content?page=1&pageSize=1`
  const keyTotalTodayTopic = `${process.env.REACT_APP_API_URL}/topic?page=1&pageSize=0&updatedAt=${moment()
    .startOf('day')
    .toISOString()}`
  const keyTotalContentToday = `${process.env.REACT_APP_API_URL}/content?page=1&pageSize=1&fromDate=${moment()
    .startOf('day')
    .toISOString()}&toDate=${moment().endOf('day').toISOString()}`
  const keyTotalFBFollow = `${process.env.REACT_APP_API_URL}/source?page=1&pageSize=0&type=FB_PAGE`
  const keyTotalToday = `${process.env.REACT_APP_API_URL}/content/totalSource/dashboard`
  const keyTotalWebFollow = `${process.env.REACT_APP_API_URL}/source?page=1&pageSize=0&type=WEBSITE`
  const totalTopic = useQuery(keyTotalTopic, (query) => getAllTopics({query, token}))
  const totalPostFollow = useQuery(keyTotalPostFollow, (query) => getAllTopics({query, token}))
  const totalTodayTopic = useQuery(keyTotalTodayTopic, (query) => getAllTopics({query, token}))
  const totalContentToday = useQuery(keyTotalContentToday, (query) => getAllPosts({query, token}))
  const totalFBFollow = useQuery(keyTotalFBFollow, (query) => getAllSources({query, token}))
  const totalPostToday = useQuery(keyTotalToday, (query) => getAllPosts({query, token}))
  const totalWebFollow = useQuery(keyTotalWebFollow, (query) => getAllSources({query, token}))
  const newPosts = useQuery(keyNewPosts, (query) => getAllPosts({query, token}))
  const topPosts = useQuery(keyTopPosts, (query) => getAllPosts({query, token}))
  const followPost = useQuery(keyFollowPosts, (query) => getAllPosts({query, token}))
  const applyLightTheme = () => {
    const lineOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#495057',
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#495057',
          },
          grid: {
            color: '#ebedef',
          },
        },
        y: {
          ticks: {
            color: '#495057',
          },
          grid: {
            color: '#ebedef',
          },
        },
      },
    }
    setLineOptions(lineOptions)
  }

  const applyDarkTheme = () => {
    const lineOptions = {
      plugins: {
        legend: {
          labels: {
            color: '#ebedef',
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: '#ebedef',
          },
          grid: {
            color: 'rgba(160, 167, 181, .3)',
          },
        },
        y: {
          ticks: {
            color: '#ebedef',
          },
          grid: {
            color: 'rgba(160, 167, 181, .3)',
          },
        },
      },
    }

    setLineOptions(lineOptions)
  }

  useEffect(() => {
    socket.on('update_dashboard', (data) => {
      // totalTopic.refetch();
      totalPostFollow.refetch()
      totalContentToday.refetch()
      newPosts.refetch()
      topPosts.refetch()
      followPost.refetch()
      if (data?.type == 'FB_POST') {
        totalFBFollow.refetch()
        totalPostToday.refetch()
      } else {
        totalWebFollow.refetch()
        totalPostToday.refetch()
      }
    })
  }, [
    followPost,
    newPosts,
    topPosts,
    totalContentToday,
    totalFBFollow,
    totalPostToday,
    totalPostFollow,
    totalWebFollow,
  ])

  useEffect(() => {
    if (props.colorMode === 'light') {
      applyLightTheme()
    } else {
      applyDarkTheme()
    }
  }, [props.colorMode])
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  useEffect(() => {
    addHistory.mutate({newData: {screen: 'Dashboard', description: 'Xem danh dashboard'}, token})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="grid">
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

      <div className="col-12 xl:col-6">
        <div className="card">
          <div className="flex align-items-center justify-content-between mb-4">
            <h5>Bài viết mới</h5>
            {/* <div>
              <Button type="button" icon="pi pi-ellipsis-v" className="p-button-rounded p-button-text p-button-plain" onClick={(event) => menu2.current.toggle(event)} />
              <Menu
                ref={menu2}
                popup
                model={[
                  { label: "Add New", icon: "pi pi-fw pi-plus" },
                  { label: "Remove", icon: "pi pi-fw pi-minus" },
                ]}
              />
            </div> */}
          </div>

          <ul className="p-0 mx-0 mt-0 mb-4 list-none">
            {newPosts && newPosts?.data && newPosts?.data?.docs && newPosts?.data?.docs?.length
              ? newPosts?.data?.docs?.map((post, i) => (
                  <li key={i} className="flex align-items-start py-2 border-bottom-1 surface-border">
                    <PostReview data={post} />
                  </li>
                ))
              : ''}
          </ul>
        </div>
      </div>

      <div className="col-12 xl:col-6">
        <div className="card">
          <div className="flex align-items-center justify-content-between mb-4">
            <h5>Bài viết nổi bật trong ngày</h5>
          </div>

          <ul className="p-0 mx-0 mt-0 mb-4 list-none">
            {topPosts && topPosts?.data && topPosts?.data?.docs && topPosts?.data?.docs?.length
              ? topPosts?.data?.docs.map((post, i) => (
                  <li key={i} className="flex align-items-start py-2 border-bottom-1 surface-border">
                    <PostReview data={post} />
                  </li>
                ))
              : ''}
          </ul>
        </div>
      </div>
      <div className="col-12 xl:col-6">
        <div className="card">
          <div className="flex align-items-center justify-content-between mb-4">
            <h5>Bài viết được theo dõi</h5>
          </div>

          <ul className="p-0 mx-0 mt-0 mb-4 list-none">
            {followPost && followPost?.data && followPost?.data?.docs && followPost?.data?.docs?.length
              ? followPost?.data.docs?.map((post, i) => (
                  <li key={i} className="flex align-items-start py-2 border-bottom-1 surface-border">
                    <PostReview data={post} />
                  </li>
                ))
              : ''}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default React.memo(Dashboard)
