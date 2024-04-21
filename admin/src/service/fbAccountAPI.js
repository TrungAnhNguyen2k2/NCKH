import axios from "axios"
export const handleError = (err) => {
  if (err.response.data.msg) {
    throw new Error(err.response.data.msg)
  } else {
    throw new Error(err.message)
  }
}
export const getAllFbAccounts = async (query, token) => {
  // &createdAt_gte=${}&createdAt__lte=${}
  try {
    const res = await axios.get(`${query.queryKey[0]}`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
    if (res.data && res.data?.code && res?.data?.code != 200) {
      throw new Error(res?.data?.message || "Đã có lỗi")
    }
    return res.data
  } catch (error) {}
}
export const getFbAccountByToken = async ({queryKey, token}) => {
  // &createdAt_gte=${}&createdAt__lte=${}
  try {
    const res = await axios.get(`${queryKey}/${token}`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    })
    if (res.data && res.data?.code && res?.data?.code != 200) {
      throw new Error(res?.data?.message || "Đã có lỗi")
    }
    return res.data
  } catch (error) {
    return error.response.data
  }
}
export const createFbAccount = async ({newData, token}) => {
  const res = await axios.post(
    `${process.env.REACT_APP_API_URL}/fbAccount`,
    {...newData, status: "LIVE"},
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    },
  )
  if (res.data && res.data?.code && res?.data?.code != 200) {
    throw new Error(res?.data?.message || "Đã có lỗi")
  }
  return res?.data
}
export const updateFbAccount = async ({id, newData, token}) => {
  delete newData.id
  const res = await axios.put(`${process.env.REACT_APP_API_URL}/fbAccount/${id}`, newData, {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
  if (res.data && res.data?.code && res?.data?.code != 200) {
    throw new Error(res?.data?.message || "Đã có lỗi")
  }
  return res.data
}

export const removeFbAccount = async ({id, token}) => {
  const res = await axios.delete(`${process.env.REACT_APP_API_URL}/fbAccount/${id}`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
  if (res.data && res.data?.code && res?.data?.code != 200) {
    throw new Error(res?.data?.message || "Đã có lỗi")
  }
  return res.data
}
