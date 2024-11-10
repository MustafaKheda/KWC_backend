// utils/pagination.js

export const getPagination = (page, limit) => {
  const pageNumber = parseInt(page, 10) || 1; // Default to page 1
  const limitNumber = parseInt(limit, 10) || 10; // Default to 10 items per page
  const skip = (pageNumber - 1) * limitNumber;

  return { limit: limitNumber, skip };
};
