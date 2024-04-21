import classNames from "classnames";
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import React, { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createProfile, getAllProfiles, updateProfile } from "../../service/profileAPI";
import { createSource, updateSource } from "../../service/sourceAPI";
import { createTag, getAllTags } from "../../service/tagAPI";

import axios from "axios";
import { createHistory } from "../../service/historyAPI";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from 'primereact/multiselect';
import { useSelector } from "react-redux";

Form.propTypes = {};

function Form({ btnText, data, toast, closeDialog }) {
  const optionQuesntions = [
    {
      label: "Văn bản",
      value: "PARAGRAPH",
    },
    {
      label: "Chọn nhiều",
      value: "CHECKBOXES",
    },
    {
      label: "Nhiều lựa chọn",
      value: "MULTIPLE_CHOICE",
    },
  ];
  const formatInfo = (label) => {
    if (label == "PARAGRAPH") return "Văn bản"
    else if (label == "CHECKBOXES") return "Câu trả lời 1 lựa chọn"
  }
  const defaultValues = {
    links: btnText == "Edit" ? data.link : "",
    tagIds:
      data?.tagsInfo?.map((p) => ({
        label: p.name,
        value: p.id,
      })) || [],
    profileIds:
      data?.profilesInfo?.map((p) => ({
        label: p.name,
        value: p.id,
      })) || [],
    link: data?.link || "",
    name: data?.name || "",
    type: data?.type || "",
    status: data?.status || "",
    questionsToJoin:
      data?.questionsToJoin?.map((question, i) => {
        let newAnswer;
        let selected_options = []
        let question_options = []
        if (question.question_type == "PARAGRAPH") {
          newAnswer = question.answer;
        } else if (question.question_type == "CHECKBOXES") {
          selected_options = question.selected_options
          question_options = question.question_options
        } else {
          selected_options = question.selected_options ? question.selected_options[0] : ""
          question_options = question.question_options
        }
        return {
          ...question,
          question_type: question.question_type,
          question: question.question,
          selected_options: selected_options,
          question_options: question_options,
          answer: question.question_type == "PARAGRAPH" ? newAnswer : ""
        };

      }) || [],
  };
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
  } = useForm({ defaultValues });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "questionsToJoin",
  });
  const queryClient = useQueryClient();
  const [keywords, setKeywords] = useState("");
  const [filterTags, setFilterTags] = useState(null);
  const [keywordsProfile, setKeywordsProfile] = useState("");
  const [filterProfiles, setFilterProfiles] = useState(null);
  const token = useSelector((state) => state.user.token);
  const userId = useSelector((state) => state.user?.userData?.id || "");
  const formatCreate = (data) => {
    return {
      links: data.links,
      tagIds: data.tagIds,
      profileIds: data.profileIds,
      // questionsToJoin: data?.questionsToJoin,
    };
  };
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
  const key = `${process.env.REACT_APP_API_URL}/tag?page=1&pageSize=12&name=${keywords}`;
  const tags = useQuery(key, (query) => getAllTags(query, token), {
    onSuccess: (data) => {
      setFilterTags([
        ...data?.docs.map((p) => ({
          value: p.id,
          label: p.name,
        })),
      ]);
    },
  });
  const keyProfile = `${process.env.REACT_APP_API_URL}/profile?page=1&pageSize=12&name=${keywordsProfile}`;
  const profiles = useQuery(keyProfile, (query) => getAllProfiles(query, token), {
    onSuccess: (data) => {
      setFilterProfiles([
        ...data?.docs.map((p) => ({
          value: p.id,
          label: p.name,
        })),
      ]);
    },
  });

  const createTagFromSource = useMutation(createTag, {
    onError: (error) => handleError(error),
    onSuccess: (data) => {
      const name = data?.doc && data?.doc[0] && data?.doc[0]?.name;
      const id = data?.doc && data?.doc[0] && data?.doc[0]?.id;
      const cloneTagIds = getValues().tagIds.map((p, i) => {
        if (p.label == name) {
          return {
            label: name,
            value: id,
          };
        }
        return p;
      });
      addHistory.mutate({ newData: {  screen: "Nguồn dữ liệu", description: "Tạo tag từ form nguồn dữ liệu" }, token });

      setValue("tagIds", cloneTagIds);
    },
    onSettled: () => {
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/tag`);
        },
      });
    },
  });
  const createProfileFromSource = useMutation(createProfile, {
    onError: (error) => handleError(error),
    onSuccess: (data) => {
      const name = data?.doc && data?.doc[0] && data?.doc[0]?.name;
      const id = data?.doc && data?.doc[0] && data?.doc[0]?.id;
      const cloneProfileIds = getValues().profileIds.map((p, i) => {
        if (p.label == name) {
          return {
            label: name,
            value: id,
          };
        }
        return p;
      });
      addHistory.mutate({ newData: {  screen: "Nguồn dữ liệu", description: "Tạo profile từ form nguồn dữ liệu" }, token });

      setValue("profileIds", cloneProfileIds);
    },
    onSettled: () => {
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/profile`);
        },
      });
    },
  });
  const updateProfileFromSource = useMutation(updateProfile, {
    onError: (error) => handleError(error),
  });
  const create = useMutation(createSource, {
    onSuccess: (data) => {
      if (data?.doc?.success?.length > 0 && data?.doc?.fail?.length > 0) {
        toast.current.show({
          severity: "warn",
          summary: (
            <span>
              Tạo Source thành công: <br />{" "}
              {data?.doc?.success.map((p) => (
                <span>
                  {p} <br />
                </span>
              ))}{" "}
              <br /> Tạo source thất bại:{" "}
              {data?.doc?.fail.map((p) => (
                <span>
                  {p} <br />
                </span>
              ))}
              `
            </span>
          ),
          detail: "Thành công",
        });
      } else if (data?.doc?.success?.length > 0 && data?.doc?.fail?.length == 0) {
        toast.current.show({ severity: "success", summary: <span>Tạo nguồn dữ liệu thành công</span>, detail: "Thành công", life: 5000 });
      } else {
        toast.current.show({ severity: "error", summary: "Tạo nguồn dữ liệu thất bại", detail: "Thất bại" });
      }
      addHistory.mutate({ newData: {  screen: "Nguồn dữ liệu", description: "Tạo nguồn dữ liệu" }, token });
    },
    onError: (error) => handleError(error),
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/source`);
        },
      });
    },
  });
  const update = useMutation(updateSource, {
    onSuccess: (updateData) => {
      toast.current.show({ severity: "success", summary: "Cập nhật nguồn dữ liệu thành công", detail: "Thành công" });
      addHistory.mutate({
        newData: {
                    screen: `Nguồn dữ liệu", description: "Cập nhật nguồn dữ liệu id: ${updateData?.doc[0]?.id} từ: {name: ${data?.name}, link: ${data?.link}, profileids: [${data?.profileIds?.join(", ") || ""}], tagids: [${data?.tagIds?.join(", ") || ""}]} sang: { name: ${updateData?.doc[0]?.name}, link: ${updateData?.doc[0]?.link
            }, profileids: [${updateData?.doc[0]?.profileIds.join(", ") || ""}], tagids: [${updateData?.doc[0]?.tagIds.join(", ") || ""}] }`,
        },
        token,
      });
    },
    onError: (error) => handleError(error),
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/source`);
        },
      });
    },
  });
  const removeSourceFromProfile = async (idSource, idProfile) => {
    const detailProfile = await axios.get(`${process.env.REACT_APP_API_URL}/profile/${idProfile}`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    let sourceIds = detailProfile.data.doc.sourceIds || [];
    let authorIds = detailProfile.data.doc.authorIds || [];
    let contentIds = detailProfile.data.doc.contentIds || [];
    let name = detailProfile.data.doc.name;
    let description = detailProfile.data.doc.description;

    if (sourceIds && sourceIds.length) {
      sourceIds = sourceIds.filter((p) => p != idSource);
    }
    updateProfileFromSource.mutate({ id: idProfile, newData: { sourceIds, authorIds, contentIds, name, description }, token });
  };
  const addSourceFromProfile = async (idSource, idProfile) => {
    const detailProfile = await axios.get(`${process.env.REACT_APP_API_URL}/profile/${idProfile}`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    let sourceIds = detailProfile.data.doc.sourceIds || [];
    let authorIds = detailProfile.data.doc.authorIds || [];
    let contentIds = detailProfile.data.doc.contentIds || [];
    let name = detailProfile.data.doc.name;
    let description = detailProfile.data.doc.description;

    sourceIds.push(idSource);
    updateProfileFromSource.mutate({ id: idProfile, newData: { sourceIds, authorIds, contentIds, name, description }, token });
  };
  const onSubmit = async (newData) => {

    let addProfiles = [];
    let removeProfiles = [];
    const oldProfiles = data?.profileIds || [];
    let newProfiles = newData.profileIds.map((p) => p.value);
    for (let item of oldProfiles) {
      if (!newProfiles.find((p) => p == item)) {
        removeProfiles.push(item);
      }
    }
    for (let item of newProfiles) {
      if (!oldProfiles.find((p) => p == item)) {
        addProfiles.push(item);
      }
    }
    const formatQuestion =
      newData.questionsToJoin?.map((question, i) => {
        if (question.question_type == "MULTIPLE_CHOICE") {
          question.selected_options = [question.selected_options];
        }
        return {
          ...question,
        };
      }) || [];
    newData.questionsToJoin = formatQuestion;

    if (btnText == "Edit") {
      update.mutate({ id: data.id, newData: { tagIds: newData.tagIds.map((p) => p.value), profileIds: newData.profileIds.map((p) => p.value), questionsToJoin: newData.questionsToJoin, type: newData?.type }, token });
      for (let item of removeProfiles) {
        removeSourceFromProfile(data?.id, item);
      }
      for (let item of addProfiles) {
        addSourceFromProfile(data?.id, item);
      }
    } else {
      create.mutate({ newData: formatCreate(newData), token });
    }
  };
  const searchTags = (event) => {
    let timeout;
    let query = event.query;

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => {
      setKeywords(query);
    }, 300);
  };
  const enterNoExit = async (e) => {
    if (e.charCode == 13 && filterTags.length == 0 && e.target.value.trim()) {
      setValue("tagIds", [
        ...getValues().tagIds,
        {
          label: e.target.value,
          value: e.target.value,
        },
      ]);
      createTagFromSource.mutate({ newData: { name: e.target.value }, token });
      e.target.value = "";
    }
  };
  const searchProfiles = (event) => {
    let timeout;
    let query = event.query;

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => {
      setKeywordsProfile(query);
    }, 300);
  };
  const enterNoExitProfiles = async (e) => {
    if (e.charCode == 13 && filterProfiles.length == 0 && e.target.value.trim()) {
      setValue("profileIds", [
        ...getValues().profileIds,
        {
          label: e.target.value,
          value: e.target.value,
        },
      ]);
      createProfileFromSource.mutate({ newData: { name: e.target.value }, token });
      e.target.value = "";
    }
  };
  //   const update = useMutation(updateSource, {
  //     onSuccess: () => {
  //       toast.current.show({ severity: "success", summary: "Update Post Thành công", detail: "Thành công" });
  //     },
  //     onError: (error) => {
  //       handleError(error);
  //     },
  //     onSettled: () => {
  //       closeDialog();
  //       return queryClient.invalidateQueries({
  //         predicate: (query) => {
  //           return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/topic`);
  //         },
  //       });
  //     },
  //   });
  const selectProfile = async (e) => { };
  const unSelectProfile = async (e) => { };
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>;
  };
  return (
    <div>
      <form className="p-fluid">
        {btnText == "Add" && (
          <div className="field">
            <span>
              <label htmlFor="name" className={classNames({ "p-error": !!errors.links })}>
                Nguồn dữ liệu
              </label>
              <Controller
                name="links"
                control={control}
                rules={{
                  validate: (e) => {
                    if (!!e?.trim()) return true;
                    else return "Yêu cầu nhập nguồn dữ liệu";
                  },
                }}
                render={({ field, fieldState }) => <InputTextarea id={field.name} rows={10} {...field} className={classNames({ "p-invalid": fieldState.invalid })} placeholder="Nhập liên kết tới nguồn dữ liệu mỗi liên kết nằm trên 1 dòng" />}
              />
            </span>
            {getFormErrorMessage("links")}
          </div>
        )}

        {btnText == "Edit" && (
          <div>
            <div className="field">
              <span>
                <label htmlFor="tagIds" className={classNames({ "p-error": !!errors.links })}>
                  Thẻ
                </label>
                <Controller
                  name="tagIds"
                  control={control}
                  render={({ field, fieldState }) => <AutoComplete dropdown multiple field="label" value={field.value} onKeyPress={enterNoExit} suggestions={filterTags} onDropdownClick={() => setFilterTags([...filterTags])} completeMethod={searchTags} onChange={(e) => field.onChange(e.value)} />}
                />
              </span>
              {getFormErrorMessage("tagIds")}
            </div>
            <div className="field">
              <span>
                <label htmlFor="profileIds" className={classNames({ "p-error": !!errors.links })}>
                  Hồ sơ vụ việc
                </label>
                <Controller
                  name="profileIds"
                  control={control}
                  render={({ field, fieldState }) => (
                    <AutoComplete
                      dropdown
                      multiple
                      field="label"
                      value={field.value}
                      onKeyPress={enterNoExitProfiles}
                      suggestions={filterProfiles}
                      onDropdownClick={() => setFilterProfiles([...filterProfiles])}
                      completeMethod={searchProfiles}
                      onChange={(e) => field.onChange(e.value)}
                      onSelect={(e) => selectProfile(e)}
                      onUnselect={(e) => unSelectProfile(e)}
                    />
                  )}
                />
              </span>
              {getFormErrorMessage("profileIds")}
            </div>
            <div className="field gap-2 border-solid border-1 border-200 p-2">
              <label>Câu hỏi</label>
              {fields.map((item, index) => {
                const valueType = watch(`questionsToJoin.${index}.question_type`);
                return (
                  <div key={index} className="flex flex-column">
                    <div key={item.id} className="flex mb-2 gap-2 align-items-start">
                      <Controller
                        rules={{ required: "Yêu cầu chọn danh mục." }}
                        control={control}
                        render={({ field }) => (
                          <InputText {...field} className="hidden" />
                        )}
                        name={`questionsToJoin.${index}.id`}
                      />
                      <Controller
                        rules={{ required: "Yêu cầu chọn danh mục." }}
                        control={control}
                        render={({ field }) => (
                          <Dropdown
                            className="w-10"
                            {...field}
                            options={optionQuesntions}
                            onChange={(e) => {
                              field.onChange(e.value);
                            }}
                            optionLabel="label"
                          />
                        )}
                        name={`questionsToJoin.${index}.question_type`}
                      />
                      <Controller rules={{ required: "Yêu cầu nhập câu hỏi." }} control={control} render={({ field, fieldState }) => <InputText {...field} className={classNames({ "p-invalid": fieldState.invalid })} disabled />} name={`questionsToJoin.${index}.question`} />
                      {(valueType == "PARAGRAPH") && (
                        <Controller
                          rules={{ required: "Yêu cầu nhập câu trả lời." }}
                          control={control}
                          render={({ field, fieldState }) => (
                            <span className="p-input-icon-right">
                              <i className="pi pi-info-circle" title={formatInfo(valueType)} />
                              <InputText {...field} className={classNames({ "p-invalid": fieldState.invalid })} placeholder="Nhập câu trả lời" />
                            </span>
                          )}
                          name={`questionsToJoin.${index}.answer`}
                        />
                      )}
                      {(valueType == "CHECKBOXES") && (
                        <Controller
                          rules={{ required: "Yêu cầu nhập câu trả lời." }}
                          control={control}
                          render={({ field, fieldState }) => (
                            <span className="p-input-icon-right">
                              <i className="pi pi-info-circle" title="Mỗi câu trả lời nhấn enter xuống dòng" />
                              <MultiSelect {...field} multiple optionLabel="question_option" optionValue="id" options={getValues(`questionsToJoin.${index}.question_options`)} className={classNames({ "p-invalid": fieldState.invalid })} />
                              {/* {JSON.stringify(getValues(`questionsToJoin.${index}.question_options`))} */}
                            </span>
                          )}
                          name={`questionsToJoin.${index}.selected_options`}
                        />
                      )}
                      {(valueType == "MULTIPLE_CHOICE") && (
                        <Controller
                          rules={{ required: "Yêu cầu nhập câu trả lời." }}
                          control={control}
                          render={({ field, fieldState }) => (
                            <span className="p-input-icon-right">
                              <i className="pi pi-info-circle" title="Mỗi câu trả lời nhấn enter xuống dòng" />
                              <Dropdown {...field} optionLabel="question_option" optionValue="id" options={getValues(`questionsToJoin.${index}.question_options`)} className={classNames({ "p-invalid": fieldState.invalid })} />
                              {/* {JSON.stringify(getValues(`questionsToJoin.${index}.question_options`))} */}
                            </span>
                          )}
                          name={`questionsToJoin.${index}.selected_options`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

            </div>
            <div className="field">
              <span>
                <label htmlFor="name" className={classNames({ "p-error": !!errors.links })}>
                  Tên nguồn dữ liệu
                </label>
                <Controller name="name" control={control} render={({ field, fieldState }) => <InputText disabled name={field.name} {...field} />} />
              </span>
            </div>
            <div className="field">
              <span>
                <label htmlFor="link" className={classNames({ "p-error": !!errors.links })}>
                  Liên kết
                </label>
                <Controller name="link" control={control} render={({ field, fieldState }) => <InputText disabled name={field.name} {...field} />} />
              </span>
            </div>
            {getValues("type") == "GOOGLE_SEARCH_WEBSITE" ? (
              <div className="field">
                <span>
                  <label htmlFor="type" className={classNames({ "p-error": !!errors.links })}>
                    Phân loại
                  </label>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Dropdown
                        id={field.name}
                        value={field.value}
                        {...field}
                        options={[
                          { name: "WEBSITE", value: "WEBSITE" },
                          { name: "GOOGLE_SEARCH_WEBSITE", value: "GOOGLE_SEARCH_WEBSITE" },
                        ]}
                        optionLabel="value"
                      />
                    )}
                  />
                </span>
              </div>
            ) : (
              <div className="field">
                <span>
                  <label htmlFor="type" className={classNames({ "p-error": !!errors.links })}>
                    Phân loại
                  </label>
                  <Controller name="type" control={control} render={({ field, fieldState }) => <InputText disabled name={field.name} {...field} />} />
                </span>
              </div>
            )}
            <div className="field">
              <span>
                <label htmlFor="status" className={classNames({ "p-error": !!errors.links })}>
                  Trạng thái
                </label>
                <Controller name="status" control={control} render={({ field, fieldState }) => <InputText disabled name={field.name} {...field} />} />
              </span>
            </div>
          </div>
        )}

        <div className="text-right">
          <Button type="button" onClick={handleSubmit(onSubmit)} label={btnText == "Edit" ? "Cập nhật" : "Thêm"} className="mt-2 inline-block w-auto" />
        </div>
      </form>
    </div>
  );
}

export default Form;
