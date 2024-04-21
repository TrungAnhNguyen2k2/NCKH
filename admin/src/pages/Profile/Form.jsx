import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import React, { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";

import classNames from "classnames";
import { InputTextarea } from "primereact/inputtextarea";
import { createProfile, updateProfile } from "../../service/profileAPI";
import { createHistory } from "../../service/historyAPI";
import { useSelector } from "react-redux";

Form.propTypes = {};

function Form({ btnText, data, toast, closeDialog }) {
  const queryClient = useQueryClient();

  const token = useSelector(state => state.user.token)
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
  const create = useMutation((newData, token) => createProfile(newData, token), {
    onSuccess: (profile) => {
      const data = profile?.doc[0];
      toast.current.show({ severity: "success", summary: "Created hồ sơ thành công", detail: "Thành công" })
      addHistory.mutate({ newData: {  screen: "Tag", description: `Tạo hồ sơ có thông tin: { id: ${data?.id}, name: ${data?.name} , totalContent: ${data?.contentIds?.length || 0}, totalSource: ${data?.sourceIds?.length || 0}, totalTags: ${data?.tagsInfo?.length || 0}}` }, token });

    },
    onError: (error) => handleError(error),
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/profile`);
        },
      });
    },
  });
  const update = useMutation(updateProfile, {
    onSuccess: (updateData) => {
      toast.current.show({ severity: "success", summary: "Cập nhật tài khoản thành công", detail: "Thành công" });
    },
    onError: (error) => {
      handleError(error);
    },
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/profile`);
        },
      });
    },
  });
  const defaultValues = {
    name: "",
    description: "",
  };
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    register,
  } = useForm({ defaultValues });

  const onSubmit = (newData) => {
    create.mutate({ newData, token })
  };
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>;
  };
  return (
    <div>
      <form className="p-fluid">
        <div className="field">
          <span>
            <label htmlFor="name" className={classNames({ "p-error": !!errors.links })}>
              Tên hồ sơ
            </label>
            <Controller name="name" control={control} rules={{
              validate: (e) => {
                if (!!e?.trim()) return true;
                else return "Yêu cầu nhập tên hồ sơ";
              },
            }} render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus placeholder="Tên hồ sơ" className={classNames({ "p-invalid": fieldState.invalid })} />} />
          </span>
          {getFormErrorMessage("name")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="description" className={classNames({ "p-error": !!errors.links })}>
              Mô tả
            </label>
            <Controller name="description" control={control} rules={{
              validate: (e) => {
                if (!!e?.trim()) return true;
                else return "Yêu cầu nhập mô tả";
              },
            }} render={({ field, fieldState }) => <InputTextarea id={field.name} {...field} rows={5} className={classNames({ "p-invalid": fieldState.invalid })} placeholder="Mô tả" />} />
          </span>
          {getFormErrorMessage("description")}
        </div>
        <div className="text-right">
          <Button disabled={create.isLoading || update.isLoading} type="button" onClick={handleSubmit(onSubmit)} label={"Thêm"} className="mt-2 inline-block w-auto" />
        </div>
      </form>
    </div>
  );
}

export default Form;
