export function getReqHeaderCrawlChannelVideo() {
  const headerReq = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
    "sec-ch-ua-arch": '"x86"',
    "sec-ch-ua-bitness": '"64"',
    "sec-ch-ua-full-version": '"111.0.5563.110"',
    "sec-ch-ua-full-version-list":
      '"Google Chrome";v="111.0.5563.110", "Not(A:Brand";v="8.0.0.0", "Chromium";v="111.0.5563.110"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": "",
    "sec-ch-ua-platform": '"Linux"',
    "sec-ch-ua-platform-version": '"5.19.0"',
    "sec-ch-ua-wow64": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "same-origin",
    "sec-fetch-site": "same-origin",
    "x-goog-visitor-id": "CgtNZkk0djZDTXkyNCip4PqgBg%3D%3D",
    "x-youtube-bootstrap-logged-in": "false",
    "x-youtube-client-name": "1",
    "x-youtube-client-version": "2.20230323.03.00",
    // cookie:
    //   "GPS=1; YSC=Pt9zfOxD7aE; VISITOR_INFO1_LIVE=MfI4v6CMy24; PREF=tz=Asia.Saigon; ST-l2sgor=itct=CBkQ8JMBGAYiEwjzs_ib1Pb9AhWJRSoKHc5JD4c%3D&csn=MC4yNzc3NjA3NDQ2MjQ0Mzg1Ng..&endpoint=%7B%22clickTrackingParams%22%3A%22CBkQ8JMBGAYiEwjzs_ib1Pb9AhWJRSoKHc5JD4c%3D%22%2C%22commandMetadata%22%3A%7B%22webCommandMetadata%22%3A%7B%22url%22%3A%22%2F%40bongdasohd%2Fvideos%22%2C%22webPageType%22%3A%22WEB_PAGE_TYPE_CHANNEL%22%2C%22rootVe%22%3A3611%2C%22apiUrl%22%3A%22%2Fyoutubei%2Fv1%2Fbrowse%22%7D%7D%2C%22browseEndpoint%22%3A%7B%22browseId%22%3A%22UCYFwnZJCd84ecRGipa3zVZw%22%2C%22params%22%3A%22EgZ2aWRlb3PyBgQKAjoA%22%2C%22canonicalBaseUrl%22%3A%22%2F%40bongdasohd%22%7D%7D",
    // Referer: `https://www.youtube.com/channel/${channelId}`,
    "Referrer-Policy": "strict-origin-when-cross-origin",
  }
  return headerReq
}
export function getReqHeaderCrawlChannelShort(channelId: string) {
  const headerReq = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "sec-ch-ua": '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
    "sec-ch-ua-arch": '"x86"',
    "sec-ch-ua-bitness": '"64"',
    "sec-ch-ua-full-version": '"119.0.6045.199"',
    "sec-ch-ua-full-version-list":
      '"Google Chrome";v="119.0.6045.199", "Chromium";v="119.0.6045.199", "Not?A_Brand";v="24.0.0.0"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": '""',
    "sec-ch-ua-platform": '"Linux"',
    "sec-ch-ua-platform-version": '"6.2.0"',
    "sec-ch-ua-wow64": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "same-origin",
    "sec-fetch-site": "same-origin",
    "x-goog-visitor-id": "CgtNOUx5cTFhbWs3NCini7qrBjIICgJWThICGgA%3D",
    "x-youtube-bootstrap-logged-in": "false",
    "x-youtube-client-name": "1",
    "x-youtube-client-version": "2.20231204.01.00",
    cookie:
      "GPS=1; YSC=XAUMj9mDhlI; VISITOR_INFO1_LIVE=M9Lyq1amk74; VISITOR_PRIVACY_METADATA=CgJWThICGgA%3D; PREF=tz=Asia.Saigon; ST-afpl2h=itct=CB4Q8JMBGAciEwikjI7-mveCAxW_m1YBHV6uB1g%3D&csn=MC4yMjk4NTMyMzY4MzU0MTI3&endpoint=%7B%22clickTrackingParams%22%3A%22CB4Q8JMBGAciEwikjI7-mveCAxW_m1YBHV6uB1g%3D%22%2C%22commandMetadata%22%3A%7B%22webCommandMetadata%22%3A%7B%22url%22%3A%22%2F%40bongda24hofficial%2Fshorts%22%2C%22webPageType%22%3A%22WEB_PAGE_TYPE_CHANNEL%22%2C%22rootVe%22%3A3611%2C%22apiUrl%22%3A%22%2Fyoutubei%2Fv1%2Fbrowse%22%7D%7D%2C%22browseEndpoint%22%3A%7B%22browseId%22%3A%22UCaJtPB6tgY9tdIV_ieMn36g%22%2C%22params%22%3A%22EgZzaG9ydHPyBgUKA5oBAA%253D%253D%22%2C%22canonicalBaseUrl%22%3A%22%2F%40bongda24hofficial%22%7D%7D",
    Referer: `https://www.youtube.com/channel/${channelId}/shorts`,
    "Referrer-Policy": "strict-origin-when-cross-origin",
  }
  return headerReq
}
export function getReqHeaderSearchYoutube(keyword: string) {
  keyword = encodeURI(keyword.trim().replaceAll(" ", "+"))
  const headerReq = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "application/json",
    "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
    "sec-ch-ua-arch": '"x86"',
    "sec-ch-ua-bitness": '"64"',
    "sec-ch-ua-full-version": '"111.0.5563.64"',
    "sec-ch-ua-full-version-list":
      '"Google Chrome";v="111.0.5563.64", "Not(A:Brand";v="8.0.0.0", "Chromium";v="111.0.5563.64"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-model": "",
    "sec-ch-ua-platform": '"Linux"',
    "sec-ch-ua-platform-version": '"5.19.0"',
    "sec-ch-ua-wow64": "?0",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "same-origin",
    "sec-fetch-site": "same-origin",
    "x-goog-visitor-id": "CgswbGVJcVBfZjl3RSi5itugBg%3D%3D",
    "x-youtube-bootstrap-logged-in": "false",
    "x-youtube-client-name": "1",
    "x-youtube-client-version": "2.20230317.00.00",
    // cookie:
    //   "GPS=1; YSC=mwafZlqcu-g; VISITOR_INFO1_LIVE=0leIqP_f9wE; PREF=tz=Asia.Saigon; ST-1np81gh=itct=CDIQk3UYACITCILOnZ_H5_0CFdq6VgEdPTMPOQ%3D%3D&csn=MC43OTI5MzE0NDk3Njg3ODY1&endpoint=%7B%22clickTrackingParams%22%3A%22CDIQk3UYACITCILOnZ_H5_0CFdq6VgEdPTMPOQ%3D%3D%22%2C%22commandMetadata%22%3A%7B%22webCommandMetadata%22%3A%7B%22url%22%3A%22%2Fresults%3Fsearch_query%3Dqu%25C3%25A2n%2B%25C4%2591%25E1%25BB%2599i%26sp%3DEgIIAQ%25253D%25253D%22%2C%22webPageType%22%3A%22WEB_PAGE_TYPE_SEARCH%22%2C%22rootVe%22%3A4724%7D%7D%2C%22searchEndpoint%22%3A%7B%22query%22%3A%22qu%C3%A2n%20%C4%91%E1%BB%99i%22%2C%22params%22%3A%22EgIIAQ%253D%253D%22%7D%7D",
    // Referer: `https://www.youtube.com/results?search_query=${keyword}`,
    // "Referrer-Policy": "strict-origin-when-cross-origin",
    // "referer": `https://www.youtube.com/results?search_query=${keyword}`,
    // "referrer-Policy": "strict-origin-when-cross-origin",
  }
  return headerReq
}
export function getReqBodyCrawlChannelVideo(channelId: string, continuation: string | null) {
  const bodyReq = {
    context: {
      client: {
        hl: "en",
        gl: "VN",
        remoteHost: "2a09:bac5:d45f:e6:0:0:17:11d",
        deviceMake: "",
        deviceModel: "",
        visitorData: "CgtNZkk0djZDTXkyNCip4PqgBg%3D%3D",
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36,gzip(gfe)",
        clientName: "WEB",
        clientVersion: "2.20230323.03.00",
        osName: "X11",
        osVersion: "",
        originalUrl: `https://www.youtube.com/channel/${channelId}/videos`,
        platform: "DESKTOP",
        clientFormFactor: "UNKNOWN_FORM_FACTOR",
        configInfo: {
          appInstallData:
            "CKng-qAGEKLsrgUQieiuBRCgt_4SEI73rgUQzPWuBRCL6q4FEOSz_hIQzK7-EhC4i64FELac_hIQ7YavBRC41K4FEMzfrgUQqrL-EhDi1K4FENOs_hIQv5CvBRDn964FEOPyrgUQ5aD-EhDujK8FEOC1_hIQmNquBQ%3D%3D",
        },
        timeZone: "Asia/Saigon",
        browserName: "Chrome",
        browserVersion: "111.0.0.0",
        acceptHeader:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        deviceExperimentId: "ChxOekl4TkRNNU56TTBORFl4TURJd01UTXhNQT09EKng-qAGGKng-qAG",
        screenWidthPoints: 961,
        screenHeightPoints: 962,
        screenPixelDensity: 1,
        screenDensityFloat: 1,
        utcOffsetMinutes: 420,
        userInterfaceTheme: "USER_INTERFACE_THEME_LIGHT",
        memoryTotalKbytes: "8000000",
        mainAppWebInfo: {
          graftUrl: `https://www.youtube.com/channel/${channelId}/videos`,
          pwaInstallabilityStatus: "PWA_INSTALLABILITY_STATUS_UNKNOWN",
          webDisplayMode: "WEB_DISPLAY_MODE_BROWSER",
          isWebNativeShareAvailable: false,
        },
      },
      user: {
        lockedSafetyMode: false,
      },
      request: {
        useSsl: true,
        //@ts-ignore
        internalExperimentFlags: [],
        //@ts-ignore
        consistencyTokenJars: [],
      },
      clickTracking: {
        clickTrackingParams: "CBkQ8JMBGAYiEwjzs_ib1Pb9AhWJRSoKHc5JD4c=",
      },
      adSignalsInfo: {
        params: [
          {
            key: "dt",
            value: "1679732777739",
          },
          {
            key: "flash",
            value: "0",
          },
          {
            key: "frm",
            value: "0",
          },
          {
            key: "u_tz",
            value: "420",
          },
          {
            key: "u_his",
            value: "6",
          },
          {
            key: "u_h",
            value: "1080",
          },
          {
            key: "u_w",
            value: "1920",
          },
          {
            key: "u_ah",
            value: "1036",
          },
          {
            key: "u_aw",
            value: "1920",
          },
          {
            key: "u_cd",
            value: "24",
          },
          {
            key: "bc",
            value: "31",
          },
          {
            key: "bih",
            value: "962",
          },
          {
            key: "biw",
            value: "946",
          },
          {
            key: "brdim",
            value: "0,0,0,0,1920,0,1920,1036,961,962",
          },
          {
            key: "vis",
            value: "1",
          },
          {
            key: "wgl",
            value: "true",
          },
          {
            key: "ca_type",
            value: "image",
          },
        ],
      },
    },
    ...(!continuation && {browseId: channelId}),
    ...(!continuation && {params: "EgZ2aWRlb3PyBgQKAjoA"}),
    ...(continuation && {continuation: continuation}),
  }
  return JSON.stringify(bodyReq)
}
export function getReqBodyCrawlChannelShort(channelId: string, continuation: string | null) {
  const bodyReq = {
    context: {
      client: {
        hl: "en",
        gl: "VN",
        remoteHost: "2402:800:61b3:12fd:ad66:8166:a744:acb2",
        deviceMake: "",
        deviceModel: "",
        visitorData: "CgtNOUx5cTFhbWs3NCini7qrBjIICgJWThICGgA%3D",
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36,gzip(gfe)",
        clientName: "WEB",
        clientVersion: "2.20231204.01.00",
        osName: "X11",
        osVersion: "",
        originalUrl: `https://www.youtube.com/channel/${channelId}/shorts`,
        platform: "DESKTOP",
        clientFormFactor: "UNKNOWN_FORM_FACTOR",
        configInfo: {
          appInstallData:
            "CKeLuqsGELfvrwUQiOOvBRDd6P4SEM-NsAUQppqwBRDZya8FEJ6LsAUQ5LP-EhDNlbAFEKiasAUQ4divBRCa8K8FEKy3rwUQvPmvBRC4i64FEKuCsAUQ0OKvBRDJ968FEL75rwUQ7qKvBRCY_P4SEKXC_hIQ49ivBRDqw68FEJaDsAUQiIewBRD1-a8FEK-HsAUQ65OuBRCikrAFEK7U_hIQ29ivBRDh8q8FEL22rgUQ4tSuBRDpjLAFEKKBsAUQmZGwBRCxh7AFENWIsAUQvZmwBRC-irAFEOe6rwUQq4ewBRCth7AFENSSsAUQmZSwBRD1-_4SEOvo_hIQ_IWwBRDT4a8FEN_YrwUQ1-mvBRDHg7AFEInorgUQ1KGvBRDamLAFEJT6_hIQzK7-EhDcmbAFELfq_hIQsPv-EhDM364FEKaBsAUQqfevBRDcgrAFENuvrwUQ-oiwBRDZg_8SELScsAU%3D",
        },
        userInterfaceTheme: "USER_INTERFACE_THEME_LIGHT",
        browserName: "Chrome",
        browserVersion: "119.0.0.0",
        acceptHeader:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        deviceExperimentId: "ChxOek13T0RreU5qRTVPREUzTmpVM05qWTBNUT09EKeLuqsGGKeLuqsG",
        screenWidthPoints: 1920,
        screenHeightPoints: 408,
        screenPixelDensity: 1,
        screenDensityFloat: 1,
        utcOffsetMinutes: 420,
        memoryTotalKbytes: "8000000",
        mainAppWebInfo: {
          graftUrl: `/channel/${channelId}/shorts`,
          pwaInstallabilityStatus: "PWA_INSTALLABILITY_STATUS_UNKNOWN",
          webDisplayMode: "WEB_DISPLAY_MODE_BROWSER",
          isWebNativeShareAvailable: false,
        },
        timeZone: "Asia/Saigon",
      },
      user: {lockedSafetyMode: false},
      //@ts-ignore
      request: {useSsl: true, internalExperimentFlags: [], consistencyTokenJars: []},
      clickTracking: {clickTrackingParams: "CB4Q8JMBGAciEwikjI7-mveCAxW_m1YBHV6uB1g="},
      adSignalsInfo: {
        params: [
          {key: "dt", value: "1701741991854"},
          {key: "flash", value: "0"},
          {key: "frm", value: "0"},
          {key: "u_tz", value: "420"},
          {key: "u_his", value: "3"},
          {key: "u_h", value: "1080"},
          {key: "u_w", value: "1920"},
          {key: "u_ah", value: "1080"},
          {key: "u_aw", value: "1920"},
          {key: "u_cd", value: "24"},
          {key: "bc", value: "31"},
          {key: "bih", value: "408"},
          {key: "biw", value: "1905"},
          {key: "brdim", value: "1920,0,1920,0,1920,0,1920,1036,1920,408"},
          {key: "vis", value: "1"},
          {key: "wgl", value: "true"},
          {key: "ca_type", value: "image"},
        ],
      },
    },
    browseId: channelId,
    params: "EgZzaG9ydHPyBgUKA5oBAA%3D%3D",
  }
  return JSON.stringify(bodyReq)
}
export function getReqBodySearchYoutube(keyword: string, continuation: string | null) {
  const uriKeyword = encodeURI(keyword.trim().replaceAll(" ", "+"))

  const bodyReq = {
    context: {
      client: {
        hl: "en",
        gl: "VN",
        remoteHost: "2a09:bac5:d45c:16dc:0:0:247:11",
        deviceMake: "",
        deviceModel: "",
        visitorData: "CgtJSWxETDRIVUZURSjJv9egBg%3D%3D",
        userAgent:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36,gzip(gfe)",
        clientName: "WEB",
        clientVersion: "2.20230317.00.00",
        osName: "X11",
        osVersion: "",
        originalUrl: `https://www.youtube.com/results?search_query=${uriKeyword}`,
        platform: "DESKTOP",
        clientFormFactor: "UNKNOWN_FORM_FACTOR",
        configInfo: {
          appInstallData:
            "CMm_16AGEMzfrgUQ06z-EhC41K4FELiLrgUQ4pOvBRDi1K4FEMyu_hIQ5_euBRC0r_4SEO2GrwUQ5aD-EhC_kK8FEI73rgUQzPWuBRDks_4SEICz_hIQtpz-EhDk8q4FEInorgUQvbauBRCU-K4FEKLsrgUQ0PeuBQ%3D%3D",
        },
        browserName: "Chrome",
        browserVersion: "111.0.0.0",
        acceptHeader:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        deviceExperimentId: "ChxOekl4TVRreE5qUXpORFk0TXpNM05qYzVNQT09EMm_16AGGMm_16AG",
        screenWidthPoints: 1024,
        screenHeightPoints: 962,
        screenPixelDensity: 1,
        screenDensityFloat: 1,
        utcOffsetMinutes: 420,
        userInterfaceTheme: "USER_INTERFACE_THEME_LIGHT",
        memoryTotalKbytes: "8000000",
        mainAppWebInfo: {
          graftUrl: `/results?search_query=${uriKeyword}`,
          pwaInstallabilityStatus: "PWA_INSTALLABILITY_STATUS_UNKNOWN",
          webDisplayMode: "WEB_DISPLAY_MODE_BROWSER",
          isWebNativeShareAvailable: false,
        },
        timeZone: "Asia/Saigon",
      },
      user: {
        lockedSafetyMode: false,
      },
      request: {
        useSsl: true,
        //@ts-ignore
        internalExperimentFlags: [],
        //@ts-ignore
        consistencyTokenJars: [],
      },
      clickTracking: {
        clickTrackingParams: "CA0Q7VAiEwi-3POv7OX9AhUSqlYBHdCpAds=",
      },
      adSignalsInfo: {
        params: [
          {
            key: "dt",
            value: "1679155147089",
          },
          {
            key: "flash",
            value: "0",
          },
          {
            key: "frm",
            value: "0",
          },
          {
            key: "u_tz",
            value: "420",
          },
          {
            key: "u_his",
            value: "2",
          },
          {
            key: "u_h",
            value: "1080",
          },
          {
            key: "u_w",
            value: "1920",
          },
          {
            key: "u_ah",
            value: "1036",
          },
          {
            key: "u_aw",
            value: "1920",
          },
          {
            key: "u_cd",
            value: "24",
          },
          {
            key: "bc",
            value: "31",
          },
          {
            key: "bih",
            value: "947",
          },
          {
            key: "biw",
            value: "1008",
          },
          {
            key: "brdim",
            value: "0,0,0,0,1920,0,1920,1036,1024,962",
          },
          {
            key: "vis",
            value: "1",
          },
          {
            key: "wgl",
            value: "true",
          },
          {
            key: "ca_type",
            value: "image",
          },
        ],
      },
    },
    ...(!continuation && {query: keyword}),
    ...(!continuation && {params: "EgQIARAB"}),
    ...(continuation && {continuation: continuation}),
  }
  return JSON.stringify(bodyReq)
}
export function renderPostedAt(time: string, lastCrawledAt: Date) {
  const now = new Date()
  let resultTime = new Date()
  if (time !== "") {
    if (
      time.includes("tuần") ||
      time.includes("weeks") ||
      time.includes("tháng") ||
      time.includes("month") ||
      time.includes("năm") ||
      time.includes("year")
    ) {
      return {postedAt: now, crawl: false}
    } else if (time.includes("day") || time.includes("ngày")) {
      const num = Number(time.replace(/\D/g, ""))
      resultTime = new Date(now.setDate(now.getDate() - num))
    } else if (time.includes("hour") || time.includes("giờ")) {
      const num = Number(time.replace(/\D/g, ""))
      resultTime = new Date(now.setHours(now.getHours() - num))
    } else if (time.includes("minute") || time.includes("phút")) {
      const num = Number(time.replace(/\D/g, ""))
      resultTime = new Date(now.setMinutes(now.getMinutes() - num))
    }
    if (resultTime > lastCrawledAt) {
      return {postedAt: resultTime, crawl: true}
    } else {
      return {postedAt: resultTime, crawl: false}
    }
  } else {
    return {postedAt: now, crawl: true}
  }
}
