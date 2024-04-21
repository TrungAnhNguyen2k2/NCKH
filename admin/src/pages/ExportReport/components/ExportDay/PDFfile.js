import React from "react";
import { Document, Page, StyleSheet, Text, View, Font } from "@react-pdf/renderer";
import moment from "moment";
Font.register({
  family: "Ubuntu",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf",
    },
    {
      src: "https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf",
      fontWeight: "bold",
    },
    {
      src: "https://fonts.gstatic.com/s/questrial/v13/QdVUSTchPBm7nuUeVf7EuStkm20oJA.ttf",
      fontWeight: "normal",
      fontStyle: "italic",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    marginTop: 10,
    marginBottom: 20,
    fontFamily: "Ubuntu",
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
    width: "8%",
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
    wordBreak: "break-all",

  },
  row3: {
    width: "15%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
  row4: {
    width: "27%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    lineBreak: "anywhere",
    textAlign: "left",
  },
  row5: {
    width: "40%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderRight: "1px solid #EEE",
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
    
  },
});

function PDFfile({ data, tags, queryDate }) {
  return (
    <>
      <Document>
        <Page style={styles?.page}>
          <View>
            <Text style={styles.headerTitle}>BẢN TIN TỔNG HỢP</Text>
            <Text style={styles.description1}>{`(Từ 0h00 ${moment(queryDate).startOf("day").format("DD/M/YYYY")} đến ${moment(queryDate).format("DD/MM/YYYY") == moment(new Date()).format("DD/MM/YYYY") ? `${moment().format("HH")}h${moment().format("mm")}` : "23h59"} ngày ${moment(queryDate).format("DD/M/YYYY")})`}</Text>
            <Text style={styles.description2}>{`Qua nắm bắt tính hình trên không gian mạng trong khoảng thời gian từ 0h00 ngày ${moment(queryDate).startOf("day").format("DD/M/YYYY")} đến ${moment(queryDate).format("DD/MM/YYYY") == moment(new Date()).format("DD/MM/YYYY") ? `${moment().format("HH")}h${moment().format("mm")}` : "23h59"} ${moment(queryDate).format("DD/M/YYYY")} có một số tin chính đáng chú ý sau:`}</Text>
          </View>
          <View>
            {tags && tags?.length
              ? tags.map((p, i) => (
                  <Text style={{ fontSize: 12, marginLeft: 20, marginBottom: 3 }}>
                    {i + 1}. {p}
                  </Text>
                ))
              : ""}
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
              <Text style={styles?.row2}>Ngày đăng</Text>
              <Text style={{ ...styles?.row3, textAlign: "center" }}>Kênh đăng</Text>
              <Text style={{ ...styles?.row4, textAlign: "center" }}>Đường dẫn</Text>
              <Text style={{ ...styles?.row5, textAlign: "center" }}>Nội dung</Text>
            </View>
            {data &&
              data?.length &&
              data.map((row, i) => (
                <View key={i} style={styles.row} wrap={true}>
                  <Text style={styles.row1}>
                    <Text style={styles.bold}>{row?.stt}</Text>
                  </Text>
                  <Text style={styles.row2}>{row.postedat}</Text>
                  <Text style={styles.row3}>{row.sourcename}</Text>
                  <Text style={styles.row4}>{row.sourcelink}</Text>
                  <Text style={styles.row5}>{row.textcontent}</Text>
                </View>
              ))}
          </View>
        </Page>
      </Document>
    </>
  );
}

export default PDFfile;
