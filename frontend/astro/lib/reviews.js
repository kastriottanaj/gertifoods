// Google Business Profile figures for "GERTI FOODS" (Food manufacturer), read
// off the profile on 2026-09-13. Five pages show the rating; every one of them
// imports it from here, so a new review means editing this file and nothing
// else. Until 2026-09-13 the pages showed 4.9 stars and "120+" / "200+"
// reviews, none of which was ever true.
export const GOOGLE_RATING = 3.7;
export const GOOGLE_REVIEW_COUNT = 3;

// Width of the filled star layer, so the stars show the real value rather than
// a rounded-up row of five.
export const GOOGLE_STAR_FILL = `${Math.round((GOOGLE_RATING / 5) * 1000) / 10}%`;
