import { Button } from 'primereact/button';
import React from 'react'
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import axios from 'axios';
export default function ButtonExportExcel({ query, fileName }) {
    const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const fileExtension = '.xlsx';

    const exportToCSV = async (query, fileName) => {
        const csvData = await axios.get(`${query}`)
        const ws = XLSX.utils.json_to_sheet(csvData.data);
        const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], {type: fileType});
        FileSaver.saveAs(data, fileName + fileExtension);
    }

    return (
        <Button type="button" label="Export data to excel" onClick={() => exportToCSV(query, fileName)} className="mt-2 inline-block w-auto" />
    )
}
