import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link, useParams } from "react-router-dom";
import { getAuthorById } from "../../service/authorAPI.js";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import moment from "moment";
import { getAllPosts } from "../../service/postAPI.js";
import { Button } from "primereact/button";

import { getUserById } from "../../service/userAPI.js";

import { createHistory, getAllHistory, removeHistory } from "../../service/historyAPI.js";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { useSelector } from "react-redux";
export default function Detail() {
  const { id } = useParams();
  const [deleteHistoryDialog, setDeleteHistoryDialog] = useState(false);
  const [historyInfo, setHistory] = useState({});
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 10,
    page: 0,
    sortOrder: -1,
    sortField: "createdAt",
    filters: {
      screen: { value: null },
      createdAt: { value: null }
    },
  });
  const token = useSelector((state) => state.user.token);
  const userId = useSelector((state) => state.user?.userData?.id || "");
  const queryClient = useQueryClient();
  const toast = useRef(null);
  const keyUser = `${process.env.REACT_APP_API_URL}/user/${id}`;
  const keyHistoryOfUser = `${process.env.REACT_APP_API_URL}/history?userId=${id}&page=${lazyParams.page + 1}&pageSize=${lazyParams.limit}${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"}${lazyParams.sortOrder == 1 ? "&desc=false" : lazyParams.sortOrder == -1 ? "&desc=true" : ""
    }${lazyParams.filters && lazyParams?.filters?.screen && lazyParams.filters?.screen?.value ? `&screen=${lazyParams.filters.screen.value}` : ""}${lazyParams.filters && lazyParams?.filters?.createdAt && lazyParams.filters?.createdAt?.value ? `&fromDate=${moment(lazyParams?.filters?.createdAt?.value[0]).startOf("day").toISOString()}&toDate=${moment((lazyParams?.filters?.createdAt?.value[1] && lazyParams?.filters?.createdAt?.value[1]) || new Date()).endOf("day").toISOString()}` : ""}`;
  const options = [
    {label: 'Dashboard', value: 'Dashboard'},
    {label: 'Chủ đề', value: 'Chủ đề'},
    {label: 'Bài viết', value: 'Bài viết'},
    {label: 'Nguồn dữ liệu', value: 'Nguồn dữ liệu'},
    {label: 'Chiến dịch facebook', value: 'Chiến dịch facebook'},
    {label: 'Hồ sơ đối tượng', value: 'Hồ sơ đối tượng'},
    {label: 'Bài viết cần xử lý', value: 'Bài viết cần xử lý'},
    {label: 'Người dùng', value: 'Người dùng'},
    {label: 'Tag', value: 'Tag'},
    {label: 'Tài khoản facebook', value: 'Tài khoản facebook'},
    {label: 'Hồ sơ vụ việc', value: 'Hồ sơ vụ việc'},
    {label: 'Export', value: 'Export'},
    {label: 'Setting', value: 'Setting'},
    {label: 'Chi tiết người đăng', value: 'Chi tiết người đăng'},
    {label: 'Chi tiết hồ sơ', value: 'Chi tiết hồ sơ'},
    {label: 'Chi tiết người dùng', value: 'Chi tiết người dùng'},
    {label: 'Content wordpress', value: 'Content wordpress'},
  ]
  const userById = useQuery(keyUser, (query) => getUserById({ query, token }), {
    enabled: !!id,
  });
  const history = useQuery(keyHistoryOfUser, (query) => getAllHistory({ query, token }), {
    enabled: !!userId,
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
  const timeTemplate = (rowData) => {
    return <div>{moment(rowData.createdAt).format("HH:mm DD/MM/YYYY")}</div>;
  };
  const confirmDeleteHistory = (history) => {
    setHistory(history);
    setDeleteHistoryDialog(true);
  };
  const hideDeleteHistoryDialog = () => {
    setDeleteHistoryDialog(false);
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
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/history`),
      }),
  });
  useEffect(() => {
    addHistory.mutate({ newData: {  screen: "Chi tiết người dùng", description: "Xem chi tiết người dùng" }, token });
  }, []);
  const remove = useMutation(removeHistory, {
    onSuccess: () => {
      console.log(historyInfo)
      toast.current.show({ severity: "success", summary: "Xóa lịch sử thành công", detail: "Thành công" });
      addHistory.mutate({ newData: {  screen: "Chi tiết người dùng", description: `Xóa lịch sử người dùng có : { id: ${historyInfo.id}, screen: ${historyInfo?.screen}, description: ${historyInfo?.description}}` }, token });
      setHistory({});
    },
    onError: (error) => handleError(error),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/history`),
      }),
  });
  const deleteHistory = () => {
    remove.mutate({ id: historyInfo.id, token: token });
    setDeleteHistoryDialog(false);
  };

  const deleteHistoryDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeleteHistoryDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deleteHistory} />
    </React.Fragment>
  );
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <i title="Xóa" className="pi pi-trash cursor-pointer" style={{ color: "red" }} onClick={() => confirmDeleteHistory(rowData)}></i>
          </div>
          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteHistory(rowData)} /> */}
        </div>
      </React.Fragment>
    );
  };
  const screenFilter = (values) => {
    return <Dropdown value={values.value} options={options} onChange={(e) => values.filterCallback(e.value)} optionLabel="label" placeholder="Any" className="p-column-filter" />;
  };
  const rangeFilter = (values) => {
    return <Calendar id="range" dateFormat="dd/mm/yy" value={values.value} onChange={(e) => values.filterCallback(e.value)} selectionMode="range" readOnlyInput showIcon />;
  };
  return (
    <div className="grid">
      <Toast ref={toast} />

      <div className="col-12">
        <div className="card">
          <Link to={`/nguoi-dung`} className="mb-4 inline-block">
            <Button icon="pi pi-arrow-left" />
          </Link>
          <DataTable value={[userById?.data?.doc || {}]} className="p-datatable-gridlines" dataKey="id" loading={userById?.isLoading} responsiveLayout="scroll" emptyMessage="No author found.">
            <Column field="name" header="Tên người dùng" style={{ minWidth: "12rem" }} />
            <Column field="email" header="Email" style={{ minWidth: "12rem" }} />
            <Column field="telephone" header="Số điện thoại" style={{ minWidth: "12rem" }} />
            <Column field="workTime" header="Ca trực" style={{ minWidth: "12rem" }} />
          </DataTable>
          <DataTable
            value={history?.data?.docs || []}
            lazy
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
            totalRecords={history?.data?.total}
            className="p-datatable-gridlines"
            rows={10}
            dataKey="id"
            loading={history?.isLoading}
            responsiveLayout="scroll"
            emptyMessage="Không tìm thấy dữ liệu"
            paginatorPosition="both"
          >
            <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} header="STT" />
            <Column field="id" header="ID" style={{ display: "none" }} />
            <Column field="screen" header="Màn hình" style={{ minWidth: "12rem" }} filter filterField="screen" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={screenFilter} />
            <Column field="description" header="Mô tả" style={{ minWidth: "12rem" }} />
            <Column field="createdAt" header="Thời gian xảy ra" body={timeTemplate} style={{ minWidth: "8rem" }} sortable filter filterField="createdAt" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={rangeFilter} />
            <Column header="Hành động" alignHeader="center" body={actionBodyTemplate} exportable={false} style={{ minWidth: "11rem" }}></Column>
          </DataTable>
        </div>
        <Dialog visible={deleteHistoryDialog} dismissableMask style={{ width: "450px" }} header="Xác nhận" modal footer={deleteHistoryDialogFooter} onHide={hideDeleteHistoryDialog}>
          <div className="confirmation-content">
            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
            {historyInfo && <span>Bạn có chắc muốn xóa ?</span>}
          </div>
        </Dialog>
      </div>
    </div>
  );
}
