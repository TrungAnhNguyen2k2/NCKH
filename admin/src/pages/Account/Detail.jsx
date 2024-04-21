import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { Link, useParams } from "react-router-dom";
import { getAuthorById } from "../../service/authorAPI.js";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import moment from "moment";
import { getAllPosts, getAllPostsDashboard } from "../../service/postAPI.js";
import { Button } from "primereact/button";
import { createHistory } from "../../service/historyAPI.js";
import { useDispatch, useSelector } from 'react-redux'
import { setQueryStr } from "../../store/queryStore.js";
export default function Detail() {
  const dispatch = useDispatch()
  const { id } = useParams();
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    limit: 10,
    page: 0,
    sortOrder: -1,
    sortField: "createdAt",
    filters: {},
  });
  const token = useSelector((state) => state.user.token);
  const userId = useSelector((state) => state.user?.userData?.id || "");
  const keyAuthor = `${process.env.REACT_APP_API_URL}/author/${id}`;
  const keyPostOfAuthor = `${process.env.REACT_APP_API_URL}/content?authorId=${id}&page=${lazyParams.page + 1}&pageSize=${(lazyParams.limit)}${lazyParams.sortField ? "&sortBy=" + lazyParams.sortField : "&sortBy=createdAt"}${lazyParams.sortOrder == 1 ? "&desc=false" : lazyParams.sortOrder == -1 ? "&desc=true" : "&desc=true"}`;
  const authorById = useQuery(keyAuthor, (query) => getAuthorById({ query, token }), {
    enabled: !!id,
  });
  const posts = useQuery(keyPostOfAuthor, (query) => getAllPosts({ query, token }), {
    enabled: !!id,
  });
  const onPage = (event) => {
    setLazyParams({ ...lazyParams, page: event.page, limit: 10, first: event.first });
  };
  const onSort = (event) => {
    setLazyParams({ ...lazyParams, ...event });
  };
  const formatDate = (value) => {
    return moment(value).format("DD/MM/YYYY");
  };
  const dateBodyTemplate = (rowData) => {
    return formatDate(rowData?.birthdate || new Date());
  };
  const nameTemplate = (rowData) => {
    return (
      <div className="flex align-items-center gap-2">
        <img className="border-circle w-2rem h-2rem" src={rowData?.avatar} alt="" />
        <span>{rowData?.name}</span>
      </div>
    );
  };
  const timeTemplate = (rowData) => {
    return <div>{moment(rowData.createdAt).format("HH:mm")}</div>;
  };
  const statusTemplate = (rowData) => {
    return (
      <span className={`product-badge`}>
        {rowData.userHandle == 'handledPost' && rowData?.status == 'DEAD' && 'ĐÃ CHẶN'}
        {rowData.userHandle == 'handledPost' && rowData?.status == 'LIVE' && 'CHƯA CHẶN'}
      </span>
    )
  };
  const contentTemplate = (rowData) => {
    return (
      <div>{rowData?.textContent.substr(0, 1000) + `${rowData?.textContent?.length > 1000 ? "..." : ""}`} <span className="text-indigo-500 cursor-pointer" onClick={() => dispatch(setQueryStr(rowData.id))}>Xem chi tiet</span></div>
    );
  };
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  });
  useEffect(() => {
    if (authorById?.data) {
      const data = authorById?.data?.doc
      addHistory.mutate({ newData: { screen: "Chi tiết người đăng", description: `Xem chi tiết người đăng: { id: ${data?.id}, name: ${data?.name}, contact: ${data?.contact} }` }, token });
    }
  }, [authorById?.data])
  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <Link to={`/nguoi-dang`} className="mb-4 inline-block">
            <Button icon="pi pi-arrow-left" />
          </Link>
          <DataTable value={[authorById?.data?.doc || {}]} className="p-datatable-gridlines" dataKey="id" loading={authorById?.isLoading} responsiveLayout="scroll" emptyMessage="No author found.">
            <Column field="name" header="Tên người dùng" body={nameTemplate} style={{ minWidth: "12rem" }} />
            <Column field="gender" header="Giới tính" style={{ minWidth: "12rem" }} />
            <Column field="birthDate" header="Ngày sinh" body={dateBodyTemplate} style={{ minWidth: "12rem" }} />
            <Column field="address" header="Quê quán" style={{ minWidth: "12rem" }} />
            <Column field="contact" header="Thông tin liên hệ" style={{ minWidth: "12rem" }} />
          </DataTable>
          <DataTable
            value={posts?.data?.docs}
            lazy
            paginator
            onPage={onPage}
            first={lazyParams.first}
            totalRecords={posts?.data?.total}
            className="p-datatable-gridlines"
            rows={10}
            dataKey="id"
            loading={posts?.isLoading}
            responsiveLayout="scroll"
            emptyMessage="Không tìm thấy dữ liệu"
            paginatorPosition="both"
          >
            <Column body={(data, props) => <div className="text-center">{props.rowIndex + 1}</div>} header="STT" />
            <Column field="id" header="ID" style={{ display: "none" }} />

            <Column field="createdAt" header="Ngày đăng" body={timeTemplate} style={{ minWidth: "8rem" }} sortable />
            {/* <Column field="sources.type" header="Kênh đăng" style={{ minWidth: "12rem" }} /> */}
            <Column field="link" header="Đường dẫn" style={{ minWidth: "12rem", wordBreak: "break-all" }} sortable />
            <Column field="textContent" header="Nội dung" body={contentTemplate} style={{ minWidth: "20rem" }} />
            <Column field="status" header="Tình trạng" body={statusTemplate} style={{ minWidth: "12rem" }} />
          </DataTable>
        </div>
      </div>
    </div>
  );
}
