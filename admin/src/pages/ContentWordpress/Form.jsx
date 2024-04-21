import classNames from "classnames";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { InputText } from "primereact/inputtext";
import React, { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { createHistory } from "../../service/historyAPI";
import { createTopic, updateTopic } from "../../service/topicAPI";
import { AutoComplete } from "primereact/autocomplete";
import { getAllAuthors } from "../../service/authorAPI";
import { createContentWordpress, updateContentWordpress } from "../../service/contentWordpressAPI";
import { useSelector } from "react-redux";
Form.propTypes = {};

function Form({ btnText, data, toast, closeDialog }) {
  const queryClient = useQueryClient();
  const token = useSelector((state) => state.user.token);
  const userId = useSelector((state) => state.user?.userData?.id || "");
  const [keywordsAuthor, setKeywordsAuthor] = useState("");
  const [filterAuthors, setFilterAuthors] = useState([]);
  
  const keyAllAuthors = `${process.env.REACT_APP_API_URL}/author?page=1&pageSize=12&name=${keywordsAuthor}`;
  const authors = useQuery(keyAllAuthors, (query) => getAllAuthors({ query, token }), {
    onSuccess: (data) => {
      setFilterAuthors([
        ...data?.docs?.map((p) => ({
          value: p.id,
          label: p.name,
        })),
      ]);
    },
  });
  // const types = localStorage.getItem("categories") && JSON.parse(localStorage.getItem("categories")) || [
  //   { label: "Chính trị", value: "Chính trị" },
  //   { label: "Quân đội", value: "Quân đội" },
  //   { label: "Văn Hoá", value: "Văn Hoá" },
  // ];
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
  const create = useMutation(createContentWordpress, {
    onSuccess: (data) => {
      toast.current.show({ severity: "success", summary: "Thêm mới content wordpress thành công", detail: "Thành công" });
      addHistory.mutate({ newData: {  screen: "Content wordpress", description: `Tạo content wordpress có thông tin : { id: ${data?.doc[0]?.id}, title: ${data?.doc[0]?.title}, content: ${data?.doc[0]?.content}}` }, token });
    },
    onError: (error) => handleError(error),
    onSettled: () => {
      closeDialog();
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/wordpressContent`);
        },
      });
    },
  });
  const update = useMutation(updateContentWordpress, {
    onSuccess: (updateData) => {
      toast.current.show({ severity: "success", summary: "Cập nhật content wordpress thành công", detail: "Thành công" });
      addHistory.mutate({
        newData: {
          
          screen: "Content wordpress",

          description: `Cập nhật Content wordpress id: ${updateData?.doc[0]?.id} từ: {title: ${data?.title}, content: ${data?.content}} sang: { title: ${updateData?.doc[0]?.title}, content: ${updateData?.doc[0]?.content
            } }`,
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
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/wordpressContent`);
        },
      });
    },
  });
  const defaultValues = {
    title: data?.title || '',
    content: data?.content || '',
    targetUrl: data?.targetUrl || '',
    authorId: data?.authorId
      ? {
          value: data?.authorId || '',
          label: data?.authorName || '',
        }
      : '',
    image: data?.image || '',

    // categories: data?.categories?.map(p => ({
    //   label: p,
    //   value: p
    // })) || [],
  }
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
    getValues,
    register,
    watch,
  } = useForm({ defaultValues });

  const onSubmit = (newData) => {
    newData.authorId = newData.authorId.value
    if (btnText != "Edit") {
      newData = { ...newData };
      create.mutate({ newData, token });
    } else {
      newData = { ...newData };
      update.mutate({ id: data.id, newData, token });
    }
    reset();
  };
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>;
  };
  const itemTemplate = (file, props) => {
    return (
      <div className="flex align-items-center flex-wrap">
        <div className="flex align-items-center" style={{ width: "40%" }}>
          <img alt={file.name} role="presentation" src={file.objectURL} width={100} />
          <span className="flex flex-column text-left ml-3">
            {file.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
      </div>
    );
  };
  const headerTemplate = (options) => {
    const { className, chooseButton } = options;

    return (
      <div className={className} style={{ backgroundColor: "transparent", display: "flex", alignItems: "center" }}>
        {chooseButton}
      </div>
    );
  };
  const customBase64Uploader = async (field, event) => {
    // convert file to base64 encoded
    try {
      const file = event.files[0];
      const reader = new FileReader();
      let blob = await fetch(file.objectURL).then((r) => r.blob()); //blob:url
      reader.readAsDataURL(blob);
      reader.onloadend = function () {
        const base64data = reader.result;
        field.onChange(base64data);
      };
    } catch (error) {
      console.log(error);
    }
  };
  const searchAuthor = (event) => {
    let timeout;
    let query = event.query;

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => {
      setKeywordsAuthor(query);
    }, 300);
  };
  const emptyTemplate = () => {
    if (!getValues("image")) {
      return <p className="m-0">Kéo thả ảnh vào đây.</p>
    } else {
      return (
        <div className="flex align-items-center flex-wrap">
          <div className="flex align-items-center" style={{ width: "40%" }}>
            <img role="presentation" src={getValues("image")} width={100} />
          </div>
        </div>
      );
    }
  }
  return (
    <div>
      <form className="p-fluid">
        <div className="field">
          <span>
            <label htmlFor="title" className={classNames({'p-error': errors.name})}>
              Tiêu đề website hiển thị trên link cho đối tượng
            </label>
            <Controller
              name="title"
              control={control}
              // rules={{required: 'Yêu cầu nhập tiêu đề.'}}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Tiêu đề"
                  className={classNames({'p-invalid': fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage('title')}
        </div>
        <div className="field">
          <span>
            <label htmlFor="targetUrl" className={classNames({'p-error': errors.name})}>
              Liên kết sẽ chuyển hướng tới
            </label>
            <Controller
              name="targetUrl"
              control={control}
              rules={{required: 'Yêu cầu nhập đường dẫn tới trang web đích'}}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Liên kết đích"
                  className={classNames({'p-invalid': fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage('targetUrl')}
        </div>
        <div className="field">
          <span>
            <label htmlFor="content" className={classNames({'p-error': errors.name})}>
              Nội dung tóm tắt hiển thị trên link cho đối tượng
            </label>
            <Controller
              name="content"
              control={control}
              // rules={{required: 'Yêu cầu nhập nội dung.'}}
              render={({field, fieldState}) => (
                <InputText
                  id={field.name}
                  {...field}
                  autoFocus
                  placeholder="Nội dung tóm tắt"
                  className={classNames({'p-invalid': fieldState.invalid})}
                />
              )}
            />
          </span>
          {getFormErrorMessage('content')}
        </div>
        <div className="field">
          <span>
            <label htmlFor="image" className={classNames({'p-error': errors.name})}>
              Ảnh đại diện hiển thị trên link cho đối tượng
            </label>
            <Controller
              name="image"
              control={control}
              // rules={{required: 'Yêu cầu chọn ảnh.'}}
              render={({field, fieldState}) => (
                <FileUpload
                  name={field.name}
                  {...field}
                  onSelect={(e) => customBase64Uploader(field, e)}
                  headerTemplate={headerTemplate}
                  accept="image/*"
                  itemTemplate={itemTemplate}
                  emptyTemplate={emptyTemplate}
                  chooseLabel="Chọn ảnh"
                />
              )}
            />
          </span>
          {getFormErrorMessage('image')}
        </div>
        <div className="field">
          <span>
            <label htmlFor="authorId" className={classNames({'p-error': errors.name})}>
              Đối tượng thu thập thông tin
            </label>
            <Controller
              name="authorId"
              control={control}
              // rules={{required: 'Yêu cầu chọn người đăng.'}}
              render={({field, fieldState}) => (
                <AutoComplete
                  suggestions={filterAuthors}
                  field="label"
                  dropdown
                  onDropdownClick={() => setFilterAuthors([...filterAuthors])}
                  completeMethod={searchAuthor}
                  {...field}
                  // value={selectedItem}
                  name={field.name}
                />
              )}
            />
          </span>
          {getFormErrorMessage('authorId')}
        </div>
        {/* <div className="field">
          <span>
            <label htmlFor="keywords" className={classNames({ "p-error": !!errors.links })}>
              Danh sách keywords=
            </label>
            <Controller name="keywords" control={control} rules={{ required: "Links is required." }} render={({ field, fieldState }) => <InputTextarea id={field.name} {...field} rows={5} className={classNames({ "p-invalid": fieldState.invalid })} placeholder="Keyword cách nhau bởi dấu enter" />} />
          </span>
          {getFormErrorMessage("keywords")}
        </div> */}

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
