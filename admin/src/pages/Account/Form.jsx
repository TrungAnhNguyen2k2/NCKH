import classNames from "classnames";
import { AutoComplete } from "primereact/autocomplete";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createAuthor, updateAuthor } from "../../service/authorAPI";
import { createProfile, getAllProfiles, updateProfile } from "../../service/profileAPI";
import { createTag, getAllTags } from "../../service/tagAPI";
import { useSelector } from 'react-redux'
import axios from "axios";
import { createHistory } from "../../service/historyAPI";
Form.propTypes = {};

function Form({ data, toast, closeDialog }) {
  const defaultValues = {
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
    // latestpostedat: data?.latestpostedat || '',
    totalContent: data?.latestContentId || "",
    latestContentId: data?.latestContentId || "",
    latestPostedAt: data?.latestPostedAt || ""
  };
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    getValues,
  } = useForm({ defaultValues });
  const queryClient = useQueryClient();
  const [keywords, setKeywords] = useState("");
  const [filterTags, setFilterTags] = useState([]);
  const [keywordsProfile, setKeywordsProfile] = useState("");
  const [filterProfiles, setFilterProfiles] = useState([]);
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
  const key = `${process.env.REACT_APP_API_URL}/tag?page=1&pageSize=12&name=${keywords}`;
  const tags = useQuery(key, (query) => getAllTags(query, token), {
    onSuccess: (data) => {
      if (data)
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
      if (data)
        setFilterProfiles([
          ...data?.docs.map((p) => ({
            value: p.id,
            label: p.name,
          })),
        ]);
    },
  });
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e);
    },
  });
  const createTagFromAuthor = useMutation(createTag, {
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
      addHistory.mutate({ newData: {  screen: "Hồ sơ đối tượng", description: "Tạo tag từ form người dùng" }, token });
      setValue("tagIds", cloneTagIds);
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
  const createProfileFromAuthor = useMutation(createProfile, {
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
      addHistory.mutate({ newData: {  screen: "Hồ sơ đối tượng", description: "Tạo hồ sơ từ form người dùng" }, token });
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
  const update = useMutation(updateAuthor, {
    onSuccess: (updateData) => {
      toast.current.show({ severity: "success", summary: "Cập nhật người đăng thành công", detail: "Thành công" });
      addHistory.mutate({
        newData: {
          screen: "Hồ sơ đối tượng",
          description: `Cập nhật người dùng id: ${updateData?.doc[0]?.id} từ: {name: ${data?.name}, contact: ${data?.contact}, profileids: [${data?.profileIds?.join(", ") || ""}], tagids: [${data?.tagIds.join(", ") || ""}]} sang: { name: ${updateData?.doc[0]?.name}, contact: ${updateData?.doc[0]?.contact
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
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/author`);
        },
      });
    },
  });
  const updateProfileFromAuthor = useMutation(updateProfile, {
    onError: (error) => handleError(error),
  });

  const removeAuthorFromProfile = async (idAuthor, idProfile) => {
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

    if (authorIds && authorIds.length) {
      authorIds = authorIds.filter((p) => p != idAuthor);
    }
    updateProfileFromAuthor.mutate({ id: idProfile, newData: { sourceIds, authorIds, contentIds, name, description }, token });
  };
  const addAuthorFromProfile = async (idAuthor, idProfile) => {
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

    authorIds.push(idAuthor);
    updateProfileFromAuthor.mutate({ id: idProfile, newData: { sourceIds, authorIds, contentIds, name, description }, token });
  };
  const onSubmit = (newData) => {
    try {
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
      for (let item of removeProfiles) {
        removeAuthorFromProfile(data?.id, item);
      }
      for (let item of addProfiles) {
        addAuthorFromProfile(data?.id, item);
      }
      update.mutate( { id: data.id, newData: { tagIds: newData.tagIds.map( ( p ) => p.value ), profileIds: newData.profileIds.map( ( p ) => p.value ), userHandle: data?.userHandle }, token });
    } catch (error) {
      console.log(error);
    }
  };
  const searchCategories = (event) => {
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
      createTagFromAuthor.mutate({ newData: { name: e.target.value }, token });
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
      createProfileFromAuthor.mutate({ newData: { name: e.target.value }, token });
      e.target.value = "";
    }
  };
  // const update = useMutation(updateAuthor, {
  //   onSuccess: () => {
  //     toast.current.show({ severity: "success", summary: "Update Post Thành công", detail: "Thành công" });
  //   },
  //   onError: (error) => {
  //     handleError(error);
  //   },
  //   onSettled: () => {
  //     closeDialog();
  //     return queryClient.invalidateQueries({
  //       predicate: (query) => {
  //         return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/topic`);
  //       },
  //     });
  //   },
  // });
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>;
  };
  return (
    <div>
      <form className="p-fluid">
        <div className="field">
          <span>
            <label htmlFor="tagIds" className={classNames({ "p-error": !!errors.links })}>
              Thẻ
            </label>
            <Controller
              name="tagIds"
              control={control}
              render={({ field, fieldState }) => <AutoComplete dropdown multiple field="label" value={field.value} onKeyPress={enterNoExit} suggestions={filterTags} onDropdownClick={() => setFilterTags([...filterTags])} completeMethod={searchCategories} onChange={(e) => field.onChange(e.value)} />}
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
                <AutoComplete dropdown multiple field="label" value={field.value} onKeyPress={enterNoExitProfiles} suggestions={filterProfiles} onDropdownClick={() => setFilterProfiles([...filterProfiles])} completeMethod={searchProfiles} onChange={(e) => field.onChange(e.value)} />
              )}
            />
          </span>
          {getFormErrorMessage("profileIds")}
        </div>
        <div>
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
          <div className="field">
            <span>
              <label htmlFor="latestContentId" className={classNames({ "p-error": !!errors.links })}>
                Bài đăng
              </label>
              <Controller name="latestContentId" control={control} render={({ field, fieldState }) => <InputText disabled name={field.name} {...field} />} />
            </span>
          </div>
          <div className="field">
            <span>
              <label htmlFor="latestPostedAt" className={classNames({ "p-error": !!errors.links })}>
                Ngày đăng
              </label>
              <Controller name="latestPostedAt" control={control} render={({ field, fieldState }) => <InputText disabled name={field.name} {...field} />} />
            </span>
          </div>
          <div className="field">
            <span>
              <label htmlFor="totalContent" className={classNames({ "p-error": !!errors.links })}>
                Số bài viết
              </label>
              <Controller name="totalContent" control={control} render={({ field, fieldState }) => <InputText disabled name={field.name} {...field} />} />
            </span>
          </div>
        </div>
        <div className="text-right">
          <Button type="button" onClick={handleSubmit(onSubmit)} label="Cập nhật" className="mt-2 inline-block w-auto" />
        </div>
      </form>
    </div>
  );
}

export default Form;
