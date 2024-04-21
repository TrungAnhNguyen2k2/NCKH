import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import moment from "moment";
import { Button } from "primereact/button";
import imgValid from '../../../assets/images/invalid.jpg'
import { useDispatch } from "react-redux";
import { setQueryStr } from "../../../store/queryStore";
PostReview.propTypes = {};

function PostReview({ data }) {
  const dispatch = useDispatch()
  return (
    <>
      <div className="w-3rem h-3rem flex align-items-start justify-content-center bg-blue-100 border-circle mr-3 mt-2 flex-shrink-0">
        <img
          className="w-full h-full border-circle"
          src={data?.authorInfo?.avatar || data?.sourceInfo?.avatar}
          onError={({ currentTarget }) => {
            currentTarget.onerror = null; // prevents looping
            currentTarget.src = imgValid;
          }}
        ></img>
      </div>
      <span className="text-900 line-height-3">
        <Link to={`bai-viet?id=${data?.id}`} target="_blank" className="font-medium">
          {data?.sourceInfo?.name}
        </Link>
        <div></div>
        <span className="text-700 cursor-pointer" onClick={() => dispatch(setQueryStr(data?.id))}>
          {data?.textContent?.substr(0, 200)}
        </span>
        {data?.type == "FB_POST" && (
          <>
                  <br />

            Cảm xúc: {Number(data?.likes || 0).toLocaleString("vi")} | Bình luận: {Number(data?.comments || 0).toLocaleString("vi")} | Chia sẻ: {Number(data?.shares || 0).toLocaleString("vi")} | {moment(data?.postedAt).format("HH:mm DD/MM/YYYY")}
          </>
        )}
        <br />
        Chủ đề:
        {data &&
          data?.topicsInfo &&
          data?.topicsInfo?.length ?
          data?.topicsInfo?.map((topic, i) => (
            <React.Fragment key={i}>
              <Link to={`/bai-viet?topicId=${topic?.id}`} className="font-medium">
                {topic?.name}
              </Link>
              {i != data?.topicsInfo?.length - 1 && <>, </>}
            </React.Fragment>
          )) : ""}
        <div className="text-indigo-500 cursor-pointer" onClick={() => setQueryStr(data?.id)}>
          Xem chi tiết
        </div>
      </span>
    </>
  );
}

export default PostReview;
