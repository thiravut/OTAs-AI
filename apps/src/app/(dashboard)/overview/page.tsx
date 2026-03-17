"use client";

import { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Spinner } from "react-bootstrap";
import Link from "next/link";

interface DashboardData {
  hotel: { id: string; name: string };
  occupancy: { today: number; forecast7Days: { date: string; occupancy: number }[] };
  revenue: { thisMonth: number; lastMonth: number; changePercent: number; changeDirection: string };
  recommendations: { pending: number; approvedToday: number; approvalRate: number };
  syncStatus: { overallStatus: string; connections: { otaName: string; status: string; lastSyncAt: string | null }[] };
}

export default function OverviewPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.[0]) setHotelId(d.data[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!hotelId) return;
    fetch(`/api/hotels/${hotelId}/dashboard`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hotelId]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <p className="text-muted mb-3">ยังไม่มีโรงแรม</p>
          <Link href="/hotels" className="btn btn-primary">
            เพิ่มโรงแรม
          </Link>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <h4 className="mb-4">{data.hotel.name}</h4>

      <Row className="g-3 mb-4">
        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">Occupancy วันนี้</div>
              <h3 className="mb-0">{data.occupancy.today}%</h3>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">รายได้เดือนนี้</div>
              <h3 className="mb-0 font-mono">
                {data.revenue.thisMonth.toLocaleString()}
              </h3>
              <small className={data.revenue.changeDirection === "up" ? "text-success" : "text-danger"}>
                {data.revenue.changeDirection === "up" ? "+" : ""}
                {data.revenue.changePercent}% vs เดือนก่อน
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} lg={3}>
          <Link href="/recommendations" className="text-decoration-none">
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <div className="text-muted small">คำแนะนำรอดำเนินการ</div>
                <h3 className="text-warning mb-0">{data.recommendations.pending}</h3>
                <small className="text-muted">
                  อนุมัติวันนี้: {data.recommendations.approvedToday}
                </small>
              </Card.Body>
            </Card>
          </Link>
        </Col>
        <Col xs={6} lg={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <div className="text-muted small">OTA Status</div>
              <h5>
                <Badge
                  bg={
                    data.syncStatus.overallStatus === "healthy"
                      ? "success"
                      : data.syncStatus.overallStatus === "degraded"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {data.syncStatus.overallStatus === "healthy"
                    ? "ปกติ"
                    : data.syncStatus.overallStatus === "degraded"
                      ? "มีปัญหา"
                      : "ยังไม่เชื่อมต่อ"}
                </Badge>
              </h5>
              <small className="text-muted">
                {data.syncStatus.connections.length} OTA
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Occupancy forecast */}
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body>
          <Card.Title>Occupancy 7 วันข้างหน้า</Card.Title>
          <div className="d-flex gap-2 mt-3">
            {data.occupancy.forecast7Days.map((d) => (
              <div key={d.date} className="text-center flex-fill">
                <div className="small text-muted">
                  {new Date(d.date).toLocaleDateString("th-TH", { weekday: "short" })}
                </div>
                <div
                  className="mx-auto rounded"
                  style={{
                    width: "100%",
                    height: 80,
                    background: `linear-gradient(to top, ${d.occupancy > 80 ? "var(--rg-success)" : d.occupancy > 50 ? "var(--rg-primary)" : "var(--rg-warning)"} ${d.occupancy}%, #eee ${d.occupancy}%)`,
                  }}
                />
                <div className="small fw-bold mt-1">{d.occupancy}%</div>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </>
  );
}
