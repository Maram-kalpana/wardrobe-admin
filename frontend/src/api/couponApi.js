import axiosClient from "./axiosClient";

export const getCouponsApi = async () => {
  const response = await axiosClient.get("/coupons");
  return response.data;
};

export const createCouponApi = async (payload) => {
  const response = await axiosClient.post("/coupons", payload);
  return response.data;
};

export const updateCouponApi = async (id, payload) => {
  const response = await axiosClient.put(`/coupons/${id}`, payload);
  return response.data;
};

export const deleteCouponApi = async (id) => {
  const response = await axiosClient.delete(`/coupons/${id}`);
  return response.data;
};