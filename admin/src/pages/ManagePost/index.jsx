import moment from "moment"
import {AutoComplete} from "primereact/autocomplete"
import {Calendar} from "primereact/calendar"
import {DataView} from "primereact/dataview"
import {Dropdown} from "primereact/dropdown"
import {InputSwitch} from "primereact/inputswitch"
import {OverlayPanel} from "primereact/overlaypanel"
import {Toast} from "primereact/toast"
import {ToggleButton} from "primereact/togglebutton"
import React, {useEffect, useRef, useState} from "react"
import {useMutation, useQuery, useQueryClient} from "react-query"
import {useDispatch, useSelector} from "react-redux"
import {useHistory} from "react-router-dom"
import invalidImage from "../../assets/images/invalid.jpg"
import useQueryRoute from "../../hooks/useQuery"
import {createHistory} from "../../service/historyAPI"
import {getAllPosts, updatePost} from "../../service/postAPI"
import {getAllProfiles} from "../../service/profileAPI"
import {getAllSources} from "../../service/sourceAPI.js"
import {getAllTags} from "../../service/tagAPI"
import {getAllTopics} from "../../service/topicAPI.js"
import {setQueryStr} from "../../store/queryStore"
import {Button} from "primereact/button"
import {ConfirmPopup} from "primereact/confirmpopup"
import {confirmPopup} from "primereact/confirmpopup"
import "./DataViewDemo.css"
TopicManage.propTypes = {}

