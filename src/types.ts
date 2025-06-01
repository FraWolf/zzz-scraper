export interface RequestWrapper<T = unknown> {
  data: {
    list: T;
    total: string;
  };
}

export type WikiAppName = "zzz" | "hsr";
