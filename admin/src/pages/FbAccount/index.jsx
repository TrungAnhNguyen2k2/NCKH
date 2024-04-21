import moment from "moment";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { getAllFbAccounts, removeFbAccount } from "../../service/fbAccountAPI";

import Form from "./Form";
import { createHistory } from "../../service/historyAPI";
import { useSelector } from "react-redux";
FbAccountManage.propTypes = {};

function FbAccountManage(props) {
  const [fbAccountDialog, setFbAccountDialog] = useState(false);
  const [selection, setSelection] = useState(null);
  const [deleteFbAccountDialog, setDeleteFbAccountDialog] = useState(false);
  const [fbAccount, setFbAccount] = useState({});
  const [edit, setEdit] = useState(false);
  const toast = useRef(null);
  const queryClient = useQueryClient();
  const token = useSelector((state) => state.user.token);
  const userId = useSelector((state) => state.user?.userData?.id || "");

  const statusOption = [
    { label: "Họat động", value: "LIVE" },
    { label: "Khóa", value: "DEAD" },
    { label: "Đợi", value: "WAITING" },
  ];
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 10,
    page: 0,
    sortOrder: -1,
    sortField: "createdAt",
    filters: {
      name: { value: null },
      email: { value: null },
      status: { value: null },
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
  const key = `${process.env.REACT_APP_API_URL}/fbAccount?page=${lazyParams.page + 1}&pageSize=${lazyParams.limit}${lazyParams.filters?.name && lazyParams.filters?.name?.value ? `&name=${lazyParams.filters?.name?.value}` : ""}${lazyParams.filters?.email && lazyParams.filters?.email?.value ? `&email=${lazyParams.filters?.email?.value}` : ""
    }${lazyParams.filters?.status && lazyParams.filters?.status?.value ? `&status=${lazyParams.filters?.status?.value}` : ""}${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"
    }${lazyParams.sortOrder == 1 ? "&desc=false" : lazyParams.sortOrder == -1 ? "&desc=true" : ""}`;
  const { isLoading, error, data } = useQuery(key, (query) => getAllFbAccounts(query, token), {});
  const remove = useMutation(removeFbAccount, {
    onSuccess: () => {
      toast.current.show({ severity: "success", summary: "Xóa tài khoản facebook thành công", detail: "Thành công" });
      addHistory.mutate({
        newData: {
          
          screen: "Tài khoản facebook",
          description: `Xóa tài khoản facebook có thông tin: { id: ${fbAccount?.id}, name: ${fbAccount?.name}, email: ${fbAccount?.email}, link: ${fbAccount?.link}, proxy: ${fbAccount?.proxy}, avatar: ${fbAccount?.avatar}, stats: ${fbAccount?.status} }`,
        },
        token,
      });
      setFbAccount({});
    },
    onError: (error) => handleError(error),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/fbAccount`),
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
    setEdit(false)
    setFbAccountDialog(true);
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
  const emailFilterTemplate = (values) => {
    return (
      <InputText
        value={values.value}
        onChange={(e) => {
          values.filterCallback(e.target.value);
        }}
        placeholder="Email"
      />
    );
  };
  const representativeFilterTemplate = (values) => {
    return <Dropdown value={values.value} options={statusOption} onChange={(e) => values.filterCallback(e.value)} optionLabel="label" placeholder="Any" className="p-column-filter" />;
  };
  const confirmDeleteFbAccount = (fbAccount) => {
    setFbAccount(fbAccount);
    setDeleteFbAccountDialog(true);
  };
  const hideDeleteFbAccountDialog = () => {
    setDeleteFbAccountDialog(false);
  };
  const deleteFbAccount = () => {
    remove.mutate({ id: fbAccount.id, token: token });
    setDeleteFbAccountDialog(false);
  };
  const deleteFbAccountDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeleteFbAccountDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deleteFbAccount} />
    </React.Fragment>
  );
  const openEditFbAccount = (rowData) => {
    setEdit(true);
    setFbAccountDialog(true);
    setFbAccount(rowData);
  };
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        {/* <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <Button className="p-button-rounded p-button-danger" title="Xóa" icon="pi pi-trash" onClick={() => confirmDeleteFbAccount(rowData)}></Button>
          </div>

          <div>
            <Link to="/bai-viet" title="Xem">
            <Button className="p-button-rounded p-button-primary" title="Xóa" icon="pi pi-eye" onClick={() => confirmDeleteFbAccount(rowData)}></Button>

            </Link>
          </div>
        </div> */}
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <i title="Xóa" className="pi pi-trash cursor-pointer" style={{ color: "red" }} onClick={() => confirmDeleteFbAccount(rowData)}></i>
          </div>
          <div>
            <i title="Cập nhật" className="pi pi-cog cursor-pointer" style={{ color: "blue" }} onClick={() => openEditFbAccount(rowData)}></i>
          </div>
          {/* <div>
            <Link to={`/bai-viet?topicId=${rowData.id}`} title="Xem">
              {" "}
              <i className="pi pi-eye cursor-pointer" style={{ color: "black" }}></i>
            </Link>
          </div> */}
          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteFbAccount(rowData)} /> */}
        </div>
      </React.Fragment>
    );
  };

  const formatDate = (value) => {
    return moment(value).format("hh:mm DD/MM/YYYY");
  };
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      handleError(e);
    },
  });
  useEffect(() => {
    if (data && data?.docs) addHistory.mutate({ newData: {  screen: "Tài khoản facebook", description: `Xem danh sách tài khoản facebook page ${data?.page} có ${data?.docs.length} bản ghi` }, token });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.page]);
  // const monthFilter = () => {
  //   setFilterDateType("month");
  //   setQueryDate(`createdAt_gte=${moment().startOf('month').toISOString()}&createdAt_lte=${moment().endOf('day').toISOString()}`)
  // };

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
              <h5 className="mb-0">Tài khoản facebook</h5>
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
              emptyMessage="No fbAccounts found."
              paginatorPosition="both"
            >
              <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
              <Column header="Hành động" alignHeader="center" body={actionBodyTemplate} exportable={false} style={{ minWidth: "11rem" }}></Column>
              <Column field="id" header="ID" sortable style={{ display: "none" }} />
              <Column field="fbId" header="ID facebook" sortable />
              <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} field="STT" header="STT" />
              <Column field="avatar" header="Ảnh đại diện" style={{ minWidth: "10rem" }} body={(data, props) => <div><img src={data.avatar} width="150" height="150" /></div>} />
              <Column field="name" header="Username" style={{ minWidth: "12rem" }} sortable filter filterField="name" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={nameFilterTemplate} />
              <Column field="email" header="Email" style={{ minWidth: "10rem" }} sortable filter filterField="email" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={emailFilterTemplate} />
              <Column field="password" header="Mật khẩu" style={{ display: "none" }} sortable />
              <Column field="link" header="Đường dẫn" style={{ minWidth: "10rem" }} sortable />
              <Column
                field="status"
                header="Trạng thái"
                body={(data, props) => <div className="text-center">{data.status == "LIVE" ? "Hoạt động" : "Khóa" }</div>}
                style={{ minWidth: "10rem" }}
                sortable
                filterField="status"
                showFilterMatchModes={false}
                showFilterMenuOptions={false}
                filterMenuStyle={{ width: "16rem" }}
                filter
                filterElement={representativeFilterTemplate}
              />
              <Column field="proxy" header="Proxy" style={{ minWidth: "10rem" }} sortable />
              {/* <Column field="location" header="Location" style={{ minWidth: "10rem" }} sortable /> */}
              {/* <Column field="otp" header="OTP" style={{ minWidth: "10rem" }} sortable /> */}
              {/* <Column field="device" header="Device" style={{ minWidth: "10rem" }} sortable /> */}
              <Column field="otp" header="OTP" style={{ minWidth: "10rem" }} sortable />
              {/* <Column field="token" header="token" style={{ minWidth: "10rem" }} sortable /> */}
              {/* <Column field="groupids" body={(data) => data?.groupids?.join(", ")} header="Groups" style={{ minWidth: "10rem" }} sortable /> */}
              {/* <Column field="targetids" body={(data) => data?.targetids?.join(", ")} header="Targets" style={{ minWidth: "10rem" }} sortable /> */}
              {/* <Column field="meta" header="Meta" style={{ minWidth: "10rem" }} sortable /> */}
              <Column field="errortType" header="Lỗi" style={{ minWidth: "10rem" }} sortable />
              <Column field="firstRunAt" body={(data) => formatDate(data.firstrunat || new Date())} header="Lần chạy đầu" style={{ minWidth: "10rem" }} sortable />
              <Column field="lastRunAt" body={(data) => formatDate(data.lastrunat || new Date())} header="Lần chạy cuối" style={{ minWidth: "10rem" }} sortable />
              {/* <Column field="createdat" body={(data) => formatDate(data.createdat || new Date())} header="Created at" style={{ minWidth: "10rem" }} sortable /> */}
              {/* <Column field="cookies" header="Cookies" style={{ minWidth: "10rem" }} sortable /> */}
            </DataTable>
          </div>
        </div>
      </div>
      <Dialog
        visible={fbAccountDialog}
        dismissableMask
        style={{ width: "800px" }}
        header={`${edit ? "Cập nhật tài khoản facebook" : "Thêm tài khoản facebook"}`}
        modal
        className="p-fluid"
        onHide={() => {
          setFbAccountDialog(false);
          setFbAccount({});
          setEdit(false);
        }}
      >
        <Form
          btnText={edit ? "Edit" : "Add"}
          data={fbAccount}
          toast={toast}
          closeDialog={() => {
            setFbAccountDialog(false);
            setFbAccount({});
          }}
        />
      </Dialog>
      <Dialog visible={deleteFbAccountDialog} dismissableMask style={{ width: "450px" }} header="Xác nhận" modal footer={deleteFbAccountDialogFooter} onHide={hideDeleteFbAccountDialog}>
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {fbAccount && (
            <span>
              Bạn có chắc muốn xóa <b>{fbAccount.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}

export default FbAccountManage;
