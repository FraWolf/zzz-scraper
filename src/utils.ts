import unfetch from "isomorphic-unfetch";

export const defaultHeaders = {
  Origin: "https://wiki.hoyolab.com",
  Referer: "https://wiki.hoyolab.com/",
  "X-Rpc-Language": "en-us",
  "X-Rpc-Wiki_app": "zzz",
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
