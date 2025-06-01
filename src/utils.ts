import unfetch from "isomorphic-unfetch";
import { RequestWrapper, WikiAppName } from "./types";

export const wikiAppName: WikiAppName = "zzz";
export const allowedWikiAppNames: WikiAppName[] = ["zzz", "hsr"];

export const defaultHeaders = {
  Origin: "https://wiki.hoyolab.com",
  Referer: "https://wiki.hoyolab.com/",
  "X-Rpc-Language": "en-us",
  "X-Rpc-Wiki_app": wikiAppName,
  "User-Agent":
    "Mozilla/5.0 (Windows; U; Windows NT 6.3;) AppleWebKit/534.37 (KHTML, like Gecko) Chrome/53.0.1955.162 Safari/600.6 Edge/17.17660",
};

export async function request<T = unknown>(
  uri: string,
  options: {
    method?: RequestInit["method"];
    headers?: RequestInit["headers"];
    body?: RequestInit["body"];
    json?: boolean;
  }
): Promise<T | null> {
  try {
    const request = await unfetch(uri, {
      method: options?.method,
      headers: options?.headers,
      body: options?.body,
    }).then((res) => {
      return options?.json ? res.json() : res.text();
    });

    return request;
  } catch (err: any) {
    console.log("Error during request:", err?.message || err);
    return null;
  }
}

export function getSubMenuData(menuId: string, pageNumber: number = 1) {
  return request<RequestWrapper<any[]>>(
    `https://sg-wiki-api.hoyolab.com/hoyowiki/${wikiAppName}/wapi/get_entry_page_list`,
    {
      method: "POST",
      headers: defaultHeaders,
      body: JSON.stringify({
        menu_id: menuId,
        page_num: pageNumber,
        page_size: 50,
      }),
      json: true,
    }
  );
}

function regexReplace(regexRule: RegExp, data: string, replacer: string) {
  return data.replace(regexRule, replacer);
}

export function formatToId(data: string) {
  return regexReplace(/\s+/g, data, "_");
}

export function cleanFromHTML(data: string) {
  return regexReplace(/<[^>]*>/g, data, "");
}

export function replaceDollarSign(data: string) {
  var newData = data;
  newData = newData.substring(1);
  newData = newData.substring(0, newData.length - 1);
  return newData;
}
