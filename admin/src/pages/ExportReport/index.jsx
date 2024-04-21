import moment from "moment"
import {AutoComplete} from "primereact/autocomplete"
import {Calendar} from "primereact/calendar"
import {Card} from "primereact/card"
import React, {useState} from "react"
import {useQuery} from "react-query"
import {getAllProfiles} from "../../service/profileAPI"
import ExportDailyContent from "./components/ExportDaily/ExportDailyContent"
import ExportDay from "./components/ExportDay/ExportDay"
import ExportTopic from "./components/ExportTopic/ExportDailyContent"
import ExportWeek from "./components/ExportWeek/ExportWeek"

import {useSelector} from "react-redux"
import ExportByDay from "./components/ExportByDay/ExportByDay"

ExportReport.propTypes = {}

function ExportReport(props) {
  const [filterDateType, setFilterDateType] = useState("day")
  const [date1, setDate1] = useState(new Date())
  const [date2, setDate2] = useState([new Date(moment().startOf("week").add(1, "day")), new Date()])
  const [date3, setDate3] = useState(new Date())
  const [date4, setDate4] = useState([new Date(moment().startOf("day")), new Date()])
  const [date5, setDate5] = useState(new Date())

  const [keywordsProfile, setKeywordsProfile] = useState("")
  const [arrayProfiles, setArrayProfiles] = useState([])
  const [filterProfiles, setFilterProfiles] = useState([])
  // const itemsDay = [
  //   {
  //     label: "Word",
  //     icon: "pi pi-file",
  //     command: (e) => {

  //     },
  //   },
  //   {
  //     label: "Pdf",
  //     icon: "pi pi-file-pdf",
  //     command: (e) => { },
  //   },
  //   {
  //     label: "Excel",
  //     icon: "pi pi-file-excel",
  //     command: (e) => {
  //       console.log("exce;");
  //     },
  //   },
  // ];

  // const itemsWeek = [
  //   {
  //     label: "Word",
  //     icon: "pi pi-file",
  //     command: (e) => {
  //       console.log("word");
  //     },
  //   },
  //   {
  //     label: "Pdf",
  //     icon: "pi pi-file-pdf",
  //     command: (e) => {
  //       console.log("pdf");
  //     },
  //   },
  //   {
  //     label: "Excel",
  //     icon: "pi pi-file-excel",
  //     command: (e) => {
  //       console.log("exce;");
  //     },
  //   },
  // ];
  // const itemsMonth = [
  //   {
  //     label: "Word",
  //     icon: "pi pi-file",
  //     command: (e) => {
  //       console.log("word");
  //     },
  //   },
  //   {
  //     label: "Pdf",
  //     icon: "pi pi-file-pdf",
  //     command: (e) => {
  //       console.log("pdf");
  //     },
  //   },
  //   {
  //     label: "Excel",
  //     icon: "pi pi-file-excel",
  //     command: (e) => {
  //       console.log("exce;");
  //     },
  //   },
  // ];
  // const itemsQuarter = [
  //   {
  //     label: "Word",
  //     icon: "pi pi-file",
  //     command: (e) => {
  //       console.log("word");
  //     },
  //   },
  //   {
  //     label: "Pdf",
  //     icon: "pi pi-file-pdf",
  //     command: (e) => {
  //       console.log("pdf");
  //     },
  //   },
  //   {
  //     label: "Excel",
  //     icon: "pi pi-file-excel",
  //     command: (e) => {
  //       console.log("exce;");
  //     },
  //   },
  // ];
  // const linkTemplate = (rowData) => {
  //   return <a href={rowData?.link} className="text-indigo-500" target="_blank">{rowData?.link}</a>
  // }
  const token = useSelector((state) => state.user.token)

  const keyProfiles = `${process.env.REACT_APP_API_URL}/profile?page=1&pageSize=12&name=${keywordsProfile}`
  const profiles = useQuery(keyProfiles, (query) => getAllProfiles(query, token), {
    onSuccess: (data) => {
      if (data)
        setFilterProfiles(
          [
            ...data?.docs?.map((p) => ({
              value: p.id,
              label: p.name,
            })),
          ] || [],
        )
    },
  })
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

  return (
    <div className="grid">
      <div className="col-12">
        <div className="col-12">
          <div className="card xl:h-screen">
            <div className="flex align-items-center justify-content-between py-2" style={{rowGap: "20px"}}>
              <div className="flex flex-column gap-4 xl:flex-row align-items-center justify-content-between py-2">
                <h5 className="mb-0 font-bold text-xl	">Báo cáo</h5>
              </div>
            </div>
            {/* <FileUpload mode="advanced" accept="application/msword, application/vnd.ms-excel, application/pdf" /> */}
            <div className="flex flex-column xl:flex-row mt-4" style={{rowGap: "15px"}}>
              <div className="grid flex-wrap justify-content-between w-full xl:gap-4 card-export">
                <Card
                  title="Bản tin ngày"
                  className="text-center col-12 md:col-6 xl:col mb-2 xl:mb-0"
                  footer={
                    <div className="flex gap-2 justify-content-center">
                      <ExportDay queryDate={date1} />
                    </div>
                  }
                >
                  <i className="pi pi-book text-6xl mb-2 w-full" />
                  <Calendar
                    value={date1}
                    maxDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                    onChange={(e) => setDate1(e.value)}
                    dateFormat="dd/mm/yy"
                    showIcon
                  ></Calendar>
                </Card>
                <Card
                  title="Bản tin tự chọn"
                  className="text-center col-12 md:col-6 xl:col mb-2 xl:mb-0"
                  footer={
                    <div className="flex gap-2 justify-content-center">
                      <ExportWeek queryDate={date2} />
                    </div>
                  }
                >
                  <i className="pi pi-book text-6xl mb-2 w-full " />
                  <Calendar
                    value={date2}
                    maxDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                    onChange={(e) => setDate2(e.value)}
                    id="range"
                    dateFormat="dd/mm/yy"
                    selectionMode="range"
                    readOnlyInput
                    showIcon
                  ></Calendar>
                </Card>
                {/* <Card
                  title="Bản tin tháng"
                  className="text-center col"
                  footer={
                    <div className="flex gap-2 justify-content-center">
                      <ExportMonth />
                    </div>
                  }
                >
                  {" "}
                  <i className="pi pi-book text-6xl" />
                </Card> */}
                {/* <Card
                  title="Bản tin quý"
                  className="text-center col"
                  footer={
                    <div className="flex gap-2 justify-content-center">
                      <ExportQuarter />
                    </div>
                  }
                >
                  {" "}
                  <i className="pi pi-book text-6xl" />
                </Card> */}
                <Card
                  title="Mẫu tin ngắn"
                  className="text-center col-12 md:col-6 xl:col mb-2 xl:mb-0"
                  footer={
                    <div className="flex gap-2 justify-content-center">
                      <ExportDailyContent queryDate={date3} />
                    </div>
                  }
                >
                  <i className="pi pi-book text-6xl mb-2 w-full" />
                  <Calendar value={date3} maxDate={new Date()} onChange={(e) => setDate3(e.value)}></Calendar>
                </Card>
                <Card
                  title="Mẫu tin chuyên đề"
                  className="text-center col-12 md:col-6 xl:col mb-2 xl:mb-0"
                  footer={
                    <div className="flex gap-2 justify-content-center">
                      <ExportTopic queryDate={date4} profiles={arrayProfiles} />
                    </div>
                  }
                >
                  {" "}
                  <i className="pi pi-book text-6xl mb-2" />
                  <Calendar
                    value={date4}
                    className="mb-2"
                    maxDate={new Date()}
                    onChange={(e) => setDate4(e.value)}
                    id="range"
                    dateFormat="dd/mm/yy"
                    selectionMode="range"
                    readOnlyInput
                    showIcon
                  ></Calendar>
                  <AutoComplete
                    dropdown
                    multiple
                    field="label"
                    value={arrayProfiles}
                    suggestions={filterProfiles}
                    onDropdownClick={() => setFilterProfiles([...filterProfiles])}
                    completeMethod={searchProfiles}
                    onChange={(e) => setArrayProfiles(e.value)}
                  />
                </Card>
                <Card
                  title="Báo cao theo ngày"
                  className="text-center col-12 md:col-6 xl:col mb-2 xl:mb-0"
                  footer={
                    <div className="flex gap-2 justify-content-center">
                      <ExportByDay queryDate={date5} />
                    </div>
                  }
                >
                  <i className="pi pi-book text-6xl mb-2 w-full" />
                  <Calendar value={date5} maxDate={new Date()} onChange={(e) => setDate5(e.value)}></Calendar>
                </Card>
                {/* <SplitButton label="Save" icon="pi pi-plus" onClick={save} model={items}></SplitButton>
                  <SplitButton label="Save" icon="pi pi-plus" onClick={save} model={items}></SplitButton>
                  <SplitButton label="Save" icon="pi pi-plus" onClick={save} model={items}></SplitButton> */}
              </div>
              {/* <Button label="Tháng này" onClick={() => monthFilter()} className={`${filterDateType != "month" ? "p-button-text" : ""}`} /> */}

              {/* <Button icon="pi pi-filter-slash" className="ml-1"></Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportReport
