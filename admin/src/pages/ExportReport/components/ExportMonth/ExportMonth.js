import React from 'react'
import axios from 'axios'
import moment from 'moment'
import PDFfile from './PDFfile'
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

import {orderBy} from 'lodash'
import {SplitButton} from 'primereact/splitbutton'
import {useMutation} from 'react-query'
import {createHistory} from '../../../../service/historyAPI'
import {useSelector} from 'react-redux'
export default function ExportMonth() {
  const token = useSelector((state) => state.user.token)
  const mergeDedupe = (arr) => {
    return [...new Set([].concat(...arr))]
  }
  const userId = useSelector((state) => state.user?.userData?.id || '')

  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  const fetchData = async () => {
    // ?fromDate=${moment().startOf("day").toISOString()}&toDate=${moment().endOf("day").toISOString()
    let queryStr = `${process.env.REACT_APP_API_URL}/content?userHandle=handledPost&fromDate=${moment()
      .startOf('year')
      .toISOString()}&toDate=${moment().endOf('day').toISOString()}`
    const data = await axios.get(queryStr, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
    return data.data?.docs
  }
  const getMostReactionContent = (array) => {
    if (array && array?.length) {
      return (
        orderBy(array, ['totalReactions'], ['desc']) &&
        orderBy(array, ['totalReactions'], ['desc'])[0] &&
        orderBy(array, ['totalReactions'], ['desc'])[0]
      )
    }
    return {}
  }
  const exportWord = async () => {
    try {
      const data = await fetchData()
      const arrayTags = data
        ?.filter((p) => p?.tagsInfo && p?.tagsInfo?.length)
        ?.map((p) => p?.tagsInfo?.map((x) => x?.name))
      const mergerTags = mergeDedupe(arrayTags)
      const mostReaction = getMostReactionContent(data)
      const arrayTagsDocx = mergerTags.map(
        (p) =>
          new Paragraph({
            text: `${p}`,
            numbering: {
              reference: 'my-numbering',
              level: 0,
            },
            heading: HeadingLevel.HEADING_2,
            style: 'stylePara',
          }),
      )
      const tableHeader = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('STT')],
            width: {
              size: 5,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Tiêu đề')],
            width: {
              size: 10,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Kênh đăng')],
            width: {
              size: 10,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Ngày đăng')],
            width: {
              size: 5,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Đường dẫn')],
            width: {
              size: 15,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Số lượng tương tác')],
            width: {
              size: 10,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Khoảng thời gian vi phạm')],
            width: {
              size: 5,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Nội dung vi phạm(chỉ rõ phút, giây vi phạm cái gì)')],
            width: {
              size: 20,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Vi phạm điều khoản')],
            width: {
              size: 20,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      })
      const tableHeader2 = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph('Tiêu đề')],
            width: {
              size: 10,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Kênh đăng')],
            width: {
              size: 10,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Ngày đăng')],
            width: {
              size: 5,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Đường dẫn')],
            width: {
              size: 15,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Số lượng tương tác')],
            width: {
              size: 10,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Khoảng thời gian vi phạm')],
            width: {
              size: 5,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Nội dung vi phạm(chỉ rõ phút, giây vi phạm cái gì)')],
            width: {
              size: 20,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph('Vi phạm điều khoản')],
            width: {
              size: 20,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      })
      const table = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        // cantSplit: true,
        rows: [
          tableHeader,
          ...data.map(
            (p, index) =>
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph((index + 1).toString())],
                    // width: {
                    //   size: 10,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [new Paragraph(p?.title || '')],
                    // width: {
                    //   size: 20,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [new Paragraph(p?.sourceInfo?.name || '')],
                    // width: {
                    //   size: 20,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [new Paragraph(moment(p.postedAt).format('DD/MM'))],
                    // width: {
                    //   size: 10,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),

                  new TableCell({
                    children: [new Paragraph(p?.sourceInfo?.link || '')],
                    // width: {
                    //   size: 20,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [new Paragraph(p?.totalReactions?.toString() || '')],
                    // width: {
                    //   size: 40,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [new Paragraph(moment(p?.postedAt || new Date()).format('hh:mm'))],
                    // width: {
                    //   size: 40,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [new Paragraph(p?.violationContent || '')],
                    // width: {
                    //   size: 40,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [new Paragraph(p?.violationEnactment || '')],
                    // width: {
                    //   size: 40,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                ],
              }),
          ),
        ],
      })
      const table2 = new Table({
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        // cantSplit: true,
        rows: [
          tableHeader2,
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph(mostReaction?.title || '')],
                // width: {
                //   size: 20,
                //   type: WidthType.PERCENTAGE,
                // },
              }),
              new TableCell({
                children: [new Paragraph(mostReaction?.sourceInfo?.name || '')],
                // width: {
                //   size: 20,
                //   type: WidthType.PERCENTAGE,
                // },
              }),
              new TableCell({
                children: [new Paragraph(moment(mostReaction.postedAt).format('DD/MM'))],
                // width: {
                //   size: 10,
                //   type: WidthType.PERCENTAGE,
                // },
              }),

              new TableCell({
                children: [new Paragraph(mostReaction?.sourceInfo?.link || '')],
                // width: {
                //   size: 20,
                //   type: WidthType.PERCENTAGE,
                // },
              }),
              new TableCell({
                children: [new Paragraph(mostReaction?.totalReactions?.toString() || '')],
                // width: {
                //   size: 40,
                //   type: WidthType.PERCENTAGE,
                // },
              }),
              new TableCell({
                children: [new Paragraph(moment(mostReaction?.postedAt || new Date()).format('hh:mm'))],
                // width: {
                //   size: 40,
                //   type: WidthType.PERCENTAGE,
                // },
              }),
              new TableCell({
                children: [new Paragraph(mostReaction?.violationContent || '')],
                // width: {
                //   size: 40,
                //   type: WidthType.PERCENTAGE,
                // },
              }),
              new TableCell({
                children: [new Paragraph(mostReaction?.violationEnactment || '')],
                // width: {
                //   size: 40,
                //   type: WidthType.PERCENTAGE,
                // },
              }),
            ],
          }),
        ],
      })
      const doc = new Document({
        numbering: {
          config: [
            {
              reference: 'my-numbering',
              levels: [
                {
                  level: 1,
                  format: LevelFormat.DECIMAL,
                  text: '%1.',
                  alignment: AlignmentType.LEFT,
                  style: {
                    paragraph: {
                      indent: {left: convertInchesToTwip(0.2), hanging: convertInchesToTwip(0.18)},
                    },
                  },
                },
                {
                  level: 3,
                  format: LevelFormat.LOWER_LETTER,
                  text: '%2)',
                  alignment: AlignmentType.LEFT,
                  style: {
                    paragraph: {
                      indent: {left: convertInchesToTwip(0.2), hanging: convertInchesToTwip(0.18)},
                    },
                  },
                },
              ],
            },
          ],
        },
        styles: {
          default: {
            heading1: {
              run: {
                size: 28,
                bold: true,
                color: '000000',
              },
              paragraph: {
                spacing: {
                  after: 120,
                },
              },
            },
            heading2: {
              run: {
                size: 26,
                bold: true,
              },
              paragraph: {
                spacing: {
                  before: 240,
                  after: 120,
                },
              },
            },
          },
          paragraphStyles: [
            {
              id: 'stylePara',
              name: 'Style Paragraph',
              run: {
                color: '000000',
                size: 26,
                bold: true,
              },
            },
            {
              id: 'stylePara1',
              name: 'Style Paragraph 1',
              run: {
                color: '000000',
                size: 26,
              },
            },
          ],
        },
        sections: [
          {
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'BẢN TIN TỔNG HỢP',
                    bold: true,
                    allCaps: true,
                    size: 30,
                  }),
                ],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `(Từ 0h00 ${moment().startOf('month').format('DD/M/YYYY')} đến ${moment().format(
                      'hh',
                    )}h${moment().format('mm')} ngày ${moment().format('DD/M/YYYY')})`,
                    bold: true,
                    size: 28,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Qua nắm bắt tính hình trên không gian mạng trong khoảng thời gian từ 0h00 ngày ${moment()
                      .startOf('month')
                      .format('DD/M/YYYY')} đến ${moment().format('hh')}h${moment().format('mm')} ${moment().format(
                      'DD/M/YYYY',
                    )} có một số tin chính đáng chú ý sau:`,
                    size: 28,
                  }),
                ],
                font: 'Calibri',
                alignment: AlignmentType.JUSTIFIED,
              }),
              ...arrayTagsDocx,
              new Paragraph({
                children: [], // Just newline without text
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Bản tin nổi bật trong tháng`,
                    size: 24,
                  }),
                ], // Just newline without text
              }),
              new Paragraph({
                children: [], // Just newline without text
              }),
              // new Paragraph({
              //   text: "Tin liên quan đến QĐ",
              //   numbering: {
              //     reference: "my-numbering",
              //     level: 0,
              //   },
              //   heading: HeadingLevel.HEADING_2,
              //   style: "stylePara",
              // }),
              // new Paragraph({
              //   text: "Tin liên quan đến hoạt động tuyên truyền chống phá QĐ",
              //   numbering: {
              //     reference: "my-numbering",
              //     level: 1,
              //   },
              //   heading: HeadingLevel.HEADING_3,
              //   style: "stylePara1",
              // }),
              // new Paragraph({
              //   text: "Tin khác liên quan đến QĐ",
              //   numbering: {
              //     reference: "my-numbering",
              //     level: 1,
              //   },
              //   heading: HeadingLevel.HEADING_3,
              //   style: "stylePara1",
              // }),
              // new Paragraph({
              //   text: "Tin lộ lọt tài liệu",
              //   numbering: {
              //     reference: "my-numbering",
              //     level: 0,
              //   },
              //   heading: HeadingLevel.HEADING_2,
              //   style: "stylePara",
              // }),
              // new Paragraph({
              //   text: "Tin chú ý khác",
              //   numbering: {
              //     reference: "my-numbering",
              //     level: 0,
              //   },
              //   heading: HeadingLevel.HEADING_2,
              //   style: "stylePara",
              // }),
              // new Paragraph({
              //   text: "Yêu cầu xử lý",
              //   numbering: {
              //     reference: "my-numbering",
              //     level: 0,
              //   },
              //   heading: HeadingLevel.HEADING_2,
              //   style: "stylePara",
              // }),
              // new Paragraph({
              //   text: "(Bản tin chi tiết xem bản trên định dạng PDF) Người tổng hợp: XX",

              //   style: "stylePara1",
              // }),

              table2,
              new Paragraph({
                children: [], // Just newline without text
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Danh sách các bài viết có nội dung vi phạm từ 0h00 ${moment()
                      .startOf('month')
                      .format('DD/M/YYYY')} đến ${moment().format('hh')}h${moment().format(
                      'mm',
                    )} ngày ${moment().format('DD/M/YYYY')}`,
                    size: 28,
                  }),
                ], // Just newline without text
              }),
              table,
            ],
          },
        ],
      })
      addHistory.mutate({newData: {screen: 'Export', description: `Export bản tin tháng - word`}, token})

      Packer.toBlob(doc).then((buffer) => {
        saveAs(buffer, 'month.docx')
      })
    } catch (error) {
      console.log(error)
    }
  }
  const exportExcel = async () => {
    let queryStr = `${process.env.REACT_APP_API_URL}/content?userHandle=handledPost&fromDate=${moment()
      .startOf('month')
      .toISOString()}&toDate=${moment().endOf('day').toISOString()}`
    exportToCSV(queryStr, 'month')
  }
  const exportToCSV = async (query, fileName) => {
    try {
      const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      const fileExtension = '.xlsx'
      const csvData = await axios.get(`${query}`, {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      })
      const dateExport = csvData?.data?.docs?.map((p, index) => ({
        STT: (index + 1).toString(),
        'Tiêu đề': p.title,
        'Kênh đăng': p?.sourceInfo?.name,
        'Ngày đăng': moment(p.postedAt).format('DD/MM/YYYY'),
        'Đường dẫn': p?.sourceInfo?.link,
        'Số lượng tương tác': p?.totalReactions,
        'Khoảng thời gian vi phạm': moment(p.postedAt).format('hh:mm'),
        'Nội dung vi phạm(chỉ rõ phút, giây vi phạm cái gì)': p?.violationContent,
        'Vi phạm điều khoản': p?.violationEnactment,
      }))
      var wscols = [
        {wch: 6},
        {wch: 20},
        {wch: 20},
        {wch: 15},
        {wch: 40},
        {wch: 15},
        {wch: 25},
        {wch: 20},
        {wch: 40},
        {wch: 40},
      ]
      const ws = XLSX.utils.json_to_sheet(dateExport)
      ws['!cols'] = wscols
      const wb = {Sheets: {data: ws}, SheetNames: ['data']}
      const excelBuffer = XLSX.write(wb, {bookType: 'xlsx', type: 'array'})
      const data = new Blob([excelBuffer], {type: fileType})
      addHistory.mutate({newData: {screen: 'Export', description: `Export bản tin tháng - excel`}, token})
      FileSaver.saveAs(data, fileName + fileExtension)
    } catch (error) {
      console.log(error)
    }
  }

  const formatObject = (obj) => {
    return {
      title: obj.title,
      postedat: moment(obj?.postedAt || new Date()).format('DD/MM/YYYY'),
      sourcename: obj?.sourceInfo?.name,
      sourcelink: obj?.sourceInfo?.link,
      violationContent: obj?.violationContent,
      violationEnactment: obj?.violationEnactment,
      timeViolation: moment(obj?.postedAt || new Date()).format('hh:mm'),
      totalReactions: obj?.totalReactions || 0,
    }
  }
  const exportToPdf = async () => {
    try {
      const data = await fetchData()
      const arrayTags = data
        ?.filter((p) => p?.tagsInfo && p?.tagsInfo?.length)
        ?.map((p) => p?.tagsInfo?.map((x) => x?.name))
      const mergerTags = mergeDedupe(arrayTags)
      const formatData = data?.map((p, i) => ({stt: i + 1, ...formatObject(p)}))
      const mostReaction = formatObject(getMostReactionContent(data))
      addHistory.mutate({newData: {screen: 'Export', description: `Export bản tin tháng - pdf`}, token})

      const blob = await pdf(<PDFfile data={formatData} tags={mergerTags} mostReaction={mostReaction} />).toBlob()
      saveAs(blob, 'month.pdf')
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
    {
      label: 'Excel',
      icon: 'pi pi-file-excel',
      command: (e) => {
        exportExcel()
      },
    },
  ]
  return (
    <>
      <SplitButton label="Xuất" model={items}></SplitButton>
    </>
  )
}
