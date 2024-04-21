import moment from "moment";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { useSelector } from "react-redux";
import { deleteCampaign, getAllCampaigns } from "../../service/campaignAPI";
import { createHistory } from "../../service/historyAPI";
import { getAllTopics } from "../../service/topicAPI";

import Form from "./Form";

CampaignFacebookManage.propTypes = {};

function CampaignFacebookManage(props) {

  const [campaignDialog, setCampaignDialog] = useState(false);
  const [deleteCampaignDialog, setDeleteCampaignDialog] = useState(false);
  const [campaign, setCampaign] = useState({});
  const toast = useRef(null);
  const [selection, setSelection] = useState(null);
  const [edit, setEdit] = useState(false);
  const queryClient = useQueryClient();
  const token = useSelector((state) => state.user.token);
  const userId = useSelector((state) => state.user?.userData?.id || "");

  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 10,
    page: 0,
    sortOrder: -1,
    sortField: 'createdAt',
    filters: {
      status: { value: null },
      name: { value: null },
      type: { value: null }
    },
  });
  const statuses = [
    { label: "CREATED", value: "CREATED" },
    { label: "RUNNING", value: "RUNNING" },
    { label: "LOST", value: "LOST" },
    { label: "SUCCESS", value: "SUCCESS" },
  ];
  const types = [
    { label: "Report", value: "REPORT" },
    { label: "Comment", value: "COMMENT" },

  ];
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

  const key = `${process.env.REACT_APP_API_URL}/campaign?page=${lazyParams.page + 1}&pageSize=${lazyParams.limit}${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"}${lazyParams.sortOrder == 1 ? "&desc=true" : lazyParams.sortOrder == -1 ? "&desc=false" : ""}`;
  const { isLoading, error, data } = useQuery(key, (query) => getAllCampaigns({ query, token }), {});
  const remove = useMutation(deleteCampaign,
    {
      onSuccess: () => {
        toast.current.show({ severity: "success", summary: "Xóa chiến dịch thành công", detail: "Thành công" })
        addHistory.mutate({ newData: { screen: "Chiến dịch facebook", description: `Xóa chiến dịch có thông tin: { id: ${campaign?.id}, name: ${campaign?.name}, type: ${campaign?.type}, status: ${campaign.status} }` }, token });
        setCampaign({});

      },
      onError: (error) => handleError(error),
      onSettled: () => queryClient.invalidateQueries({
        predicate: query => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/campaign`)
      })
    }
  )
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
  const formatDate = (value) => {
    return moment(value).format("DD/MM/YYYY");
  };
  const dateBodyTemplate = (rowData) => {
    return formatDate(rowData?.startedAt || new Date());
  };
  const contentUrlsTemplate = (rowData) => {
    const urls = rowData?.contentUrls?.join('<br />')
    return <div style={{ wordBreak: "break-all" }} dangerouslySetInnerHTML={{ __html: urls }}></div>
  };
  const statusTemplate = (rowData) => {
    return <span className={`product-badge status-${rowData.status == "RUNNING" || rowData.status == "SUCCESS" ? "instock" : "outofstock"} uppercase`}>{rowData.status == "RUNNING" ? "Đang chạy" : rowData.status == "CREATED" ? "Đã khởi tạo" : rowData.status == "LOST" ? "Thất bại" : "Thành công"}</span>;
  };

  const confirmDeleteCampaign = (campaign) => {
    setCampaign(campaign);
    setDeleteCampaignDialog(true);
  };
  const openEditCampaign = (rowData) => {
    setCampaign(rowData);
    setCampaignDialog(true);
    setEdit(true);
  };
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        <div className="text-center flex justify-content-center" style={{ gap: "8px" }}>
          <div>
            <i style={{ color: "red" }} title="Xóa" className="pi pi-trash cursor-pointer" onClick={() => confirmDeleteCampaign(rowData)}></i>
          </div>
          <div>
            <i title="Cập nhật" className="pi pi-cog cursor-pointer" style={{ color: "blue" }} onClick={() => openEditCampaign(rowData)}></i>
          </div>
          <div>
            <i style={{ color: "green" }} title="Chạy" className="pi pi-play cursor-pointer" onClick={() => confirmDeleteCampaign(rowData)}></i>
          </div>
          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteCampaign(rowData)} /> */}
        </div>
      </React.Fragment>
    );
  };
  const hideDeleteCampaignDialog = () => {
    setDeleteCampaignDialog(false);
  };
  const deleteCampaignConfirm = () => {
    remove.mutate({ id: campaign.id, token })
    setDeleteCampaignDialog(false);
  };
  const deleteCampaignDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeleteCampaignDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deleteCampaignConfirm} />
    </React.Fragment>
  );
  const openNew = () => {
    setEdit(false);
    setCampaignDialog(true);
  };

  const hideDialog = () => {
    setCampaignDialog(false);
    setCampaign({})
    setEdit(false)
  };


  const representativeFilterTemplate = (values) => {
    return <MultiSelect value={values.value} options={statuses} onChange={(e) => values.filterCallback(e.value)} optionLabel="label" placeholder="Any" className="p-column-filter" />;
  };
  const nameFilterTemplate = (values) => {
    return <InputText value={values.value} onChange={(e) => {
      values.filterCallback(e.target.value)
    }} placeholder="Name" />;
  };
  const typeFilterTemplate = (values) => {
    return <MultiSelect value={values.value} options={types} onChange={(e) => values.filterCallback(e.value)} optionLabel="label" placeholder="Any" className="p-column-filter" />;
  };
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      handleError(e);
    },
  });
  useEffect(() => {
    if (data && data?.docs) addHistory.mutate({ newData: {  screen: "Chiến dịch facebook", description: `Xem danh chiến dịch facebook page ${data?.page} có ${data?.docs.length} bản ghi` }, token });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.page])
  return (
    <div>
      <Toast ref={toast} />
      <div className="grid">
        <div className="col-12">
          <Button className="px-8" onClick={openNew}>
            Thêm
          </Button>
        </div>
        <div className="col-12">
          <div className="card">
            <h5>Chiến dịch facebook</h5>
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
              emptyMessage="Không tìm thấy dữ liệu"
              paginatorPosition="both"
            >
              <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
              <Column header="Hành động" alignHeader="center" body={actionBodyTemplate} exportable={false} style={{ minWidth: "10rem" }}></Column>
              <Column field="id" header="ID" sortable style={{ display: "none " }} />
              <Column body={(data, props) =>
                <div className="text-center">
                  {props.rowIndex + 1}
                </div>
              } header="STT" />
              <Column field="name" header="Tên chiến dịch" filterPlaceholder="Search by name" style={{ minWidth: "14rem" }} sortable filter filterField="name" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={nameFilterTemplate} />
              <Column field="contentUrls" body={contentUrlsTemplate} header="Danh sách bài viết thực hiện chiến dịch" filterMenuStyle={{ width: "14rem" }} style={{ width: "60rem" }} sortable />
              <Column field="type" header="Loại chiến dịch" style={{ minWidth: "14rem" }} sortable filter filterField="type" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={typeFilterTemplate} />
              <Column body={dateBodyTemplate} field="startedat" header="Thời gian tạo" style={{ minWidth: "12rem" }} sortable />
              <Column field="runCount" header="Số lần" body={(rowData) => <div>{Number(rowData.runCount || 0).toLocaleString("vi")}</div>} style={{ minWidth: "10rem" }} sortable />
              <Column field="interactions" header="Tương tác" body={(rowData) => <div>{Number(rowData.interactions || 0).toLocaleString("vi")}</div>} style={{ minWidth: "10rem" }} sortable />

              <Column field="status" header="Trạng thái" body={statusTemplate} style={{ width: "15rem" }} filter filterField="status" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={representativeFilterTemplate} />
            </DataTable>
          </div>
        </div>
      </div>
      <Dialog visible={campaignDialog} dismissableMask style={{ width: "800px" }} header={`${edit ? "Sửa chiến dịch" : "Thêm chiến dịch"}`} modal className="p-fluid" onHide={hideDialog}>
        <Form data={campaign} toast={toast} btn={edit ? "Edit" : "Add"} closeDialog={hideDialog} />
      </Dialog>
      <Dialog visible={deleteCampaignDialog} dismissableMask style={{ width: "450px" }} header="Xác nhận" modal footer={deleteCampaignDialogFooter} onHide={hideDeleteCampaignDialog}>
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {campaign && (
            <span>
              Bạn có chắc muốn xóa <b>{campaign.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}

export default React.memo(CampaignFacebookManage);