function TopicManage(props) {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [layout, setLayout] = useState("grid")
  const [loading, setLoading] = useState(true)
  const rows = useRef(12)
  const op = useRef()
  const history = useHistory()

  const {token, userData} = useSelector((state) => state.user)
  const queryStr = useSelector((state) => state.query.queryStr)
  const isMounted = useRef(false)
  const [topic, setTopic] = useState({
    id: "all",
    name: "Tất cả chủ đề",
  })
  const [topicQuery, setTopicQuery] = useState({
    id: "all",
    name: "Tất cả chủ đề",
  })
  const [source, setSource] = useState({
    id: "all",
    name: "Tất cả nguồn",
  })
  const [sourceQuery, setSourceQuery] = useState({
    id: "all",
    name: "Tất cả nguồn",
  })

  const [sources, setSources] = useState([])
  const [detailPost, setDetailPost] = useState(null)
  const [topics, setTopics] = useState([])
  const [filterTopics, setFilterTopics] = useState(null)
  const [filterSources, setFilterSources] = useState(null)
  const [displayDialog, setDisplayDialog] = useState(false)
  const [date, setDate] = useState([new Date(new Date().setDate(new Date().getDate() - 7)), new Date()])
  const [onWebsite, setOnWebsite] = useState(true)
  const [onFacebook, setOnFacebook] = useState(true)
  const [notHandle, setOnnotHandle] = useState(true)
  const [skippedPost, setOnskippedPost] = useState(false)
  const [handledPost, setOnhandledPost] = useState(false)
  const [onNegative, setOnNegative] = useState(true)
  const [onNotNegative, setOnNotNegative] = useState(true)

  const [sort, setSort] = useState("postedAt")
  const [sortType, setSortType] = useState(false)
  const [queryDate, setQueryDate] = useState(
    `fromDate=${moment().startOf("year").toISOString()}&toDate=${moment().endOf("day").toISOString()}`,
  )
  const [keywordsTag, setKeywordsTag] = useState("")
  // const [ arrayTags, setArrayTags ] = useState( [{value: "878aa7a3-8691-49b9-8018-2159a8b55175", label: "Tiêu cực"}] );
  const [arrayTags, setArrayTags] = useState([])
  const [filterTags, setFilterTags] = useState([])
  const [keywordsProfile, setKeywordsProfile] = useState("")
  const [arrayProfiles, setArrayProfiles] = useState([])
  const [filterProfiles, setFilterProfiles] = useState([])
  const toast = useRef(null)

  let query = useQueryRoute()
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 12,
    page: 0,
  })
  const keyTags = `${process.env.REACT_APP_API_URL}/tag?page=1&pageSize=12&name=${keywordsTag}`
  const tags = useQuery(keyTags, (query) => getAllTags(query, token), {
    onSuccess: (data) => {
      setFilterTags([
        ...data?.docs.map((p) => ({
          value: p.id,
          label: p.name,
        })),
      ])
    },
  })
  const keyProfiles = `${process.env.REACT_APP_API_URL}/profile?page=1&pageSize=12&name=${keywordsProfile}`
  const profiles = useQuery(keyProfiles, (query) => getAllProfiles(query, token), {
    onSuccess: (data) => {
      setFilterProfiles([
        ...data?.docs.map((p) => ({
          value: p.id,
          label: p.name,
        })),
      ])
    },
  })
  const key = `${process.env.REACT_APP_API_URL}/content?page=${lazyParams.page + 1}&pageSize=${lazyParams.limit}${
    sort ? "&sortBy=" + sort : "&sortBy=postedAt"
  }${sortType ? "&desc=false" : "&desc=true"}${queryDate ? "&" + queryDate.trim() : ""}${
    topic?.id ? (topicQuery.id == "all" ? "" : `&topicIds=${topicQuery?.id}`) : ""
  }${source?.id ? (sourceQuery.id == "all" ? "" : `&sourceId=${sourceQuery?.id}`) : ""}${
    onWebsite && !onFacebook ? `&type=WEBSITE_POST` : ""
  }${onFacebook && !onWebsite ? `&type=FB_POST` : ""}${onNegative && !onNotNegative ? "&userHandle=handledPost" : ""}${
    onNotNegative && !onNegative ? "&userHandle=null" : ""
  }${notHandle && !skippedPost && !handledPost ? `&userHandle=notHandle` : ""}${
    !notHandle && skippedPost && !handledPost ? `&userHandle=skippedPost` : ""
  }${!notHandle && !skippedPost && handledPost ? `&userHandle=handledPost` : ""}${
    notHandle && skippedPost && !handledPost ? `&userHandle=notHandle,skippedPost` : ""
  }${notHandle && !skippedPost && handledPost ? `&userHandle=notHandle,handledPost` : ""}${
    !notHandle && skippedPost && handledPost ? `&userHandle=skippedPost,handledPost` : ""
  }${arrayTags && arrayTags?.length ? `&tagIds=${arrayTags.map((p) => p.value).join(",")}` : ""}${
    arrayProfiles && arrayProfiles?.length ? `&profileIds=${arrayProfiles.map((p) => p.value).join(",")}` : ""
  }${query.get("ids") ? `&ids=${query.get("ids")}` : ""}`

  const keyAllTopic = `${process.env.REACT_APP_API_URL}/topic`
  const keyAllSource = `${process.env.REACT_APP_API_URL}/source`
  const getAllTopic = useQuery(keyAllTopic, (query) => getAllTopics({query, token}), {
    onSuccess: (data) => {
      if (data) {
        setTopics(
          data?.docs.map((p) => ({
            id: p.id,
            name: p.name,
          })),
        )
      }
    },
  })
  const getAllSource = useQuery(keyAllSource, (query) => getAllSources({query, token}), {
    onSuccess: (data) => {
      if (data) {
        setSources(
          data?.docs.map((p) => ({
            id: p.id,
            name: p.name,
          })),
        )
      }
    },
  })
  useEffect(() => {
    if (query.get("id")) {
      dispatch(setQueryStr(query.get("id") || ""))
    }
    if (query?.get("topicId") && topics && topics.length) {
      let filterTopics = topics.filter((p) => p.id == query.get("topicId"))
      filterTopics = [
        ...filterTopics,
        {
          id: "all",
          name: "Tất cả chủ đề",
        },
      ]
      setFilterTopics(filterTopics)
      setTopic({
        id: topics.find((p) => p.id == query.get("topicId"))?.id,
        name: topics.find((p) => p.id == query.get("topicId"))?.name,
      })
    }
  }, [dispatch, query, topics])

  // useEffect(() => {

  //     // let filterTopics = topics.filter((p) => p.id == query.get("topicId"))
  //     // filterTopics = [...filterTopics, {
  //     //   id: "all",
  //     //   name: "Tất cả chủ đề"
  //     // }]
  //     // setFilterTopics(filterTopics);
  // }, [sources]);
  const {isLoading, error, data, isFetching, refetch} = useQuery(key, (query) => getAllPosts({query, token}), {})
  const sorts = [
    {
      label: "Ngày đăng",
      value: "postedAt",
    },
    {
      label: "Số lượng like",
      value: "likes",
    },
    {
      label: "Số lượng bình luận",
      value: "comments",
    },
    {
      label: "Số lượng chia sẻ",
      value: "shares",
    },
  ]
  const searchTopic = (event) => {
    setTimeout(() => {
      let _filterTopic
      if (!event.query.trim().length) {
        _filterTopic = [...topics]
      } else {
        _filterTopic = topics.filter((topic) => {
          return topic.name.toLowerCase().startsWith(event.query.toLowerCase())
        })
      }
      _filterTopic = [..._filterTopic, {id: "all", name: "Tất cả chủ đề"}]
      setFilterTopics(_filterTopic)
    }, 250)
  }
  const searchSource = (event) => {
    setTimeout(() => {
      let _filterSource
      if (!event.query.trim().length) {
        _filterSource = [...sources]
      } else {
        _filterSource = sources.filter((source) => {
          return source.name.toLowerCase().startsWith(event.query.toLowerCase())
        })
      }
      _filterSource = [..._filterSource, {id: "all", name: "Tất cả nguồn"}]
      setFilterSources(_filterSource)
    }, 250)
  }
  useEffect(() => {
    if (isMounted.current) {
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    }
  }, [loading])
  const openDetailPost = (data) => {
    setQueryStr(data.id || "")
    history.push({
      pathname: "/bai-viet",
      search: `?id=${data.id}`,
    })
    setDetailPost(data)
    setDisplayDialog(true)
  }
  const onPage = (event) => {
    setLazyParams({...lazyParams, first: event.first, page: event.page})
  }
  const handleSortType = (e) => {
    setSortType(e.value)
  }
  const filterRange = (e) => {
    setDate(e.value)
    if (e?.value[1]) {
      setQueryDate(
        `fromDate=${moment(e.value[0]).startOf("day").toISOString()}&toDate=${moment(e.value[1])
          .endOf("day")
          .toISOString()}`,
      )
    } else {
      setQueryDate(
        `fromDate=${moment(e.value[0]).startOf("day").toISOString()}&toDate=${moment(e.value[0])
          .endOf("day")
          .toISOString()}`,
      )
    }
  }
  const selectTag = (e) => {
    setArrayTags([...arrayTags, e.value])
  }
  const unSelectTag = (e) => {
    const newArrayTags = arrayTags.filter((p) => p.value != e.value.value)
    setArrayTags(newArrayTags)
  }
  const searchTags = (event) => {
    let timeout
    let query = event.query

    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    timeout = setTimeout(() => {
      setKeywordsTag(query)
    }, 300)
  }
  const selectProfile = (e) => {
    setArrayProfiles([...arrayProfiles, e.value])
  }
  const unSelectProfile = (e) => {
    const newArrayProfiles = arrayProfiles.filter((p) => p.value != e.value.value)
    setArrayProfiles(newArrayProfiles)
  }
  const searchProfiles = (event) => {
    let timeout
    let query = event.query

    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    timeout = setTimeout(() => {
      setKeywordsProfile(query)
    }, 300)
  }
  const handleError = (err) => {
    if (err?.response?.data?.msg) {
      toast.current.show({severity: "error", summary: err.response.data.msg, detail: "Lỗi"})
      throw new Error(err.response.data.msg)
    } else if (err?.message) {
      toast.current.show({severity: "error", summary: err.message, detail: "Lỗi"})
      throw new Error(err.message)
    } else {
      toast.current.show({severity: "error", summary: err, detail: "Lỗi"})
    }
  }
  const updateStatus = useMutation(updatePost, {
    onSuccess: () => {
      toast.current.show({severity: "success", summary: "Cập nhật bài viết thành công", detail: "Thành công"})
    },
    onError: (error) => {
      handleError(error)
    },
    onSettled: () => {
      //   setDisplayDialog(false)
      history.push({
        pathname: `/bai-viet`,
        search: `?id=${data.id}`,
      })
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/content`)
        },
      })
    },
  })
  const handlePost = (val, dataPost) => {
    if (val === "cancelHandle") {
      updateStatus.mutate({
        id: dataPost?.id,
        newData: {
          userHandle: "skippedPost",
          process: false,
        },
        token,
      })
    } else if (val === "handle") {
      updateStatus.mutate({
        id: dataPost?.id,
        newData: {
          userHandle: "handledPost",
          process: true,
        },
        token,
      })
    }
  }
  const handleTag = (val, tagId, dataPost) => {
    let listTag = dataPost?.tagsInfo.map((e) => e.id)

    if (val) {
      updateStatus.mutate({
        id: dataPost?.id,
        newData: {
          tagIds: [...listTag, tagId],
        },
        token,
      })
    } else {
      updateStatus.mutate({
        id: dataPost?.id,
        newData: {
          tagIds: listTag.filter((w) => w !== tagId),
        },
        token,
      })
    }
  }

  const handleContent = useMutation(updatePost, {
    onSuccess: (updateData) => {
      toast.current.show({severity: "success", summary: "Đã bỏ qua bài viết", detail: "Thành công"})
      addHistory.mutate({
        newData: {
          screen: "Bài viết",
          description: `Bỏ qua bài viết id: ${updateData?.doc[0]?.id} từ: {title: ${
            updateData?.doc[0]?.title || ""
          }, editedTextContent : ${updateData?.doc[0]?.editedTextContent} , profileids: [${
            updateData?.doc[0]?.profilesInfo?.map((p) => p?.id).join(", ") || ""
          }], tagids: [${updateData?.doc[0]?.tagsInfo?.map((p) => p?.id).join(", ") || ""}]}`,
        },
        token,
      })
    },
    onSettled: () => {
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/content`)
        },
      })
    },
  })

  const renderGridItem = (data) => {
    return (
      <div className="col-12 md:col-6 lg:col-4">
        <div className="product-grid-item card p-4" style={{borderRadius: "0.375rem"}}>
          <div className="product-grid-item-top">
            <div className="flex gap-2 w-full align-content-start">
              <img
                className="h-3rem w-3rem border-circle m-0"
                src={data?.authorInfo?.avatar || data?.sourceInfo?.avatar}
                onError={({currentTarget}) => {
                  currentTarget.onerror = null // prevents looping
                  currentTarget.src = `${invalidImage}`
                }}
                alt=""
              />
              <div className="w-full">
                <div className="flex justify-content-between align-items-start">
                  <p className="product-category mb-1 w-9">
                    {data.type == "WEBSITE_POST" ? "Webiste: " : ""}{" "}
                    {data?.sourceInfo?.name !== data?.authorInfo?.name && data?.authorInfo?.name
                      ? data?.authorInfo?.name + " - "
                      : ""}{" "}
                    {data?.sourceInfo?.name}
                  </p>

                  {data?.userHandle === "handledPost" && (
                    <p className={`product-badge status-instock align-self-start`}>Đã xử lý</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <p className="text-sm flex align-items-center align-self-center m-0 gap-1">
                    {moment(data.postedAt).format("HH:mm DD/MM/YYYY")}
                    <i className="pi pi-clock"></i>
                  </p>
                </div>
              </div>
            </div>
            {/* <span className={`product-badge status-instock`}>{data.nameTopic}</span> */}
          </div>
          <hr />
          <div className="gap-1 flex flex-wrap">
            {tags.data.docs.map((e, i) => {
              if (e?.showOnPost === true) {
                return (
                  <span
                    key={i}
                    className={
                      e?.id === "878aa7a3-8691-49b9-8018-2159a8b55175"
                        ? "status-outofstock product-badge  inline-block flex flex-column md:flex-row md:align-items-center gap-1 ml-1"
                        : e?.id === "bafe7c3e-106c-4ebd-89c8-27f64de0c668"
                        ? "status-instock product-badge  inline-block flex flex-column md:flex-row md:align-items-center gap-1 ml-1"
                        : "product-badge status-normalofstock inline-block flex flex-column md:flex-row md:align-items-center gap-1 ml-1"
                    }
                  >
                    <InputSwitch
                      checked={data?.tagsInfo?.find((f) => f?.id === e?.id) !== undefined}
                      onChange={(f) => handleTag(f.value, e.id, data)}
                    />
                    {e.name}
                  </span>
                )
              }
              return ""
            })}
          </div>

          <div className="product-grid-item-content mt-2">
            {data.imageContents && data.imageContents.length && data.imageContents[0] ? (
              <img
                onClick={() => openDetailPost(data)}
                className="cursor-pointer w-full h-full"
                src={
                  data?.imageContents && data?.imageContents?.length && data?.imageContents[0]
                    ? data?.imageContents[0]
                    : invalidImage
                }
                onError={(e) => (e.target.src = invalidImage)}
                alt={data.title}
              />
            ) : (
              ""
            )}
            {/* <div className="product-name">{data?.title}</div> */}
          </div>
          <div className="">
            <p className="text-2xl font-bold">{data?.title ? data?.title : ""}</p>
            <p className="text-lg font-card cursor-pointer" onClick={() => openDetailPost(data)}>
              {!data?.textContent.includes(data?.editedTextContent?.slice(0, 20)) ? data?.editedTextContent : ""}
            </p>
            <p
              className="text-lg font-card cursor-pointer"
              style={{whiteSpace: "pre-line", wordBreak: "break-word"}}
              onClick={() => openDetailPost(data)}
            >
              {data?.textContent?.substr(0, 500) + `${data?.textContent?.length > 500 ? "... " : ""}`}
            </p>
            <hr />
            {data?.topicsInfo && data?.topicsInfo?.length ? (
              <div className="gap-2 flex flex-wrap">
                {data?.topicsInfo?.map((topic, i) => (
                  <span
                    key={i}
                    onClick={() => {
                      setTopic({
                        id: topic.id,
                        name: topic.name,
                      })
                      history.push({
                        pathname: "/bai-viet",
                        search: `?topicId=${topic?.id}`,
                      })
                    }}
                    className="product-badge status-new inline-block cursor-pointer"
                  >
                    {topic?.name}
                  </span>
                ))}
              </div>
            ) : (
              ""
            )}
            <hr />

            <div className="flex justify-content-start text-lg" style={{gap: "30px"}}>
              <div className="inline-flex align-items-center gap-1">
                <span className="mr-1"> {Number(data?.views || 0).toLocaleString("vi")}</span>{" "}
                <i className="pi pi-eye" style={{color: "blue"}}></i>
              </div>
              <div className="inline-flex align-items-center gap-1">
                <span className="mr-1"> {Number(data?.likes || 0).toLocaleString("vi")}</span>{" "}
                <i className="pi pi-thumbs-up" style={{color: "blue"}}></i>
              </div>
              <div className="inline-flex align-items-center gap-1">
                <span className="mr-1"> {Number(data?.commentCount || 0).toLocaleString("vi")}</span>
                <i className="pi pi-comments" style={{color: "#a89b32"}}></i>
              </div>
              <div className="inline-flex align-items-center gap-1">
                <span className="mr-1"> {Number(data?.shares || 0).toLocaleString("vi")}</span>{" "}
                <i className="pi pi-share-alt"></i>
              </div>
            </div>
            <hr />
            <div className="flex gap-1 mt-3 justify-content-end">
              <Button
                onClick={() => {
                  handleContent.mutate({
                    id: data.id,
                    newData: {
                      userHandle: "skippedPost",
                      process: false,
                    },
                    token,
                  })
                }}
                className="w-auto"
                label="Bỏ qua"
              ></Button>
              <ConfirmPopup />
              <Button
                className="p-button-primary w-auto"
                onClick={() => {
                  handlePost(data?.userHandle === "handledPost" ? "cancelHandle" : "handle", data)
                }}
              >
                {data?.userHandle === "handledPost" ? "Ngưng xử lý" : "Xử lý"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  const renderHeader = () => {
    return (
      <div>
        <div style={{textAlign: "left"}} className="flex flex-column gap-4 lg:flex-row justify-content-between">
          <div className="flex flex-column lg:flex-row justify-content-between" style={{rowGap: "20px"}}>
            <div className="flex flex-column" style={{rowGap: "20px"}}>
              <AutoComplete
                value={topic}
                suggestions={filterTopics}
                completeMethod={searchTopic}
                field="name"
                dropdown
                forceSelection
                onSelect={(e) => {
                  if (e?.value && e?.value?.id != "all") {
                    setTopicQuery(e.value)
                    history.push({
                      pathname: "/bai-viet",
                      search: `?topicId=${e.value.id}`,
                    })
                  } else {
                    setTopicQuery({
                      id: "all",
                      label: "Tất cả chủ đề",
                    })
                    history.push({
                      pathname: "/bai-viet",
                      search: ``,
                    })
                  }
                }}
                onChange={(e) => {
                  if (e.value) {
                    setTopic(e.value)
                  } else {
                    // setTopic({
                    //   id: "all",
                    //   name: "Tất cả chủ đề",
                    // });
                  }

                  // history.push({
                  //   pathname: "/bai-viet",
                  //   search: `?topicId=all`
                  // })
                }}
              />
              <div className="flex gap-2 align-items-center">
                {/* <Button label="Hôm nay" className="p-button-primary p-button-outlined" />
                            <Button label="Hôm qua" className="p-button-primary p-button-outlined" /> */}
                {/* <Button label="Tuần này" className="p-button-primary p-button-outlined" />
                            <Button label="Tháng này" className="p-button-primary p-button-outlined" /> */}
                <div>Sắp xếp</div>
                <Dropdown
                  optionLabel="label"
                  optionValue="value"
                  className="w-6 lg:w-auto"
                  value={sort}
                  options={sorts}
                  onChange={(e) => setSort(e.value)}
                  placeholder="Sắp xếp"
                />
                <ToggleButton
                  className="mr-1 mb-1 md:mb-0"
                  onLabel=""
                  offLabel=""
                  onIcon="pi pi-arrow-up"
                  offIcon="pi pi-arrow-down"
                  tooltip={sortType ? "Tăng dần" : "Giảm dần"}
                  checked={sortType}
                  onChange={(e) => handleSortType(e)}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-column gap-4">
            <AutoComplete
              value={source}
              suggestions={filterSources}
              completeMethod={searchSource}
              field="name"
              dropdown
              forceSelection
              onSelect={(e) => {
                setSourceQuery(e.value)
              }}
              onChange={(e) => {
                if (e.value) {
                  setSource(e.value)
                } else
                  setSource({
                    id: "all",
                    name: "",
                  })
              }}
              aria-label="Sources"
            />
            <div className="flex flex-column md:flex-row md:align-items-center gap-2 ml-4">
              <span>Facebook</span> <InputSwitch checked={onFacebook} onChange={(e) => setOnFacebook(e.value)} />
              <span>Website</span> <InputSwitch checked={onWebsite} onChange={(e) => setOnWebsite(e.value)} />
            </div>
          </div>
          <div className="flex flex-column gap-4">
            <Calendar
              id="range"
              dateFormat="dd/mm/yy"
              value={date}
              onChange={(e) => filterRange(e)}
              selectionMode="range"
              placeholder="DD/MM/YYYY - DD/MM/YYYY"
              readOnlyInput
              showIcon
            />
            <div className="flex flex-column md:flex-row md:align-items-center gap-2 ml-4">
              <span>Chưa xử lý</span> <InputSwitch checked={notHandle} onChange={(e) => setOnnotHandle(e.value)} />
              <span>Đã bỏ qua</span> <InputSwitch checked={skippedPost} onChange={(e) => setOnskippedPost(e.value)} />
              <span>Đã thêm vào xử lý</span>{" "}
              <InputSwitch checked={handledPost} onChange={(e) => setOnhandledPost(e.value)} />
            </div>
          </div>
        </div>
        <div className="filter-content flex gap-4 mt-4">
          <div className="w-full flex flex-column gap-2">
            <span>Lọc theo thẻ</span>
            <AutoComplete
              className="w-full flex"
              dropdown
              multiple
              field="label"
              suggestions={filterTags}
              onDropdownClick={() => setFilterTags([...filterTags])}
              completeMethod={searchTags}
              value={arrayTags}
              onSelect={(e) => selectTag(e)}
              onUnselect={(e) => unSelectTag(e)}
            />
          </div>
          <div className="w-full flex flex-column gap-2">
            <span>Lọc theo hồ sơ</span>

            <AutoComplete
              className="w-full flex"
              dropdown
              multiple
              field="label"
              suggestions={filterProfiles}
              onDropdownClick={() => setFilterProfiles([...filterProfiles])}
              completeMethod={searchProfiles}
              value={arrayProfiles}
              onSelect={(e) => selectProfile(e)}
              onUnselect={(e) => unSelectProfile(e)}
            />
          </div>
        </div>
      </div>
    )
  }
  const header = renderHeader()

  // const handlePost = (process) => {
  //   updateStatus.mutate({ id: detailPost.id, newData: { ...detailPost, process: process } });
  // };
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  useEffect(() => {
    if (data && data?.docs)
      addHistory.mutate({
        newData: {
          screen: "Bài viết",
          description: `Xem danh sách bài viết page ${data?.page} có ${data?.docs.length} bản ghi`,
        },
        token,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.page])
  return (
    <div className="grid">
      <Toast ref={toast} />

      <div className="col-12">
        <div className="card p-1 md:p-2 lg:p-4">
          <div className="dataview-demo">
            <div className="card p-1 md:p-2 lg:p-4">
              <DataView
                value={data?.docs}
                layout={layout}
                header={header}
                itemTemplate={renderGridItem}
                lazy
                paginator
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                currentPageReportTemplate="Hiển thị {first} - {last} của tổng {totalRecords} bản ghi"
                paginatorPosition={"both"}
                rows={rows.current}
                totalRecords={data?.total}
                first={lazyParams.first}
                onPage={onPage}
                loading={isLoading || isFetching}
                emptyMessage="Không tìm thấy bài viết"
              />
            </div>
          </div>
        </div>
      </div>
      <OverlayPanel ref={op}></OverlayPanel>
    </div>
  )
}

export default React.memo(TopicManage)
