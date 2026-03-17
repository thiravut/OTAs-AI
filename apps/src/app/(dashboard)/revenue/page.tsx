"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Button, Spinner } from "react-bootstrap";

interface AnalyticsData {
  period: string;
  revenue: {
    before: { total: number; avgDaily: number };
    after: { total: number; avgDaily: number; projected: number };
    changePercent: number;
    changeDirection: string;
  };
  occupancy: {
    before: { average: number };
    after: { average: number };
    changePercent: number;
  };
  aiPerformance: {
    totalRecommendations: number;
    approved: number;
    rejected: number;
    expired: number;
    approvalRate: number;
    topRejectionReasons: { reason: string; label: string; count: number }[];
  };
}

export default function RevenuePage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.data?.[0]) { setLoading(false); return; }
        setHotelId(d.data[0].id);
        const res = await fetch(`/api/hotels/${d.data[0].id}/analytics?period=30d`);
        setData(await res.json());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <>
        <h4 className="mb-4">รายได้ & Analytics</h4>
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <p className="text-muted">ยังไม่มีข้อมูลเพียงพอ</p>
          </Card.Body>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">รายได้ & Analytics</h4>
        {hotelId && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() =>
              window.open(
                `/api/hotels/${hotelId}/analytics/export?period=30d`,
                "_blank"
              )
            }
          >
            Export CSV
          </Button>
        )}
      </div>

      {/* Revenue */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">รายได้ก่อนใช้ระบบ</div>
              <h4 className="font-mono mb-1">
                {data.revenue.before.total.toLocaleString()} ฿
              </h4>
              <small className="text-muted">
                เฉลี่ย {data.revenue.before.avgDaily.toLocaleString()} ฿/วัน
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">รายได้หลังใช้ระบบ</div>
              <h4 className="font-mono mb-1">
                {data.revenue.after.total.toLocaleString()} ฿
              </h4>
              <small className="text-muted">
                เฉลี่ย {data.revenue.after.avgDaily.toLocaleString()} ฿/วัน
                (คาดการณ์ {data.revenue.after.projected.toLocaleString()} ฿)
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">เปลี่ยนแปลง</div>
              <h4
                className={`mb-1 ${data.revenue.changeDirection === "up" ? "text-success" : "text-danger"}`}
              >
                {data.revenue.changeDirection === "up" ? "+" : ""}
                {data.revenue.changePercent}%
              </h4>
              <small className="text-muted">
                Occupancy: {data.occupancy.before.average}% → {data.occupancy.after.average}%
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* AI Performance */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Card.Title>AI Performance</Card.Title>
          <Row className="mt-3">
            <Col xs={6} md={3} className="text-center">
              <div className="text-muted small">คำแนะนำทั้งหมด</div>
              <h4>{data.aiPerformance.totalRecommendations}</h4>
            </Col>
            <Col xs={6} md={3} className="text-center">
              <div className="text-muted small">อนุมัติ</div>
              <h4 className="text-success">{data.aiPerformance.approved}</h4>
            </Col>
            <Col xs={6} md={3} className="text-center">
              <div className="text-muted small">ปฏิเสธ</div>
              <h4 className="text-danger">{data.aiPerformance.rejected}</h4>
            </Col>
            <Col xs={6} md={3} className="text-center">
              <div className="text-muted small">อัตราอนุมัติ</div>
              <h4>{data.aiPerformance.approvalRate}%</h4>
            </Col>
          </Row>

          {data.aiPerformance.topRejectionReasons.length > 0 && (
            <div className="mt-3">
              <small className="text-muted fw-bold">
                เหตุผลปฏิเสธหลัก:
              </small>
              <ul className="mb-0 mt-1">
                {data.aiPerformance.topRejectionReasons.map((r) => (
                  <li key={r.reason}>
                    <small>
                      {r.label} ({r.count} ครั้ง)
                    </small>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
