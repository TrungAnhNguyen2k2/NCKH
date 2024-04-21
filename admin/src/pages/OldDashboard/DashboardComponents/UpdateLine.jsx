import React from "react";
import PropTypes from "prop-types";

UpdateLine.propTypes = {};

function UpdateLine(props) {
    const { date, text, link} = props
    return (
        <div className="flex align-items-center">
            <span className="text-900 line-height-3">
                {date}
                <span className="ml-1 text-800">
                    {text}
                </span>
            </span>
            <a href={link} className="ml-2 text-blue-500">Truy cập ngay</a>
        </div>
    );
}

export default UpdateLine;
