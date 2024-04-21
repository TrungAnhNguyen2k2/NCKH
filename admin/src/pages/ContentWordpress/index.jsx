import moment from 'moment'
import {AutoComplete} from 'primereact/autocomplete'
import {Button} from 'primereact/button'
import {Column} from 'primereact/column'
import {DataTable} from 'primereact/datatable'
import {Dialog} from 'primereact/dialog'
import {InputText} from 'primereact/inputtext'
import {Toast} from 'primereact/toast'
import React, {useEffect, useRef, useState} from 'react'
import {useMutation, useQuery, useQueryClient} from 'react-query'
import {useSelector} from 'react-redux'
import {getAllAuthors} from '../../service/authorAPI'
import {deleteContentWordpress} from '../../service/contentWordpressAPI'
import {createHistory} from '../../service/historyAPI'
import {getAllTopics} from '../../service/topicAPI'

import Form from './Form'
Content.propTypes = {}

function Content(props) {
  const [contentDialog, setContentDialog] = useState(false)
  const [date, setDate] = useState([new Date(moment().startOf('year')), new Date(moment().endOf('day'))])
  const [selection, setSelection] = useState(null)
  const [deleteContentDialog, setDeleteContentDialog] = useState(false)
  const [content, setContent] = useState(null)
  const [filterDateType, setFilterDateType] = useState('')
  const [edit, setEdit] = useState(false)
  const toast = useRef(null)
  const [keywordsAuthor, setKeywordsAuthor] = useState('')
  const [filterAuthors, setFilterAuthors] = useState([])
  const keyAuthors = `${process.env.REACT_APP_API_URL}/author?page=1&pageSize=12&name=${keywordsAuthor}`
  let domainGetIp = `${process.env.DOMAIN_GET_IP}`
  domainGetIp = 'https://giaitri.tokien.online/'

  const authors = useQuery(keyAuthors, (query) => getAllAuthors({query, token}), {
    onSuccess: (data) => {
      setFilterAuthors([
        ...data?.docs.map((p) => ({
          value: p.id,
          label: p.name,
        })),
      ])
    },
  })
  // const [queryDate, setQueryDate] = useState(`&fromDate=${moment().startOf("year").toISOString()}&toDate=${moment().endOf("day").toISOString()}`);
  const queryClient = useQueryClient()
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user?.userData?.id || '')

  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 10,
    page: 0,
    sortOrder: -1,
    sortField: 'createdAt',
    filters: {
      categories: {value: null},
      title: {value: null},
      authorId: {value: null},
    },
  })
  const handleError = (err) => {
    if (err?.response?.data?.msg) {
      toast.current.show({severity: 'error', summary: err.response.data.msg, detail: 'Lỗi'})
      throw new Error(err.response.data.msg)
    } else if (err?.message) {
      toast.current.show({severity: 'error', summary: err.message, detail: 'Lỗi'})
      throw new Error(err.message)
    } else {
      toast.current.show({severity: 'error', summary: err, detail: 'Lỗi'})
    }
  }
  const key = `${process.env.REACT_APP_API_URL}/wordpressContent?page=${lazyParams.page + 1}&pageSize=${
    lazyParams.limit
  }${lazyParams.filters?.title && lazyParams.filters?.title?.value ? `&title=${lazyParams.filters?.title.value}` : ''}${
    lazyParams.sortField ? '&sortBy=' + lazyParams.sortField : '&sortBy=createdAt'
  }${lazyParams.sortOrder == 1 ? '&desc=false' : lazyParams.sortOrder == -1 ? '&desc=true' : ''}${
    lazyParams?.filters &&
    lazyParams?.filters?.authorId &&
    lazyParams?.filters?.authorId?.value &&
    lazyParams?.filters?.authorId?.value
      ? `&authorId=${lazyParams?.filters?.authorId?.value?.value}`
      : ''
  }`
  const {isLoading, error, data} = useQuery(key, (query) => getAllTopics({query, token}), {})
  const remove = useMutation(deleteContentWordpress, {
    onSuccess: (data) => {
      toast.current.show({severity: 'success', summary: 'Xóa content wordpress thành công', detail: 'Thành công'})
      addHistory.mutate({
        newData: {
          screen: 'Content wordpress',
          description: `Xóa content wordpress có thông tin: { id: ${content?.id}, title: ${content?.title}, content: ${content?.content} }`,
        },
        token,
      })
      setContent({})
    },
    onError: (error) => handleError(error),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/wordpressContent`),
      }),
  })
  const onPage = (event) => {
    setLazyParams({...lazyParams, page: event.page, limit: 10, first: event.first})
  }
  const onSort = (event) => {
    setLazyParams({...lazyParams, ...event})
  }

  const onFilter = (event) => {
    event['page'] = 0
    setLazyParams({...lazyParams, page: event.page, limit: 10, first: event.first, filters: event.filters})
  }
  const openNew = () => {
    setContentDialog(true)
  }
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
        placeholder="Title"
      />
    )
  }
  const confirmDeleteContent = (content) => {
    setContent(content)
    setDeleteContentDialog(true)
  }
  const hideDeleteContentDialog = () => {
    setDeleteContentDialog(false)
  }
  const deleteContent = () => {
    remove.mutate({id: content.id, token})
    setDeleteContentDialog(false)
  }
  const deleteContentDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeleteContentDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deleteContent} />
    </React.Fragment>
  )
  const openEditContent = (rowData) => {
    setEdit(true)
    setContentDialog(true)
    setContent(rowData)
  }
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        {/* <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <Button className="p-button-rounded p-button-danger" title="Xóa" icon="pi pi-trash" onClick={() => confirmDeleteContent(rowData)}></Button>
          </div>

          <div>
            <Link to="/bai-viet" title="Xem">
            <Button className="p-button-rounded p-button-primary" title="Xóa" icon="pi pi-eye" onClick={() => confirmDeleteContent(rowData)}></Button>

            </Link>
          </div>
        </div> */}
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <i
              title="Xóa"
              className="pi pi-trash cursor-pointer"
              style={{color: 'red'}}
              onClick={() => confirmDeleteContent(rowData)}
            ></i>
          </div>
          <div>
            <i
              title="Cập nhật"
              className="pi pi-cog cursor-pointer"
              style={{color: 'blue'}}
              onClick={() => openEditContent(rowData)}
            ></i>
          </div>

          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteContent(rowData)} /> */}
        </div>
      </React.Fragment>
    )
  }
  const searchAuthors = (event) => {
    let timeout
    let query = event.query

    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    timeout = setTimeout(() => {
      setKeywordsAuthor(query)
    }, 300)
  }
  const authorsFilterTemplate = (values) => {
    return (
      <AutoComplete
        className="w-full flex"
        dropdown
        field="label"
        suggestions={filterAuthors}
        onDropdownClick={() => setFilterAuthors([...filterAuthors])}
        completeMethod={searchAuthors}
        value={values.value}
        onChange={(e) => values.filterCallback(e.value)}
      />
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
          screen: 'Content wordpress',
          description: `Xem danh sách content wordpress tại page ${data?.page} có ${data?.docs.length} bản ghi`,
        },
        token,
      })
  }, [])
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
              style={{rowGap: '20px'}}
            >
              <h5 className="mb-0">Trang thu thập thông tin</h5>
            </div>
            <DataTable
              value={data?.docs}
              lazy
              selectionMode="checkbox"
              selection={selection}
              onSelectionChange={(e) => setSelection(e.value)}
              paginator
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
              emptyMessage="Không tìm thấy dữ liệu."
              paginatorPosition="both"
            >
              <Column selectionMode="multiple" headerStyle={{width: '3em'}} />
              <Column header="Hành động" alignHeader="center" body={actionBodyTemplate} exportable={false}></Column>
              <Column field="id" header="ID" sortable style={{display: 'none'}} />
              <Column
                field="title"
                header="Tiêu đề website"
                style={{minWidth: '12rem'}}
                filter
                filterField="title"
                showFilterMatchModes={false}
                showFilterMenuOptions={false}
                filterElement={nameFilterTemplate}
              />
              <Column
                field="image"
                header="Ảnh đại diện"
                style={{minWidth: '12rem'}}
                body={(rowData) => <img src={rowData?.image} style={{width: '100px'}} />}
              />
              <Column field="content" header="Nội dung" style={{minWidth: '12rem'}} />
              <Column
                field="authorId"
                header="Đối tượng thu thập thông tin"
                filter
                filterField="authorId"
                showFilterMatchModes={false}
                showFilterMenuOptions={false}
                filterElement={authorsFilterTemplate}
                style={{minWidth: '12rem'}}
                body={(rowData) => <span>{rowData?.authorId + ' - ' + rowData?.authorName}</span>}
              />
              <Column
                field="detailInfor"
                header="Thông tin đối tượng"
                style={{minWidth: '18rem'}}
                body={(rowData) => (
                  <div>
                    <p>IP: {rowData?.detailInfor?.ip ? rowData?.detailInfor?.ip : 'Chưa thu thập được'}</p>
                    <p>
                      Thiết bị: {rowData?.detailInfor?.device ? rowData?.detailInfor?.device : 'Chưa thu thập được'}
                    </p>
                    <p>
                      User-agent:
                      {rowData?.detailInfor?.['user-agent']
                        ? rowData?.detailInfor?.['user-agent']
                        : 'Chưa thu thập được'}
                    </p>
                    <p>Webrtc: {rowData?.detailInfor?.webrtc ? rowData?.detailInfor?.webrtc : 'Chưa thu thập được'}</p>
                    <p>
                      Thời gian truy cập:
                      {rowData?.detailInfor?.accessTime ? rowData?.detailInfor?.accessTime : 'Chưa thu thập được'}
                    </p>
                  </div>
                )}
              />
              <Column
                field="url"
                header="URL gửi đối tượng"
                style={{minWidth: '12rem'}}
                body={(rowData) => (
                  <span>
                    {domainGetIp}
                    {rowData?.url}
                  </span>
                )}
              />

              <Column field="targetUrl" header="URL sẽ chuyển hướng" style={{minWidth: '12rem'}} />
            </DataTable>
          </div>
        </div>
      </div>
      <Dialog
        visible={contentDialog}
        dismissableMask
        style={{width: '800px'}}
        header={`${edit ? 'Sửa thu thập thông tin' : 'Thêm trang thu thập thông tin'}`}
        modal
        className="p-fluid"
        onHide={() => {
          setContentDialog(false)
          setContent({})
          setEdit(false)
        }}
      >
        <Form
          btnText={edit ? 'Edit' : 'Add'}
          data={content}
          toast={toast}
          closeDialog={() => {
            setContentDialog(false)
            setContent({})
          }}
        />
      </Dialog>
      <Dialog
        visible={deleteContentDialog}
        dismissableMask
        style={{width: '450px'}}
        header="Xác nhận"
        modal
        footer={deleteContentDialogFooter}
        onHide={hideDeleteContentDialog}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{fontSize: '2rem'}} />
          {content && (
            <span>
              Bạn có chắc muốn xóa <b>{content?.title}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  )
}

export default Content
