import moment from "moment";
import { FilterMatchMode } from "primereact/api";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import {ToggleButton} from 'primereact/togglebutton'
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { MultiSelect } from "primereact/multiselect";
import { Toast } from "primereact/toast";
import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { Link } from "react-router-dom";
import { getAllTags, removeTag } from "../../service/tagAPI";

import Form from "./Form";
import { FileUpload } from "primereact/fileupload";
import { createHistory } from "../../service/historyAPI";
import { useSelector } from "react-redux";

TagManage.propTypes = {};

function TagManage(props) {
  const [userDialog, setTagDialog] = useState(false);
  const [selection, setSelection] = useState(null);
  const [deleteTagDialog, setDeleteTagDialog] = useState(false);
  const [tag, setTag] = useState(null);
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
      categories: { value: null },
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
  const key = `${process.env.REACT_APP_API_URL}/tag?page=${lazyParams.page + 1}&pageSize=${lazyParams.limit}${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"
    }${lazyParams.sortOrder == 1 ? "&desc=false" : lazyParams.sortOrder == -1 ? "&desc=true" : ""}`;
  const { isLoading, error, data } = useQuery(key, (query) => getAllTags(query, token), {});
  const remove = useMutation(removeTag, {
    onSuccess: () => {
      toast.current.show({ severity: "success", summary: "Xóa thẻ thành công", detail: "Thành công" });
      addHistory.mutate({ newData: {  screen: "Tag", description: `Xóa tag có : { id: ${tag?.id}, name: ${tag?.name}}` }, token });
      setTag({});
    },
    onError: (error) => handleError(error),
    onSettled: () =>
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.startsWith(`${process.env.REACT_APP_API_URL}/tag`),
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
    setTagDialog(true);
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
  const confirmDeleteTag = (tag) => {
    setTag(tag);
    setDeleteTagDialog(true);
  };
  const hideDeleteTagDialog = () => {
    setDeleteTagDialog(false);
  };
  const deleteTag = () => {
    remove.mutate({ id: tag.id, token: token });
    setDeleteTagDialog(false);
  };
  const deleteTagDialogFooter = (
    <React.Fragment>
      <Button label="Hủy" icon="pi pi-times" className="p-button-text" onClick={hideDeleteTagDialog} />
      <Button label="Xác nhận" icon="pi pi-check" className="p-button-text" onClick={deleteTag} />
    </React.Fragment>
  );
  const openEditTag = (rowData) => {
    setEdit(true);
    setTagDialog(true);
    setTag(rowData);
  };
  const formatDate = (value) => {
    return moment(value).format("DD/MM/YYYY");
  };
  const dateBodyTemplate = (rowData) => {
    return formatDate(rowData?.createdAt);
  };
  const actionBodyTemplate = (rowData) => {
    return (
      <React.Fragment>
        {/* <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <Button className="p-button-rounded p-button-danger" title="Xóa" icon="pi pi-trash" onClick={() => confirmDeleteTag(rowData)}></Button>
          </div>

          <div>
            <Link to="/bai-viet" title="Xem">
            <Button className="p-button-rounded p-button-primary" title="Xóa" icon="pi pi-eye" onClick={() => confirmDeleteTag(rowData)}></Button>

            </Link>
          </div>
        </div> */}
        <div className="text-center flex justify-content-center align-items-center gap-2">
          <div>
            <i title="Xóa" className="pi pi-trash cursor-pointer" style={{ color: "red" }} onClick={() => confirmDeleteTag(rowData)}></i>
          </div>
          <div>
            <i title="Cập nhật" className="pi pi-cog cursor-pointer" style={{ color: "blue" }} onClick={() => openEditTag(rowData)}></i>
          </div>
          {/* <div>
            <Link to={`/bai-viet?topicId=${rowData.id}`} title="Xem">
              {" "}
              <i className="pi pi-eye cursor-pointer" style={{ color: "black" }}></i>
            </Link>
          </div> */}
          {/* <Button icon="pi pi-trash" className="p-button-danger" onClick={() => confirmDeleteTag(rowData)} /> */}
        </div>
      </React.Fragment>
    );
  };
  const showBodyTemplate = (rowData) => {
    return (
      <div>
        {rowData?.showOnPost? "Tag hay dùng": "Tag không hay dùng" }
      </div>
    )
  };
  
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e);
    },
  });
  useEffect(() => {
    if (data && data?.docs) addHistory.mutate({ newData: {  screen: "Tag", description: `Xem danh sách tag page ${data?.page} có ${data?.docs.length} bản ghi` }, token });
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
              <h5 className="mb-0">Thẻ</h5>
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
              emptyMessage="Không tìm thấy dữ liệu"
              paginatorPosition="both"
            >
              <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />
              <Column header="Hành động" alignHeader="center" body={actionBodyTemplate} exportable={false} style={{ minWidth: "11rem" }}></Column>
              <Column field="id" header="ID" sortable style={{ display: "none" }} />
              <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} field="STT" header="STT" />
              <Column field="name" header="Tên thẻ" style={{ minWidth: "12rem" }} filter filterField="name" showFilterMatchModes={false} showFilterMenuOptions={false} filterElement={nameFilterTemplate} />
              <Column field="showOnPost" header="Tag hay dùng" sortable body={showBodyTemplate} />
              <Column field="createdAt" header="Ngày đăng" style={{ minWidth: "12rem" }} sortable body={dateBodyTemplate} />
            </DataTable>
          </div>
        </div>
      </div>
      <Dialog
        visible={userDialog}
        dismissableMask
        style={{ width: "800px" }}
        header={`${edit ? "Cập nhật thẻ" : "Thêm thẻ"}`}
        modal
        className="p-fluid"
        onHide={() => {
          setTagDialog(false);
          setTag({});
          setEdit(false);
        }}
      >
        <Form
          btnText={edit ? "Edit" : "Add"}
          data={tag}
          toast={toast}
          closeDialog={() => {
            setTagDialog(false);
            setTag({});
          }}
        />
      </Dialog>
      <Dialog visible={deleteTagDialog} dismissableMask style={{ width: "450px" }} header="Xác nhận" modal footer={deleteTagDialogFooter} onHide={hideDeleteTagDialog}>
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: "2rem" }} />
          {tag && (
            <span>
              Bạn có chắc muốn xóa <b>{tag.name}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}

export default TagManage;
