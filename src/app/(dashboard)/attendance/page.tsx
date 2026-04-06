"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { getAttendance, getClasses } from "@/lib/api";

type ClassItem = { id: string; name: string; room?: string; day_of_week?: string; start_time?: string };
type AttendRecord = { id: string; student_name?: string; class_name?: string; attend_time?: string; status: string };

const statusColor: Record<string, { bg: string; text: string }> = {
  출석: { bg: "#d1fae5", text: "#059669" },
  지각: { bg: "#fef3c7", text: "#d97706" },
  결석: { bg: "#fee2e2", text: "#ef4444" },
};

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [attendances, setAttendances] = useState<AttendRecord[]>([]);
  const [qrToken, setQrToken] = useState<string | null>(null);
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

  // QR 값: 학생이 스캔 시 /attend 페이지로 이동 (프론트엔드 URL)
  const siteOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const qrValue = selectedClass
    ? `${siteOrigin}/attend?class=${selectedClass.id}&t=${Date.now()}`
    : "";

  function handlePrint() { window.print(); }

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
        }
      `}</style>

      <div className="p-8">
        <div className="mb-6 no-print">
          <h1 className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>출석체크 QR</h1>
          <p className="text-sm mt-0.5" style={{ color: "#9ca3af" }}>QR 스티커를 출력해 교실 문에 부착하세요</p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* QR 생성 */}
          <div className="rounded-xl border p-6" style={{ background: "#fff", borderColor: "var(--border)" }}>
            <div className="no-print">
              <label className="block text-sm font-medium mb-2" style={{ color: "#374151" }}>반 선택</label>
              {loadingClasses ? (
                <p className="text-sm py-2" style={{ color: "#9ca3af" }}>반 목록 불러오는 중...</p>
              ) : classes.length === 0 ? (
                <p className="text-sm py-2" style={{ color: "#9ca3af" }}>등록된 반이 없습니다. 시간표에서 먼저 반을 추가하세요.</p>
              ) : (
                <select
                  value={selectedClass?.id ?? ""}
                  onChange={(e) => setSelectedClass(classes.find((c) => c.id === e.target.value) ?? null)}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none mb-6"
                  style={{ borderColor: "var(--border)", background: "#fafafa" }}>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.room ? ` (${c.room})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedClass && qrValue && (
              <>
                <div className="flex flex-col items-center py-6 border rounded-xl"
                  style={{ borderColor: "var(--border)", background: "#fafafa" }}>
                  <div className="bg-white p-4 rounded-xl shadow-sm">
                    <QRCodeSVG value={qrValue} size={180} level="H"
                      imageSettings={{ src: "", height: 0, width: 0, excavate: false }} />
                  </div>
                  <p className="text-base font-bold mt-4" style={{ color: "var(--foreground)" }}>
                    {selectedClass.name}
                  </p>
                  {selectedClass.room && (
                    <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>{selectedClass.room}</p>
                  )}
                  <p className="text-xs mt-3 px-4 text-center" style={{ color: "#9ca3af" }}>
                    QR을 스캔하면 자동으로 출석 처리됩니다<br />위치 확인 후 출결이 완료됩니다
                  </p>
                </div>

                <div className="flex gap-2 mt-4 no-print">
                  <button onClick={handlePrint}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white"
                    style={{ background: "var(--accent)" }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24">
                      <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    인쇄 / PDF 저장
                  </button>
                </div>
              </>
            )}

            <div className="mt-4 p-3 rounded-lg no-print" style={{ background: "#ede9fe" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "var(--accent)" }}>대리출결 방지 안내</p>
              <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                학원 반경 100m 이내 + 수업 시작 5분 전~10분 후에만 출결이 인정됩니다.
              </p>
            </div>
          </div>

          {/* 최근 출석 현황 */}
          <div className="rounded-xl border p-6" style={{ background: "#fff", borderColor: "var(--border)" }}>
            <h2 className="font-semibold mb-4" style={{ color: "var(--foreground)" }}>최근 출석 현황</h2>
            {attendances.length === 0 ? (
              <p className="text-sm py-6 text-center" style={{ color: "#9ca3af" }}>출석 기록이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {attendances.slice(0, 10).map((a) => (
                  <div key={a.id}
                    className="flex items-center justify-between py-2.5 border-b"
                    style={{ borderColor: "var(--border)" }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "var(--accent)" }}>
                        {(a.student_name ?? "?")[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{a.student_name ?? "-"}</p>
                        <p className="text-xs" style={{ color: "#9ca3af" }}>{a.class_name ?? "-"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: statusColor[a.status]?.bg ?? "#f3f4f6",
                          color: statusColor[a.status]?.text ?? "#6b7280",
                        }}>
                        {a.status}
                      </span>
                      <p className="text-xs mt-1" style={{ color: "#d1d5db" }}>
                        {a.attend_time ? a.attend_time.slice(5, 16) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
