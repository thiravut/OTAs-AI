"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Alert,
  Row,
  Col,
  Badge,
  Spinner,
} from "react-bootstrap";

interface Hotel {
  id: string;
  name: string;
  location: string | null;
  totalRooms: number;
  role: string;
  memberCount: number;
  createdAt: string;
}

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create hotel form
  const [hotelName, setHotelName] = useState("");
  const [hotelLocation, setHotelLocation] = useState("");
  const [hotelRooms, setHotelRooms] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("REVENUE_MANAGER");
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchHotels = useCallback(async () => {
    try {
      const res = await fetch("/api/hotels");
      const data = await res.json();
      setHotels(data.data ?? []);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลโรงแรมได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  async function handleCreateHotel(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreateLoading(true);

    try {
      const res = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: hotelName,
          location: hotelLocation || undefined,
          totalRooms: hotelRooms ? parseInt(hotelRooms) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess("เพิ่มโรงแรมสำเร็จ");
      setShowCreate(false);
      setHotelName("");
      setHotelLocation("");
      setHotelRooms("");
      fetchHotels();
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInviteLoading(true);

    try {
      const res = await fetch(`/api/hotels/${showInvite}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(data.message);
      setShowInvite(null);
      setInviteEmail("");
      setInviteRole("REVENUE_MANAGER");
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setInviteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="mb-0">โรงแรมของฉัน</h4>
        <Button variant="primary" onClick={() => setShowCreate(true)}>
          + เพิ่มโรงแรม
        </Button>
      </div>

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

      {hotels.length === 0 ? (
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <p className="text-muted mb-3">ยังไม่มีโรงแรม</p>
            <Button variant="primary" onClick={() => setShowCreate(true)}>
              เพิ่มโรงแรมแรกของคุณ
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {hotels.map((hotel) => (
            <Col key={hotel.id} md={6} lg={4}>
              <Card className="border-0 shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <Card.Title className="mb-0">{hotel.name}</Card.Title>
                    <Badge bg={hotel.role === "OWNER" ? "primary" : "secondary"}>
                      {hotel.role === "OWNER" ? "เจ้าของ" : "สมาชิก"}
                    </Badge>
                  </div>
                  {hotel.location && (
                    <p className="text-muted mb-1">{hotel.location}</p>
                  )}
                  <p className="text-muted mb-3">
                    {hotel.totalRooms > 0 ? `${hotel.totalRooms} ห้อง` : ""}
                    {hotel.totalRooms > 0 && hotel.memberCount > 0 ? " · " : ""}
                    {hotel.memberCount > 0
                      ? `${hotel.memberCount} สมาชิก`
                      : ""}
                  </p>
                  {hotel.role === "OWNER" && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowInvite(hotel.id)}
                    >
                      เชิญสมาชิก
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Create Hotel Modal */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>เพิ่มโรงแรมใหม่</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateHotel}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>ชื่อโรงแรม *</Form.Label>
              <Form.Control
                type="text"
                placeholder="เช่น โรงแรมภูเก็ตพาราไดซ์"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>ที่ตั้ง</Form.Label>
              <Form.Control
                type="text"
                placeholder="เช่น ภูเก็ต"
                value={hotelLocation}
                onChange={(e) => setHotelLocation(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>จำนวนห้อง</Form.Label>
              <Form.Control
                type="number"
                placeholder="เช่น 80"
                value={hotelRooms}
                onChange={(e) => setHotelRooms(e.target.value)}
                min={1}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" disabled={createLoading}>
              {createLoading ? "กำลังสร้าง..." : "เพิ่มโรงแรม"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Invite Modal */}
      <Modal show={!!showInvite} onHide={() => setShowInvite(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>เชิญสมาชิก</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleInvite}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>อีเมล *</Form.Label>
              <Form.Control
                type="email"
                placeholder="email@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>บทบาท *</Form.Label>
              <Form.Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="REVENUE_MANAGER">Revenue Manager</option>
                <option value="FRONT_DESK">Front Desk</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowInvite(null)}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="primary" disabled={inviteLoading}>
              {inviteLoading ? "กำลังส่ง..." : "ส่งคำเชิญ"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
