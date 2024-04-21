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
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { createHistory } from "../../service/historyAPI";
import { getAllUsers, removeUser } from "../../service/userAPI";
import { setPageUser } from "../../store/pageStore";

import Form from "./Form";
UserManage.propTypes = {};

function UserManage(props) {
  const dispatch = useDispatch()
  const [userDialog, setUserDialog] = useState(false);
  const [selection, setSelection] = useState(null);
  const [deleteUserDialog, setDeleteUserDialog] = useState(false);
  const [user, setUser] = useState({});
  const [edit, setEdit] = useState(false);
  const toast = useRef(null);
  const queryClient = useQueryClient();

  const token = useSelector(state => state.user.token)
  const userData = useSelector(state => state.user.userData)
  const pageUser = useSelector(state => state.page.pageUser)

  // const { setPageUser, pageState } = store()

  const [lazyParams, setLazyParams] = useState({
    first: pageUser * 10,
    limit: 10,
    page: pageUser,
    sortOrder: -1,
    sortField: "createdAt",
    filters: {
      email: { value: null },
      name: { value: null }
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
  const key = `${process.env.REACT_APP_API_URL}/user?page=${pageUser + 1}&pageSize=${lazyParams.limit}${lazyParams.filters?.name && lazyParams.filters?.name?.value ? `&name=${lazyParams.filters?.name?.value}` : ''}${lazyParams.filters?.email && lazyParams.filters?.email?.value ? `&email=${lazyParams.filters?.email?.value}` : ''}${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"
    }${lazyParams.sortOrder == 1 ? "&desc=false" : lazyParams.sortOrder == -1 ? "&desc=true" : ""}`;
  const { isLoading, error, data } = useQuery(key, (query) => getAllUsers(query, token), {});

  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  });
  useEffect(() => {
    if (data && data?.docs) addHistory.mutate({ newData: {  screen: "Người dùng", description: `Xem danh sách người dùng ${data?.page} có ${data?.docs.length} bản ghi` }, token });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.page])
  const remove = useMutation(removeUser, {
    onSuccess: () => {
      toast.current.show({ severity: "success", summary: "Xóa tài khoản thành công", detail: "Thành công" })
      addHistory.mutate({ newData: {  screen: "Người dùng", description: `Xóa người dùng có thông tin: { id: ${user?.id}, name: ${user?.name}, email: ${user?.name}, telephone: ${user?.telephone} ` }, token });
      setUser({});

    },
    onError: (error) => handleError(error),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/user`),
      }),
  });
  const onPage = (event) => {
    dispatch(setPageUser(event.page))
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
    setUserDialog(true);
  };
  const nameFilterTemplate = (values) => {
    return <InputText value={values.value} onChange={(e) => {
      values.filterCallback(e.target.value)
    }} placeholder="Name" />;
  };
  const emailFilterTemplate = (values) => {
    return <InputText value={values.value} onChange={(e) => {
      values.filterCallback(e.target.value)
    }} placeholder="Email" />;
  };
  const confirmDeleteUser = (user) => {
    setUser(user);
    setDeleteUserDialog(true);
  };
  const hideDeleteUserDialog = () => {
    setDeleteUserDialog(false);
  };
  const deleteUser = () => {
    remove.mutate({ id: user.id, token: token });
    setDeleteUserDialog(false);
  };
  const deleteUserDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeleteUserDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deleteUser} />
    </React.Fragment>
  );
  const openEditUser = (rowData) => {
    setEdit(true);
    setUserDialog(true);
    setUser(rowData);
  };
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        {/* <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <Button className="p-button-rounded p-button-danger" title="Xóa" icon="pi pi-trash" onClick={() => confirmDeleteUser(rowData)}></Button>
          </div>

          <div>
            <Link to="/bai-viet" title="Xem">
            <Button className="p-button-rounded p-button-primary" title="Xóa" icon="pi pi-eye" onClick={() => confirmDeleteUser(rowData)}></Button>

            </Link>
          </div>
        </div> */}
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <i title="Xóa" className="pi pi-trash cursor-pointer" style={{ color: "red" }} onClick={() => confirmDeleteUser(rowData)}></i>
          </div>
          <div>
            <i title="Cập nhật" className="pi pi-cog cursor-pointer" style={{ color: "blue" }} onClick={() => openEditUser(rowData)}></i>
          </div>
          <div>
            <Link to={`/nguoi-dung/${rowData.id}`} title="Xem">
              {" "}
              <i className="pi pi-eye cursor-pointer" style={{ color: "black" }}></i>
            </Link>
          </div>
          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteUser(rowData)} /> */}
        </div>
      </React.Fragment>
    );
  };

  // const monthFilter = () => {
  //   setFilterDateType("month");
  //   setQueryDate(`createdAt_gte=${moment().startOf('month').toISOString()}&createdAt_lte=${moment().endOf('day').toISOString()}`)
  // };

  return (
    <div className="grid">
      <Toast ref={toast} />
      <div className="col-12">
        <div className="col-12">
          {/* ${userData?.roles?.find(p => p == "SUPER_ADMIN") ? "" : "hidden"} */}
          <Button className={`px-8 ${userData?.roles?.find(p => p == "SUPER_ADMIN") ? "" : "hidden"}`} onClick={openNew}>
            Thêm
          </Button>
        </div>
        <div className="col-12">
          <div className="card">
            <div className="flex flex-column xl:flex-row align-items-center justify-content-between py-2" style={{ rowGap: "20px" }}>
              <h5 className="mb-0">Người dùng</h5>

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
              emptyMessage="No users found."
              paginatorPosition="both"
            >
              <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
              <Column header="Hành động" alignHeader="center" body={actionBodyTemplate} exportable={false} style={{ minWidth: "11rem", display: `${userData?.roles?.find(p => p == "SUPER_ADMIN") ? "" : "none"}` }}></Column>
              <Column field="id" header="ID" sortable style={{ display: "none" }} />
              <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} field="STT" header="STT" />
              <Column field="name" header="Username" style={{ minWidth: "12rem" }} sortable filter filterField="name" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={nameFilterTemplate} />
              <Column field="email" header="Email" style={{ minWidth: "10rem" }} sortable filter filterField="email" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={emailFilterTemplate} />

              {/* <Column field="password" header="Mật khẩu" style={{ minWidth: "10rem" }} sortable /> */}
              <Column field="telephone" header="Số điện thoại" style={{ minWidth: "10rem" }} sortable />

              <Column field="roles" header="Vai trò" body={(data, props) => <div className="text-center">{data.roles.join(",")}</div>} style={{ minWidth: "10rem" }} sortable />
              <Column field="workTime" header="Ca trực" style={{ minWidth: "10rem" }} sortable />
              <Column field="gender" header="Giới tính" style={{ minWidth: "10rem" }} sortable />
              <Column field="lock" header="Trạng thái" body={(data, props) => <div className="text-center">{data.lock ? "Khóa" : "Hoạt động"}</div>} style={{ minWidth: "10rem" }} sortable />

            </DataTable>
          </div>
        </div>
      </div>
      <Dialog
        visible={userDialog}
        dismissableMask
        style={{ width: "800px" }}
        header={`${edit ? "Cập nhật tài khoản" : "Thêm tài khoản"}`}
        modal
        className="p-fluid"
        onHide={() => {
          setUserDialog(false);
          setUser({});
          setEdit(false)
        }}
      >

        <Form btnText={edit ? "Edit" : "Add"} data={user} toast={toast} closeDialog={() => {
          setUserDialog(false)
          setUser({})
        }} />
      </Dialog>
      <Dialog visible={deleteUserDialog} dismissableMask style={{ width: "450px" }} header="Xác nhận" modal footer={deleteUserDialogFooter} onHide={hideDeleteUserDialog}>
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {user && (
            <span>
              Bạn có chắc muốn xóa <b>{user.nameTopic}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}

export default UserManage;
