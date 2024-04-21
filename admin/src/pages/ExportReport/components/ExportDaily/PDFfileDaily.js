import React from "react";
import { Document, Page, StyleSheet, Text, View, Font } from "@react-pdf/renderer";
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
    marginBottom: 10,
    fontFamily: "Ubuntu",
    width: "210mm",
  },
  section: {
    marginLeft: 20,
    marginRight: 20,
  },
  text: {
    textAlign: "justify",
    fontSize: 13,
    breakWord: "break-all",
  },
});

function PDFfile({ data }) {
  return (
    <>
      <Document>
        <Page style={styles?.page}>
          <View>
            <Text style={{ textAlign: "center", fontSize: 20 }}>Mẫu tin ngắn: 5W2H</Text>
          </View>
          <View style={styles?.section}>
            {data &&
              data?.length &&
              data.map((row, i) => (
                <View key={i} wrap={true}>
                  <Text style={styles?.text}>{row}</Text>
                </View>
              ))}
          </View>
        </Page>
      </Document>
    </>
  );
}

export default PDFfile;
