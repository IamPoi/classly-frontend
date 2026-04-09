"use client";

import { ConfigProvider, App } from "antd";
import ko_KR from "antd/locale/ko_KR";
import antdTheme from "@/lib/antd-theme";

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider theme={antdTheme} locale={ko_KR}>
      <App>{children}</App>
    </ConfigProvider>
  );
}
