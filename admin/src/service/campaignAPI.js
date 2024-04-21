import axios from "axios";
export const handleError = (err) => {
  if (err.response.data.msg) {
    throw new Error(err.response.data.msg);
  } else {
    throw new Error(err.message);
  }
};

export const getAllCampaigns = async ({ query, token }) => {
  // &createdAt_gte=${}&createdAt__lte=${}
  // &createdAt_gte=${}&createdAt__lte=${}
  try {
    const res = await axios.get(`${query.queryKey[0]}`, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    if (res?.data?.code != 200) {
      throw new Error(res?.data?.message);
    }
    return res.data;
  } catch (error) {}
};

export const createCampaign = async ({ newData, token }) => {
  const res = await axios.post(`${process.env.REACT_APP_API_URL}/campaign`, newData, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });
  if (res?.data?.code != 200) {
    throw new Error(res?.data?.message);
  }
  return res.data;
};
export const updateCampaign = async ({ id, newData, token }) => {
  // newData = { ...newData };
  try {
    const res = await axios.put(`${process.env.REACT_APP_API_URL}/campaign/${id}`, newData, {
      headers: {
        Authorization: "Bearer " + token,
      },
    });
    if (res?.data?.code != 200) {
      throw new Error(res?.data?.message);
    }
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

export const deleteCampaign = async ({ id, token }) => {
  const res = await axios.delete(`${process.env.REACT_APP_API_URL}/campaign/${id}`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  });
  if (res?.data?.code != 200) {
    throw new Error(res?.data?.message);
  }
  return res.data;
};
