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
import { createTag, updateTag } from "../../service/tagAPI";
import { createHistory } from "../../service/historyAPI";
import { useSelector } from "react-redux";

Form.propTypes = {};

function Form({ btnText, data, toast, closeDialog }) {
  const queryClient = useQueryClient();
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
  const create = useMutation(createTag, {
    onSuccess: (tag) => {
      const data = tag?.doc[0];
      toast.current.show({ severity: "success", summary: "Tạo thẻ thành công", detail: "Thành công" });
      addHistory.mutate({ newData: { screen: "Tag", description: `Tạo tag có thông tin: { id: ${data?.id}, name: ${data?.name}}` }, token });
    },
    onError: (error) => handleError(error),
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/tag`);
        },
      });
    },
  });
  const update = useMutation(updateTag, {
    onSuccess: (updateData) => {
      toast.current.show({ severity: "success", summary: "Cập nhật thẻ thành công", detail: "Thành công" });
      addHistory.mutate({ newData: {  screen: "Tag", description: `Cập nhật tag id: ${updateData?.doc[0]?.id} từ: {name: ${data?.name} sang: { name: ${updateData?.doc[0]?.name} }` }, token });
    },
    onError: (error) => {
      handleError(error);
    },
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/tag`);
        },
      });
    },
  });
  const defaultValues = {
    name: data?.name || "",
    showOnPost: data?.showOnPost || false,
  };
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    register,
  } = useForm({ defaultValues });

  const onSubmit = (newData) => {
    if (btnText == "Edit") {
      update.mutate({ id: data.id, newData, token });
    } else {
      create.mutate({ newData, token });
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
            <label htmlFor="name" className={classNames({'p-error': !!errors.links})}>
              Tên thẻ
            </label>
            <Controller
              name="name"
              control={control}
              rules={{
                validate: (e) => {
                  if (!!e?.trim()) return true
                  else return 'Yêu cầu nhập tên thẻ'
                },
              }}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Tên thẻ dán"
                  className={classNames({'p-invalid': fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage('name')}
        </div>
        <div className="field">
          <span className="align-items-center flex gap-1">
            <label htmlFor="showOnPost" className="m-0">
              Tag hay dùng
            </label>
            <Controller
              name="showOnPost"
              control={control}
              render={({field, fieldState}) => <InputSwitch checked={field.value} id={field.name} {...field} />}
            />
          </span>
        </div>
        <div className="text-right">
          <Button
            disabled={create.isLoading || update.isLoading}
            type="button"
            onClick={handleSubmit(onSubmit)}
            label={btnText == 'Edit' ? 'Sửa' : 'Thêm'}
            className="mt-2 inline-block w-auto"
          />
        </div>
      </form>
    </div>
  )
}

export default Form;
