import React from 'react';
import PropTypes from 'prop-types';

BlockSmall.propTypes = {
    title: PropTypes.string,
    count: PropTypes.number,
    updateNumber: PropTypes.number,
    keyOne: PropTypes.string,
    keyTwo: PropTypes.string
};

function BlockSmall(props) {
    const { title, count, keyOne, keyTwo, updateNumber } = props;
    return (
        <div className="col-12 lg:col-6 xl:col-3">
        <div className="card mb-0">
            <div className="flex justify-content-between mb-3">
                <div>
                    <span className="block text-500 font-medium mb-3">{title}</span>
                    <div className="text-900 font-medium text-xl">{count} đang được theo dõi</div>
                </div>
                {/* <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{width: '2.5rem', height: '2.5rem'}}>
                    <i className="pi pi-shopping-cart text-blue-500 text-xl"/>
                </div> */}
            </div>
            <span className="text-green-500 font-medium">{updateNumber} {keyTwo} </span>
            <span className="text-500">được cập nhật hôm nay</span>
        </div>
    </div>
    );
}

export default BlockSmall;
