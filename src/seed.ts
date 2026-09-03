import type { Db } from "./types";

/**
 * قاعدة البداية: فارغة تمامًا.
 * كل المحتوى (المجالات، المشاريع، المقالات) يُضاف من الداشبورد فقط
 * ويتزامن لحظيًا مع Firestore.
 */
export const seedDb: Db = {
  fields: [],
  projects: [],
  articles: [],
};
