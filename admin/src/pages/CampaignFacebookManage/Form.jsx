import classNames from "classnames";
import moment from "moment";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import React, { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import { createCampaign, updateCampaign } from "../../service/campaignAPI";
import { createHistory } from "../../service/historyAPI";
Form.propTypes = {};

function Form({ btn, data, closeDialog, toast }) {
  const [typeCampaign, setTypeCampaign] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (data.type == "COMMENT") {
      setTypeCampaign("comment");
      setValue("comments", data?.comments);
    }
  }, []);
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
  const create = useMutation(createCampaign, {
    onSuccess: (newData) => {
      const data = newData?.doc && newData?.doc[0];
      toast.current.show({ severity: "success", summary: "Tạo chiến dịch thành công", detail: "Thành công" });
      addHistory.mutate({ newData: {  screen: "Chiến dịch facebook", description: `Tạo chiến dịch có thông tin : { id: ${data?.id}, name: ${data?.name}, type: ${data?.type}, status: ${data.status}}` }, token });
    },
    onError: (error) => handleError(error),
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/campaign`);
        },
      });
    },
  });
  const update = useMutation(updateCampaign, {
    onSuccess: (updateData) => {
      toast.current.show({ severity: "success", summary: "Cập nhật chiến dịch thành công", detail: "Thành công" });
      addHistory.mutate({
        newData: {
          screen: "Chiến dịch facebook",
          description: `Cập nhật chiến dịch id: ${updateData?.doc[0]?.id} từ: {name: ${data?.name},  type: ${data?.type}, status: ${data.status}} sang: { name: ${updateData?.doc[0]?.name},  type: ${updateData?.doc[0]?.type}, status: ${updateData?.doc[0]?.status} }`,
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
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/campaign`);
        },
      });
    },
  });
  const defaultValues = {
    name: data?.name || "",
    contentUrls: data?.contentUrls?.map((p) => p).join("\n") || "",
    type: data?.type || "",
    interactions: data?.interactions || "",
    comments: data?.comments || [],
  };
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    register,
    setValue,
  } = useForm({ defaultValues });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "comments",
  });
  const onSubmit = (newData) => {
    // if (newData.type == "REPORT") {
    //   delete newData.comments;
    // }
    newData = { ...newData };
    if (btn == "Edit") {
      newData = { ...newData, contentUrls: newData?.contentUrls, startedAt: new Date(data.startedAt), endedAt: new Date(data.endedAt), runCount: data.runCount, status: data.status };
      update.mutate({ id: data.id, newData, token });
    } else {
      create.mutate({ newData: { ...newData, status: "CREATED" }, token });
    }
    // reset();
  };
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>;
  };
  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-fluid">
        <div className="field">
          <span>
            <label htmlFor="name" className={classNames({ "p-error": errors.name })}>
              Tên chiến dịch
            </label>
            <Controller
              name="name"
              control={control}
              rules={{
                validate: (e) => {
                  if (!!e?.trim()) return true;
                  else return "Yêu cầu nhập tên chiến dịch";
                },
              }}
              render={({ field, fieldState }) => <InputText id={field.name} {...field} autoFocus className={classNames({ "p-invalid": fieldState.invalid })} />}
            />
          </span>
          {getFormErrorMessage("name")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="contentUrls" className={classNames({ "p-error": !!errors.links })}>
              Đường dẫn bài viết thực hiện chiến dịch
            </label>
            <Controller
              name="contentUrls"
              control={control}
              rules={{
                validate: (e) => {
                  if (!!e?.trim()) return true;
                  else return "Yêu cầu nhập đường dẫn";
                },
              }}
              render={({ field, fieldState }) => <InputTextarea id={field.name} {...field} className={classNames({ "p-invalid": fieldState.invalid })} />}
            />
          </span>
          {getFormErrorMessage("contentUrls")}
        </div>
        <div className="field">
          <span>
            <label htmlFor="type">Chọn loại chiến dịch</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Dropdown
                  id={field.name}
                  value={field.value}
                  optionLabel="name"
                  onChange={(e) => {
                    field.onChange(e.value);
                    if (e.value == "COMMENT") {
                      setTypeCampaign("comment");
                    } else setTypeCampaign("rp");
                  }}
                  options={[
                    { name: "Bình luận", value: "COMMENT" },
                    { name: "Report", value: "REPORT" },
                  ]}
                />
              )}
            />
          </span>
        </div>
        {typeCampaign == "comment" && (
          <>
            <div className="field gap-2 border-solid border-1 border-200 p-2">
              <label>Bình luận</label>
              {fields.map((item, index) => (
                <div key={item.id} className="flex mb-2 gap-2">
                  <Controller
                    rules={{
                      validate: (e) => {
                        if (!!e?.trim()) return true;
                        else return "Yêu cầu nhập bình luận";
                      },
                    }}
                    render={({ field, fieldState }) => <InputText className={classNames({ "p-invalid": fieldState.invalid })} {...field} />}
                    name={`comments.${index}`}
                    control={control}
                  />
                  <Button type="button" onClick={() => remove(index)} className="w-2 flex justify-content-center">
                    Xóa
                  </Button>
                </div>
              ))}
              <div className="text-right mt-2">
                <Button type="button" onClick={() => append("")} className="inline-block w-auto">
                  Thêm bình luận
                </Button>
              </div>
            </div>
          </>
        )}
        <div className="field">
          <span>
            <label htmlFor="interactions" className={classNames({ "p-error": errors.name })}>
              Số lượng tài khoản tương tác
            </label>
            <Controller name="interactions" control={control} render={({ field }) => <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} showButtons min={0} />} />{" "}
          </span>
          {getFormErrorMessage("interactions")}
        </div>

        <div className="text-right">
          <Button type="submit" label={btn == "Edit" ? "Sửa" : "Thêm"} className="mt-2 inline-block w-auto" />
        </div>
      </form>
    </div>
  );
}

export default Form;
