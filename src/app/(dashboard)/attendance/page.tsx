"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, Select, Row, Col, Tag, Avatar, Button, Alert, List, Typography } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import { getAttendance, getClasses } from "@/lib/api";

const { Text } = Typography;

type ClassItem = { id: string; name: string; room?: string; day_of_week?: string; start_time?: string };
type AttendRecord = { id: string; student_name?: string; class_name?: string; attend_time?: string; status: string };

const statusColor: Record<string, string> = {
  출석: "success",
  지각: "warning",
  결석: "error",
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [attendances, setAttendances] = useState<AttendRecord[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    getClasses()
      .then((list) => {
        setClasses(list);
        if (list.length > 0) setSelectedClass(list[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingClasses(false));
    getAttendance().then(setAttendances).catch(() => {});
  }, []);

  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const qrValue = selectedClass
    ? `${siteOrigin}/attend?class=${selectedClass.id}&t=${Date.now()}`
    : "";

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
          <Text type="secondary" style={{ fontSize: 13 }}>QR 스티커를 출력해 교실 문에 부착하세요</Text>
        </div>

        <Row gutter={24}>
          {/* QR 생성 */}
          <Col span={12}>
            <Card title="QR 코드 생성">
              <div className="no-print" style={{ marginBottom: 20 }}>
                <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>반 선택</Text>
                {loadingClasses ? (
                  <Text type="secondary">반 목록 불러오는 중...</Text>
                ) : classes.length === 0 ? (
                  <Alert type="info" message="등록된 반이 없습니다. 시간표에서 먼저 반을 추가하세요." showIcon />
                ) : (
                  <Select
                    value={selectedClass?.id}
                    onChange={(id) => setSelectedClass(classes.find((c) => c.id === id) ?? null)}
                    style={{ width: "100%" }}
                    options={classes.map((c) => ({
                      value: c.id,
                      label: c.name + (c.room ? ` (${c.room})` : ""),
                    }))}
                  />
                )}
              </div>

              {selectedClass && qrValue && (
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
                      <QRCodeSVG value={qrValue} size={180} level="H"
                        imageSettings={{ src: "", height: 0, width: 0, excavate: false }} />
                    </div>
                    <Text strong style={{ fontSize: 16, marginTop: 16 }}>{selectedClass.name}</Text>
                    {selectedClass.room && <Text type="secondary" style={{ marginTop: 4 }}>{selectedClass.room}</Text>}
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 12, textAlign: "center" }}>
                      QR을 스캔하면 자동으로 출석 처리됩니다<br />위치 확인 후 출결이 완료됩니다
                    </Text>
                  </div>

                  <Button
                    type="primary"
                    icon={<PrinterOutlined />}
                    block
                    onClick={() => window.print()}
                    style={{ marginTop: 16 }}
                    className="no-print"
                  >
                    인쇄 / PDF 저장
                  </Button>
                </>
              )}

              <Alert
                type="info"
                style={{ marginTop: 16 }}
                className="no-print"
                message="대리출결 방지 안내"
                description="학원 반경 100m 이내 + 수업 시작 5분 전~10분 후에만 출결이 인정됩니다."
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
                        description={a.class_name ?? "-"}
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
