import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {Toast} from 'primereact/toast'
import {Controller, useForm} from 'react-hook-form'
import classNames from 'classnames'
import {InputText} from 'primereact/inputtext'
import {Button} from 'primereact/button'
import {Checkbox} from 'primereact/checkbox'
import {InputNumber} from 'primereact/inputnumber'
import {DataTable} from 'primereact/datatable'
import {useMutation, useQuery, useQueryClient} from 'react-query'
import {getAllNotifications, removeNotification} from '../../service/notifyAPI'

import {Column} from 'primereact/column'
import {createHistory} from '../../service/historyAPI'
import {Dropdown} from 'primereact/dropdown'
import {Dialog} from 'primereact/dialog'
import {getAllSettings, updateSetting} from '../../service/settingNotifyAPI'
import {useSelector} from 'react-redux'

Notify.propTypes = {}

function Notify(props) {
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 10,
    page: 0,
    sortOrder: -1,
    sortField: 'createdAt',
    filters: {
      type: {value: null},
    },
  })
  const [notification, setNotification] = useState('')
  const [deleteNotificationDialog, setDeleteNotificationDialog] = useState(false)
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user?.userData?.id || '')
  const emailUser = useSelector((state) => state.user?.userData?.email || '')
  const queryClient = useQueryClient()

  const key = `${process.env.REACT_APP_API_URL}/notification?page=${lazyParams.page + 1}&pageSize=${lazyParams.limit}${
    lazyParams.sortField ? '&sortBy=' + lazyParams.sortField : '&sortBy=createdAt'
  }${lazyParams.sortOrder == 1 ? '&desc=false' : lazyParams.sortOrder == -1 ? '&desc=true' : ''}`
  const keySetting = `${process.env.REACT_APP_API_URL}/notificationSetting`
  const getSetting = useQuery(keySetting, (query) => getAllSettings({query, token}), {
    onSuccess: (setting) => {
      if (setting && setting?.doc) {
        if (setting?.doc?.email) setValue('email', true)

        if (setting?.doc?.telegram) {
          setValue('telegram', true)
          setValue('inputTelegram', setting?.doc?.telegram)
        }
        setValue('webapp', setting?.doc?.webapp)

        if (setting?.doc?.totalContentOnNotification) {
          setValue('totalContentOnNotification', setting?.doc?.totalContentOnNotification)
        }
        setValue('notifyInWorkTime', setting?.doc?.notifyInWorkTime)
      }
    },
  })
  const {isLoading, data} = useQuery(key, (query) => getAllNotifications({query, token}))
  const toast = useRef(null)
  const defaultValues = {
    telegram: false,
    inputTelegram: '',
    webapp: false,
    email: false,
    totalContentOnNotification: 5,
    notifyInWorkTime: true,
  }
  const types = [
    {label: 'Webapp', value: 'webapp'},
    {label: 'Email', value: 'email'},
    {label: 'Telegram', value: 'telegram'},
  ]
  const {
    control,
    formState: {errors},
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
  } = useForm({defaultValues})
  const onTelegram = watch('telegram')

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
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  const remove = useMutation(removeNotification, {
    onSuccess: () => {
      toast.current.show({severity: 'success', summary: 'Xóa notification thành công', detail: 'Thành công'})
      addHistory.mutate({
        newData: {
          screen: 'Setting',
          description: `Xóa notifcation có : { id: ${notification.id}, type: ${notification?.type}, notifycationContent: ${notification?.notifycationContent}}`,
        },
        token,
      })
      setNotification({})
    },
    onError: (error) => handleError(error),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/notification`),
      }),
  })
  const update = useMutation(updateSetting, {
    onSuccess: (updateData) => {
      toast.current.show({severity: 'success', summary: 'Cập nhật setting thành công', detail: 'Thành công'})
      if (updateData && updateData?.doc)
        addHistory.mutate({
          newData: {
            screen: 'Setting',
            description: `Cập nhật setting id: ${updateData?.doc[0]?.id} từ: {webapp: ${getSetting?.data?.doc?.webapp}, email: ${getSetting?.data?.doc?.email},telegram: ${getSetting?.data?.doc?.telegram}, totalContentOnNotification: ${getSetting?.data?.doc?.totalContentOnNotification}, notifyInWorkTime: ${getSetting?.data?.doc?.notifyInWorkTime}} sang: { webapp: ${updateData?.doc[0]?.webapp}, email: ${updateData?.doc[0]?.email},telegram: ${updateData?.doc[0]?.telegram}, totalContentOnNotification: ${updateData?.doc[0]?.totalContentOnNotification}, notifyInWorkTime: ${updateData?.doc[0]?.notifyInWorkTime} }`,
          },
          token,
        })
    },
    onError: (error) => handleError(error),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/notificationSetting`),
      }),
  })
  const confirmDeleteNotification = (history) => {
    setNotification(history)
    setDeleteNotificationDialog(true)
  }
  const hideDeleteNotificationDialog = () => {
    setDeleteNotificationDialog(false)
  }
  const deleteNotification = () => {
    remove.mutate({id: notification.id, token: token})
    setDeleteNotificationDialog(false)
  }
  const deleteNotificationDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeleteNotificationDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deleteNotification} />
    </React.Fragment>
  )
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <i
              title="Xóa"
              className="pi pi-trash cursor-pointer"
              style={{color: 'red'}}
              onClick={() => confirmDeleteNotification(rowData)}
            ></i>
          </div>
          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteNotification(rowData)} /> */}
        </div>
      </React.Fragment>
    )
  }
  const typeFilterTemplate = (values) => {
    return (
      <Dropdown
        value={values.value}
        options={types}
        onChange={(e) => values.filterCallback(e.value)}
        optionLabel="label"
        placeholder="Any"
        className="p-column-filter"
      />
    )
  }
  const onSubmit = (newData) => {
    if (newData.telegram) {
      newData.telegram = newData.inputTelegram
    } else newData.telegram = null
    if (newData.email) newData.email = emailUser
    else newData.email = null
    delete newData.inputTelegram
    update.mutate({id: getSetting?.data?.doc?.id, newData, token})
  }
  useEffect(() => {
    if (data && data?.docs)
      addHistory.mutate({
        newData: {
          screen: 'Setting',
          description: `Xem danh sách notification page ${data?.page} có ${data?.docs.length} bản ghi`,
        },
        token,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.page])
  return (
    <div className="grid">
      <Toast ref={toast} />
      <div className="col-12">
        <div className="card">
          <h3>Cài đặt thông báo</h3>
          <div>
            <Button
              onClick={() => {
                if (Notification.permission === 'default') {
                  //       // We need to ask the user for permission

                  Notification.requestPermission().then((permission) => {
                    console.log('permission: ', permission)
                  })
                } else {
                  new Notification('Đã kích hoạt thông báo từ trình duyệt')
                }
              }}
            >
              Kích hoạt thông báo trên trình duyệt
            </Button>
            <form className="p-fluid">
              <div className="flex flex-column lg:flex-row justify-content-between">
                <div className="field col-12 lg:col-2">
                  <span className="flex gap-1 mb-4">
                    {/* <label htmlFor="webapp" className={`${classNames({'p-error': !!errors.links})} mb-0`}>
                      Webapp
                    </label> */}
                  </span>
                  {/* <span className="">
                    <label
                      htmlFor="totalContentOnNotification"
                      className={`${classNames({'p-error': !!errors.links})}`}
                    >
                      Số bài viết gộp
                    </label>
                    <Controller
                      name="totalContentOnNotification"
                      control={control}
                      render={({field, fieldState}) => (
                        <InputNumber name={field.name} {...field} onChange={(e) => field.onChange(e.value)} />
                      )}
                    />
                  </span> */}

                  {/* {getFormErrorMessage("profileIds")} */}
                </div>
                <div className="fiel col-12 lg:col-3">
                  {/* <span className="flex gap-1 lg:flex-column mb-4">
                    <label
                      htmlFor="webapp"
                      className={`${classNames({'p-error': !!errors.links})} mb-0 lg:w-full block`}
                    >
                      Nhận thông báo qua Email của tài khoản
                    </label>
                    <Controller
                      name="email"
                      control={control}
                      render={({field, fieldState}) => <Checkbox name={field.name} {...field} checked={field.value} />}
                    />
                  </span> */}

                  {/* {getFormErrorMessage("profileIds")} */}
                </div>
                <div className="field col-12 lg:col-2">
                  <span className="flex gap-1 justify-content-end align-items-center mb-2">
                    {/* <span className="gap-1 flex lg:flex-column">
                      <label
                        htmlFor="notifyInWorkTime"
                        className={`${classNames({'p-error': !!errors.links})} mb-2 lg:w-full block`}
                      >
                        Thông báo trong ca làm
                      </label>
                      <Controller
                        name="notifyInWorkTime"
                        control={control}
                        render={({field, fieldState}) => (
                          <Checkbox name={field.name} {...field} checked={field.value} />
                        )}
                      />
                    </span> */}
                    {/* <label htmlFor="telegram" className={`${classNames({'p-error': !!errors.links})} mb-0`}>
                      Telegram
                    </label>
                    <Controller
                      name="telegram"
                      control={control}
                      render={({field, fieldState}) => <Checkbox name={field.name} {...field} checked={field.value} />}
                    /> */}
                    {/* {onTelegram && (
                      <Controller
                        name="inputTelegram"
                        rules={{
                          required: 'Required',
                        }}
                        control={control}
                        render={({field, fieldState}) => (
                          <InputText name={field.name} {...field} placeholder="Tài khoản telegram" />
                        )}
                      />
                    )} */}
                  </span>
                  {/* {getFormErrorMessage("profileIds")} */}
                </div>
                <div className="field col-12 lg:col-2"></div>
              </div>

              {/* <div className="text-right">
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  label="Cập nhật"
                  className="mt-2 inline-block w-auto"
                />
              </div> */}
            </form>
          </div>
        </div>
        <div className="card">
          <DataTable
            value={data?.docs || []}
            lazy
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
            <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} header="STT" />
            <Column field="id" header="ID" style={{display: 'none'}} />
            <Column
              field="type"
              header="Loại thông báo"
              style={{minWidth: '12rem'}}
              filter
              filterField="type"
              showFilterMatchModes={false}
              showFilterMenuOptions={false}
              filterElement={typeFilterTemplate}
            />
            <Column
              field="userId"
              header="Người nhận"
              body={(data) => <span>{data?.userId + ' - ' + data?.userEmail + ' - ' + data?.userName}</span>}
              style={{minWidth: '12rem'}}
            />
            <Column field="notifycationContent" header="Nội dung" style={{minWidth: '12rem'}} />
            <Column
              field="seen"
              header="Tình trạng"
              body={(data) => <span>{data?.seen ? 'Đã đọc' : 'Chưa đọc'}</span>}
              style={{minWidth: '12rem'}}
            />
            <Column
              header="Hành động"
              alignHeader="center"
              body={actionBodyTemplate}
              exportable={false}
              style={{minWidth: '11rem'}}
            ></Column>
          </DataTable>
        </div>
        <Dialog
          visible={deleteNotificationDialog}
          dismissableMask
          style={{width: '450px'}}
          header="Xác nhận"
          modal
          footer={deleteNotificationDialogFooter}
          onHide={hideDeleteNotificationDialog}
        >
          <div className="confirmation-content">
            <i className="pi pi-exclamation-triangle mr-3" style={{fontSize: '2rem'}} />
            {notification && <span>Bạn có chắc muốn xóa ?</span>}
          </div>
        </Dialog>
      </div>
    </div>
  )
}

export default Notify
