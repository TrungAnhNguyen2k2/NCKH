import moment from "moment"
import {Button} from "primereact/button"
import {ToggleButton} from "primereact/togglebutton"
import {Calendar} from "primereact/calendar"
import {Column} from "primereact/column"
import {DataTable} from "primereact/datatable"
import {Toast} from "primereact/toast"
import React, {useEffect, useRef, useState} from "react"
import {useMutation, useQuery, useQueryClient} from "react-query"
import {useDispatch, useSelector} from "react-redux"
import {createHistory} from "../../service/historyAPI"
import {getAllPosts, updatePost, getAllPostsDashboard} from "../../service/postAPI"
import {setQueryStr} from "../../store/queryStore"
import {useHistory} from "react-router-dom"
import {Divider} from "primereact/divider"
import ButtonExportExcel from "./components/ButtonExportExcel"
Report.propTypes = {}

function Report(props) {
  const dispatch = useDispatch()
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 10,
    page: 0,
    sortOrder: -1,
    sortField: "postedAt",
    filters: {},
  })
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user?.userData?.id || "")
  const queryClient = useQueryClient()
  const toast = useRef(null)
  const [selection, setSelection] = useState(null)
  const [filterDateType, setFilterDateType] = useState("today")
  const [queryDate, setQueryDate] = useState(
    `&fromDate=${moment().startOf("day").toISOString()}&toDate=${moment().endOf("day").toISOString()}`,
  )
  const [date, setDate] = useState([new Date(moment().startOf("day")), new Date(moment().endOf("day"))])
  const [contentDisplay, setContentDisplay] = useState("")
  const history = useHistory()

  const key = `${process.env.REACT_APP_API_URL}/content?userHandle=handledPost&page=${lazyParams.page + 1}&pageSize=${
    lazyParams.limit
  }${queryDate ? queryDate : ""}${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"}${
    lazyParams.sortOrder == 1 ? "&desc=false" : lazyParams.sortOrder == -1 ? "&desc=true" : ""
  }`
  const {isLoading, error, data} = useQuery(key, (query) => getAllPosts({query, token}), {})
  const onPage = (event) => {
    setLazyParams({...lazyParams, page: event.page, limit: 10, first: event.first})
  }
  const onSort = (event) => {
    console.log(event)
    setLazyParams({...lazyParams, ...event})
  }

  const onFilter = (event) => {
    event["page"] = 1
    setLazyParams(event)
  }
  const todayFilter = () => {
    setFilterDateType("today")
    setDate([new Date(moment().startOf("day")), new Date(moment().endOf("day"))])
    setTimeout(() => {
      setQueryDate(`&fromDate=${moment().startOf("day").toISOString()}&toDate=${moment().endOf("day").toISOString()}`)
    }, 200)
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
  const filterRange = (e) => {
    setFilterDateType("")
    setTimeout(() => {
      setDate(e.value)
    }, 200)
    if (e?.value[1]) {
      setQueryDate(
        `&fromDate=${moment(e.value[0]).startOf("day").toISOString()}&toDate=${moment(e.value[1])
          .endOf("day")
          .toISOString()}`,
      )
    } else {
      setQueryDate(
        `&fromDate=${moment(e.value[0]).startOf("day").toISOString()}&toDate=${moment(e.value[0])
          .endOf("day")
          .toISOString()}`,
      )
    }
  }
  const handleError = (err) => {
    if (err?.response?.data?.msg) {
      toast.current.show({severity: "error", summary: err.response.data.msg, detail: " Cập nhật lỗi"})
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
      queryClient.invalidateQueries(key)
      toast.current.show({severity: "success", summary: "Cập nhật thành công", detail: "Thành công"})
    },
    onError: (error) => {
      handleError(error)
    },
    // onSettled: () => {
    //   //   setDisplayDialog(false)
    //   history.push({
    //     pathname: `/bai-viet`,
    //     search: `?id=${data.id}`,
    //   })
    //   return queryClient.invalidateQueries({
    //     predicate: (query) => {
    //       return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/content`)
    //     },
    //   })
    // },
  })
  const changeStatusBlock = (e, value) => {
    console.log(value)
    updateStatus.mutate({
      id: value?.id,
      newData: {
        [e]: !value[e],
      },
      token,
    })
  }
  const timeTemplate = (rowData) => {
    return <div>{moment(rowData.postedAt).format("HH:mm, DD/MM/YYYY")}</div>
  }
  const blockRequire = (rowData) => {
    return rowData.blockRequire ? (
      <>
        <ToggleButton
          style={{background: rowData.blockRequire ? "red" : "blue", color: "white"}}
          onLabel="Yêu cầu gỡ"
          offLabel="Không yêu cầu gỡ"
          onIcon="pi pi-times"
          checked={rowData.blockRequire}
          onChange={(e) => changeStatusBlock("blockRequire", rowData)}
        />
        <Divider />
        <ToggleButton
          style={{background: rowData.viettelBlocked ? "blue" : "red", color: "white"}}
          onLabel=" Viettel chưa chặn"
          offLabel="Viettel đã chặn"
          onIcon="pi pi-times"
          checked={!rowData.viettelBlocked}
          onChange={(e) => changeStatusBlock("viettelBlocked", rowData)}
        />
        <Divider />
        <ToggleButton
          style={{background: rowData.vnptBlocked ? "blue" : "red", color: "white"}}
          onLabel="VNPT Chưa chặn"
          offLabel="VNPT Đã chặn"
          onIcon="pi pi-times"
          checked={!rowData.vnptBlocked}
          onChange={(e) => changeStatusBlock("vnptBlocked", rowData)}
        />
        <Divider />
        <ToggleButton
          style={{background: rowData.fptBlocked ? "blue" : "red", color: "white"}}
          onLabel="FPT Chưa chặn"
          offLabel="FPT Đã chặn"
          onIcon="pi pi-times"
          checked={!rowData.fptBlocked}
          onChange={(e) => changeStatusBlock("fptBlocked", rowData)}
        />
      </>
    ) : (
      <ToggleButton
        style={{background: rowData.blockRequire ? "red" : "blue", color: "white"}}
        onLabel="Có yêu cầu gỡ"
        offLabel="Không yêu cầu gỡ"
        onIcon="pi pi-times"
        checked={rowData.blockRequire}
        onChange={(e) => changeStatusBlock("blockRequire", rowData)}
      />
    )
  }

  const contentTemplate = (rowData) => {
    return (
      <div>
        {rowData?.textContent?.substr(0, 1000) + `${rowData?.textContent.length ? "..." : ""}`}{" "}
        <span className="text-indigo-500 cursor-pointer" onClick={() => dispatch(setQueryStr(rowData.id))}>
          Xem chi tiet
        </span>
      </div>
    )
  }
  const linkTemplate = (rowData) => {
    return (
      <a href={rowData?.link} className="text-indigo-500" target="_blank" rel="noreferrer">
        {rowData?.link}
      </a>
    )
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
          screen: "Bài viết cần xử lý",
          description: `Xem danh sách bài viết cần xử lý page ${data?.page} có ${data?.docs.length} bản ghi`,
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
          <div className="card">
            <div className="flex align-items-center justify-content-between py-2" style={{rowGap: "20px"}}>
              <div className="flex flex-column xl:flex-row align-items-center justify-content-between py-2">
                <h5 className="mb-0">Bài viết cần xử lý</h5>
                <div className="flex flex-column xl:flex-row" style={{rowGap: "15px"}}>
                  <div className="flex xl:mr-2">
                    <Button
                      label="Ngày"
                      onClick={() => todayFilter()}
                      className={`${filterDateType != "today" ? "p-button-text" : ""} border-right-none`}
                    />
                    <Button
                      label="Tuần"
                      onClick={() => weekFilter()}
                      className={`${filterDateType != "week" ? "p-button-text" : ""} border-right-none`}
                    />
                    <Button
                      label="Tháng"
                      onClick={() => monthFilter()}
                      className={`${filterDateType != "month" ? "p-button-text" : ""} border-right-none`}
                    />
                    <Button
                      label="Năm"
                      onClick={() => yearFilter()}
                      className={`${filterDateType != "year" ? "p-button-text" : ""} border-right-none`}
                    />
                  </div>
                  {/* <Button label="Tháng này" onClick={() => monthFilter()} className={`${filterDateType != "month" ? "p-button-text" : ""}`} /> */}

                  <Calendar
                    id="range"
                    dateFormat="dd/mm/yy"
                    value={date}
                    onChange={(e) => filterRange(e)}
                    selectionMode="range"
                    readOnlyInput
                    showIcon
                  />
                  {/* <Button icon="pi pi-filter-slash" className="ml-1"></Button> */}
                </div>
              </div>
              {/* <ButtonExportExcel query={keyFull} fileName={`excel`} /> */}
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
              <Column selectionMode="multiple" headerStyle={{width: "1%"}} />
              <Column
                body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>}
                field="STT"
                header="STT"
                headerStyle={{width: "1%"}}
              />
              <Column field="postedAt" header="Thời gian" body={timeTemplate} headerStyle={{width: "5%"}} sortable />
              <Column
                field="link"
                header="Đường dẫn"
                body={linkTemplate}
                style={{width: "13%", wordBreak: "break-word"}}
              />
              <Column field="textContent" header="Nội dung" body={contentTemplate} style={{width: "60%"}} />
              <Column field="blockRequire" header="Yêu cầu gỡ" body={blockRequire} style={{minWidth: "10%"}} sortable />

              {/* <Column field="handle" header="Hình thức xử lý" style={{ minWidth: "12rem" }} sortable /> */}
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Report
