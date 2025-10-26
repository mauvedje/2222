import cookies from "js-cookie";
import axios from "axios";
import { API_URL } from "../config/config";

const getTradeData = async () => {
  const auth = cookies.get("auth");
  try {
    const getTradeData = await axios.get(API_URL + "/user/tradeInfo", {
      headers: { Authorization: "Bearer " + auth },
    });
    return { status: "ok", tradeInfo: getTradeData.data.data };
  } catch {
    return { status: "failed" };
  }
};

export default getTradeData;
