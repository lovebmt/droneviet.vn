/** Facts about the site shared by metadata, JSON-LD and llms.txt. */
export const SITE_URL = "https://www.droneviet.vn";
export const SITE_NAME = "Drone Việt";
export const SITE_SUMMARY =
  "Drone Việt cung cấp giải pháp drone trọn bộ cho giáo dục tại Việt Nam: combo thiết bị cho lớp học, drone và linh kiện, giáo trình theo cấp học, workshop trải nghiệm, hướng dẫn giấy phép và cấp phép bay, cùng trình bay mô phỏng miễn phí trên trình duyệt.";

export const absolute = (path: string) => `${SITE_URL}${path}`;
export const zaloLink = (zalo: string | null) => (zalo ? `https://zalo.me/${zalo}` : null);
