import classNames from "classnames"
import {parseBooleanQuery} from "boolean-parser"
import {Button} from "primereact/button"
import {InputText} from "primereact/inputtext"
import {InputTextarea} from "primereact/inputtextarea"
import {Dropdown} from "primereact/dropdown"
import {MultiStateCheckbox} from "primereact/multistatecheckbox"
import React, {useState} from "react"
import {Controller, useFieldArray, useForm} from "react-hook-form"
import {useMutation, useQueryClient} from "react-query"
import {createTopic, updateTopic} from "../../service/topicAPI"
import {InputSwitch} from "primereact/inputswitch"

import {createHistory} from "../../service/historyAPI"

import {useSelector} from "react-redux"
Form.propTypes = {}

function Form({btnText, data, toast, closeDialog}) {
  const queryClient = useQueryClient()
  const [filterCategories, setFilterCategories] = useState([])
  const options = [
    // { value: "merger", icon: "pi pi-prime" },
    {value: "priority", icon: "pi pi-star"},
  ]
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user?.userData?.id || "")

  const [label, setLabel] = useState("None")
  // const types = localStorage.getItem("categories") && JSON.parse(localStorage.getItem("categories")) || [
  //   { label: "Chính trị", value: "Chính trị" },
  //   { label: "Quân đội", value: "Quân đội" },
  //   { label: "Văn Hoá", value: "Văn Hoá" },
  // ];
  const handleError = (err) => {
    if (err?.response?.data?.msg) {
      toast.current.show({severity: "error", summary: err.response.data.msg, detail: "Lỗi"})
      throw new Error(err.response.data.msg)
    } else if (err?.message) {
      toast.current.show({severity: "error", summary: err.message, detail: "Lỗi"})
      throw new Error(err.message)
    } else {
      toast.current.show({severity: "error", summary: err, detail: "Lỗi"})
    }
  }
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  const create = useMutation(createTopic, {
    onSuccess: (topic) => {
      const data = topic?.doc[0]
      toast.current.show({severity: "success", summary: "Thêm mới chủ đề thành công", detail: "Thành công"})
      addHistory.mutate({
        newData: {
          screen: "Chủ đề",
          description: `Tạo chủ đề có thông tin : { id: ${data?.id}, name: ${data?.name}, keywords: ${JSON.stringify(
            data?.keywords,
          )}}`,
        },
        token,
      })
    },
    onError: (error) => handleError(error),
    onSettled: () => {
      closeDialog()
      return queryClient.invalidateQueries({
        predicate: (query) => {
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/topic`)
        },
      })
    },
  })
  const update = useMutation(updateTopic, {
    onSuccess: (updateData) => {
      toast.current.show({severity: "success", summary: "Cập nhật chủ đề thành công", detail: "Thành công"})
      addHistory.mutate({
        newData: {
          screen: "Chủ đề",

          description: `Cập nhật người dùng id: ${updateData?.doc[0]?.id} từ: {name: ${data?.name}, isActiveCrawl: ${
            data?.isActiveCrawl
          }, screenShot: ${data?.screenShot}, keywords: ${JSON.stringify(data?.keywords)}} sang: { name: ${
            updateData?.doc[0]?.name
          }, isActiveCrawl: ${updateData?.doc[0]?.isActiveCrawl}, screenShot: ${
            updateData?.doc[0]?.screenShot
          }, keywords: ${JSON.stringify(updateData?.doc[0]?.keywords)} }`,
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
          return query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/topic`)
        },
      })
    },
  })
  const defaultValues = {
    name: data?.name || "",
    searchKeywords: data?.searchKeywords?.join("|") || "",
    excludeKeywords: data?.excludeKeywords?.join("|") || "",
    // keywords: data?.keywords?.map((p) => p).join("\n") || "",
    // keywords: data?.keywords?.map((p) => ({
    //   keywords: p.keywords,
    //   notify: p.notify?.merge?.find((p) => p === userId)
    //     ? 'merger'
    //     : p?.notify?.priority?.find((p) => p === userId)
    //     ? 'priority'
    //     : 'none',
    //   defaultNotify: p.notify,
    // })) || [
    //   {
    //     keywords: '',
    //     notify: '',
    //     defaultNotify: {merge: [], notify: []},
    //   },
    // ],
    keywords: data?.keywords || [
      {
        keywords: "",
        // notify: "None",
      },
    ],
    intervalSearch: data?.intervalSearch || 43200000,
    screenShot: data?.screenShot || false,
    isActiveCrawl: data?.isActiveCrawl || true,

    // categories: data?.categories?.map(p => ({
    //   label: p,
    //   value: p
    // })) || [],
  }

  const {
    control,
    formState: {errors},
    handleSubmit,
    reset,
    setValue,
    getValues,
    register,
  } = useForm({defaultValues})
  const {fields, append, remove} = useFieldArray({
    control,
    name: "keywords",
    rules: {
      required: "Ít nhất 1 từ khóa",
    },
  })

  const onSubmit = (newData) => {
    let check = true
    newData.keywords = newData.keywords.map((e) => {
      e.keywords = e.keywords
        .replaceAll("( ", "(")
        .replaceAll(" (", "(")
        .replaceAll(" ( ", "(")
        .replaceAll(") ", ")")
        .replaceAll(" )", ")")
        .replaceAll(" ) ", ")")
        .replaceAll("& ", "&")
        .replaceAll(" &", "&")
        .replaceAll(" & ", "&")
        .replaceAll(", ", ",")
        .replaceAll(" ,", ",")
        .replaceAll(" , ", ",")
        .replaceAll("| ", "|")
        .replaceAll(" |", "|")
        .replaceAll(" | ", "|")
      return e
    })
    newData.keywords.forEach((e) => {
      try {
        const checkParse = parseBooleanQuery(
          e.keywords.replaceAll("&", " AND ").replaceAll(",", " AND ").replaceAll("|", " OR "),
        )
        if (!checkParse) {
          check = false
        }
      } catch (error) {
        console.log("Error when parseBooolean", error)
        check = false
      }
    })
    if (check === false) {
      toast.current.show({
        severity: "error",
        summary: "Lỗi danh sách bộ quy tắc từ khóa!",
        detail:
          "Vui lòng kiểm tra lại bộ danh sách quy tắc từ khóa, check lại lỗi cú pháp, thừa thiếu dấu ngoặc, thiếu dấu mở đóng ngoặc với các cặp...",
      })
    } else {
      newData.name = newData?.name?.trim() || ""
      newData.searchKeywords = newData.searchKeywords
        .split("|")
        .map((e) => e.trim())
        .filter((e) => e !== null && e !== "")
      newData.searchKeywords = [...new Set(newData.searchKeywords)]
      newData.excludeKeywords = newData.excludeKeywords
        .split("|")
        .map((e) => e.trim())
        .filter((e) => e !== null && e !== "")
      newData.excludeKeywords = [...new Set(newData.excludeKeywords)]
      // const formatData = newData.keywords.map((p) => {
      // p.defaultNotify.merge = p?.defaultNotify?.merge || [];
      // p.defaultNotify.priority = p?.defaultNotify?.priority || [];
      // if (p.notify === "merger") {
      //   if (!p.defaultNotify?.merge?.find((p) => p === userId)) {
      //     p.defaultNotify.merge.push(userId);
      //   }
      // } else {
      //   if (p.defaultNotify?.merge?.find((p) => p === userId)) {
      //     p.defaultNotify.merge = p.defaultNotify.merge.filter((p) => p !== userId);
      //   }
      // }
      // if (p.notify === "priority") {
      //   if (!p.defaultNotify?.priority?.find((p) => p === userId)) {
      //     p.defaultNotify.priority.push(userId);
      //   }
      // } else {
      //   if (p.defaultNotify?.priority?.find((p) => p === userId)) {
      //     p.defaultNotify.priority = p.defaultNotify.priority.filter((p) => p !==userId);
      //   }
      // }
      // return {
      //   keywords: p.keywords,
      //   notify: p.defaultNotify,
      // };
      // });
      // newData.keywords = formatData;
      if (btnText !== "Edit") {
        // newData = { ...newData, keywords: newData.keywords };
        create.mutate({newData, token})
      } else {
        // newData = { ...newData, keywords: newData.keywords };
        update.mutate({id: data.id, newData, token})
      }
      reset()
    }
  }
  const getFormErrorMessage = (name) => {
    return errors[name] && <small className="p-error">{errors[name].message}</small>
  }
  const getFormErrorMessageArrayFields = (index) => {
    return (
      errors["keywords"] &&
      errors["keywords"][index] &&
      errors["keywords"][index]?.keyword &&
      errors["keywords"][index]?.keyword?.message && (
        <small className="p-error">{errors["keywords"][index]?.keyword?.message}</small>
      )
    )
  }
  const getFormErrorMessageArrayFieldsRoot = () => {
    return (
      errors["keywords"] &&
      errors["keywords"]?.root &&
      errors["keywords"]?.root?.message && <small className="p-error">{errors["keywords"]?.root?.message}</small>
    )
  }
  //   const searchCategories = (event) => {
  //     //in a real application, make a request to a remote url with the query and return filtered results, for demo we filter at client side
  //     let query = event.query;
  //     let _filteredItems = [];

  //     for(let i = 0; i < types.length; i++) {
  //         let item = types[i];
  //         if (item.label.toLowerCase().indexOf(query.toLowerCase()) === 0) {
  //             _filteredItems.push(item);
  //         }
  //     }
  //     if(_filteredItems.length == 0) {

  //     }
  //     setFilterCategories(_filteredItems);
  // }
  // const enterNoExit = (e) => {
  //   if(e.charCode == 13 && filterCategories.length == 0 && e.target.value.trim()) {
  //     types.push({
  //       label: e.target.value,
  //       value: e.target.value
  //     })
  //     setValue("categories", [...getValues().categories, {
  //       label: e.target.value,
  //       value: e.target.value
  //     }])
  //     localStorage.setItem("categories", JSON.stringify([...JSON.parse(localStorage.getItem("categories")), {
  //       label: e.target.value,
  //       value: e.target.value
  //     }]))
  //     e.target.value = ""
  //   }
  // }
  return (
    <div>
      <form className="p-fluid">
        <div className="flex gap-6">
          <div className="field w-8">
            <span>
              <label htmlFor="name" className={classNames({"p-error": errors.name})}>
                <b>Tên chủ đề</b>
              </label>
              <Controller
                name="name"
                control={control}
                rules={{
                  validate: (e) => {
                    if (!!e?.trim()) return true
                    else return "Yêu cầu nhập tên chủ đề"
                  },
                }}
                render={({field, fieldState}) => (
                  <InputText
                    id={field.name}
                    {...field}
                    autoFocus
                    placeholder="Tên chủ đề"
                    className={classNames({"p-invalid": fieldState.invalid})}
                  />
                )}
              />
            </span>
            {getFormErrorMessage("name")}
          </div>
          <div className="field">
            <span>
              <label htmlFor="intervalSearch" className={classNames({"p-error": errors.intervalSearch})}>
                <b>Tần suất tìm kiếm</b>
              </label>
              <Controller
                name="intervalSearch"
                control={control}
                render={({field, fieldState}) => (
                  <Dropdown
                    id={field.name}
                    value={field.value}
                    optionLabel="name"
                    onChange={(e) => {
                      field.onChange(e.value)
                      // if (e.value == 'COMMENT') {
                      //   setTypeCampaign('comment')
                      // } else setTypeCampaign('rp')
                    }}
                    options={[
                      {name: "1 giờ", value: 3600000},
                      {name: "4 giờ", value: 14400000},
                      {name: "8 giờ", value: 28800000},
                      {name: "12 giờ", value: 43200000},
                      {name: "24 giờ", value: 86400000},
                    ]}
                  />
                )}
              />
            </span>
            {getFormErrorMessage("intervalSearch")}
          </div>
        </div>

        {/* <div className="field">
          <span>
            <label htmlFor="keywords" className={classNames({ "p-error": !!errors.links })}>
              Danh sách keywords
            </label>
            <Controller name="keywords" control={control} rules={{ required: "Links is required." }} render={({ field, fieldState }) => <InputTextarea id={field.name} {...field} rows={5} className={classNames({ "p-invalid": fieldState.invalid })} placeholder="Keyword cách nhau bởi dấu enter" />} />
          </span>
          {getFormErrorMessage("keywords")}
        </div> */}
        <div className="field">
          <span>
            <label htmlFor="searchKeywords">
              <b>Từ khóa sẽ được tìm kiếm (Mỗi từ khóa cách nhau bởi dấu | , không chứa kí tự đặc biệt)</b>
            </label>
            <Controller
              name="searchKeywords"
              control={control}
              render={({field, fieldState}) => (
                <>
                  <InputTextarea
                    id={field.name}
                    {...field}
                    autoResize
                    placeholder="Danh sách từ khóa dùng để tìm kiếm"
                  />
                </>
              )}
            />
          </span>
          {/* {getFormErrorMessage("searchKeywords")} */}
        </div>

        <div className="field gap-2 border-solid border-1 border-300 p-2  rounded-md">
          <label className="">
            <b>Danh sách bộ quy tắc từ khóa để lọc bài viết </b>
            <p></p>
          </label>
          {fields.map((item, index) => (
            <div key={index} className="flex flex-column">
              <div key={item.id} className="flex mb-2 gap-2 align-items-center">
                <Controller
                  rules={{
                    validate: (e) => {
                      if (!!e?.trim()) return true
                      else return "Yêu cầu nhập từ khóa"
                    },
                  }}
                  control={control}
                  render={({field, fieldState}) => (
                    <InputTextarea
                      {...field}
                      autoResize
                      tooltip="Cú pháp kết hợp từ khóa:&#013;&#010;a | b : logic hoặc&#013;&#010;a & b : logic và&#013;&#010;(a | b) & (c | d) : nhóm từ khóa"
                      placeholder="(từ khóa 1 | từ khóa 2) & (từ khóa 3 | (từ khóa 4 & từ khóa 5))"
                      className={classNames({"p-invalid": fieldState.invalid})}
                    />
                  )}
                  name={`keywords.${index}.keywords`}
                />
                {/* <Controller
                  render={({field}) => (
                    <MultiStateCheckbox
                      {...field}
                      options={options}
                      optionValue="value"
                      onChange={(e) => {
                        // const label = e.value === "merger" ? "Thông báo gộp" : e.value === "priority" ? "Thông báo ưu tiên" : "Không thông báo";
                        const label = e.value === "priority" ? "Thông báo ưu tiên" : "Không thông báo"
                        setLabel(label)
                        field.onChange(e.value)
                      }}
                    />
                  )}
                  name={`keywords.${index}.notify`}
                  control={control}
                /> */}
                {/* <label>
                  {getValues(`keywords.${index}.notify`) == 'merger'
                    ? 'Thông báo gộp'
                    : getValues(`keywords.${index}.notify`) == 'priority'
                    ? 'Thông báo ưu tiên'
                    : 'Không thông báo'}
                </label> */}
                {/* <label>
                  {getValues(`keywords.${index}.notify`) == "priority" ? "Thông báo ưu tiên" : "Không thông báo"}
                </label> */}

                <Button type="button" onClick={() => remove(index)} className="w-2 flex justify-content-center">
                  Xóa
                </Button>
              </div>
              {getFormErrorMessageArrayFields(index)}
            </div>
          ))}
          <div className="text-right mt-2">
            <Button
              type="button"
              onClick={() => append({keywords: "", notify: "None"})}
              className="inline-block w-auto"
            >
              Thêm từ khóa
            </Button>
          </div>
          {getFormErrorMessageArrayFieldsRoot()}
        </div>
        <div className="field ">
          <span>
            <label htmlFor="excludeKeywords">
              <b>Từ khóa để loại bỏ bài viết (Mỗi từ khóa cách nhau bởi dấu | )</b>
            </label>
            <Controller
              name="excludeKeywords"
              control={control}
              render={({field, fieldState}) => (
                <>
                  <InputTextarea
                    id={field.name}
                    {...field}
                    autoResize
                    placeholder="Danh sách từ khóa dùng để loại bỏ bài viết chứa từ khóa"
                  />
                </>
              )}
            />
          </span>
          {/* {getFormErrorMessage("searchKeywords")} */}
        </div>
        <div className="flex gap-4">
          <div className="field">
            <span className="align-items-center flex gap-1">
              <label htmlFor="screenShot" className="m-0">
                Chụp ảnh ngay khi phát hiện
              </label>
              <Controller
                name="screenShot"
                control={control}
                render={({field, fieldState}) => <InputSwitch checked={field.value} id={field.name} {...field} />}
              />
            </span>
            {getFormErrorMessage("screenShot")}
          </div>
          <div className="field">
            <span className="align-items-center flex gap-1">
              <label htmlFor="isActiveCrawl" className="m-0">
                Theo dõi
              </label>
              <Controller
                name="isActiveCrawl"
                control={control}
                render={({field, fieldState}) => <InputSwitch checked={field.value} id={field.name} {...field} />}
              />
            </span>
            {getFormErrorMessage("isActiveCrawl")}
          </div>
        </div>
        {/* <div className="field">
          <span>
            <label htmlFor="categories" className={classNames({ "p-error": !!errors.links })}>
              Phân loại
            </label>
            <Controller name="categories" control={control} rules={{ required: "Types is required." }} render={({ field, fieldState }) => <AutoComplete dropdown multiple field="value" value={field.value} onKeyPress={(e) => enterNoExit(e)} suggestions={filterCategories} completeMethod={searchCategories} onChange={(e) => field.onChange(e.value)} />} />
          </span>
          {getFormErrorMessage("categories")}
        </div> */}
        <div className="text-right">
          <Button
            disabled={create.isLoading || update.isLoading}
            type="button"
            onClick={handleSubmit(onSubmit)}
            label={btnText === "Edit" ? "Lưu lại" : "Thêm"}
            className="mt-2 inline-block w-auto"
          />
        </div>
      </form>
    </div>
  )
}

export default Form
