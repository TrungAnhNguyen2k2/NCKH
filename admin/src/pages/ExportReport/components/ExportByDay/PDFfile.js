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
    paddingBottom: 20,
    fontFamily: "Ubuntu",
    fontSize: 14,
  },
  table: {
    width: "210mm",
    fontSize: 14,
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
    fontSize: 15,
    marginBottom: 3,
  },
  description1: {
    textAlign: "center",
    fontSize: 14,
    marginLeft: 20,
    marginRight: 20,
    marginBottom: 3,
  },
  description2: {
    textAlign: "justify",
    fontSize: 14,
    marginLeft: 20,
    marginBottom: 5,
    marginRight: 20,
  },
  bold: {
    fontWeight: "bold",
  },
  // So Declarative and unDRY 👌
  cell1: {
    width: "35%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    borderBottom: "1px solid #EEE",
  },
  cell2: {
    width: "65%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    borderBottom: "1px solid #EEE",
    borderRight: "1px solid #EEE",
    wordBreak: "break-all",
  },
  cell3: {
    width: "40%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    borderBottom: "1px solid #EEE",
    textAlign: "left"
  },
  cell4: {
    width: "60%",
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 4,
    paddingRight: 4,
    borderLeft: "1px solid #EEE",
    borderBottom: "1px solid #EEE",
    borderRight: "1px solid #EEE",
    wordBreak: "break-all",
  },
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

function PDFfile({ data, queryDate }) {
  console.log(data);
  return (
    <>
      <Document>
        <Page style={styles?.page}>
          <View style={styles?.table}>
            <View
              style={{
                ...styles?.row,
                ...styles.bold,
                ...styles.header,
                ...styles.section,
              }}
            >
              <View style={styles?.cell1}>
                <Text>THÀNH UỶ HÀ NỘI</Text>
                <Text>BAN TUYÊN GIÁO</Text>
                <Text>*</Text>
                <Text>Số &nbsp; &nbsp; - BC/BTGTU</Text>
              </View>

              <View style={styles?.cell2}>
                <Text style={{ textDecoration: "underline", fontWeight: "bold", textAlign: "right" }}>ĐẢNG CỘNG SẢN VIỆT NAM</Text>
                <Text style={{ marginTop: 10, marginBottom: 10 }}></Text>
                <Text style={{ textAlign: "right" }}>Hà Nội, ngày&nbsp; tháng 10 năm 2022</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={{ ...styles.headerTitle, marginTop: 30 }}>BÁO CÁO </Text>
            <Text style={styles.description1}>{`Những thông tin báo chí phản ánh vụ việc bức xúc liên quan đến Hà Nội`}</Text>
            <Text style={styles.description1}>{`(Ngày 27 tháng 10 năm 2022)`}</Text>
          </View>
          <View style={{ marginLeft: 80, marginTop: 30, fontSize: 14, fontWeight: "bold" }}>
            <Text>Kính gửi:</Text>
            <Text style={{ textIndent: 10 }}>{`- N- Đ/c Đinh Tiến Dũng - Ủy viên Bộ Chính trị, Bí thư Thành ủy, 
Trưởng đoàn đại biểu Quốc hội khóa XV  thành phố Hà Nội;`}</Text>
            <Text style={{ textIndent: 10 }}>{`- Đ/c Nguyễn Văn Phong - Phó Bí thư Thành ủy;`}</Text>
            <Text style={{ textIndent: 10 }}>- Đ/c Bùi Huyền Mai - UVTV, Trưởng Ban Tuyên giáo Thành ủy;</Text>
          </View>
          <View style={{ marginLeft: 40, marginRight: 40, marginBottom: 10, fontSize: 14 }}>
            {data &&
              data?.length &&
              data.map((row, i) => (
                <View key={i}>
                  <Text style={{ marginBottom: 6, marginTop: 10, fontWeight: "bold" }}>{`${i + 1}.${row?.name}`}</Text>
                  <View>
                    {row?.contents &&
                      row?.contents?.length &&
                      row?.contents?.map((content, j) => (
                        <Text key={j} style={{ textAlign: "justify" }}>
                          <Text style={{ fontWeight: 600, textIndent: 20 }}>{`- ${content?.title}`}</Text>
                          <Text>{`(${content?.link} : ${moment(content.postedAt).format("DD/MM/YYYY")})`}</Text>
                          <Text>{content?.editTextContent ? content?.editTextContent : content?.textContent}</Text>
                        </Text>
                      ))}
                  </View>
                </View>
              ))}
            <View>
              <Text style={{ marginBottom: 6, marginTop: 10, fontWeight: "bold" }}>{`${data?.length + 1}.Dự báo các nội dung dư luận quan tâm, báo chí phản ánh và các đề xuất, kiến nghị:`}</Text>
              <View>
                <Text style={{ fontWeight: 600, textIndent: 20 }}>{`* Nội dung dư luận quan tâm, báo chí phản ánh:`}</Text>
                <Text style={{ fontWeight: 600, textIndent: 20 }}>{`* Đề xuất, kiến nghị:`}</Text>
              </View>
            </View>
          </View>
          <View style={styles?.table}>
            <View
              style={{
                ...styles?.row,
                ...styles.header,
                ...styles.section,
              }}
            >
              <View style={styles?.cell3}>
                <Text>Nơi nhận:</Text>
                <Text style={{ fontStyle: "italic" }}>- Như kính gửi (để b/c),</Text>
                <Text>- Đ/c Phạm Thanh Học - Phó Ban TT;</Text>
                <Text>- Lưu P.TT-TH, P.BC-XB.</Text>
              </View>

              <View style={styles?.cell4}>
                <Text style={{ fontWeight: "bold", textAlign: "center" }}>K/T TRƯỞNG BAN</Text>
                <Text style={{ marginBottom: 10, textAlign: "center" }}>PHÓ TRƯỞNG BAN THƯỜNG TRỰC</Text>
                <Text style={{ textAlign: "center" }}>Phạm Thanh Học</Text>
              </View>
            </View>
          </View>
        </Page>
      </Document>
    </>
  );
}

export default PDFfile;
