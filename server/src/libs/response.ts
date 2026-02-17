export function successResponse<T>(message: string, data: T) {
  return { success: true, message, data };
}

export function paginatedResponse<T>(
  message: string,
  items: T[],
  page: number,
  limit: number,
  totalItems: number,
) {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    success: true,
    message,
    data: {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    },
  };
}
