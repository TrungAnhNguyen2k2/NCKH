import Axios from 'axios'
import classNames from 'classnames'
import moment from 'moment'
import {Button} from 'primereact/button'
import {Column} from 'primereact/column'
import {DataTable} from 'primereact/datatable'
import {Dialog} from 'primereact/dialog'
import {InputText} from 'primereact/inputtext'
import {InputTextarea} from 'primereact/inputtextarea'
import {MultiSelect} from 'primereact/multiselect'
import {Toast} from 'primereact/toast'
import React, {useEffect, useRef, useState} from 'react'
import {Controller, useForm} from 'react-hook-form'
import {useMutation, useQuery, useQueryClient} from 'react-query'
import {useParams} from 'react-router-dom'
import {updatePost} from '../../service/postAPI.js'
import {getProfileByID, updateProfile} from '../../service/profileAPI.js'
import {updateSource} from '../../service/sourceAPI.js'
import {updateAuthor} from '../../service/authorAPI.js'
import {createHistory} from '../../service/historyAPI.js'
import {useDispatch, useSelector} from 'react-redux'
import {setQueryStr} from '../../store/queryStore.js'
export default function Detail() {
  const {id} = useParams()
  const dispatch = useDispatch()
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user?.userData?.id || '')
  const toast = useRef(null)
  const statuses = [
    {label: 'Hoạt động', value: 'LIVE'},
    {label: 'Dừng hoạt động', value: 'DEAD'},
    {label: 'Không xác định', value: 'WAITING'},
  ]
  const types = [
    {label: 'Website', value: 'WEBSITE'},
    {label: 'Facebook page', value: 'FB_PAGE'},
    {label: 'Facebook group', value: 'FB_GROUP'},
    {label: 'Facebook account', value: 'FB_ACCOUNT'},
    {label: 'Google search website', value: 'GOOGLE_SEARCH_WEBSITE'},
  ]
  const [deleteType, setDeleteType] = useState('')
  const [deleteDialog, setDeleteDialog] = useState(false)
  const queryClient = useQueryClient()
  const hideDeleteDialog = () => {
    setDeleteDialog(false)
  }
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  useEffect(() => {
    addHistory.mutate({newData: {screen: 'Chi tiết hồ sơ', description: 'Xem chi tiết hồ sơ'}, token})
  }, [])
  const [data, setData] = useState(null)
  const keyProfile = `${process.env.REACT_APP_API_URL}/profile/${id}`
  const profileById = useQuery(keyProfile, (query) => getProfileByID({query, token}), {
    enabled: !!id,
    onSuccess: (data) => {
      setValue('name', data?.doc && data?.doc?.name)
      setValue('description', data?.doc && data?.doc?.description)
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
  const removeDataFromProfile = useMutation(updateProfile, {
    onSuccess: (e) => {
      addHistory.mutate({newData: {screen: 'Hồ sơ vụ việc', description: 'Cập nhật hồ sơ'}, token})
    },
    onError: (e) => handleError(e),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/profile`),
      }),
  })
  const removeProfileFromContent = useMutation(updatePost, {
    onSuccess: (e) => {
      addHistory.mutate({newData: {screen: 'Hồ sơ vụ việc', description: 'Xóa hồ sơ khỏi bài viết'}, token})
    },
    onError: (e) => handleError(e),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/content`),
      }),
  })
  const removeProfileFromSource = useMutation(updateSource, {
    onSuccess: (e) => {
      addHistory.mutate({newData: {screen: 'Hồ sơ vụ việc', description: 'Xóa hồ sơ khỏi nguồn'}, token})
    },
    onError: (e) => handleError(e),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/source`),
      }),
  })
  const removeProfileFromAuthor = useMutation(updateAuthor, {
    onSuccess: (e) => {
      addHistory.mutate({newData: {screen: 'Hồ sơ vụ việc', description: 'Xóa hồ sơ khỏi người đăng'}, token})
    },
    onError: (e) => handleError(e),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/author`),
      }),
  })
  const formatDate = (value) => {
    return moment(value).format('DD/MM/YYYY')
  }
  const dateBodyTemplate = (rowData) => {
    return formatDate(rowData?.lastetCrawl || new Date())
  }
  const nameTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <img className="border-circle w-2rem h-2rem" src={rowData?.avatar} alt="" />
        <span>{rowData?.name}</span>
      </div>
    )
  }
  const timeTemplate = (rowData) => {
    return <div>{moment(rowData.createdAt).format('HH:mm')}</div>
  }
  const statusTemplate = (rowData) => {
    return (
      <span className={`product-badge status-${rowData?.status == 'LIVE' ? 'instock' : 'outofstock'}`}>
        {rowData?.status == 'DEAD' ? 'ĐÃ CHẶN' : 'CHƯA CHẶN'}
      </span>
    )
  }
  const contentTemplate = (rowData) => {
    return (
      <div>
        {rowData?.textContent?.substr(0, 1000) + `${rowData?.textContent?.length > 1000 ? '...' : ''}`}{' '}
        <span className="text-indigo-500 cursor-pointer" onClick={() => dispatch(setQueryStr(rowData.id))}>
          Xem chi tiet
        </span>
      </div>
    )
  }

  const sourceTemplate = (rowData) => {
    return (
      <React.Fragment>
        <a target="_blank" href={rowData.link} className="text-start flex align-items-center gap-2" rel="noreferrer">
          <img className="border-circle w-2rem h-2rem" src={rowData.avatar} alt="" />
          <span>{rowData.name}</span>
        </a>
      </React.Fragment>
    )
  }
  const typeTemplate = (rowData) => {
    return (
      <React.Fragment>
        <div className="text-start">
          {rowData.type == 'FB_GROUP'
            ? 'Facebook Group'
            : rowData.type == 'FB_PAGE'
            ? 'Facebook Fanpage'
            : rowData.type == 'FB_ACCOUNT'
            ? 'Facebook Account'
            : rowData.type == 'GOOGLE_SEARCH_WEBSITE'
            ? 'Google search website'
            : 'Website'}
        </div>
      </React.Fragment>
    )
  }
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
  const representativeFilterTemplate = (values) => {
    return (
      <MultiSelect
        value={values.value}
        options={statuses}
        onChange={(e) => values.filterCallback(e.value)}
        optionLabel="label"
        placeholder="Any"
        className="p-column-filter"
      />
    )
  }
  const typeFilterTemplate = (values) => {
    return (
      <MultiSelect
        value={values.value}
        options={types}
        onChange={(e) => values.filterCallback(e.value)}
        optionLabel="label"
        placeholder="Any"
        className="p-column-filter"
      />
    )
  }
  const confirmDelete = (data, type) => {
    setDeleteType(type)
    setData(data)
    setDeleteDialog(true)
  }
  const deleteData = async () => {
    setDeleteDialog(false)
    if (deleteType == 'content') {
      let contentids = profileById?.data?.doc?.contentIds?.filter((p) => p != data?.id)
      removeDataFromProfile.mutate({
        id: id,
        newData: {
          sourceIds: profileById?.data?.doc?.sourceIds,
          contentIds: contentids,
          authorIds: profileById?.data?.doc?.authorIds,
          name: profileById?.data?.doc?.name,
          description: profileById?.data?.doc?.description,
        },
        token,
      })
      const getContentDetail = await Axios.get(`${process.env.REACT_APP_API_URL}/content/${data?.id}`, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
      const dataContent = getContentDetail?.data?.doc
      if (dataContent) {
        const newProfileIds = dataContent?.profilesInfo?.map((p) => p.id)?.filter((p) => p != id)
        removeProfileFromContent.mutate({
          id: data?.id,
          newData: {
            userHandle: dataContent?.userHandle,
            profileIds: newProfileIds,
            tagIds: dataContent?.tagsInfo?.map((p) => p.id) || [],
            editedTextContent: dataContent?.editedTextContent,
            violationContent: dataContent?.violationContent,
            violationEnactment: dataContent?.violationEnactment,
          },
          token,
        })
      }
    } else if (deleteType == 'source') {
      let sourceids = profileById?.data?.doc?.sourceIds?.filter((p) => p != data?.id)
      removeDataFromProfile.mutate({
        id: id,
        newData: {
          sourceIds: sourceids,
          contentIds: profileById?.data?.doc?.contentIds,
          authorIds: profileById?.data?.doc?.authorIds,
          name: profileById?.data?.doc?.name,
          description: profileById?.data?.doc?.description,
        },
        token,
      })
      const getContentDetail = await Axios.get(`${process.env.REACT_APP_API_URL}/source/${data?.id}`, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
      const dataContent = getContentDetail?.data?.doc
      if (dataContent) {
        const newProfileIds = dataContent?.profilesInfo?.map((p) => p.id)?.filter((p) => p != id)
        removeProfileFromSource.mutate({
          id: data?.id,
          newData: {profileIds: newProfileIds, tagIds: dataContent?.tagsInfo?.map((p) => p.id) || []},
          token,
        })
      }
    } else if (deleteType == 'author') {
      let authorids = profileById?.data?.doc?.authorIds?.filter((p) => p != data?.id)
      removeDataFromProfile.mutate({
        id: id,
        newData: {
          sourceIds: profileById?.data?.doc?.sourceIds,
          contentIds: profileById?.data?.doc?.contentIds,
          authorIds: authorids,
          name: profileById?.data?.doc?.name,
          description: profileById?.data?.doc?.description,
        },
        token,
      })
      const getContentDetail = await Axios.get(`${process.env.REACT_APP_API_URL}/author/${data?.id}`, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
      const dataContent = getContentDetail?.data?.doc
      if (dataContent) {
        const newProfileIds = dataContent?.profileIds?.filter((p) => p != id)
        removeProfileFromAuthor.mutate({
          id: data?.id,
          newData: {
            userHandle: dataContent?.userHandle,
            profileIds: newProfileIds,
            tagIds: dataContent?.tagsInfo?.map((p) => p.id) || [],
          },
          token,
        })
      }
    }
    setData({})
  }
  const deleteDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeleteDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deleteData} />
    </React.Fragment>
  )
  const actionBodyTemplateContent = (rowData) => {
    return (
      <React.Fragment>
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <Button
              className="p-button-rounded p-button-danger"
              title="Xóa"
              icon="pi pi-trash"
              onClick={() => confirmDelete(rowData, 'content')}
            ></Button>
          </div>
        </div>
      </React.Fragment>
    )
  }
  const actionBodyTemplateSource = (rowData) => {
    return (
      <React.Fragment>
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <Button
              className="p-button-rounded p-button-danger"
              title="Xóa"
              icon="pi pi-trash"
              onClick={() => confirmDelete(rowData, 'source')}
            ></Button>
          </div>
        </div>
      </React.Fragment>
    )
  }
  const actionBodyTemplateAuthor = (rowData) => {
    return (
      <React.Fragment>
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <Button
              className="p-button-rounded p-button-danger"
              title="Xóa"
              icon="pi pi-trash"
              onClick={() => confirmDelete(rowData, 'author')}
            ></Button>
          </div>
        </div>
      </React.Fragment>
    )
  }
  const defaultValues = {
    name: '',
    description: '',
  }
  const {
    control,
    formState: {errors},
    handleSubmit,
    reset,
    register,
    setValue,
  } = useForm({defaultValues})

  const onSubmit = (newData) => {
    removeDataFromProfile.mutate({
      id: id,
      newData: {
        sourceIds: profileById?.data?.doc?.sourceIds,
        contentIds: profileById?.data?.doc?.contentIds,
        authorIds: profileById?.data?.doc?.authorIds,
        name: newData?.name,
        description: newData?.description,
      },
      token,
    })
  }
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>
  }
  return (
    <div className="grid">
      <Toast ref={toast} />
      <div className="col-12">
        <div className="card">
          <div className="w-5">
            <h4>Thông tin hồ sơ</h4>
            <form className="p-fluid">
              <div className="field">
                <span>
                  <label htmlFor="name" className={classNames({'p-error': !!errors.links})}>
                    Tên hồ sơ
                  </label>
                  <Controller
                    name="name"
                    control={control}
                    rules={{
                      validate: (e) => {
                        if (!!e?.trim()) return true
                        else return 'Yêu cầu nhập tên hồ sơ'
                      },
                    }}
                    render={({field, fieldState}) => (
                      <InputText
                        id={field.name}
                        {...field}
                        autoFocus
                        placeholder="Tên hồ sơ"
                        className={classNames({'p-invalid': fieldState.invalid})}
                      />
                    )}
                  />
                </span>
                {getFormErrorMessage('name')}
              </div>
              <div className="field">
                <span>
                  <label htmlFor="description" className={classNames({'p-error': !!errors.links})}>
                    Mô tả
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    rules={{
                      validate: (e) => {
                        if (!!e?.trim()) return true
                        else return 'Yêu cầu nhập mô tả'
                      },
                    }}
                    render={({field, fieldState}) => (
                      <InputTextarea
                        id={field.name}
                        {...field}
                        rows={5}
                        className={classNames({'p-invalid': fieldState.invalid})}
                        placeholder="Mô tả"
                      />
                    )}
                  />
                </span>
                {getFormErrorMessage('description')}
              </div>
              <div className="text-left">
                <Button
                  disabled={false}
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  label={'Sửa'}
                  className="mt-2 inline-block w-auto"
                />
              </div>
            </form>
          </div>
        </div>
        <div className="card">
          <h4>Bài viết</h4>
          <DataTable
            value={
              (profileById.data?.doc && profileById.data?.doc?.contentsInfo && profileById.data?.doc?.contentsInfo) ||
              []
            }
            paginator
            totalRecords={
              (profileById.data?.doc?.contentsInfo &&
                profileById.data?.doc?.contentsInfo.length &&
                profileById.data?.doc?.contentsInfo.length) ||
              0
            }
            className="p-datatable-gridlines"
            rows={10}
            dataKey="id"
            loading={false}
            responsiveLayout="scroll"
            emptyMessage="Không tìm thấy dữ liệu"
            paginatorPosition="both"
          >
            <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} header="STT" />
            <Column field="id" header="ID" style={{display: 'none'}} />
            <Column field="createdAt" header="Ngày đăng" body={timeTemplate} style={{minWidth: '8rem'}} sortable />
            <Column field="sources.type" header="Kênh đăng" style={{minWidth: '12rem'}} />
            <Column field="link" header="Đường dẫn" style={{minWidth: '12rem', wordBreak: 'break-all'}} sortable />
            <Column field="textContent" header="Nội dung" body={contentTemplate} style={{minWidth: '20rem'}} />
            <Column field="status" header="Tình trạng" body={statusTemplate} style={{minWidth: '12rem'}} />
            <Column
              header="Hành động"
              alignHeader="center"
              body={actionBodyTemplateContent}
              exportable={false}
              style={{minWidth: '11rem'}}
            ></Column>
          </DataTable>
        </div>
        <div className="card">
          <h4>Nguồn dữ liệu</h4>

          <DataTable
            value={(profileById.data?.doc?.sourcesInfo && profileById.data?.doc?.sourcesInfo?.docs) || []}
            paginator
            totalRecords={(profileById.data?.doc?.sourcesInfo && profileById.data?.doc?.sourcesInfo?.total) || 0}
            className="p-datatable-gridlines"
            rows={10}
            dataKey="id"
            loading={false}
            responsiveLayout="scroll"
            emptyMessage="Không tìm thấy dữ liệu"
            paginatorPosition="both"
          >
            <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} header="STT" />
            <Column field="id" header="ID" sortable style={{display: 'none'}} />
            <Column
              body={sourceTemplate}
              field="name"
              header="Tên nguồn dữ liệu"
              style={{minWidth: '12rem'}}
              sortable
              filter
              filterField="name"
              showFilterMatchModes={false}
              showFilterMenuOptions={false}
              filterElement={nameFilterTemplate}
            />
            <Column field="link" header="Liên kết" style={{minWidth: '12rem'}} />
            <Column
              body={typeTemplate}
              field="type"
              header="Phân loại"
              style={{minWidth: '12rem'}}
              sortable
              filter
              filterField="type"
              showFilterMatchModes={false}
              showFilterMenuOptions={false}
              filterElement={typeFilterTemplate}
            />
            <Column
              body={statusTemplate}
              field="status"
              header="Trạng thái"
              style={{minWidth: '11rem'}}
              sortable
              filter
              filterField="status"
              showFilterMatchModes={false}
              showFilterMenuOptions={false}
              filterElement={representativeFilterTemplate}
            />
            <Column
              field="totalcontent"
              header="Số bài viết"
              body={(rowData) => <div>{Number(rowData.totalcontent || 0).toLocaleString('vi')}</div>}
              style={{minWidth: '10rem'}}
              sortable
            />
            <Column
              body={dateBodyTemplate}
              field="lastetCrawl"
              header="Lần cập nhật cuối"
              style={{minWidth: '12rem'}}
              sortable
            />
            <Column
              header="Hành động"
              alignHeader="center"
              body={actionBodyTemplateSource}
              exportable={false}
              style={{minWidth: '11rem'}}
            ></Column>
          </DataTable>
        </div>
        <div className="card">
          <h4>Hồ sơ đối tượng</h4>

          <DataTable
            value={(profileById.data?.doc?.authorsInfo && profileById.data?.doc?.authorsInfo?.docs) || []}
            paginator
            totalRecords={(profileById.data?.doc?.authorsInfo && profileById.data?.doc?.authorsInfo?.total) || 0}
            className="p-datatable-gridlines"
            rows={10}
            dataKey="id"
            loading={false}
            responsiveLayout="scroll"
            emptyMessage="Không tìm thấy dữ liệu"
            paginatorPosition="both"
          >
            <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} header="STT" />
            <Column field="id" header="ID" style={{display: 'none'}} />

            <Column field="name" body={nameTemplate} header="Tên người đăng" sortable />
            <Column field="latestContentId" header="Bài đăng" sortable />
            <Column
              body={dateBodyTemplate}
              field="latestPostedAt"
              header="Ngày đăng"
              style={{minWidth: '12rem'}}
              sortable
            />
            <Column
              field="totalContent"
              header="Số bài viết"
              body={(rowData) => <div>{Number(rowData.totalContent || 0).toLocaleString('vi')}</div>}
              sortable
            />
            <Column
              header="Hành động"
              alignHeader="center"
              body={actionBodyTemplateAuthor}
              exportable={false}
              style={{minWidth: '11rem'}}
            ></Column>
          </DataTable>
        </div>
      </div>
      <Dialog
        visible={deleteDialog}
        dismissableMask
        style={{width: '450px'}}
        header="Xác nhận"
        modal
        footer={deleteDialogFooter}
        onHide={hideDeleteDialog}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{fontSize: '2rem'}} />
          {data && <span>Bạn có chắc muốn xóa data?</span>}
        </div>
      </Dialog>
    </div>
  )
}
