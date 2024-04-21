import React, {useRef} from 'react'
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

import {SplitButton} from 'primereact/splitbutton'
import {useMutation} from 'react-query'
import {createHistory} from '../../../../service/historyAPI'
import {Toast} from 'primereact/toast'
import {useSelector} from 'react-redux'
export default function ExportTopic({queryDate, profiles}) {
  const token = useSelector((state) => state.user.token)
  const userId = useSelector((state) => state.user.userData?.id || '')
  const toast = useRef(null)
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  const fetchData = async (profile) => {
    let queryStr = `${process.env.REACT_APP_API_URL}/content?userHandle=handledPost&fromDate=${moment(
      queryDate[0] || new Date(),
    )
      .startOf('day')
      .toISOString()}&toDate=${moment(queryDate[1] || new Date())
      .endOf('day')
      .toISOString()}&profileIds=${profile}`
    // &process=eq.true
    const data = await axios.get(queryStr, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    })
    return data.data?.docs
  }
  const mergeDedupe = (arr) => {
    return [...new Set([].concat(...arr))]
  }
  const exportWord = async () => {
    try {
      if (profiles && profiles.length) {
        let data = []
        let paragraphs = []
        for (let i = 0; i < profiles.length; i++) {
          let res = await fetchData(profiles[i].value)
          data = [...data, ...res]
          const startDay = res.sort((a, b) => new Date(a?.postedAt) - new Date(b?.postedAt))
          console.log(startDay)
          paragraphs = [
            ...paragraphs,
            new Paragraph({
              children: [
                new TextRun({
                  text: `Qua nắm bắt thông tin, từ ${moment(startDay[0]?.postedAt || new Date()).format('HH')}h${moment(
                    startDay[0]?.postedAt || new Date(),
                  ).format('mm')} ngày ${moment(startDay[0]?.postedAt || new Date()).format('DD.MM')} đến ${moment(
                    startDay[startDay.length - 1]?.postedAt || new Date(),
                  ).format('HH')}h${moment(startDay[startDay.length - 1]?.postedAt || new Date()).format(
                    'mm',
                  )} ${moment(startDay[startDay.length - 1]?.postedAt || new Date()).format(
                    'DD.MM',
                  )}, trên mạng xã hội xuất hiện một số tin như sau:`,
                  size: 24,
                  break: 1,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Trên nhiều trang Facebook, các tài khoản  câu view,  câu like tiếp  tục đưa tin, chia sẻ các hình ảnh, video về XXXXXXXXXXXX`,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Nhiều bình luận đưa ra các nghi ngờ về YYYYYYYY  nhằm  gây  nhiễu  thông tin  liên  quan đến vụ án, làm ảnh hưởng đến uy tín của ABC.`,
                  size: 24,
                  break: 1,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Qua nắm bắt thông tin, từ ${moment(startDay[0]?.postedAt || new Date()).format('HH')}h${moment(
                    startDay[0]?.postedAt || new Date(),
                  ).format('mm')} ngày ${moment(startDay[0]?.postedAt || new Date()).format('DD.MM')} đến ${moment(
                    startDay[startDay.length - 1]?.postedAt || new Date(),
                  ).format('HH')}h${moment(startDay[startDay.length - 1]?.postedAt || new Date()).format(
                    'mm',
                  )} ${moment(startDay[startDay.length - 1]?.postedAt || new Date()).format(
                    'DD.MM',
                  )}, tài khoản facebook “sss” đăng tải 07 video liên quan đến ${
                    profiles[i]?.label
                  } của zzzz ( cập nhật mới nhất đã xóa 03 video) chủ yếu zzz. Trong video, có 1 nhóm cccc được cho là người thân của OOOOO`,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Qua nắm bắt thông tin, từ ${moment(startDay[0]?.postedAt || new Date()).format('HH')}h${moment(
                    startDay[0]?.postedAt || new Date(),
                  ).format('mm')} ngày ${moment(startDay[0]?.postedAt || new Date()).format('DD.MM')} đến ${moment(
                    startDay[startDay.length - 1]?.postedAt || new Date(),
                  ).format('HH')}h${moment(startDay[startDay.length - 1]?.postedAt || new Date()).format(
                    'mm',
                  )} ${moment(startDay[startDay.length - 1]?.postedAt || new Date()).format(
                    'DD.MM',
                  )}, trên mạng xã hội xuất hiện một số tin như sau:`,
                  size: 24,
                }),
              ],
              alignment: AlignmentType.JUSTIFIED,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Một số trang Facebook, các tài khoản câu view, câu like tiếp tục  đưa tin, chia sẻ các hình ảnh, video về FFFFFF nhằm gây nhiễu thông tin liên quan đến vụ án, làm ảnh hưởng đến uy tín của QQQQQ.`,
                  size: 24,
                }),
              ],
              font: 'Calibri',
              alignment: AlignmentType.JUSTIFIED,
            }),
          ]
        }
        const tableHeader = new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph('STT')],
              width: {
                size: 10,
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
                size: 20,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({
              children: [new Paragraph('Ngày đăng')],
              width: {
                size: 10,
                type: WidthType.PERCENTAGE,
              },
            }),

            new TableCell({
              children: [new Paragraph('Đường dẫn')],
              width: {
                size: 20,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({
              children: [new Paragraph('Số lượt tương tác')],
              width: {
                size: 40,
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
            ...data
              .filter((p) => p.type == 'FB_POST')
              .map(
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
                        children: [new Paragraph(moment(p?.postedAt).format('DD/MM'))],
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
                    ],
                  }),
              ),
          ],
        })
        console.log(data)
        const table2 = new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          // cantSplit: true,
          rows: [
            tableHeader,
            ...data
              .filter((p) => p.type == 'WEBSITE_POST')
              .map(
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
                        children: [new Paragraph(moment(p?.postedAt).format('DD/MM'))],
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
                    ],
                  }),
              ),
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
                      text: `BẢN TIN ${moment().format('DD.MM')}`,
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
                      text: `Liên quan đến AAAAAAAAAAAAA`,
                      bold: true,
                      size: 24,
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
                ...paragraphs,
                // ...arrayTagsDocx,
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
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Thống kê trên các link kênh Facebook có 08 video nội dung sai sự thật về  XXXX từ ngày 15.6 đến 16.6`,
                      size: 24,
                    }),
                  ], // Just newline without text
                }),
                new Paragraph({
                  children: [], // Just newline without text
                }),
                table,
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Thống kê trên các link Website có 08 video nội dung sai sự thật về  XXXX từ ngày 15.6 đến 16.6`,
                      size: 24,
                    }),
                  ], // Just newline without text
                }),
                new Paragraph({
                  children: [], // Just newline without text
                }),
                table2,
              ],
            },
          ],
        })
        addHistory.mutate({newData: {screen: 'Export', description: `Export bản tin chuyên đề - word`}, token})

        Packer.toBlob(doc).then((buffer) => {
          saveAs(buffer, 'topic.docx')
        })
      } else {
        toast.current.show({severity: 'error', summary: 'Error Message', detail: 'Bạn phải chọn profile trước'})
      }
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
      totalReactions: obj?.totalReactions || 0,
    }
  }
  const exportToPdf = async () => {
    try {
      if (profiles && profiles.length) {
        let data = []
        let paragraphs = []
        for (let i = 0; i < profiles.length; i++) {
          let res = await fetchData(profiles[i].value)
          data.push(res)
          const startDay = res.sort((a, b) => new Date(a?.postedAt) - new Date(b?.postedAt))
          if (startDay && startDay.length) {
            paragraphs.push({
              start: startDay[0]?.postedAt,
              end: startDay[startDay.length - 1]?.postedAt,
              profile: profiles[0]?.label,
            })
          }
        }
        const formatData = data?.map((p, i) => ({stt: i + 1, ...formatObject(p)}))
        addHistory.mutate({newData: {screen: 'Export', description: `Export bản tin chuyên đề - pdf`}, token})
        const blob = await pdf(<PDFfile data={formatData} paragraphs={paragraphs} />).toBlob()
        saveAs(blob, 'topic.pdf')
      } else {
        toast.current.show({severity: 'error', summary: 'Error Message', detail: 'Bạn phải chọn profile trước'})
      }
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
      <Toast ref={toast} />
      <SplitButton label="Xuất" model={items}></SplitButton>
    </>
  )
}
