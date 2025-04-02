export interface RequestWrapper<T = unknown> {
  data: {
    list: T;
    total: string;
  };
}
