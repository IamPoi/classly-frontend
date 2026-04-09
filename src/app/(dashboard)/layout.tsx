"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "antd";
import Sidebar from "@/components/Sidebar";

const { Content } = Layout;

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.replace("/");
    }
  }, [router]);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar />
      <Content style={{ overflow: "auto", background: "#f9f8f6" }}>
        {children}
      </Content>
    </Layout>
  );
}
