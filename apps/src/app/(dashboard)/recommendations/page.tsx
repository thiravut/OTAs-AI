"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Badge,
  Table,
  Form,
  Modal,
  Alert,
  Spinner,
  Row,
  Col,
} from "react-bootstrap";

interface Recommendation {
  id: string;
  roomType: { id: string; name: string };
  targetDate: string;
  currentPrice: number;
  recommendedPrice: number;
  changePercent: number;
  changeDirection: string;
  reason: string;
  status: string;
  rejectionReason: string | null;
  rejectionNote: string | null;
  decidedAt: string | null;
  decidedBy: { name: string } | null;
  createdAt: string;
}

interface Summary {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  approvalRate: number;
}

const REJECTION_REASONS = [
  { value: "LOCAL_EVENT", label: "มี local event" },
  { value: "PRICE_TOO_HIGH", label: "ราคาสูงเกินไป" },
  { value: "PRICE_TOO_LOW", label: "ราคาต่ำเกินไป" },
  { value: "MARKET_KNOWLEDGE", label: "มีข้อมูลตลาดที่ AI ไม่รู้" },
  { value: "OTHER", label: "อื่นๆ" },
];

const STATUS_BADGES: Record<string, string> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  expired: "secondary",
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Reject modal
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("PRICE_TOO_HIGH");
  const [rejectNote, setRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // We need a hotelId — for now use the first hotel
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

  const fetchRecs = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations?status=${statusFilter}&limit=50`
      );
      const data = await res.json();
      setRecs(data.data ?? []);
      setSummary(data.summary ?? null);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  }, [hotelId, statusFilter]);

  useEffect(() => {
    fetchRecs();
  }, [fetchRecs]);

  async function handleApprove(recId: string) {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations/${recId}/approve`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess("อนุมัติแล้ว");
      fetchRecs();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectId) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations/${rejectId}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rejectionReason: rejectReason,
            rejectionNote: rejectNote || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess("ปฏิเสธแล้ว");
      setRejectId(null);
      setRejectNote("");
      fetchRecs();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBatchApprove() {
    const pendingIds = recs
      .filter((r) => r.status === "pending")
      .map((r) => r.id);
    if (pendingIds.length === 0) return;

    setActionLoading(true);
    try {
      const res = await fetch(
        `/api/hotels/${hotelId}/recommendations/batch-approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recommendationIds: pendingIds }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setSuccess(data.message);
      fetchRecs();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setActionLoading(false);
    }
  }

  if (!hotelId && !loading) {
    return (
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <p className="text-muted">กรุณาเพิ่มโรงแรมก่อนใช้งานคำแนะนำ AI</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <h4 className="mb-4">คำแนะนำ AI</h4>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {summary && (
        <Row className="g-3 mb-4">
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="text-muted small">รอดำเนินการ</div>
                <h4 className="text-warning mb-0">{summary.pending}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="text-muted small">อนุมัติวันนี้</div>
                <h4 className="text-success mb-0">{summary.approvedToday}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="text-muted small">ปฏิเสธวันนี้</div>
                <h4 className="text-danger mb-0">{summary.rejectedToday}</h4>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6} md={3}>
            <Card className="border-0 shadow-sm text-center">
              <Card.Body>
                <div className="text-muted small">อัตราอนุมัติ</div>
                <h4 className="mb-0">{summary.approvalRate}%</h4>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Select
          style={{ width: 200 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="pending">รอดำเนินการ</option>
          <option value="approved">อนุมัติแล้ว</option>
          <option value="rejected">ปฏิเสธแล้ว</option>
          <option value="expired">หมดอายุ</option>
          <option value="all">ทั้งหมด</option>
        </Form.Select>

        {statusFilter === "pending" && recs.length > 0 && (
          <Button
            variant="success"
            size="sm"
            onClick={handleBatchApprove}
            disabled={actionLoading}
          >
            อนุมัติทั้งหมด ({recs.filter((r) => r.status === "pending").length})
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : recs.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <p className="text-muted">ไม่มีคำแนะนำในสถานะนี้</p>
          </Card.Body>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>ห้อง</th>
                <th>วันที่</th>
                <th className="text-end">ราคาปัจจุบัน</th>
                <th className="text-end">ราคาแนะนำ</th>
                <th className="text-end">%</th>
                <th>เหตุผล</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recs.map((rec) => (
                <tr key={rec.id}>
                  <td>{rec.roomType.name}</td>
                  <td>{rec.targetDate}</td>
                  <td className="text-end font-mono">
                    {rec.currentPrice.toLocaleString()}
                  </td>
                  <td className="text-end font-mono">
                    {rec.recommendedPrice.toLocaleString()}
                  </td>
                  <td
                    className={`text-end ${rec.changeDirection === "up" ? "text-success" : rec.changeDirection === "down" ? "text-danger" : ""}`}
                  >
                    {rec.changeDirection === "up" ? "+" : ""}
                    {rec.changePercent.toFixed(1)}%
                  </td>
                  <td style={{ maxWidth: 250 }}>
                    <small>{rec.reason}</small>
                  </td>
                  <td>
                    <Badge bg={STATUS_BADGES[rec.status] ?? "secondary"}>
                      {rec.status === "pending"
                        ? "รอ"
                        : rec.status === "approved"
                          ? "อนุมัติ"
                          : rec.status === "rejected"
                            ? "ปฏิเสธ"
                            : "หมดอายุ"}
                    </Badge>
                  </td>
                  <td>
                    {rec.status === "pending" && (
                      <div className="d-flex gap-1">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(rec.id)}
                          disabled={actionLoading}
                        >
                          อนุมัติ
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setRejectId(rec.id)}
                          disabled={actionLoading}
                        >
                          ปฏิเสธ
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Reject Modal */}
      <Modal show={!!rejectId} onHide={() => setRejectId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>ปฏิเสธคำแนะนำ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>เหตุผล *</Form.Label>
            <Form.Select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            >
              {REJECTION_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>
              หมายเหตุ {rejectReason === "OTHER" ? "*" : "(ถ้ามี)"}
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="เช่น มีงาน Phuket Food Festival วันที่ 21-23"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRejectId(null)}>
            ยกเลิก
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
            disabled={actionLoading}
          >
            {actionLoading ? "กำลังดำเนินการ..." : "ปฏิเสธ"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
