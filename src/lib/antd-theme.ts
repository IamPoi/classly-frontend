import type { ThemeConfig } from "antd";

const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: "#7c6af7",
    colorPrimaryHover: "#6b58f0",
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily:
      '"Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    colorBgLayout: "#f9f8f6",
    colorBgContainer: "#ffffff",
    colorBorder: "#e5e5e5",
    colorText: "#1a1a1a",
    colorTextSecondary: "#6b7280",
  },
  components: {
    Layout: {
      siderBg: "#1e1e2e",
      triggerBg: "#1e1e2e",
    },
    Menu: {
      darkItemBg: "#1e1e2e",
      darkItemSelectedBg: "rgba(124, 106, 247, 0.18)",
      darkItemColor: "#6c7086",
      darkItemSelectedColor: "#ffffff",
      darkItemHoverBg: "rgba(124, 106, 247, 0.08)",
      darkSubMenuItemBg: "#1e1e2e",
    },
    Table: {
      headerBg: "#fafafa",
      rowHoverBg: "#f5f3ff",
    },
    Button: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
    Modal: {
      borderRadiusLG: 16,
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
};

export default antdTheme;
