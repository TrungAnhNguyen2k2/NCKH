import {pdf, PDFViewer} from '@react-pdf/renderer'
import axios from 'axios'
import {
  AlignmentType,
  convertInchesToTwip,
  Document,
  HeadingLevel,
  Indent,
  LevelFormat,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import * as FileSaver from 'file-saver'
import {saveAs} from 'file-saver'
import moment from 'moment'
import React from 'react'
import * as XLSX from 'xlsx'
import PDFfile from './PDFfile'

import {SplitButton} from 'primereact/splitbutton'
import {useMutation} from 'react-query'
import {useSelector} from 'react-redux'
import {createHistory} from '../../../../service/historyAPI'
export default function ExportByDay({queryDate}) {
  const token = useSelector((state) => state.user.token)
  const mergeDedupe = (arr) => {
    return [...new Set([].concat(...arr))]
  }
  const userId = useSelector((state) => state.user.userData?.id || '')
  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  const fetchData = async () => {
    // ?fromDate=${moment().startOf("week").toISOString()}&toDate=${moment().endOf("day").toISOString()
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
      let arrayTopics = []
      const getArrayTopics = data
        ?.filter((p) => p?.topicsInfo && p?.topicsInfo?.length)
        ?.forEach((p) =>
          p?.topicsInfo?.forEach((x) => {
            arrayTopics.push({
              name: x?.name,
              id: x?.id,
            })
          }),
        )
      let arrayTopicsId = []
      const getArrayTopicsId = data
        ?.filter((p) => p?.topicsInfo && p?.topicsInfo?.length)
        ?.forEach((p) => p?.topicsInfo?.forEach((x) => arrayTopicsId.push(x?.id)))
      const mergerTopics = mergeDedupe(arrayTopicsId)
      let topicsParagraph = []
      const arrayTopicsDocx =
        mergerTopics.forEach((p) => {
          let findContent = arrayTopics?.find((topic) => topic?.id == p)
          topicsParagraph = [
            ...topicsParagraph,
            new Paragraph({
              text: `${findContent?.name || ''}`,
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              heading: HeadingLevel.HEADING_2,
              style: 'stylePara',
            }),
          ]
          let contentsOfTopic = data?.filter((topic) => topic.topicsInfo?.map((p) => p?.id)?.find((x) => x == p))
          for (let content of contentsOfTopic) {
            topicsParagraph = [
              ...topicsParagraph,
              new Paragraph({
                indent: {firstLine: convertInchesToTwip(0.4)},
                alignment: AlignmentType.JUSTIFIED,
                children: [
                  new TextRun({
                    text: `- ${content?.title || ''}`,
                    bold: true,
                    size: 28,
                  }),
                  new TextRun({
                    text: `(${content?.link}; ${moment(content?.postedAt).format('DD/MM/YYYY')}): ${
                      content?.editedTextContent ? content?.editedTextContent : content?.textContent
                    }`,
                    size: 28,
                  }),
                ],
              }),
            ]
          }
        }) || []
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
                // {
                //   level: 3,
                //   format: LevelFormat.LOWER_LETTER,
                //   text: "%2)",
                //   alignment: AlignmentType.LEFT,
                //   style: {
                //     paragraph: {
                //       indent: { left: convertInchesToTwip(0.2), hanging: convertInchesToTwip(0.18) },
                //     },
                //   },
                // },
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
                underline: true,
              },
              paragraph: {
                spacing: {
                  before: 400,
                  after: 100,
                },
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
              new Table({
                width: {size: 100, type: WidthType.PERCENTAGE},
                layout: TableLayoutType.FIXED,
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: 'THÀNH UỶ HÀ NỘI',
                                allCaps: true,
                                size: 28,
                                break: 0,
                              }),
                              new TextRun({
                                text: 'BAN TUYÊN GIÁO',
                                allCaps: true,
                                bold: true,
                                size: 28,
                                break: 1,
                              }),
                              new TextRun({
                                text: '*',
                                allCaps: true,
                                size: 28,
                                break: 1,
                              }),
                              new TextRun({
                                text: 'Số        - BC/BTGTU',
                                allCaps: false,
                                size: 28,
                                break: 1,
                              }),
                            ],
                          }),
                        ],
                        columnSpan: 8,
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                text: 'ĐẢNG CỘNG SẢN VIỆT NAM',
                                bold: true,
                                allCaps: true,
                                size: 30,
                                underline: true,
                                break: 0,
                              }),
                              new TextRun({
                                text: 'Hà Nội, ngày      tháng  10  năm 2022',
                                size: 28,
                                break: 2,
                                italics: true,
                              }),
                            ],
                          }),
                        ],
                        columnSpan: 4,
                      }),
                    ],
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'BÁO CÁO',
                    bold: true,
                    allCaps: true,
                    size: 30,
                    break: 1,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Những thông tin báo chí phản ánh vụ việc bức xúc liên quan đến Hà Nội`,
                    size: 28,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `(Ngày ${moment(queryDate).format('DD')} tháng ${moment(queryDate).format('MM')} năm ${moment(
                      queryDate,
                    ).format('YYYY')})`,
                    italics: true,
                    size: 28,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Kính gửi:`,
                    italics: true,
                    bold: true,
                    size: 28,
                    break: 2,
                  }),
                ],
                indent: {left: convertInchesToTwip(0.2), hanging: convertInchesToTwip(0.18)},
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `- Đ/c Đinh Tiến Dũng - Ủy viên Bộ Chính trị, Bí thư Thành ủy, 
                    Trưởng đoàn đại biểu Quốc hội khóa XV  thành phố Hà Nội;`,
                    bold: true,
                    size: 28,
                  }),
                ],
                indent: {left: convertInchesToTwip(0.4)},
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `- Đ/c Nguyễn Văn Phong - Phó Bí thư Thành ủy; `,
                    bold: true,
                    size: 28,
                  }),
                ],
                indent: {left: convertInchesToTwip(0.4)},
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `- Đ/c Bùi Huyền Mai - UVTV, Trưởng Ban Tuyên giáo Thành ủy;`,
                    bold: true,
                    size: 28,
                  }),
                ],
                indent: {left: convertInchesToTwip(0.4)},
              }),
              ...topicsParagraph,
              new Paragraph({
                text: `Dự báo các nội dung dư luận quan tâm, báo chí phản ánh và các đề xuất, kiến nghị:`,
                numbering: {
                  reference: 'my-numbering',
                  level: 0,
                },
                heading: HeadingLevel.HEADING_2,
                style: 'stylePara',
              }),
              new Paragraph({
                indent: {start: convertInchesToTwip(0.4)},
                children: [
                  new TextRun({
                    text: `* Nội dung dư luận quan tâm, báo chí phản ánh:`,
                    size: 28,
                  }),
                  new TextRun({
                    text: `* Đề xuất, kiến nghị:`,
                    size: 28,
                    break: 1,
                  }),
                ],
                spacing: {
                  after: 300,
                },
              }),
              new Table({
                width: {size: 100, type: WidthType.PERCENTAGE},
                layout: TableLayoutType.FIXED,
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.LEFT,
                            children: [
                              new TextRun({
                                text: 'Nơi nhận:',
                                size: 28,
                                underline: true,
                                break: 0,
                              }),
                              new TextRun({
                                text: '- Như kính gửi (để b/c),',
                                size: 28,
                                underline: true,
                                break: 1,
                              }),
                              new TextRun({
                                text: '- Đ/c Phạm Thanh Học - Phó Ban TT;',
                                size: 28,
                                underline: true,
                                break: 1,
                              }),
                              new TextRun({
                                text: '- Lưu P.TT-TH, P.BC-XB.',
                                size: 28,
                                underline: true,
                                break: 1,
                              }),
                            ],
                          }),
                        ],
                        columnSpan: 4,
                      }),
                      new TableCell({
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [
                              new TextRun({
                                text: 'K/T TRƯỞNG BAN',
                                allCaps: true,
                                bold: true,
                                size: 28,
                                break: 0,
                              }),
                              new TextRun({
                                text: 'PHÓ TRƯỞNG BAN THƯỜNG TRỰC',
                                allCaps: true,
                                bold: true,
                                size: 28,
                                break: 1,
                              }),
                              new TextRun({
                                text: 'Phạm Thanh Học',
                                allCaps: true,
                                bold: true,
                                size: 28,
                                break: 3,
                              }),
                            ],
                          }),
                        ],
                        columnSpan: 8,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          },
        ],
      })
      addHistory.mutate({newData: {screen: 'Export', description: `Export báo cáo ngày - word`}, token})

      Packer.toBlob(doc).then((buffer) => {
        saveAs(buffer, 'report-day.docx')
      })
    } catch (error) {
      console.log(error)
    }
  }

  const exportToPdf = async () => {
    const data = await fetchData()
    let arrayTopics = []
    console.log(data)
    const getArrayTopics = data
      ?.filter((p) => p?.topicsInfo && p?.topicsInfo?.length)
      ?.forEach((p) =>
        p?.topicsInfo?.forEach((x) => {
          arrayTopics.push({
            name: x?.name,
            id: x?.id,
          })
        }),
      )
    let arrayTopicsId = []
    const getArrayTopicsId = data
      ?.filter((p) => p?.topicsInfo && p?.topicsInfo?.length)
      ?.forEach((p) => p?.topicsInfo?.forEach((x) => arrayTopicsId.push(x?.id)))
    const mergerTopics = mergeDedupe(arrayTopicsId)
    let topicsParagraph = []
    const arrayTopicsDocx = mergerTopics.forEach((p) => {
      let findContent = arrayTopics?.find((topic) => topic?.id == p)

      let contentsOfTopic = data?.filter((topic) =>
        topic.topicsInfo?.map((p) => p?.id)?.find((x) => arrayTopicsId.find((c) => c == p)),
      )
      topicsParagraph.push({
        name: findContent?.name || 'No topic',
        contents: contentsOfTopic,
      })
    })
    addHistory.mutate({newData: {screen: 'Export', description: `Export bản tin ngày - pdf`}, token})
    const blob = await pdf(<PDFfile data={topicsParagraph || []} queryDate={queryDate} />).toBlob()
    saveAs(blob, 'day.pdf')
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
  ]
  return (
    <>
      <SplitButton label="Xuất" model={items}></SplitButton>
      {/* <PDFViewer>
        <PDFfile data={}/>
      </PDFViewer> */}
    </>
  )
}
