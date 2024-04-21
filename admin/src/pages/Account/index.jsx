import moment from "moment";
import { AutoComplete } from "primereact/autocomplete";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { Link } from "react-router-dom";
import { getAllAuthors } from "../../service/authorAPI";
import { createHistory } from "../../service/historyAPI";
import { getAllTags } from "../../service/tagAPI";
import { useDispatch, useSelector } from 'react-redux'
import Form from "./Form";
import invalidImage from "../../assets/images/invalid.jpg";
import { selectPage, setPageAuthor } from "../../store/pageStore";

Account.propTypes = {};

function Account(props) {
  const dispatch = useDispatch()
  const page = useSelector(state => state.page)
  console.log(page)
  const [lazyParams, setLazyParams] = useState({
    first: page?.pageAuthor * 10,
    limit: 10,
    page: page?.pageAuthor,
    sortOrder: -1,
    sortField: "createdAt",
    filters: {
      name: { value: null },
      tagIds: { value: [] },
      profileIds: { value: [] },
    },
  });
  const toast = useRef(null);

  const [selection, setSelection] = useState(null);
  const [author, setAuthor] = useState(null);
  const [authorDialog, setAuthorDialog] = useState(null);
  const [keywordsTag, setKeywordsTag] = useState("");
  const [keywordsProfile, setKeywordsProfile] = useState("");

  const token = useSelector((state) => state.user.token);
  const userId = useSelector((state) => state.user?.userData?.id || "");
  const [filterTags, setFilterTags] = useState([]);
  const [filterProfiles, setFilterProfiles] = useState([]);
  const keyTags = `${process.env.REACT_APP_API_URL}/tag?page=1&pageSize=12&name=${keywordsTag}`;
  const tags = useQuery(keyTags, (query) => getAllTags(query, token), {
    onSuccess: (data) => {
      setFilterTags([
        ...data?.docs.map((p) => ({
          value: p.id,
          label: p.name,
        })),
      ]);
    },
  });
  const keyProfiles = `${process.env.REACT_APP_API_URL}/profile?page=1&pageSize=12&name=${keywordsProfile}`;
  const profiles = useQuery(keyProfiles, (query) => getAllTags(query, token), {
    onSuccess: (data) => {
      setFilterProfiles([
        ...data?.docs.map((p) => ({
          value: p.id,
          label: p.name,
        })),
      ]);
    },
  });
  const key = `${process.env.REACT_APP_API_URL}/author?page=${page?.pageAuthor + 1}&pageSize=${lazyParams.limit}${lazyParams.filters?.name && lazyParams.filters?.name?.value ? `&name=${lazyParams.filters?.name?.value}` : ""}${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"
    }${lazyParams.sortOrder == 1 ? "&desc=false" : lazyParams.sortOrder == -1 ? "&desc=true" : ""}${lazyParams.filters && lazyParams.filters.tagIds && lazyParams.filters.tagIds.value && lazyParams.filters.tagIds.value.length ? `&tagIds=${lazyParams.filters.tagIds.value.map((p) => p.value).join(",")}` : ""
    }${lazyParams.filters && lazyParams.filters.profileIds && lazyParams.filters.profileIds.value && lazyParams.filters.profileIds.value.length ? `&profileIds=${lazyParams.filters.profileIds.value.map((p) => p.value).join(",")}` : ""}`;
  const { isLoading, error, data } = useQuery(key, (query) => getAllAuthors({ query, token }), {});
  const onPage = (event) => {
    dispatch(setPageAuthor(event.page))
    console.log(event)
    setLazyParams({ ...lazyParams, page: event.page, limit: 10, first: event.first, filters: event.filters });
  };
  const onSort = (event) => {
    console.log(event);
    setLazyParams({ ...lazyParams, ...event });
  };

  const onFilter = (event) => {
    event["page"] = 0;
    setLazyParams({ ...lazyParams, page: event.page, limit: 10, first: event.first, filters: event.filters });
  };
  const nameTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <a href={rowData?.link} target="_blank" className="flex align-items-center gap-2 inline-block" title={rowData?.link}>
          <img
            className="border-circle w-2rem h-2rem"
            src={rowData.avatar}
            alt=""
            onError={({ currentTarget }) => {
              currentTarget.onerror = null; // prevents looping
              currentTarget.src = `${invalidImage}`;
            }}
          />
          <span>{rowData.name}</span>
        </a>
      </div>
    );
  };
  const formatDate = (value) => {
    return moment(value).format("DD/MM/YYYY");
  };
  const dateBodyTemplate = (rowData) => {
    return formatDate(rowData?.createdAt);
  };
  const openEditAuthor = (rowData) => {
    setAuthorDialog(true);
    setAuthor(rowData);
  };
  const hideDialog = () => {
    setAuthorDialog(false);
    setAuthor({});
  };
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <div className="text-center flex justify-content-center gap-2" style={{ color: "red" }}>
          <div>
            <Link to={`/nguoi-dang/${rowData.id}`} title="Xem">
              <i className="pi pi-eye cursor-pointer" style={{ color: "black" }}></i>
            </Link>
          </div>
          <i title="Cập nhật" className="pi pi-cog cursor-pointer" style={{ color: "blue" }} onClick={() => openEditAuthor(rowData)}></i>

          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteCampaign(rowData)} /> */}
        </div>
      </React.Fragment>
    );
  };
  const nameFilterTemplate = (values) => {
    return (
      <InputText
        value={values.value}
        onChange={(e) => {
          values.filterCallback(e.target.value);
        }}
        placeholder="Name"
      />
    );
  };
  const searchTags = (event) => {
    let timeout;
    let query = event.query;

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => {
      setKeywordsTag(query);
    }, 300);
  };
  const selectTag = (e, values) => {
    values.value = values.value || [];
    const findTag = values.value.find((p) => p.value == e.value.value);
    if (!findTag) {
      values.filterCallback([...values.value, e.value]);
    }
  };
  const unSelectTag = (e, values) => {
    values.value = values.value || [];
    const newArrayTags = values.value.filter((p) => p.value != e.value.value);
    values.filterCallback([...newArrayTags]);
  };
  const tagIdsFilterTemplate = (values) => {
    return <AutoComplete className="w-full flex" dropdown multiple field="label" suggestions={filterTags} onDropdownClick={() => setFilterTags([...filterTags])} completeMethod={searchTags} value={values.value} onSelect={(e) => selectTag(e, values)} onUnselect={(e) => unSelectTag(e, values)} />;
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
  const selectProfile = (e, values) => {
    values.value = values.value || [];
    const findProfile = values.value.find((p) => p.value == e.value.value);
    if (!findProfile) {
      values.filterCallback([...values.value, e.value]);
    }
  };
  const unSelectProfile = (e, values) => {
    values.value = values.value || [];

    const newArrayProfiles = values.value.filter((p) => p.value != e.value.value);
    values.filterCallback([...newArrayProfiles]);
  };
  const profileIdsFilterTemplate = (values) => {
    return (
      <AutoComplete
        className="w-full flex"
        dropdown
        multiple
        field="label"
        suggestions={filterProfiles}
        onDropdownClick={() => setFilterProfiles([...filterProfiles])}
        completeMethod={searchProfiles}
        value={values.value}
        onSelect={(e) => selectProfile(e, values)}
        onUnselect={(e) => unSelectProfile(e, values)}
      />
    );
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
  useEffect(() => {
    if (data && data?.docs) {
      addHistory.mutate({ newData: { screen: "Hồ sơ đối tượng", description: `Xem danh sách người đăng page ${data?.page} có ${data?.docs.length} bản ghi` }, token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.page]);
  return (
    <div className="grid">
      <Toast ref={toast} />

      <div className="col-12">
        <div className="col-12">
          <div className="card">
            <div
              className="flex flex-column xl:flex-row align-items-center justify-content-between py-2"
              style={{rowGap: '20px'}}
            >
              <h5 className="mb-0">Hồ sơ đối tượng</h5>
            </div>
            <DataTable
              value={data?.docs}
              lazy
              selectionMode="checkbox"
              selection={selection}
              selectionAutoFocus={false}
              onSelectionChange={(e) => setSelection(e.value)}
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
              <Column selectionMode="multiple" headerStyle={{width: '3em'}} />
              <Column field="id" header="ID" sortable style={{display: 'none'}} />
              <Column
                header="Hành động"
                alignHeader="center"
                body={actionBodyTemplate}
                exportable={false}
                style={{minWidth: '8rem'}}
              ></Column>
              <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} header="STT" />
              <Column
                field="name"
                body={nameTemplate}
                header="Tên người đăng"
                filter
                filterField="name"
                showFilterMatchModes={false}
                showFilterMenuOptions={false}
                filterElement={nameFilterTemplate}
              />
              <Column field="latestContentId" header="Bài đăng" />
              {/* <Column field="link" header="Liên kết" sortable/> */}
              <Column
                body={dateBodyTemplate}
                field="createdAt"
                header="Ngày đăng"
                style={{minWidth: '12rem'}}
                sortable
              />
              <Column
                field="detailInfo"
                header="Thông tin đối tượng"
                style={{minWidth: '18rem'}}
                body={(rowData) => (
                  <div>
                    <p>IP: {rowData?.detailInfo?.ip ? rowData?.detailInfo?.ip : 'Chưa thu thập được'}</p>
                    <p>
                      Thiết bị: {rowData?.detailInfo?.device ? rowData?.detailInfo?.device : 'Chưa thu thập được'}
                    </p>
                    <p>
                      User-agent:{' '}
                      {rowData?.detailInfo?.['user-agent']
                        ? rowData?.detailInfo?.['user-agent']
                        : 'Chưa thu thập được'}
                    </p>
                    <p>Webrtc: {rowData?.detailInfo?.webrtc ? rowData?.detailInfo?.webrtc : 'Chưa thu thập được'}</p>
                    <p>
                      Thời gian truy cập:
                      {rowData?.detailInfo?.accessTime ? rowData?.detailInfo?.accessTime : 'Chưa thu thập được'}
                    </p>
                  </div>
                )}
              />
              <Column
                field="totalContent"
                header="Số bài viết"
                body={(rowData) => <div>{Number(rowData.totalContent || 0).toLocaleString('vi')}</div>}
                sortable
              />
              <Column
                field="tagsInfo"
                header="Danh sách tag"
                body={(rowData) => (
                  <div>
                    {rowData?.tagsInfo && rowData?.tagsInfo?.length
                      ? rowData?.tagsInfo?.map((p) => p.name).join(', ')
                      : ''}
                  </div>
                )}
                filter
                filterField="tagIds"
                showFilterMatchModes={false}
                showFilterMenuOptions={false}
                filterElement={tagIdsFilterTemplate}
              />
              <Column
                field="profilesInfo"
                header="Danh sách hồ sơ"
                body={(rowData) => (
                  <div>
                    {rowData?.profilesInfo && rowData?.profilesInfo?.length
                      ? rowData?.profilesInfo?.map((p) => p.name).join(', ')
                      : ''}
                  </div>
                )}
                filter
                filterField="profileIds"
                showFilterMatchModes={false}
                showFilterMenuOptions={false}
                filterElement={profileIdsFilterTemplate}
              />
            </DataTable>
          </div>
        </div>
      </div>
      <Dialog
        visible={authorDialog}
        dismissableMask
        style={{width: '800px'}}
        header="Cập nhật người đăng"
        modal
        className="p-fluid"
        onHide={hideDialog}
      >
        <Form
          data={author}
          toast={toast}
          closeDialog={() => {
            setAuthorDialog(false)
            console.log('close')
          }}
        />
      </Dialog>
      {/* <Dialog
        visible={postDialog}
        dismissableMask
        style={{ width: "800px" }}
        header={`${edit ? "Sửa chủ đề" : "Thêm chủ đề"}`}
        modal
        className="p-fluid"
        onHide={() => {
          setPostDialog(false);
          setPost({})
        }}
      >
        <Form btnText={edit ? "Edit" : "Add"} data={post} toast={toast} closeDialog={() => setPostDialog(false)}/>
      </Dialog> */}
    </div>
  )
}

export default Account;
