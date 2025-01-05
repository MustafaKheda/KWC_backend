// utils/pagination.js

export const getPagination = (page, limit) => {
  const pageNumber = Math.max(1, parseInt(page, 10) || 1); // Ensure page is at least 1
  const limitNumber = Math.max(1, parseInt(limit, 10) || 10); // Ensure limit is at least 1
  const skip = (pageNumber - 1) * limitNumber;

  return { limit: limitNumber, skip };
};
