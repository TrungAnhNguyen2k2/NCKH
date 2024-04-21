import moment from "moment"
import {FilterMatchMode} from "primereact/api"
import {Button} from "primereact/button"
import {Calendar} from "primereact/calendar"
import {Column} from "primereact/column"
import {DataTable} from "primereact/datatable"
import {Dialog} from "primereact/dialog"
import {InputText} from "primereact/inputtext"
import {MultiSelect} from "primereact/multiselect"
import {Toast} from "primereact/toast"
import React, {useEffect, useRef, useState} from "react"
import {useMutation, useQuery, useQueryClient} from "react-query"
import {useSelector} from "react-redux"
import {Link} from "react-router-dom"
import {createHistory} from "../../service/historyAPI"
import {deleteTopic, getAllTopics} from "../../service/topicAPI"

import Form from "./Form"
AnalystPost.propTypes = {}

function AnalystPost(props) {
  const [postDialog, setPostDialog] = useState(false)
  const [date, setDate] = useState([new Date(moment().startOf("year")), new Date(moment().endOf("day"))])
  const [selection, setSelection] = useState(null)
  const [deletePostDialog, setDeletePostDialog] = useState(false)
  const [post, setPost] = useState(null)
  const [filterDateType, setFilterDateType] = useState("")
  const [edit, setEdit] = useState(false)
  const toast = useRef(null)
  const [queryDate, setQueryDate] = useState(
    `&fromDate=${moment().startOf("year").toISOString()}&toDate=${moment().endOf("day").toISOString()}`,
  )
  const queryClient = useQueryClient()
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user?.userData?.id || "")
  //   const columns = [
  //     {field: 'name', header: 'Tên chủ đề'},
  //     {field: 'keywords', header: 'Danh sách từ khóa'},
  //     {field: 'totalContent', header: 'Số bài viết'},
  //     {field: 'likes', header: 'Lượt thích'},
  //     {field: 'comments', header: 'Lượt bình luận'},
  //       {field: 'shares', header: 'Lượt chia sẻ'},
  //     {field: 'screenShot', header: 'Chụp ảnh'},
  //     {field: 'isActiveCrawl', header: 'Crawl'},
  //     {field: 'shares', header: 'Lượt chia sẻ'},
  // ];
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 10,
    page: 0,
    sortOrder: -1,
    sortField: "createdAt",
    filters: {
      categories: {value: null},
      name: {value: null},
    },
  })
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
  const key = `${process.env.REACT_APP_API_URL}/topic?page=${lazyParams.page + 1}&pageSize=${lazyParams.limit}${
    lazyParams.filters?.name && lazyParams.filters?.name?.value ? `&name=${lazyParams.filters?.name?.value}` : ""
  }${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"}${
    lazyParams.sortOrder == 1 ? "&desc=false" : lazyParams.sortOrder == -1 ? "&desc=true" : ""
  }${queryDate ? queryDate : ""}`
  const {isLoading, error, data} = useQuery(key, (query) => getAllTopics({query, token}), {})
  const remove = useMutation(deleteTopic, {
    onSuccess: (data) => {
      toast.current.show({severity: "success", summary: "Xóa chủ đề thành công", detail: "Thành công"})

      addHistory.mutate({
        newData: {
          screen: "Chủ đề",
          description: `Xóa chủ đề có thông tin: { id: ${post?.id}, name: ${post?.name}, keywords: ${JSON.stringify(
            post.keywords,
          )} }`,
        },
        token,
      })
      setPost({})
    },
    onError: (error) => handleError(error),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/topic`),
      }),
  })
  const onPage = (event) => {
    setLazyParams({...lazyParams, page: event.page, limit: 10, first: event.first})
  }
  const onSort = (event) => {
    setLazyParams({...lazyParams, ...event})
  }

  const onFilter = (event) => {
    event["page"] = 0
    setLazyParams({...lazyParams, page: event.page, limit: 10, first: event.first, filters: event.filters})
  }
  const openNew = () => {
    setPostDialog(true)
  }
  const keywordsTemplate = (rowData) => {
    return (
      <div>
        {rowData?.keywords?.map((p, index) => {
          return (
            <div style={{margin: "5px 0 5px 0"}} key={index}>
              {
                <span>
                  <span>{p.keywords}</span>{" "}
                  {/* <b style={{color: "#FF0000"}}>
                    {p.notify == "merger" ? " - Thông báo gộp" : p.notify == "priority" ? " - Thông báo ưu tiên" : ""}
                  </b> */}
                </span>
              }
            </div>
          )
        })}
      </div>
    )
  }
  const keywordsSearchTemplate = (rowData) => {
    return (
      <div>
        <div style={{margin: "5px 0 5px 0"}}>
          {
            <span>
              <span>{rowData.searchKeywords.join("|")}</span>{" "}
            </span>
          }
        </div>
      </div>
    )
  }
  const keywordsExcludeTemplate = (rowData) => {
    return (
      <div>
        <div style={{margin: "5px 0 5px 0"}}>
          {
            <span>
              <span>{rowData.excludeKeywords.join("|")}</span>{" "}
            </span>
          }
        </div>
      </div>
    )
  }

  const intervalTemplate = (rowData) => {
    return (
      <div style={{margin: "5px 0 5px 0"}}>
        {
          <span>
            <span>
              {rowData.intervalSearch === 15 * 60 * 1000
                ? "15 phút"
                : rowData.intervalSearch === 60 * 60 * 1000
                ? "1 giờ"
                : rowData.intervalSearch === 12 * 60 * 60 * 1000
                ? "12 giờ"
                : rowData.intervalSearch === 24 * 60 * 60 * 1000
                ? "24 giờ"
                : `${Math.floor(rowData.intervalSearch / (1000 * 60))} phút`}
            </span>
          </span>
        }
      </div>
    )
  }

  // const typeTemplate = (rowData) => {
  //   const concatStr = rowData?.categories
  //     ?.map((p) => {
  //       return p;
  //     })
  //     .join(", ");
  //   return <span>{concatStr}</span>;
  // };
  // const representativeFilterTemplate = (values) => {
  //   return <MultiSelect value={values.value} options={types} onChange={(e) => values.filterCallback(e.value)} optionLabel="label" placeholder="Any" className="p-column-filter" />;
  // };
  const nameFilterTemplate = (values) => {
    return (
      <InputText
        value={values.value}
        onChange={(e) => {
          values.filterCallback(e.target.value)
        }}
        placeholder="Name"
      />
    )
  }
  const confirmDeletePost = (post) => {
    setPost(post)
    setDeletePostDialog(true)
  }
  const hideDeletePostDialog = () => {
    setDeletePostDialog(false)
  }
  const deletePost = () => {
    remove.mutate({id: post.id, token})
    setDeletePostDialog(false)
  }
  const deletePostDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeletePostDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deletePost} />
    </React.Fragment>
  )
  const openEditPost = (rowData) => {
    setEdit(true)
    setPostDialog(true)
    setPost(rowData)
  }
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        {/* <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <Button className="p-button-rounded p-button-danger" title="Xóa" icon="pi pi-trash" onClick={() => confirmDeletePost(rowData)}></Button>
          </div>

          <div>
            <Link to="/bai-viet" title="Xem">
            <Button className="p-button-rounded p-button-primary" title="Xóa" icon="pi pi-eye" onClick={() => confirmDeletePost(rowData)}></Button>

            </Link>
          </div>
        </div> */}
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <i
              title="Xóa"
              className="pi pi-trash cursor-pointer"
              style={{color: "red"}}
              onClick={() => confirmDeletePost(rowData)}
            ></i>
          </div>
          <div>
            <i
              title="Cập nhật"
              className="pi pi-cog cursor-pointer"
              style={{color: "blue"}}
              onClick={() => openEditPost(rowData)}
            ></i>
          </div>
          <div>
            <Link to={`/bai-viet?topicId=${rowData.id}`} title="Xem">
              {" "}
              <i className="pi pi-eye cursor-pointer" style={{color: "black"}}></i>
            </Link>
          </div>
          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeletePost(rowData)} /> */}
        </div>
      </React.Fragment>
    )
  }

  const todayFilter = () => {
    setFilterDateType("today")
    setTimeout(() => {
      setDate([new Date(moment().startOf("day")), new Date(moment().endOf("day"))])
    }, 200)

    setQueryDate(`&fromDate=${moment().startOf("day").toISOString()}&toDate=${moment().endOf("day").toISOString()}`)
  }
  const weekFilter = () => {
    setFilterDateType("week")
    setTimeout(() => {
      setDate([new Date(moment().startOf("week")), new Date(moment().endOf("day"))])
    }, 200)

    setQueryDate(`&fromDate=${moment().startOf("week").toISOString()}&toDate=${moment().endOf("day").toISOString()}`)
  }
  const monthFilter = () => {
    setFilterDateType("month")
    setTimeout(() => {
      setDate([new Date(moment().startOf("month")), new Date(moment().endOf("day"))])
    }, 200)
    setQueryDate(`&fromDate=${moment().startOf("month").toISOString()}&toDate=${moment().endOf("day").toISOString()}`)
  }
  const yearFilter = () => {
    setFilterDateType("year")
    setTimeout(() => {
      setDate([new Date(moment().startOf("year")), new Date(moment().endOf("day"))])
    }, 200)
    setQueryDate(`&fromDate=${moment().startOf("year").toISOString()}&toDate=${moment().endOf("day").toISOString()}`)
  }
  // const monthFilter = () => {
  //   setFilterDateType("month");
  //   setQueryDate(`createdAt_gte=${moment().startOf('month').toISOString()}&createdAt_lte=${moment().endOf('day').toISOString()}`)
  // };
  const filterRange = (e) => {
    setTimeout(() => {
      setDate(e.value)
    }, 200)
    setFilterDateType("")
    if (e?.value[1]) {
      setQueryDate(
        `&fromDate=${moment(e.value[0]).startOf("day").toISOString()}&toDate=${moment(e.value[1])
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
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  useEffect(() => {
    if (data && data?.docs)
      addHistory.mutate({
        newData: {
          screen: "Chủ đề",
          description: `Xem danh sách chủ đề page ${data?.page} có ${data?.docs.length} bản ghi`,
        },
        token,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.page])
  return (
    <div className="grid">
      <Toast ref={toast} />
      <div className="col-12">
        <div className="col-12">
          <Button className="px-8" onClick={openNew}>
            Thêm
          </Button>
        </div>
        <div className="col-12">
          <div className="card">
            <div
              className="flex flex-column xl:flex-row align-items-center justify-content-between py-2"
              style={{rowGap: "20px"}}
            >
              <h5 className="mb-0">Danh sách chủ đề</h5>
              <div className="flex flex-column xl:flex-row" style={{rowGap: "15px"}}>
                {/* <Button label="Ngày" onClick={() => todayFilter()} className={`${filterDateType != "today" ? "p-button-text" : ""} border-right-none`} />
                <Button label="Tuần" onClick={() => weekFilter()} className={`${filterDateType != "week" ? "p-button-text" : ""} border-right-none`} />
                <Button label="Tháng" onClick={() => monthFilter()} className={`${filterDateType != "month" ? "p-button-text" : ""} border-right-none`} />
                <Button label="Năm" onClick={() => yearFilter()} className={`${filterDateType != "year" ? "p-button-text" : ""} border-right-none mr-2`} /> */}
                {/* <Button label="Tháng này" onClick={() => monthFilter()} className={`${filterDateType != "month" ? "p-button-text" : ""}`} /> */}

                {/* <Calendar id="range" dateFormat="dd/mm/yy" value={date} onChange={(e) => filterRange(e)} selectionMode="range" /> */}
                {/* <Button icon="pi pi-times" className="ml-2"  onClick={() => {
                  setQueryDate("")
                  setDate(null)
                  setFilterDateType("")
                }}/> */}

                {/* <Button icon="pi pi-filter-slash" className="ml-1"></Button> */}
              </div>
            </div>
            <DataTable
              value={data?.docs}
              lazy
              selectionMode="checkbox"
              selection={selection}
              onSelectionChange={(e) => setSelection(e.value)}
              paginator
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
              currentPageReportTemplate="Hiển thị {first} - {last} của tổng {totalRecords} bản ghi"
              onPage={onPage}
              first={lazyParams.first}
              onSort={onSort}
              sortField={lazyParams.sortField}
              sortOrder={lazyParams.sortOrder}
              onFilter={onFilter}
              filters={lazyParams.filters}
              totalRecords={data?.total}
              className="p-datatable-gridlines"
              rows={10}
              dataKey="id"
              loading={isLoading}
              responsiveLayout="scroll"
              emptyMessage="Không tìm thấy dữ liệu"
              paginatorPosition="both"
            >
              <Column selectionMode="multiple" headerStyle={{width: "3em"}} />
              <Column
                header="Hành động"
                alignHeader="center"
                body={actionBodyTemplate}
                exportable={false}
                style={{minWidth: "8rem"}}
              ></Column>
              <Column field="id" header="ID" sortable style={{display: "none"}} />
              <Column field="name" header="Tên chủ đề" style={{minWidth: "12rem"}} sortable />
              <Column
                body={keywordsSearchTemplate}
                field="keywords"
                header="Danh sách từ khóa tìm kiếm"
                style={{minWidth: "10rem"}}
              />
              <Column
                body={keywordsTemplate}
                field="keywords"
                header="Danh sách từ khóa bộ quy tắc lọc"
                style={{minWidth: "40rem"}}
              />
              <Column
                body={keywordsExcludeTemplate}
                field="keywords"
                header="Danh sách từ khóa loại bỏ bài viết"
                style={{minWidth: "10rem"}}
              />
              <Column body={intervalTemplate} field="intervalSearch" header="Tần suất quét" sortable />
              <Column
                field="isActiveCrawl"
                header="Quét chủ đề"
                body={(rowData) => <div>{rowData?.isActiveCrawl ? "Đang quét" : "Dừng quét"}</div>}
                style={{minWidth: "6rem"}}
                sortable
              />
              <Column
                field="screenShot"
                header="Chụp ảnh"
                body={(rowData) => <div>{rowData?.screenShot ? "Chụp" : "Không chụp"}</div>}
                style={{minWidth: "6rem"}}
                sortable
              />
              <Column
                field="totalContent"
                header="Số bài viết"
                body={(rowData) => <div>{Number(rowData.totalContent || 0).toLocaleString("vi")}</div>}
                style={{minWidth: "3rem"}}
                sortable
              />
              {/* <Column
                field="likes"
                header="Lượt thích"
                body={(rowData) => <div>{Number(rowData.likes || 0).toLocaleString("vi")}</div>}
                style={{minWidth: "3rem"}}
                sortable
              />
              <Column
                field="comments"
                header="Lượt bình luận"
                body={(rowData) => <div>{Number(rowData.comments || 0).toLocaleString("vi")}</div>}
                style={{minWidth: "3rem"}}
                sortable
              />
              <Column
                field="shares"
                header="Lượt chia sẻ"
                body={(rowData) => <div>{Number(rowData.shares || 0).toLocaleString("vi")}</div>}
                style={{minWidth: "3rem"}}
                sortable
              /> */}

              {/* <Column field="favoriteFruit" header="Nguồn từ" style={{ minWidth: "12rem" }} filter /> */}
            </DataTable>
          </div>
        </div>
      </div>
      <Dialog
        visible={postDialog}
        dismissableMask
        style={{width: "800px"}}
        header={`${edit ? "Sửa chủ đề" : "Thêm chủ đề"}`}
        modal
        className="p-fluid"
        onHide={() => {
          setPostDialog(false)
          setPost({})
          setEdit(false)
        }}
      >
        <Form
          btnText={edit ? "Edit" : "Add"}
          data={post}
          toast={toast}
          closeDialog={() => {
            setPostDialog(false)
            setPost({})
          }}
        />
      </Dialog>
      <Dialog
        visible={deletePostDialog}
        dismissableMask
        style={{width: "450px"}}
        header="Xác nhận"
        modal
        footer={deletePostDialogFooter}
        onHide={hideDeletePostDialog}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{fontSize: "2rem"}} />
          {post && (
            <span>
              Bạn có chắc muốn xóa <b>{post.nameTopic}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  )
}

export default AnalystPost
