export type Paginate<T> = [
  T[],
  {
    currentPage: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    previousPage: number;
    nextPage: number;
    pageCount: number;
    totalCount: number;
  },
];
