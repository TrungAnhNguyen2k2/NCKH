import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { RadioButton } from "primereact/radiobutton";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import TimePicker from "react-time-picker";

import classNames from "classnames";
import { MultiSelect } from "primereact/multiselect";
import { createUser, updateUser } from "../../service/userAPI";
import { createHistory } from "../../service/historyAPI";
import { useSelector } from "react-redux";

Form.propTypes = {};

function Form({ btnText, data, toast, closeDialog }) {
  const queryClient = useQueryClient();
  const roleOptions = [
    { label: "SUPER_ADMIN", value: "SUPER_ADMIN" },
    { label: "MANAGER", value: "MANAGER" },
  ];
  const token = useSelector((state) => state.user.token);
  const userId = useSelector((state) => state.user?.userData?.id || "");

  const handleError = (err) => {
    if (err?.response?.data?.msg) {
      toast.current.show({ severity: "error", summary: err.response.data.msg, detail: "Lỗi" });
      throw new Error(err.response.data.msg);
    } else if (err?.message) {
      toast.current.show({ severity: "error", summary: err.message, detail: "Lỗi" });
      throw new Error(err.message);
    } else {
      toast.current.show({ severity: "error", summary: err, detail: "Lỗi" });
    }
  };
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e);
    },
  });

  const create = useMutation((newData, token) => createUser(newData, token), {
    onSuccess: (user) => {
      console.log(user)
      const data = user && user?.doc && user?.doc[0] && user?.doc[0];

      toast.current.show({ severity: "success", summary: "Tạo tài khoản thành công", detail: "Thành công" });
      addHistory.mutate({ newData: {  screen: "Người dùng", description: `Tạo người dùng có thông tin: { id: ${data?.id}, name: ${data?.name}, email: ${data?.name}, telephone: ${data?.telephone}` }, token });
    },
    onError: (error) => handleError(error),
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/user`);
        },
      });
    },
  });
  const update = useMutation(updateUser, {
    onSuccess: (updateData) => {
      toast.current.show({ severity: "success", summary: "Cập nhật tài khoản thành công", detail: "Thành công" });
      addHistory.mutate({
        newData: {
          
          screen: "Người dùng",
          description: `Cập nhật người dùng id: ${updateData?.doc[0]?.id} từ: {name: ${data?.name}, email: ${data?.email}, telephone: ${data?.telephone}} sang: { name: ${updateData?.doc[0]?.name}, email: ${updateData?.doc[0]?.email}, telephone: ${updateData?.doc[0]?.telephone} }`,
        },
        token,
      });
    },
    onError: (error) => {
      handleError(error);
    },
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/user`);
        },
      });
    },
  });
  const defaultValues = {
    email: data?.email || "",
    password: "",
    name: data?.name || "",
    workTime1: (data?.workTime?.split("-")[0] && data?.workTime?.split("-")[0]) || "",
    workTime2: (data?.workTime?.split("-")[1] && data?.workTime?.split("-")[1]) || "",
    roles: data?.roles || [],
    telephone: data?.telephone || "",
    gender: data?.gender || "Nam",
    lock: data?.lock || false,
  };
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    register,
  } = useForm({ defaultValues });
  const formatObject = (obj) => {
    return {
      email: obj?.email || "",
      password: obj.password ? obj.password : "",
      name: obj?.name || "",
      workTime: obj?.workTime1 + "-" + obj?.workTime2,
      roles: obj?.roles || [],
      telephone: obj?.telephone || "",
      gender: obj?.gender || "Nam",
      lock: obj?.lock || false,
    }
  }
  const onSubmit = (newData) => {
    if (btnText == "Edit") {
      update.mutate({ id: data.id, newData: formatObject(newData), token });
    } else {
      create.mutate(formatObject(newData), token);
    }
    reset();
  };
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>;
  };

  return (
    <div>
      <form className="p-fluid">
        <div className="field">
          <span>
            <label htmlFor="email" className={classNames({ "p-error": errors.name })}>
              Email
            </label>
            <Controller
              name="email"
              control={control}
              rules={{
                required: "Yêu cầu nhập email.",
                pattern: {
                  value: /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,6}$/,
                  message: "Please enter a valid email",
                },
              }}
              render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Email" className={classNames({ "p-invalid": fieldState.invalid })} />}
            />
          </span>
          {getFormErrorMessage("email")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="password" className={classNames({ "p-error": !!errors.links })}>
              Password
            </label>
            <Controller
              name="password"
              control={control}
              rules={{
                required: btnText != "Edit",
                minLength: 6,
              }}
              render={({ field, fieldState }) => <Password id={field.name} {...field} feedback={false} toggleMask />}
            />
          </span>
          {getFormErrorMessage("password")}
        </div>

        <div className="field">
          <span>
            <label htmlFor="name" className={classNames({ "p-error": !!errors.links })}>
              Tên người dùng
            </label>
            <Controller name="name" control={control} rules={{ required: "Yêu cầu nhập tên." }} render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Tên người dùng" className={classNames({ "p-invalid": fieldState.invalid })} />} />
          </span>
          {getFormErrorMessage("name")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="telephone" className={classNames({ "p-error": !!errors.links })}>
              Số điện thoại
            </label>
            <Controller
              name="telephone"
              control={control}
              rules={{
                required: "Yêu cầu nhập số điện thoại.",
                pattern: {
                  value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
                  message: "Please enter a valid phone",
                },
              }}
              render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Số điện thoại" className={classNames({ "p-invalid": fieldState.invalid })} />}
            />
          </span>
          {getFormErrorMessage("telephone")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="workTime" className={classNames({ "p-error": !!errors.links })}>
              Ca trực
            </label>
            <div className="flex gap-2">
              <Controller name="workTime1" control={control} rules={{ required: "Yêu cầu nhập ca trực." }} render={({ field, fieldState }) => <TimePicker className="flex" format="HH:mm" clockIcon={null} id={field.name} {...field} />} />
              <Controller name="workTime2" control={control} rules={{ required: "Yêu cầu nhập ca trực." }} render={({ field, fieldState }) => <TimePicker className="flex" format="HH:mm" clockIcon={null} id={field.name} {...field} />} />
            </div>
          </span>
          {getFormErrorMessage("workTime1")} {getFormErrorMessage("workTime2")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="roles" className={classNames({ "p-error": !!errors.links })}>
              Quyền
            </label>
            <Controller name="roles" control={control} rules={{ required: "Yêu cầu chọn quyền." }} render={({ field, fieldState }) => <MultiSelect options={roleOptions} display="chip" id={field.name} {...field} />} />
          </span>
          {getFormErrorMessage("roles")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="gender" className={classNames({ "p-error": !!errors.links })}>
              Giới tính
            </label>
            <Controller
              name="gender"
              control={control}
              rules={{ required: "Yêu cầu chọn giới tính." }}
              render={({ field, fieldState }) => {
                return (
                  <div className="flex align-content-center gap-2">
                    <RadioButton {...field} id={field.name} {...register("gender")} value="Nam" checked={field.value == "Nam"} /> <label className="mb-0">Nam</label>
                    <RadioButton {...field} id={field.name} {...register("gender")} value="Nữ" checked={field.value == "Nữ"} /> <label className="mb-0">Nữ</label>
                  </div>
                );
              }}
            />
          </span>
          {getFormErrorMessage("gender")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="lock" className={classNames({ "p-error": !!errors.links })}>
              Khóa tài khoản
            </label>
            <Controller name="lock" control={control} render={({ field, fieldState }) => <InputSwitch id={field.name} {...field} checked={field.value} className="block" />} />
          </span>
          {getFormErrorMessage("lock")}
        </div>
        <div className="text-right">
          <Button disabled={create.isLoading || update.isLoading} type="button" onClick={handleSubmit(onSubmit)} label={btnText == "Edit" ? "Sửa" : "Thêm"} className="mt-2 inline-block w-auto" />
        </div>
      </form>
    </div>
  );
}

export default Form;
