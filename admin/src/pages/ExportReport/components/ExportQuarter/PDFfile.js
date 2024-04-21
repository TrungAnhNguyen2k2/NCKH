import React from "react";
import { Document, Page, StyleSheet, Text, View, Font } from "@react-pdf/renderer";
import moment from "moment";
// Font.register({
//   family: "Ubuntu",
//   fonts: [
//     {
//       src: "https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf",
//     },
//     {
//       src: "https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf",
//       fontWeight: "bold",
//     },
//     {
//       src: "https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf",
//       fontWeight: "normal",
//       fontStyle: "italic",
//     },
//   ],
// });

const styles = StyleSheet.create({
  page: {
    marginTop: 10,
    marginBottom: 20,
    // fontFamily: "Ubuntu",
  },
  table: {
    width: "210mm",
    fontSize: 12,
    
  },
  section: { marginLeft: 20, marginRight: 20 },
  row: {
    display: "flex",
    flexDirection: "row",
    borderTop: "1px solid #EEE",
    textAlign: "center",
    marginLeft: 20,
    marginRight: 20,
  },
  header: {
    borderTop: "1px solid #EEE",
    textAlign: "center",
  },
  headerTitle: {
    textAlign: "center",
    fontSize: 22,
    marginBottom: 3,
  },
  description1: {
    textAlign: "center",
    fontSize: 12,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 3,
  },
  description2: {
    textAlign: "justify",
    fontSize: 12,
    marginLeft: 20,
    marginBottom: 5,
    marginRight: 20,
  },
  bold: {
    fontWeight: "bold",
  },
  // So Declarative and unDRY 👌
  row1: {
    width: "5%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
  },
  row2: {
    width: "10%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
  },
  row3: {
    width: "10%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
  row4: {
    width: "15%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
  row5: {
    width: "15%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
  row6: {
    width: "10%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
  row7: {
    width: "10%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
  row8: {
    width: "13%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
  row9: {
    width: "12%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    borderRight: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
});

function PDFfile({ data, tags, mostReaction }) {
  return (
    <>
      <Document>
        <Page style={styles?.page}>
          <View>
            <Text style={styles.headerTitle}>BẢN TIN TỔNG HỢP</Text>
            <Text style={styles.description1}>{`(Từ 0h00 ${moment().startOf("quarter").format("DD/M/YYYY")} đến ${moment().format("hh")}h${moment().format("mm")} ngày ${moment().format("DD/M/YYYY")})`}</Text>
            <Text style={styles.description2}>{`Qua nắm bắt tính hình trên không gian mạng trong khoảng thời gian từ 0h00 ngày ${moment().startOf("quarter").format("DD/M/YYYY")} đến ${moment().format("hh")}h${moment().format("mm")} ${moment().format("DD/M/YYYY")} có một số tin chính đáng chú ý sau:`}</Text>
          </View>
          <View>
            {tags && tags?.length
              ? tags.map((p, i) => (
                  <Text style={{ fontSize: 12, marginLeft: 20, marginBottom: 3, fontWeight: "bold" }}>
                    {i + 1}. {p}
                  </Text>
                ))
              : ""}
          </View>
          <View>
            <Text style={{ fontWeight: "bold", marginLeft: 20,marginBottom: 4, marginTop: 4, fontSize: 13 }}>Bản tin nổi bật trong quý</Text>
          </View>
          <View style={styles?.table}>
            <View
              style={{
                ...styles?.row,
                ...styles.bold,
                ...styles.header,
                ...styles.section,
              }}
            >
              <Text style={styles?.row2}>Tiêu đề</Text>
              <Text style={{ ...styles?.row3, textAlign: "center" }}>Kênh đăng</Text>
              <Text style={{ ...styles?.row4, textAlign: "center" }}>Ngày đăng</Text>
              <Text style={{ ...styles?.row5, textAlign: "center" }}>Đường dẫn</Text>
              <Text style={{ ...styles?.row6, textAlign: "center" }}>Số lượng tương tác</Text>
              <Text style={{ ...styles?.row7, textAlign: "center" }}>Khoảng thời gian vi phạm</Text>
              <Text style={{ ...styles?.row8, textAlign: "center" }}>Nội dung vi phạm(chỉ rõ phút, giây vi phạm cái gì)</Text>
              <Text style={{ ...styles?.row9, textAlign: "center", width: "17%" }}>Vi phạm điều khoản</Text>
            </View>

            <View style={styles.row} wrap={true}>
              <Text style={styles.row2}>{mostReaction?.title}</Text>
              <Text style={styles.row3}>{mostReaction.sourcename}</Text>
              <Text style={styles.row4}>{mostReaction.postedat}</Text>
              <Text style={styles.row5}>{mostReaction.sourcelink}</Text>
              <Text style={styles.row6}>{mostReaction.totalReactions?.toString()}</Text>
              <Text style={styles.row7}>{mostReaction?.timeViolation}</Text>
              <Text style={styles.row8}>{mostReaction?.violationContent}</Text>
              <Text style={{...styles.row9, width: "17%"}}>{mostReaction?.violationEnactment}</Text>
            </View>
          </View>
          <View>
            <Text style={{ fontWeight: "bold", marginLeft: 20,marginBottom: 10, marginTop: 10, fontSize: 13 }}>{`Danh sách các bài viết vi phạm từ 0h00 ${moment().startOf("quarter").format("DD/M/YYYY")} đến ${moment().format("hh")}h${moment().format("mm")} ngày ${moment().format("DD/M/YYYY")})`}</Text>
          </View>
          <View style={styles?.table}>
            <View
              style={{
                ...styles?.row,
                ...styles.bold,
                ...styles.header,
                ...styles.section,
              }}
            >
              <Text style={styles?.row1}>STT</Text>
              <Text style={styles?.row2}>Tiêu đề</Text>
              <Text style={{ ...styles?.row3, textAlign: "center" }}>Kênh đăng</Text>
              <Text style={{ ...styles?.row4, textAlign: "center" }}>Ngày đăng</Text>
              <Text style={{ ...styles?.row5, textAlign: "center" }}>Đường dẫn</Text>
              <Text style={{ ...styles?.row6, textAlign: "center" }}>Số lượng tương tác</Text>
              <Text style={{ ...styles?.row7, textAlign: "center" }}>Khoảng thời gian vi phạm</Text>
              <Text style={{ ...styles?.row8, textAlign: "center" }}>Nội dung vi phạm(chỉ rõ phút, giây vi phạm cái gì)</Text>
              <Text style={{ ...styles?.row9, textAlign: "center" }}>Vi phạm điều khoản</Text>
            </View>
            {data &&
              data?.length &&
              data.map((row, i) => (
                <View key={i} style={styles.row} wrap={true}>
                  <Text style={styles.row1}>
                    <Text style={styles.bold}>{row?.stt}</Text>
                  </Text>
                  <Text style={styles.row2}>{row?.title}</Text>
                  <Text style={styles.row3}>{row.sourcename}</Text>
                  <Text style={styles.row4}>{row.postedat}</Text>
                  <Text style={styles.row5}>{row.sourcelink}</Text>
                  <Text style={styles.row6}>{row.totalReactions?.toString()}</Text>
                  <Text style={styles.row7}>{row?.timeViolation}</Text>
                  <Text style={styles.row8}>{row?.violationContent}</Text>
                  <Text style={styles.row9}>{row?.violationEnactment}</Text>
                </View>
              ))}
          </View>
        </Page>
      </Document>
    </>
  );
}

export default PDFfile;
