import {Button} from "primereact/button"
import {Dropdown} from "primereact/dropdown"
import {InputText} from "primereact/inputtext"
import {Password} from "primereact/password"
import React, {useRef, useState} from "react"
import {Controller, useForm} from "react-hook-form"
import {useMutation, useQueryClient} from "react-query"

import classNames from "classnames"
import {AutoComplete} from "primereact/autocomplete"
import {createFbAccount, updateFbAccount} from "../../service/fbAccountAPI"

import {createHistory} from "../../service/historyAPI"
import {useSelector} from "react-redux"

Form.propTypes = {}

function Form({btnText, data, toast, closeDialog}) {
  const queryClient = useQueryClient()
  const statusOption = [
    {label: "LIVE", value: "LIVE"},
    {label: "DEAD", value: "DEAD"},
    {label: "WAITING", value: "WAITING"},
  ]
  const [totalSize, setTotalSize] = useState(0)
  const fileUploadRef = useRef(null)
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user?.userData?.id || "")

  const handleError = (err) => {
    if (err?.response?.data?.msg) {
      toast.current.show({severity: "error", summary: err.response.data.msg, detail: "Lỗi"})
      throw new Error(err.response.data.msg)
    } else if (err?.message) {
      toast.current.show({severity: "error", summary: err.message, detail: "Lỗi"})
      throw new Error(err.message)
    } else {
      toast.current.show({severity: "error", summary: err || "Đã có lỗi xảy ra", detail: "Lỗi"})
    }
  }
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  const create = useMutation((newData, token) => createFbAccount(newData, token), {
    onSuccess: (fbAccount) => {
      const data = fbAccount?.doc[0]
      toast.current.show({severity: "success", summary: "Tạo tài khoản thành công", detail: "Thành công"})
      addHistory.mutate({
        newData: {
          screen: "Tài khoản facebook",
          description: `Tạo tài khoản facebook có thông tin: { id: ${data?.id}, name: ${data?.name}, email: ${data?.name},link: ${data?.link}, proxy: ${data?.proxy}, avatar: ${data?.avatar}, stats: ${data?.status}}`,
        },
        token,
      })
    },
    onError: (error) => handleError(error),
    onSettled: () => {
      closeDialog()
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/fbAccount`)
        },
      })
    },
  })
  const update = useMutation(updateFbAccount, {
    onSuccess: (updateData) => {
      toast.current.show({severity: "success", summary: "Cập nhật tài khoản thành công", detail: "Thành công"})
      addHistory.mutate({
        newData: {
          screen: "Tài khoản facebook",
          description: `Cập nhật tài khoản facebook id: ${updateData?.doc[0]?.id} từ: {name: ${data?.name}, email: ${data?.email},link: ${data?.link}, proxy: ${data?.proxy}, avatar: ${data?.avatar}, stats: ${data?.status}} sang: { name: ${updateData?.doc[0]?.name}, email: ${updateData?.doc[0]?.email},link: ${updateData?.doc[0]?.link}, proxy: ${updateData?.doc[0]?.proxy}, avatar: ${updateData?.doc[0]?.avatar}, stats: ${updateData?.doc[0]?.status} }`,
        },
        token,
      })
    },
    onError: (error) => {
      handleError(error)
    },
    onSettled: () => {
      closeDialog()
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/fbAccount`)
        },
      })
    },
  })
  const defaultValues = {
    fbId: data?.fbId || "",
    email: data?.email || "",
    phone: data?.phone || "",
    password: "",
    name: data?.name || "",
    link: data?.link || "",
    proxy: data?.proxy || "",
    avatar: data?.avatar || null,
    otp: data?.otp || null,
    // cookies: data?.cookies || '',
    status: data?.status || "",
    // token: data?.token || '',
    // location: data?.location || '',
    // otp: data?.otp || '',
    // device: data?.device || '',
    // groupIds: data?.groupIds || [],
    // targetIds: data?.targetIds || [],
    // meta: null,
    // errorType: data?.errorType || '',
  }
  const {
    control,
    formState: {errors},
    handleSubmit,
    reset,
    register,
    setValue,
    getValues,
    watch,
  } = useForm({defaultValues})
  const watchId = watch("fbId")
  const watchEmail = watch("email")
  const watchPhone = watch("phone")
  const onSubmit = (newData) => {
    if (btnText == "Edit") {
      update.mutate({
        id: data?.id,
        newData: {...newData, password: newData.password ? newData.password : data?.password},
        token,
      })
    } else {
      create.mutate({newData: formatCreate(newData), token})
    }
    closeDialog()
    reset()
  }
  const getFormErrorMessage = (name) => {
    console.log(errors[name])
    return errors[name] && <small className="p-error">{errors[name].message}</small>
  }
  // const keyFbAccountById = `${}`
  const formatCreate = (data) => {
    return {
      fbId: data.fbId?.trim(),
      email: data.email?.trim(),
      phone: data?.phone?.trim(),
      password: data.password?.trim(),
      name: data.name?.trim(),
      link: data.link?.trim(),
      proxy: data.proxy?.trim(),
      avatar: data.avatar?.trim(),
      otp: data.otp?.trim(),
    }
  }

  // const enterNoExit = async (e) => {
  //   if (e.charCode == 13 && e.target.value.trim()) {
  //     if (!getValues().groupIds.find(p => p.value == e.target.value))
  //       setValue("groupIds", [...getValues().groupIds, {
  //         label: e.target.value,
  //         value: e.target.value
  //       }])
  //     e.target.value = ""
  //   }
  // }
  // const enterNoExitTargetIds = async (e) => {
  //   if (e.charCode == 13 && e.target.value.trim()) {
  //     if (!getValues().targetIds.find(p => p.value == e.target.value))
  //       setValue("targetIds", [...getValues().targetIds, {
  //         label: e.target.value,
  //         value: e.target.value
  //       }])
  //     e.target.value = ""
  //   }
  // }
  return (
    <div>
      <form className="p-fluid">
        <div className="field">
          <span>
            <label htmlFor="fbId" className={classNames({"p-error": errors.name})}>
              ID Facebook
            </label>
            <Controller
              name="fbId"
              control={control}
              rules={{
                validate: (e) => {
                  // if (!!e?.trim() || watchEmail?.trim() || watchPhone?.trim()) return true;
                  if (!!e?.trim() || watchEmail?.trim()) return true
                  else return "Yêu cầu nhập facebook id, email để hệ thống có thể đăng nhập"
                },
              }}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="ID"
                  className={classNames({"p-invalid": fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage("fbId")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="email" className={classNames({"p-error": errors.name})}>
              Email
            </label>
            <Controller
              name="email"
              control={control}
              rules={{
                validate: (e) => {
                  // if (!!e?.trim() || watchId?.trim() || watchPhone?.trim()) return true;
                  if (!!e?.trim() || watchId?.trim()) return true
                  else return "Yêu cầu nhập facebook id, email để hệ thống có thể đăng nhập"
                },
                pattern: {
                  value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/,
                  message: "Please enter a valid email",
                },
              }}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Email"
                  className={classNames({"p-invalid": fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage("email")}
        </div>
        {/* <div className="field">
          <span>
            <label htmlFor="telephone" className={classNames({ "p-error": !!errors.links })}>
              Số điện thoại
            </label>
            <Controller
              name="phone"
              control={control}
              rules={{
                validate: (e) => {
                  if (!!e?.trim() || watchId?.trim() || watchEmail?.trim()) return true;
                  else return "Yêu cầu nhập facebook id, email hoặc số điện thoại";
                },
                pattern: {
                  value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
                  message: "Please enter a valid phone",
                },
              }}
              render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Số điện thoại" className={classNames({ "p-invalid": fieldState.invalid })} />}
            />
          </span>
          {getFormErrorMessage("phone")}
        </div> */}
        <div className="field">
          <span>
            <label htmlFor="password" className={classNames({"p-error": !!errors.links})}>
              Password
            </label>
            <Controller
              name="password"
              control={control}
              rules={{
                required: btnText != "Edit" ? "Yêu cầu nhập mật khẩu" : false,
                minLength: 6,
              }}
              render={({field, fieldState}) => (
                <Password
                  id={field.name}
                  {...field}
                  feedback={false}
                  toggleMask
                  className={classNames({"p-invalid": fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage("password")}
        </div>

        <div className="field">
          <span>
            <label htmlFor="name" className={classNames({"p-error": !!errors.links})}>
              Tên người dùng
            </label>
            <Controller
              name="name"
              control={control}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Tên người dùng"
                  className={classNames({"p-invalid": fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage("name")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="link" className={classNames({"p-error": !!errors.links})}>
              Đường dẫn
            </label>
            <Controller
              name="link"
              control={control}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Link"
                  className={classNames({"p-invalid": fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage("link")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="proxy" className={classNames({"p-error": !!errors.links})}>
              Proxy
            </label>
            <Controller
              name="proxy"
              control={control}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Proxy"
                  className={classNames({"p-invalid": fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage("proxy")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="avatar" className={classNames({"p-error": !!errors.links})}>
              Ảnh đại diện
            </label>
            <Controller
              name="avatar"
              control={control}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Avatar"
                  className={classNames({"p-invalid": fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage("avatar")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="otp" className={classNames({"p-error": !!errors.links})}>
              OTP
            </label>
            <Controller
              name="otp"
              control={control}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Token"
                  className={classNames({"p-invalid": fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage("otp")}
        </div>
        {btnText == "Edit" && (
          <div>
            <div className="field">
              <span>
                <label htmlFor="status" className={classNames({"p-error": !!errors.links})}>
                  Trạng thái
                </label>
                <Controller
                  name="status"
                  control={control}
                  rules={{
                    required: "Yêu cầu chọn trạng thái.",
                  }}
                  render={({field, fieldState}) => (
                    <Dropdown
                      options={statusOption}
                      {...field}
                      name={field.name}
                      placeholder="Select a status"
                      className={classNames({"p-invalid": fieldState.invalid})}
                    />
                  )}
                />
              </span>
              {getFormErrorMessage("status")}
            </div>
            {/* <div className="field">
              <span>
                <label htmlFor="cookies" className={classNames({ "p-error": !!errors.links })}>
                  Cookies
                </label>
                <Controller name="cookies" control={control} rules={{
                  required: "Cookies is required."
                }} render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Cookies" className={classNames({ "p-invalid": fieldState.invalid })} />} />
              </span>
              {getFormErrorMessage("cookies")}

            </div>
            <div className="field">
              <span>
                <label htmlFor="token" className={classNames({ "p-error": !!errors.links })}>
                  Token
                </label>
                <Controller name="token" control={control} rules={{
                  required: "Token is required."
                }} render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Token" className={classNames({ "p-invalid": fieldState.invalid })} />} />
              </span>
              {getFormErrorMessage("token")}

            </div>
            <div className="field">
              <span>
                <label htmlFor="location" className={classNames({ "p-error": !!errors.links })}>
                  Location
                </label>
                <Controller name="location" rules={{
                  required: "Location is required."
                }} control={control} render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Location" className={classNames({ "p-invalid": fieldState.invalid })} />} />
              </span>
              {getFormErrorMessage("location")}

            </div>
            <div className="field">
              <span>
                <label htmlFor="device" className={classNames({ "p-error": !!errors.links })}>
                  Device
                </label>
                <Controller name="device" rules={{
                  required: "Device is required."
                }} control={control} render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Device" className={classNames({ "p-invalid": fieldState.invalid })} />} />
              </span>
              {getFormErrorMessage("device")}

            </div>
            <div className="field">
              <span>
                <label htmlFor="otp" className={classNames({ "p-error": !!errors.links })}>
                  OTP
                </label>
                <Controller name="otp" control={control} rules={{
                  required: "OTP is required."
                }} render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="OTP" className={classNames({ "p-invalid": fieldState.invalid })} />} />
              </span>
              {getFormErrorMessage("otp")}

            </div>
            <div className="field">
              <span>
                <label htmlFor="meta" className={classNames({ "p-error": !!errors.links })}>
                  Meta
                </label>
                <Controller name="meta" control={control} rules={{
                  required: "Meta is required."
                }} render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Meta" className={classNames({ "p-invalid": fieldState.invalid })} />} />
              </span>
              {getFormErrorMessage("meta")}

            </div>
            <div className="field">
              <span>
                <label htmlFor="errorType" className={classNames({ "p-error": !!errors.links })}>
                  Error type
                </label>
                <Controller name="errorType" control={control} rules={{
                  required: "Error type is required."
                }} render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Error type" className={classNames({ "p-invalid": fieldState.invalid })} />} />
              </span>
              {getFormErrorMessage("errorType")}

            </div>
            <div className="field">
              <span>
                <label htmlFor="groupIds" className={classNames({ "p-error": !!errors.links })}>
                  Group ids
                </label>
                <Controller name="groupIds" control={control} rules={{
                  required: "Group ids is required."
                }} render={({ field, fieldState }) => <AutoComplete {...field} name={field.name} className="w-full flex" onKeyPress={enterNoExit} multiple field="label" />} />
              </span>
              {getFormErrorMessage("groupIds")}

            </div>
            <div className="field">
              <span>
                <label htmlFor="targetIds" className={classNames({ "p-error": !!errors.links })}>
                  Target ids
                </label>
                <Controller name="targetIds" control={control} rules={{
                  required: "Target ids is required."
                }} render={({ field, fieldState }) => <AutoComplete {...field} name={field.name} className="w-full flex" onKeyPress={enterNoExitTargetIds} multiple field="label" />} />
              </span>
              {getFormErrorMessage("targetIds")}

            </div> */}
          </div>
        )}
        <div className="text-right">
          <Button
            disabled={create.isLoading || update.isLoading}
            type="button"
            onClick={handleSubmit(onSubmit)}
            label={btnText == "Edit" ? "Sửa" : "Thêm"}
            className="mt-2 inline-block w-auto"
          />
        </div>
      </form>
    </div>
  )
}

export default Form
