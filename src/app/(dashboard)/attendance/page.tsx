"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, Row, Col, Tag, Avatar, Button, Alert, List, Typography, Spin } from "antd";
import { PrinterOutlined, ReloadOutlined } from "@ant-design/icons";
import { getAttendance, generateQR } from "@/lib/api";

const { Text } = Typography;

type AttendRecord = { id: string; student_name?: string; attend_time?: string; status: string };

const statusColor: Record<string, string> = {
  출석: "success",
  지각: "warning",
  결석: "error",
};

export default function AttendancePage() {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [attendances, setAttendances] = useState<AttendRecord[]>([]);

  useEffect(() => {
    getAttendance().then(setAttendances).catch(() => {});
  }, []);

  async function handleGenerateQR() {
    setQrLoading(true);
    setQrError("");
    try {
      const data = await generateQR();
      setQrUrl(data.url);
    } catch (err: any) {
      setQrError(err.message);
    } finally {
      setQrLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div style={{ padding: 32 }}>
        <div className="no-print" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>출석체크 QR</h1>
          <Text type="secondary" style={{ fontSize: 13 }}>QR 코드를 생성해 학생들이 출석할 수 있도록 공유하세요</Text>
        </div>

        <Row gutter={24}>
          {/* QR 생성 */}
          <Col span={12}>
            <Card title="QR 코드">
              {!qrUrl ? (
                <div className="no-print" style={{ textAlign: "center", padding: "24px 0" }}>
                  <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
                    버튼을 눌러 학원 QR 코드를 생성하세요
                  </Text>
                  <Button
                    type="primary"
                    size="large"
                    loading={qrLoading}
                    onClick={handleGenerateQR}
                  >
                    QR 생성
                  </Button>
                  {qrError && <Alert type="error" message={qrError} showIcon style={{ marginTop: 16 }} />}
                </div>
              ) : (
                <>
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: 24,
                    border: "1px solid #f0f0f0",
                    borderRadius: 12,
                    background: "#fafafa",
                  }}>
                    <div style={{ background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                      <QRCodeSVG value={qrUrl} size={180} level="H"
                        imageSettings={{ src: "", height: 0, width: 0, excavate: false }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>
                      QR을 스캔하면 자동으로 출석 처리됩니다<br />위치 확인 후 출결이 완료됩니다
                    </Text>
                  </div>

                  <div className="no-print" style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <Button
                      icon={<ReloadOutlined />}
                      block
                      loading={qrLoading}
                      onClick={handleGenerateQR}
                    >
                      QR 재발급 (기존 만료)
                    </Button>
                    <Button
                      type="primary"
                      icon={<PrinterOutlined />}
                      block
                      onClick={() => window.print()}
                    >
                      인쇄 / PDF 저장
                    </Button>
                  </div>
                  {qrError && <Alert type="error" message={qrError} showIcon style={{ marginTop: 12 }} />}
                </>
              )}

              <Alert
                type="info"
                style={{ marginTop: 16 }}
                className="no-print"
                message="대리출결 방지 안내"
                description="학원 반경 100m 이내에서만 출결이 인정됩니다. QR 재발급 시 이전 QR은 즉시 만료됩니다."
                showIcon
              />
            </Card>
          </Col>

          {/* 최근 출석 현황 */}
          <Col span={12}>
            <Card title="최근 출석 현황">
              {attendances.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <Text type="secondary">출석 기록이 없습니다.</Text>
                </div>
              ) : (
                <List
                  dataSource={attendances.slice(0, 10)}
                  renderItem={(a) => (
                    <List.Item
                      style={{ padding: "10px 0" }}
                      extra={
                        <div style={{ textAlign: "right" }}>
                          <Tag color={statusColor[a.status] ?? "default"}>{a.status}</Tag>
                          <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {a.attend_time ? a.attend_time.slice(5, 16) : ""}
                            </Text>
                          </div>
                        </div>
                      }
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{ background: "#7c6af7", fontWeight: 600 }}>
                            {(a.student_name ?? "?")[0]}
                          </Avatar>
                        }
                        title={a.student_name ?? "-"}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
}
