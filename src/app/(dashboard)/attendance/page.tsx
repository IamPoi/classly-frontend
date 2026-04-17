"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, Row, Col, Tag, Avatar, Button, Alert, List, Typography } from "antd";
import { PrinterOutlined, ReloadOutlined } from "@ant-design/icons";
import { getAttendance, generateQR, getMe } from "@/lib/api";

const { Text } = Typography;
const QR_STORAGE_KEY = "classly_qr_url";

function formatAttendTime(t: string) {
  const d = new Date(t);
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

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
  const [academyName, setAcademyName] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(QR_STORAGE_KEY);
    if (saved) setQrUrl(saved);
    getAttendance().then(setAttendances).catch(() => {});
    getMe().then((me) => setAcademyName(me.academy_name ?? "")).catch(() => {});
  }, []);

  async function handleGenerateQR() {
    setQrLoading(true);
    setQrError("");
    try {
      const data = await generateQR();
      setQrUrl(data.url);
      localStorage.setItem(QR_STORAGE_KEY, data.url);
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
          .print-only { display: flex !important; }
          body { background: white; margin: 0; }
          @page { margin: 20mm; size: A4; }
        }
        .print-only { display: none; }
      `}</style>

      {/* 인쇄 전용 레이아웃 */}
      <div className="print-only" style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 32,
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#111", letterSpacing: -0.5 }}>
          {academyName}
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: -20 }}>출석 체크 QR 코드</div>
        {qrUrl && (
          <div style={{ padding: 24, background: "#fff", borderRadius: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.1)" }}>
            <QRCodeSVG value={qrUrl} size={420} level="H"
              imageSettings={{ src: "", height: 0, width: 0, excavate: false }} />
          </div>
        )}
        <div style={{ fontSize: 13, color: "#9ca3af", marginTop: -8 }}>
          스캔 후 학생 로그인 → 자동 출석 처리
        </div>
      </div>

      {/* 일반 화면 */}
      <div className="no-print" style={{ padding: 32 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>출석체크 QR</h1>
          <Text type="secondary" style={{ fontSize: 13 }}>QR 코드를 생성해 학생들이 출석할 수 있도록 공유하세요</Text>
        </div>

        <Row gutter={24}>
          <Col span={12}>
            <Card title="QR 코드">
              {!qrUrl ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                  <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
                    버튼을 눌러 학원 QR 코드를 생성하세요
                  </Text>
                  <Button type="primary" size="large" loading={qrLoading} onClick={handleGenerateQR}>
                    QR 생성
                  </Button>
                  {qrError && <Alert type="error" message={qrError} showIcon style={{ marginTop: 16 }} />}
                </div>
              ) : (
                <>
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: 24, border: "1px solid #f0f0f0", borderRadius: 12, background: "#fafafa",
                  }}>
                    <div style={{ background: "#fff", padding: 16, borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                      <QRCodeSVG value={qrUrl} size={180} level="H"
                        imageSettings={{ src: "", height: 0, width: 0, excavate: false }} />
                    </div>
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>
                      QR을 스캔하면 자동으로 출석 처리됩니다<br />위치 확인 후 출결이 완료됩니다
                    </Text>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    <Button icon={<ReloadOutlined />} block loading={qrLoading} onClick={handleGenerateQR}>
                      QR 재발급 (기존 만료)
                    </Button>
                    <Button type="primary" icon={<PrinterOutlined />} block onClick={() => window.print()}>
                      인쇄 / PDF 저장
                    </Button>
                  </div>
                  {qrError && <Alert type="error" message={qrError} showIcon style={{ marginTop: 12 }} />}
                </>
              )}

              <Alert
                type="info"
                style={{ marginTop: 16 }}
                message="대리출결 방지 안내"
                description="학원 반경 100m 이내에서만 출결이 인정됩니다. QR 재발급 시 이전 QR은 즉시 만료됩니다."
                showIcon
              />
            </Card>
          </Col>

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
                              {a.attend_time ? formatAttendTime(a.attend_time) : ""}
                            </Text>
                          </div>
                        </div>
                      }
                    >
                      <List.Item.Meta
                        avatar={<Avatar style={{ background: "#7c6af7", fontWeight: 600 }}>{(a.student_name ?? "?")[0]}</Avatar>}
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
