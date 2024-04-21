import React from "react"
import axios from "axios"
import moment from "moment"
import PDFfile from "./PDFfile"
import * as FileSaver from "file-saver"
import * as XLSX from "xlsx"
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
  ExternalHyperlink,
} from "docx"
import {saveAs} from "file-saver"
import {Button} from "primereact/button"
import {pdf} from "@react-pdf/renderer"
import {useSelector} from "react-redux"
import {orderBy} from "lodash"
import {SplitButton} from "primereact/splitbutton"
import {useMutation} from "react-query"
import {createHistory} from "../../../../service/historyAPI"
export default function ExportWeek({queryDate}) {
  console.log("queryDate", queryDate)
  const token = useSelector((state) => state.user.token)
  const mergeDedupe = (arr) => {
    return [...new Set([].concat(...arr))]
  }
  const userId = useSelector((state) => state.user?.userData?.id || "")

  const addHistory = useMutation(createHistory, {
    onError: (e) => {
      console.log(e)
    },
  })
  let start = new Date(queryDate[0])
  console.log("start", start)
  let end = new Date(queryDate[1])
  start.setDate(start.getDate() - 1)
  start.setHours(6, 0, 0, 0)
  start = start.toISOString()
  end.setHours(6, 0, 0, 0)
  end = end.toISOString()
  const fetchData = async () => {
    let queryStr = `${process.env.REACT_APP_API_URL}/content?userHandle=handledPost&fromDate=${start}&toDate=${end}`
    const data = await axios.get(queryStr, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
    return data.data?.docs
  }

  const centerBold = (text) => {
    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
          size: 28,
        }),
      ],
      spacing: {
        after: 80,
      },
      alignment: AlignmentType.CENTER,
    })
  }
  const header2Bold = (text) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: "       " + text,
          bold: true,
          size: 28,
        }),
      ],
      spacing: {
        after: 80,
      },
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.LEFT,
    })
  }
  const normalParagraph = (text) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: "       " + text,
          size: 28,
        }),
      ],
      spacing: {
        after: 80,
      },
      alignment: AlignmentType.LEFT,
    })
  }
  const firstListYoutubeParagraph = (data) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: `       + ${moment(data.postedAt).format("HH:mm DD/MM/YYYY")}, trang youtube `,
          size: 28,
        }),
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: `${data.sourceInfo.name}`,
              style: "Hyperlink",
              size: 28,
            }),
          ],
          link: data.sourceInfo.link,
        }),
        new TextRun({
          text: ` đăng video có tiêu đề `,
          size: 28,
        }),
        new TextRun({
          text: `${data.title}`,
          size: 28,
          bold: true,
        }),
        new TextRun({
          text: data?.editedTextContent !== "" ? `  và nội dung ${data.editedTextContent}` : "",
          size: 28,
        }),
      ],
      spacing: {
        after: 80,
      },
      alignment: AlignmentType.LEFT,
    })
  }
  const firstListFacebookParagraph = (data) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: `       + ${moment(data.postedAt).format("HH:mm DD/MM/YYYY")}, tài khoản facebook `,
          size: 28,
        }),
        data.sourceInfo.type !== "FB_GROUP"
          ? new ExternalHyperlink({
              children: [
                new TextRun({
                  text: `${data.sourceInfo.name}`,
                  style: "Hyperlink",
                  size: 28,
                }),
              ],
              link: data.sourceInfo.link,
            })
          : new ExternalHyperlink({
              children: [
                new TextRun({
                  text: `${data.authorInfo.name}`,
                  style: "Hyperlink",
                  size: 28,
                }),
              ],
              link: data.authorInfo.link,
            }),
        data.sourceInfo.type !== "FB_GROUP"
          ? new TextRun({
              text: data?.editedTextContent !== "" ? `  đăng tin ${data.editedTextContent}` : data.textContent,
              size: 28,
            })
          : (new TextRun({
              text: `đăng trong nhóm `,
            }),
            new ExternalHyperlink({
              children: [
                new TextRun({
                  text: `${data.sourceInfo.name}`,
                  style: "Hyperlink",
                  size: 28,
                }),
              ],
              link: data.sourceInfo.link,
            }),
            new TextRun({
              text: data?.editedTextContent !== "" ? ` với nội dung ${data.editedTextContent}` : data.textContent,
            })),
      ],
      spacing: {
        after: 80,
      },
      alignment: AlignmentType.LEFT,
    })
  }
  const firstListWebsiteParagraph = (data) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: `       + ${moment(data.postedAt).format("HH:mm DD/MM/YYYY")}, website `,
          size: 28,
        }),
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: `${data.sourceInfo.name}`,
              style: "Hyperlink",
              size: 28,
            }),
          ],
          link: data.sourceInfo.link,
        }),
        new TextRun({
          text: ` đăng bài viết có tiêu đề `,
          size: 28,
        }),
        new TextRun({
          text: `${data.title}`,
          size: 28,
          bold: true,
        }),
        new TextRun({
          text: data?.editedTextContent !== "" ? `  và nội dung ${data.editedTextContent}` : "",
          size: 28,
        }),
      ],
      spacing: {
        after: 80,
      },
      alignment: AlignmentType.LEFT,
    })
  }
  const lotLoParagraph = (data) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: `       + ${moment(data.postedAt).format("HH:mm DD/MM/YYYY")}, nguồn tin `,
          size: 28,
        }),
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: `${data.sourceInfo.name}`,
              style: "Hyperlink",
              size: 28,
            }),
          ],
          link: data.sourceInfo.link,
        }),
        new TextRun({
          text:
            data?.editedTextContent !== ""
              ? `Đưa tin có nội dung ${data.editedTextContent}`
              : `Đưa tin có nội dung ${data.textContent}`,
          size: 28,
        }),
      ],
      spacing: {
        after: 80,
      },
      alignment: AlignmentType.LEFT,
    })
  }
  const exportWord = async () => {
    try {
      const data = await fetchData()
      const arrayTags = data
        ?.filter((p) => p?.tagsInfo && p?.tagsInfo?.length)
        ?.map((p) => p?.tagsInfo?.map((x) => x?.name))
      const mergerTags = mergeDedupe(arrayTags)
      const arrayTagsDocx = mergerTags.map(
        (p) =>
          new Paragraph({
            text: `${p}`,
            numbering: {
              reference: "my-numbering",
              level: 0,
            },
            heading: HeadingLevel.HEADING_2,
            style: "stylePara",
          }),
      )
      const tableHeader = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("STT")],
            width: {
              size: 3,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph("Ngày đăng")],
            width: {
              size: 5,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph("Kênh đăng")],
            width: {
              size: 10,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph("Đường dẫn")],
            width: {
              size: 15,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph("Nội dung")],
            width: {
              size: 67,
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
                    children: [new Paragraph(moment(p.postedAt).format("DD/MM"))],
                    // width: {
                    //   size: 10,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [new Paragraph(p?.sourceInfo?.name || "")],
                    // width: {
                    //   size: 20,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new ExternalHyperlink({
                            children: [
                              new TextRun({
                                text: `${p?.link}`,
                                style: "Hyperlink",
                                size: 28,
                              }),
                            ],
                            link: p?.link,
                          }),
                        ],
                      }),
                    ],
                    // width: {
                    //   size: 20,
                    //   type: WidthType.PERCENTAGE,
                    // },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph(
                        p?.editedTextContent !== "" ? p?.editedTextContent : p.textContent.substring(0, 200),
                      ),
                    ],
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
              reference: "my-numbering",
              levels: [
                {
                  level: 1,
                  format: LevelFormat.DECIMAL,
                  text: "%1.",
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
                  text: "%2)",
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
                color: "000000",
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
              id: "stylePara",
              name: "Style Paragraph",
              run: {
                color: "000000",
                size: 26,
                bold: true,
              },
            },
            {
              id: "stylePara1",
              name: "Style Paragraph 1",
              run: {
                color: "000000",
                size: 26,
              },
            },
          ],
        },
        sections: [
          {
            children: [
              //   new Paragraph({
              //     children: [
              //       new TextRun({
              //         text: "BẢN TIN TỔNG HỢP",
              //         bold: true,
              //         allCaps: true,
              //         size: 30,
              //       }),
              //     ],
              //     heading: HeadingLevel.HEADING_1,
              //     alignment: AlignmentType.CENTER,
              //   }),
              //   new Paragraph({
              //     children: [
              //       new TextRun({
              //         text: `(Từ 6h ${moment(start).format("DD/M/YYYY")} đến 6h ngày ${moment(end).format("DD/M/YYYY")})`,
              //         bold: true,
              //         size: 28,
              //       }),
              //     ],
              //     alignment: AlignmentType.CENTER,
              //   }),
              //   new Paragraph({
              //     children: [
              //       new TextRun({
              //         text: `Qua nắm bắt tính hình trên không gian mạng trong khoảng thời gian từ 6h ngày ${moment(
              //           start,
              //         ).format("DD/M/YYYY")} đến 6h ngày ${moment(start).format(
              //           "DD/M/YYYY",
              //         )} có một số tin chính đáng chú ý sau:`,
              //         size: 28,
              //       }),
              //     ],
              //     font: "Calibri",
              //     alignment: AlignmentType.JUSTIFIED,
              //   }),
              //   new Paragraph({
              //     children: [
              //       new TextRun({
              //         text: ``,
              //         size: 28,
              //       }),
              //     ],
              //     font: "Calibri",
              //     alignment: AlignmentType.JUSTIFIED,
              //   }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Phụ lục bản tin 6h ngày ${moment(end).format("DD/M/YYYY")}`,
                    size: 28,
                  }),
                ],
                font: "Calibri",
                alignment: AlignmentType.JUSTIFIED,
              }),
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
              table,
            ],
          },
        ],
      })
      addHistory.mutate({newData: {screen: "Export", description: `Export bản tin ngày - word`}, token})

      Packer.toBlob(doc).then((buffer) => {
        saveAs(buffer, "day.docx")
      })
    } catch (error) {
      console.log("Error when exportWord: ", error)
    }
  }
  const exportExcel = async () => {
    let queryStr = `${process.env.REACT_APP_API_URL}/content?userHandle=handledPost&fromDate=${start}&toDate=${end}`

    exportToCSV(queryStr, "day")
  }
  const exportToCSV = async (query, fileName) => {
    const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"
    const fileExtension = ".xlsx"
    const csvData = await axios.get(`${query}`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
    console.log("csvData", csvData)
    const dataYoutube = csvData?.data?.docs?.filter((e) => e.type === "WEBSITE_POST") || []
    const dateExport = dataYoutube.map((p, index) => ({
      STT: (index + 1).toString(),
      "Tiêu đề": p.title,
      "Kênh đăng": p?.sourceInfo?.name,
      "Ngày đăng": moment(p.postedAt).format("HH:mm DD/MM/YYYY"),
      "Đường dẫn": p?.link,
      "Số người xem": p?.views || 0,
      "Số lượng người đăng ký kênh": p?.sourceInfo?.metaInfo?.subscribe || "",
      "Khoảng thời gian vi phạm": p?.violationTimes || "",
      "Nội dung vi phạm(chỉ rõ phút, giây vi phạm cái gì)": p?.violationContent,
      "Vi phạm điều khoản": p?.violationEnactment,
    }))
    var wscols = [
      {wch: 3},
      {wch: 20},
      {wch: 15},
      {wch: 15},
      {wch: 40},
      {wch: 7},
      {wch: 7},
      {wch: 10},
      {wch: 40},
      {wch: 40},
    ]
    const ws = XLSX.utils.json_to_sheet(dateExport)
    ws["!cols"] = wscols
    const wb = {Sheets: {data: ws}, SheetNames: ["data"]}
    const excelBuffer = XLSX.write(wb, {bookType: "xlsx", type: "array"})
    const data = new Blob([excelBuffer], {type: fileType})
    addHistory.mutate({newData: {screen: "Export", description: `Export bản tin ngày - excel`}, token})
    FileSaver.saveAs(data, fileName + fileExtension)
  }
  const exportToPdf = async () => {
    const data = await fetchData()
    const arrayTags = data
      ?.filter((p) => p?.tagsInfo && p?.tagsInfo?.length)
      ?.map((p) => p?.tagsInfo?.map((x) => x?.name))
    const mergerTags = mergeDedupe(arrayTags)
    const formatData = data?.map((p, i) => ({
      stt: i,
      title: p.title,
      textcontent: p.textContent,
      postedat: moment(p.postedAt).format("DD/MM"),
      sourcename: p?.sourceInfo?.name,
      sourcelink: p?.sourceInfo?.link,
    }))
    addHistory.mutate({newData: {screen: "Export", description: `Export bản tin ngày - pdf`}, token})
    const blob = await pdf(<PDFfile data={formatData} tags={mergerTags} queryDate={queryDate} />).toBlob()
    saveAs(blob, "day.pdf")
  }
  const exportSumary = async () => {
    try {
      const data = await fetchData()

      const data1 = data.filter((e) => e.category === "ChongPhaDangNhaNuoc")
      const data1f = data1.filter((e) => e.type === "FB_POST")
      const data1fg = data1f.filter((e) => e.sourceInfo.type === "FB_GROUP")
      const data1fp = data1f.filter((e) => e.sourceInfo.type !== "FB_GROUP")
      const data1w = data1.filter((e) => e.type === "WEBSITE_POST")
      const data1y = data1.filter((e) => e.type === "YOUTUBE")

      const data2 = data.filter((e) => e.category === "ChongPhaQuanDoi")
      const data2f = data2.filter((e) => e.type === "FB_POST")
      const data2fg = data2f.filter((e) => e.sourceInfo.type === "FB_GROUP")
      const data2fp = data2f.filter((e) => e.sourceInfo.type !== "FB_GROUP")
      const data2w = data2.filter((e) => e.type === "WEBSITE_POST")
      const data2y = data2.filter((e) => e.type === "YOUTUBE")

      const data3 = data.filter((e) => e.category === "KhacLienQuanQuanDoi")
      const data3f = data3.filter((e) => e.type === "FB_POST")
      const data3fg = data3f.filter((e) => e.sourceInfo.type === "FB_GROUP")
      const data3fp = data3f.filter((e) => e.sourceInfo.type !== "FB_GROUP")
      const data3w = data3.filter((e) => e.type === "WEBSITE_POST")
      const data3wqlt = data3w.filter((e) => e.sourceInfo.isQuality === true)
      const data3wnqlt = data3w.filter((e) => e.sourceInfo.isQuality !== true)
      const data3y = data3.filter((e) => e.type === "YOUTUBE")

      const data4 = data.filter((e) => e.category === "LotLoTaiLieu")
      const data4f = data4.filter((e) => e.type === "FB_POST")
      const data4fg = data4f.filter((e) => e.sourceInfo.type === "FB_GROUP")
      const data4fp = data4f.filter((e) => e.sourceInfo.type !== "FB_GROUP")
      const data4w = data4.filter((e) => e.type === "WEBSITE_POST")
      const data4y = data4.filter((e) => e.type === "YOUTUBE")

      const data5 = data.filter((e) => e.category === "TinKhac")
      const data5f = data5.filter((e) => e.type === "FB_POST")
      const data5fg = data5f.filter((e) => e.sourceInfo.type === "FB_GROUP")
      const data5fp = data5f.filter((e) => e.sourceInfo.type !== "FB_GROUP")
      const data5w = data5.filter((e) => e.type === "WEBSITE_POST")
      const data5wqlt = data5w.filter((e) => e.sourceInfo.isQuality === true)
      const data5wnqlt = data5w.filter((e) => e.sourceInfo.isQuality !== true)
      const data5y = data5.filter((e) => e.type === "YOUTUBE")
      const arrayTags = data
        ?.filter((p) => p?.tagsInfo && p?.tagsInfo?.length)
        ?.map((p) => p?.tagsInfo?.map((x) => x?.name))
      const mergerTags = mergeDedupe(arrayTags)
      const arrayTagsDocx = mergerTags.map(
        (p) =>
          new Paragraph({
            text: `${p}`,
            numbering: {
              reference: "my-numbering",
              level: 0,
            },
            heading: HeadingLevel.HEADING_2,
            style: "stylePara",
          }),
      )
      const tableHeader = new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph("STT")],
            width: {
              size: 3,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph("Ngày đăng")],
            width: {
              size: 5,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph("Kênh đăng")],
            width: {
              size: 10,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph("Đường dẫn")],
            width: {
              size: 20,
              type: WidthType.PERCENTAGE,
            },
          }),
          new TableCell({
            children: [new Paragraph("Nội dung")],
            width: {
              size: 52,
              type: WidthType.PERCENTAGE,
            },
          }),
        ],
      })
      const table = new Table({
        width: {
          size: 3505,
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
                    width: {
                      size: 3,
                      type: WidthType.PERCENTAGE,
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph(moment(p.postedAt).format("DD/MM"))],
                    width: {
                      size: 5,
                      type: WidthType.PERCENTAGE,
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph(p?.sourceInfo?.name || "")],
                    width: {
                      size: 10,
                      type: WidthType.PERCENTAGE,
                    },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [
                          new ExternalHyperlink({
                            children: [
                              new TextRun({
                                text: `${p?.link}`,
                                style: "Hyperlink",
                                size: 28,
                              }),
                            ],
                            link: p?.link,
                          }),
                        ],
                      }),
                    ],
                    width: {
                      size: 20,
                      type: WidthType.PERCENTAGE,
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph(p?.textContent || "")],
                    width: {
                      size: 52,
                      type: WidthType.PERCENTAGE,
                    },
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
              reference: "my-numbering",
              levels: [
                {
                  level: 1,
                  format: LevelFormat.DECIMAL,
                  text: "%1.",
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
                  text: "%2)",
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
        styles: {},
        sections: [
          {
            children: [
              new Paragraph({
                text: "BẢN TIN TỔNG HỢP 6H",
                bold: true,
                size: 30,
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
              }),
              centerBold(
                `(Từ 6h00 ${moment(start).format("DD/MM/YYYY")} đến 6h00 ngày ${moment(end).format("DD/MM/YYYY")})`,
              ),
              normalParagraph(
                `Qua nắm bắt tính hình trên không gian mạng trong khoảng thời gian từ 6h ngày ${moment(start).format(
                  "DD/MM/YYYY",
                )} đến 6h ngày ${moment(start).format("DD/MM/YYYY")} có một số tin chính đáng chú ý sau:`,
              ),
              header2Bold("1. Tin liên quan đến hoạt động tuyên truyền, chống phá Đảng, Nhà nước"),
              ...data1y.map((e) => {
                return firstListYoutubeParagraph(e)
              }),
              ...data1f.map((e) => {
                return firstListFacebookParagraph(e)
              }),
              ...data1w.map((e) => {
                return firstListWebsiteParagraph(e)
              }),
              header2Bold("2. Tin liên quan đến Quân đội"),
              normalParagraph("a. Tin liên quan đến hoạt động tuyên truyền chống phá Quân đội"),
              data2y.length > 0
                ? normalParagraph(
                    `Qua rà soát từ 6h ${moment(start).format("DD/MM/YYYY")} đến 6h00 ngày ${moment(end).format(
                      "DD/MM/YYYY",
                    )} trên mạng xã hội youtube có một số nội dung đáng chú ý: `,
                  )
                : normalParagraph(""),
              ...data2y.map((e) => {
                return normalParagraph(`+ ${e.title.toUpperCase()}`)
              }),
              data2f.length > 0
                ? normalParagraph(
                    `Qua rà soát từ 6h ${moment(start).format("DD/MM/YYYY")} đến 6h00 ngày ${moment(end).format(
                      "DD/MM/YYYY",
                    )} trên mạng xã hội facebook có một số nội dung đáng chú ý: `,
                  )
                : normalParagraph(""),
              ...data2f.map((e) => {
                return normalParagraph(`+ ${e.editedTextContent !== "" ? e.editedTextContent : e.textContent}`)
              }),
              data2w.length > 0
                ? normalParagraph(
                    `Qua rà soát từ 6h ${moment(start).format("DD/MM/YYYY")} đến 6h00 ngày ${moment(end).format(
                      "DD/MM/YYYY",
                    )} trên các trang báo mạng có một số nội dung đáng chú ý: `,
                  )
                : normalParagraph(""),
              ...data2w.map((e) => {
                return normalParagraph(`+ ${e.title.toUpperCase()}`)
              }),
              normalParagraph("b. Tin khác liên quan Quân đội"),
              data3wqlt.length > 0 ? normalParagraph("- Báo chính thống đưa tin:") : normalParagraph(""),
              ...data3wqlt.map((e) => {
                return firstListWebsiteParagraph(e)
              }),
              data3wnqlt.length > 0 ? normalParagraph("- Một số báo khác đưa tin:") : normalParagraph(""),
              ...data3wnqlt.map((e) => {
                return firstListWebsiteParagraph(e)
              }),
              data3f.length > 0 ? normalParagraph("- Trên mạng xã hội facebook:") : normalParagraph(""),
              ...data3f.map((e) => {
                return firstListFacebookParagraph(e)
              }),
              data3y.length > 0 ? normalParagraph("- Trên youtube:") : normalParagraph(""),
              ...data3y.map((e) => {
                return firstListYoutubeParagraph(e)
              }),
              header2Bold("3. Tin lộ lọt tài liệu"),
              data4.length > 0
                ? normalParagraph("- Một số nguồn đưa tin")
                : normalParagraph("- Chưa phát hiện tài liệu lộ liên quan đến quân đội"),
              ...data4.map((e) => {
                return lotLoParagraph(e)
              }),
              header2Bold("4. Tin chú ý khác"),
              data5wqlt.length > 0 ? normalParagraph("- Báo chính thống đưa tin:") : normalParagraph(""),
              ...data5wqlt.map((e) => {
                return firstListWebsiteParagraph(e)
              }),
              data5wqlt.length > 0 ? normalParagraph("- Một số tờ báo khác đưa tin:") : normalParagraph(""),
              ...data5wnqlt.map((e) => {
                return firstListWebsiteParagraph(e)
              }),
              data5f.length > 0 ? normalParagraph("- Trên mạng xã hội facebook:") : normalParagraph(""),
              ...data5f.map((e) => {
                return firstListFacebookParagraph(e)
              }),
              data5y.length > 0 ? normalParagraph("- Trên youtube:") : normalParagraph(""),
              ...data5y.map((e) => {
                return firstListYoutubeParagraph(e)
              }),
              header2Bold("5. Yêu cầu bóc gỡ"),
              normalParagraph(
                `Rà soát và đưa vào danh dách đề nghị bóc gỡ ${
                  data1y.length + data2y.length + data3y.length + data4y.length + data5y.length
                } video xấu độc.`,
              ),
              normalParagraph(`(Bản tin chi tiết xem bản trên định dạng PDF) Người tổng hợp: `),
              centerBold(`Phụ lục bản tin 6h ngày ${moment(end).format("DD/MM/YYYY")})`),
              table,
            ],
          },
        ],
      })
      addHistory.mutate({newData: {screen: "Export", description: `Export bản tin ngày - word`}, token})

      Packer.toBlob(doc).then((buffer) => {
        saveAs(buffer, "BAN_TIN_6h_.docx")
      })
    } catch (error) {
      console.log("Error when exportWord: ", error)
    }
  }
  return (
    <div className="card">
      <div className="mb-4">
        <Button icon="pi pi-file" label="Bản tin 6h" onClick={exportSumary}></Button>
      </div>
      <div className="mb-4">
        <Button icon="pi pi-file" label="Phụ lục doc" onClick={exportWord}></Button>
      </div>
      <div className="mb-4">
        <Button icon="pi pi-file-excel" label="Phụ lục video youtube" onClick={exportExcel}></Button>
      </div>
    </div>
  )
}
