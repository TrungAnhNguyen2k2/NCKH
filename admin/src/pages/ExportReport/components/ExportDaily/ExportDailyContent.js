import React from 'react'
import axios from 'axios'
import moment from 'moment'
import PDFfile from './PDFfileDaily'
import * as FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  LevelFormat,
  Numbering,
  Indent,
  HeadingLevel,
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx'
import {saveAs} from 'file-saver'
import {Button} from 'primereact/button'
import {pdf} from '@react-pdf/renderer'
import {useSelector} from 'react-redux'
import {SplitButton} from 'primereact/splitbutton'
import {useMutation} from 'react-query'
import {createHistory} from '../../../../service/historyAPI'
export default function ExportDailyContent({queryDate}) {
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user?.userData?.id)

  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  const fetchData = async () => {
    let queryStr = `${process.env.REACT_APP_API_URL}/content?userHandle=handledPost&fromDate=${moment(queryDate)
      .startOf('day')
      .toISOString()}&toDate=${moment(queryDate).endOf('day').toISOString()}`
    const data = await axios.get(queryStr, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
    return data.data?.docs
  }
  const exportWord = async () => {
    try {
      const data = await fetchData()
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'Mẫu tin ngắn: 5W2H',
                    bold: true,
                    allCaps: true,
                    size: 30,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              ...data.map(
                (p) =>
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: p?.editedTextContent,
                        size: 18,
                        break: 1,
                      }),
                    ],
                    alignment: AlignmentType.JUSTIFIED,
                  }),
              ),
            ],
          },
        ],
      })
      addHistory.mutate({newData: {screen: 'Export', description: `Export mẫu tin ngắn - word`}, token})

      Packer.toBlob(doc).then((buffer) => {
        saveAs(buffer, 'daily-export')
      })
    } catch (error) {
      console.log(error)
    }
  }
  const exportToPdf = async () => {
    try {
      const data = await fetchData()
      const formatData = data?.map((p, i) => p.editedTextContent)
      addHistory.mutate({newData: {screen: 'Export', description: `Export mẫu tin ngắn - pdf`}, token})
      const blob = await pdf(<PDFfile data={formatData} />).toBlob()
      saveAs(blob, 'daily-export.pdf')
    } catch (error) {
      console.log(error)
    }
  }
  const items = [
    {
      label: 'Word',
      icon: 'pi pi-file',
      command: (e) => {
        exportWord()
      },
    },
    {
      label: 'Pdf',
      icon: 'pi pi-file-pdf',
      command: (e) => {
        exportToPdf()
      },
    },
    // {
    //   label: "Excel",
    //   icon: "pi pi-file-excel",
    //   command: (e) => {
    //     exportExcel()
    //   },
    // },
  ]
  return (
    <>
      <SplitButton label="Xuất" model={items}></SplitButton>
    </>
  )
}
