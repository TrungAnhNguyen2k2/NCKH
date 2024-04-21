import moment from "moment";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { createHistory } from "../../service/historyAPI";
import { getAllProfiles, removeProfile } from "../../service/profileAPI";

import Form from "./Form";
ProfileManage.propTypes = {};

function ProfileManage(props) {
  const [profileDialog, setProfileDialog] = useState(false);
  const [selection, setSelection] = useState(null);
  const [deleteProfileDialog, setDeleteProfileDialog] = useState(false);
  const [profile, setProfile] = useState({});
  const [edit, setEdit] = useState(false);
  const toast = useRef(null);
  const queryClient = useQueryClient();
  const token = useSelector((state) => state.user.token);
  const userId = useSelector((state) => state.user?.userData?.id || "");

  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 10,
    page: 0,
    sortOrder: -1,
    sortField: "createdAt",
    filters: {
      name: { value: null },
    },
  });
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
  const key = `${process.env.REACT_APP_API_URL}/profile?page=${lazyParams.page + 1}&pageSize=${lazyParams.limit}${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"
    }${lazyParams.sortOrder == 1 ? "&desc=false" : lazyParams.sortOrder == -1 ? "&desc=true" : ""}`;
  const { isLoading, error, data } = useQuery(key, (query) => getAllProfiles(query, token), {});
  const remove = useMutation(removeProfile, {
    onSuccess: () => {
      toast.current.show({ severity: "success", summary: "Xóa tài khoản thành công", detail: "Thành công" });
      addHistory.mutate({
        newData: {
          userId,
          screen: "Profile",
          description: `Xóa hồ sơ có : { id: ${profile?.id}, name: ${profile?.name}, description: ${profile?.description}, totalContent: ${profile?.contentIds?.length || 0}, totalSource: ${profile?.sourceIds?.length || 0}, totalTags: ${profile?.tagids?.length || 0}}`,
        },
        token,
      });
      setProfile({});
    },
    onError: (error) => handleError(error),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/profile`),
      }),
  });
  const onPage = (event) => {
    setLazyParams({ ...lazyParams, page: event.page, limit: 10, first: event.first });
  };
  const onSort = (event) => {
    setLazyParams({ ...lazyParams, ...event });
  };

  const onFilter = (event) => {
    event["page"] = 0;
    setLazyParams({ ...lazyParams, page: event.page, limit: 10, first: event.first, filters: event.filters });
  };
  const openNew = () => {
    setProfileDialog(true);
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
  const confirmDeleteProfile = (profile) => {
    setProfile(profile);
    setDeleteProfileDialog(true);
  };
  const hideDeleteProfileDialog = () => {
    setDeleteProfileDialog(false);
  };
  const deleteProfile = () => {
    remove.mutate({ id: profile.id, token: token });
    setDeleteProfileDialog(false);
  };
  const deleteProfileDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeleteProfileDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deleteProfile} />
    </React.Fragment>
  );
  const openEditProfile = (rowData) => {
    setEdit(true);
    setProfileDialog(true);
    setProfile(rowData);
  };
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <i title="Xóa" className="pi pi-trash cursor-pointer" style={{ color: "red" }} onClick={() => confirmDeleteProfile(rowData)}></i>
          </div>

          <div>
            <Link to={`/ho-so/${rowData.id}`} title="Xem">
              {" "}
              <i className="pi pi-eye cursor-pointer" style={{ color: "black" }}></i>
            </Link>
          </div>
          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeletePost(rowData)} /> */}
        </div>
      </React.Fragment>
    );
  };

  // const monthFilter = () => {
  //   setFilterDateType("month");
  //   setQueryDate(`createdAt_gte=${moment().startOf('month').toISOString()}&createdAt_lte=${moment().endOf('day').toISOString()}`)
  // };
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e);
    },
  });
  useEffect(() => {
    if (data && data?.docs) addHistory.mutate({ newData: {  screen: "Hồ sơ vụ việc", description: `Xem danh sách hồ sơ page ${data?.page} có ${data?.docs.length} bản ghi` }, token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.page]);
  return (
    <div className="grid">
      <Toast ref={toast} />
      <div className="col-12">
        <div className="col-12">
          <Button className="px-8" onClick={openNew}>
            Thêm
          </Button>
        </div>
        <div className="col-12">
          <div className="card">
            <div className="flex flex-column xl:flex-row align-items-center justify-content-between py-2" style={{ rowGap: "20px" }}>
              <h5 className="mb-0">Hồ sơ vụ việc</h5>
            </div>
            <DataTable
              value={data?.docs}
              lazy
              selectionMode="checkbox"
              selection={selection}
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
              emptyMessage="Không tìm thấy dữ liệu."
              paginatorPosition="both"
            >
              <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
              <Column header="Hành động" alignHeader="center" body={actionBodyTemplate} exportable={false} style={{ minWidth: "11rem" }}></Column>
              <Column field="id" header="ID" sortable style={{ display: "none" }} />
              <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} field="STT" header="STT" />
              <Column field="name" header="Tên hồ sơ" style={{ minWidth: "12rem" }} sortable filter filterField="name" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={nameFilterTemplate} />
              <Column field="description" header="Mô tả" style={{ minWidth: "10rem" }} sortable />
              <Column field="sourceIds" body={(rowData) => <span>{rowData.sourceIds?.length || 0}</span>} header="Số lượng nguồn" style={{ minWidth: "10rem" }} sortable />
              <Column field="authorIds" header="Số lượng người đăng" body={(rowData) => <span>{rowData.authorIds?.length || 0}</span>} style={{ minWidth: "10rem" }} sortable />
              <Column field="contentIds" header="Số lượng bài viết" body={(rowData) => <span>{rowData.contentIds?.length || 0}</span>} style={{ minWidth: "10rem" }} sortable />
              <Column field="createdAt" header="Ngày tạo" body={(data, props) => <div className="text-center">{moment(data.createdAt).format("DD/MM/YYYY")}</div>} style={{ minWidth: "10rem" }} sortable />
            </DataTable>
          </div>
        </div>
      </div>
      <Dialog
        visible={profileDialog}
        dismissableMask
        style={{ width: "800px" }}
        header={`${edit ? "Cập nhật tài khoản facebook" : "Thêm tài khoản facebook"}`}
        modal
        className="p-fluid"
        onHide={() => {
          setProfileDialog(false);
          setProfile({});
          setEdit(false);
        }}
      >
        <Form
          btnText={edit ? "Edit" : "Add"}
          data={profile}
          toast={toast}
          closeDialog={() => {
            setProfileDialog(false);
            setProfile({});
          }}
        />
      </Dialog>
      <Dialog visible={deleteProfileDialog} dismissableMask style={{ width: "450px" }} header="Xác nhận" modal footer={deleteProfileDialogFooter} onHide={hideDeleteProfileDialog}>
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {profile && (
            <span>
              Bạn có chắc muốn xóa <b>{profile.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}

export default ProfileManage;
