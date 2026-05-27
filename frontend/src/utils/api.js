import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3001/api",
  timeout: 90000, // 90s — scraping + AI can be slow
  headers: { "Content-Type": "application/json" },
});

export const optimizeASIN = (asin) =>
  api.post("/optimize", { asin }).then((r) => r.data);

export const getHistory = (limit = 20, offset = 0) =>
  api.get(`/history?limit=${limit}&offset=${offset}`).then((r) => r.data);

export const getASINHistory = (asin) =>
  api.get(`/history/${asin}`).then((r) => r.data);

export const getOptimization = (id) =>
  api.get(`/optimization/${id}`).then((r) => r.data);

export const deleteOptimization = (id) =>
  api.delete(`/optimization/${id}`).then((r) => r.data);

export const getASINs = () => api.get("/asins").then((r) => r.data);
