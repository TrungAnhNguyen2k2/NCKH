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
    width: "10%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
  },
  row2: {
    width: "15%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
  },
  row3: {
    width: "20%",
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
    width: "25%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
  row6: {
    width: "15%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    wordBreak: "break-all",
    textAlign: "left",
  },
});

function PDFfile({ data, paragraphs }) {
  return (
    <>
      <Document>
        <Page style={styles?.page}>
          <View>
            <Text style={{ fontWeight: "bold", marginLeft: 20, marginBottom: 10, marginTop: 10, fontSize: 16, textAlign: "center" }}>{`Liên quan đến AAAAAAAAAAAAA`}</Text>
          </View>
          {paragraphs &&
            paragraphs?.length &&
            paragraphs.map((row, i) => (
              <View>
                <View>
                  <Text style={{ marginLeft: 20, marginRight: 20, marginBottom: 4, marginTop: 4, fontSize: 12 }}>{`Qua nắm bắt thông tin, từ ${moment(row?.start || new Date()).format("HH")}h${moment(row?.start || new Date()).format("mm")} ngày ${moment(row?.start || new Date()).format(
                    "DD.MM"
                  )} đến ${moment(row?.end || new Date()).format("HH")}h${moment(row?.end || new Date()).format("mm")} ${moment(row?.end || new Date()).format("DD.MM")}, trên mạng xã hội xuất hiện một số tin như sau:`}</Text>
                </View>
                <View>
                  <Text style={{ marginLeft: 20, marginRight: 20, marginBottom: 10, marginTop: 4, fontSize: 12 }}>{`Trên nhiều trang Facebook, các tài khoản  câu view,  câu like tiếp  tục đưa tin, chia sẻ các hình ảnh, video về XXXXXXXXXXXX`}</Text>
                </View>
                <View>
                  <Text style={{ marginLeft: 20, marginRight: 20, marginBottom: 10, marginTop: 4, fontSize: 12 }}>{`Nhiều bình luận đưa ra các nghi ngờ về YYYYYYYY  nhằm  gây  nhiễu  thông tin  liên  quan đến vụ án, làm ảnh hưởng đến uy tín của ABC.`}</Text>
                </View>
                <View>
                  <Text style={{ marginLeft: 20, marginRight: 20, marginBottom: 10, marginTop: 4, fontSize: 12 }}>{`Qua nắm bắt thông tin, từ ${moment(row?.start || new Date()).format("HH")}h${moment(row?.start || new Date()).format("mm")} ngày ${moment(row?.start || new Date()).format(
                    "DD.MM"
                  )} đến ${moment(row?.end || new Date()).format("HH")}h${moment(row?.end || new Date()).format("mm")} ${moment(row?.end || new Date()).format("DD.MM")}, tài khoản facebook “sss” đăng tải 07 video liên quan đến ${
                    row?.profile
                  } của zzzz ( cập nhật mới nhất đã xóa 03 video) chủ yếu zzz. Trong video, có 1 nhóm cccc được cho là người thân của OOOOO`}</Text>
                </View>
                <View>
                  <Text style={{ marginLeft: 20, marginRight: 20, marginBottom: 10, marginTop: 4, fontSize: 12 }}>{`Qua nắm bắt thông tin, từ ${moment(row?.start || new Date()).format("HH")}h${moment(row?.end || new Date()).format("mm")} ngày ${moment(row?.start || new Date()).format(
                    "DD.MM"
                  )} đến ${moment(row?.end || new Date()).format("HH")}h${moment(row?.end || new Date()).format("mm")} ${moment(row?.end || new Date()).format("DD.MM")}, trên mạng xã hội xuất hiện một số tin như sau:`}</Text>
                </View>
                <View>
                  <Text
                    style={{ marginLeft: 20, marginRight: 20, marginBottom: 10, marginTop: 4, fontSize: 12 }}
                  >{`Một số trang Facebook, các tài khoản câu view, câu like tiếp tục  đưa tin, chia sẻ các hình ảnh, video về FFFFFF nhằm gây nhiễu thông tin liên quan đến vụ án, làm ảnh hưởng đến uy tín của QQQQQ.`}</Text>
                </View>
              </View>
            ))}
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
            </View>
            {data &&
              data?.length &&
              data
                .filter((p) => p.type == "FB_POST")
                .map((row, i) => (
                  <View key={i} style={styles.row} wrap={true}>
                    <Text style={styles.row1}>
                      <Text style={styles.bold}>{row?.stt}</Text>
                    </Text>
                    <Text style={styles.row2}>{row?.title}</Text>
                    <Text style={styles.row3}>{row?.sourcename}</Text>
                    <Text style={styles.row4}>{row?.postedat}</Text>
                    <Text style={styles.row5}>{row?.sourcelink}</Text>
                    <Text style={styles.row6}>{row?.totalReactions}</Text>
                  </View>
                ))}
          </View>
          <View>
            <Text style={{ fontWeight: "bold", marginLeft: 20, marginBottom: 10, marginTop: 10, fontSize: 14 }}>{`Thống kê trên kênh Website  có 08 video nội dung sai sự thật về  XXXX từ ngày 15.6 đến 16.6`}</Text>
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
            </View>
            {data &&
              data?.length &&
              data
                .filter((p) => p.type == "WEBSITE_POST")
                .map((row, i) => (
                  <View key={i} style={styles.row} wrap={true}>
                    <Text style={styles.row1}>
                      <Text style={styles.bold}>{row?.stt}</Text>
                    </Text>
                    <Text style={styles.row2}>{row?.title}</Text>
                    <Text style={styles.row3}>{row?.sourcename}</Text>
                    <Text style={styles.row4}>{row?.postedat}</Text>
                    <Text style={styles.row5}>{row?.sourcelink}</Text>
                    <Text style={styles.row6}>{row?.totalReactions}</Text>
                  </View>
                ))}
          </View>
        </Page>
      </Document>
    </>
  );
}

export default PDFfile;
