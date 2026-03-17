"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  Table,
  Collapse,
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

interface OtaConnection {
  otaName: string;
  status: string;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  lastError: string | null;
  retryCount: number;
}

interface SyncStatus {
  overallStatus: string;
  connections: OtaConnection[];
}

interface RoomTypeMapping {
  id: string;
  name: string;
  agodaName: string | null;
  bookingName: string | null;
}

interface SyncHistoryEntry {
  id: string;
  otaName: string;
  status: string;
  syncedAt: string;
  details: string | null;
}

interface PushHistoryEntry {
  id: string;
  otaName: string;
  status: string;
  newPrice: number;
  previousPrice: number;
  createdAt: string;
}

const OTA_COLORS: Record<string, string> = {
  agoda: "#f27d0c",
  "booking.com": "#003580",
  booking: "#003580",
  expedia: "#fddb32",
};

function otaBadgeBg(platform: string): string {
  const key = platform.toLowerCase();
  return OTA_COLORS[key] ?? "#6c757d";
}

function timeSince(dateStr: string | null): string {
  if (!dateStr) return "ยังไม่เคย sync";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "เมื่อสักครู่";
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return `${days} วันที่แล้ว`;
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

  // Channel management expanded state
  const [expandedHotel, setExpandedHotel] = useState<string | null>(null);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus>>(
    {}
  );
  const [roomTypes, setRoomTypes] = useState<
    Record<string, RoomTypeMapping[]>
  >({});
  const [syncHistories, setSyncHistories] = useState<
    Record<string, SyncHistoryEntry[]>
  >({});
  const [pushHistories, setPushHistories] = useState<
    Record<string, PushHistoryEntry[]>
  >({});
  const [channelLoading, setChannelLoading] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchHotels = useCallback(async () => {
    try {
      const res = await fetch("/api/hotels");
      const data = await res.json();
      const list: Hotel[] = data.data ?? [];
      setHotels(list);

      // Fetch sync status for every hotel in parallel
      const statusPromises = list.map(async (h) => {
        try {
          const r = await fetch(`/api/hotels/${h.id}/sync-status`);
          if (r.ok) {
            const s: SyncStatus = await r.json();
            return { id: h.id, status: s };
          }
        } catch {
          /* ignore */
        }
        return { id: h.id, status: null };
      });

      const results = await Promise.all(statusPromises);
      const map: Record<string, SyncStatus> = {};
      results.forEach((r) => {
        if (r.status) map[r.id] = r.status;
      });
      setSyncStatuses(map);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลโรงแรมได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  // Fetch channel details when expanding
  async function loadChannelDetails(hotelId: string) {
    if (roomTypes[hotelId]) return; // already loaded
    setChannelLoading(hotelId);
    try {
      const [rtRes, histRes, pushRes] = await Promise.all([
        fetch(`/api/hotels/${hotelId}/room-types`),
        fetch(`/api/hotels/${hotelId}/sync-history`),
        fetch(`/api/hotels/${hotelId}/push-history?limit=5`),
      ]);

      if (rtRes.ok) {
        const rtData = await rtRes.json();
        setRoomTypes((prev) => ({
          ...prev,
          [hotelId]: rtData.data ?? rtData ?? [],
        }));
      }

      if (histRes.ok) {
        const histData = await histRes.json();
        setSyncHistories((prev) => ({
          ...prev,
          [hotelId]: (histData.data ?? histData ?? []).slice(0, 5),
        }));
      }

      if (pushRes.ok) {
        const pushData = await pushRes.json();
        setPushHistories((prev) => ({
          ...prev,
          [hotelId]: (pushData.data ?? []).slice(0, 5),
        }));
      }
    } catch {
      /* ignore */
    } finally {
      setChannelLoading(null);
    }
  }

  function toggleExpand(hotelId: string) {
    if (expandedHotel === hotelId) {
      setExpandedHotel(null);
    } else {
      setExpandedHotel(hotelId);
      loadChannelDetails(hotelId);
    }
  }

  async function triggerSync(hotelId: string) {
    setSyncing(hotelId);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/sync`, {
        method: "POST",
      });
      if (res.ok) {
        setSuccess("เริ่ม sync เรียบร้อย");
        // Refresh sync status
        const sr = await fetch(`/api/hotels/${hotelId}/sync-status`);
        if (sr.ok) {
          const s: SyncStatus = await sr.json();
          setSyncStatuses((prev) => ({ ...prev, [hotelId]: s }));
        }
      } else {
        setError("ไม่สามารถ sync ได้");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการ sync");
    } finally {
      setSyncing(null);
    }
  }

  async function handleRollback(hotelId: string, logId: string) {
    if (!confirm("ต้องการ rollback ราคากลับเป็นราคาเดิมบน OTA?")) return;
    try {
      const res = await fetch(`/api/hotels/${hotelId}/push-history/${logId}/rollback`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Rollback สำเร็จ — ราคาเดิมถูก push กลับไป OTA แล้ว");
        // Refresh push history
        const pushRes = await fetch(`/api/hotels/${hotelId}/push-history?limit=5`);
        if (pushRes.ok) {
          const pushData = await pushRes.json();
          setPushHistories((prev) => ({ ...prev, [hotelId]: (pushData.data ?? []).slice(0, 5) }));
        }
      } else {
        setError(data.error ?? "Rollback ล้มเหลว");
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการ rollback");
    }
  }

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
        <>
          <Row className="g-3">
            {hotels.map((hotel) => {
              const ss = syncStatuses[hotel.id];
              const isExpanded = expandedHotel === hotel.id;

              return (
                <Col key={hotel.id} md={6} lg={4}>
                  <Card
                    className={`border-0 shadow-sm h-100 ${isExpanded ? "border-primary" : ""}`}
                  >
                    <Card.Body>
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Card.Title className="mb-0">{hotel.name}</Card.Title>
                        <Badge
                          bg={
                            hotel.role === "OWNER" ? "primary" : "secondary"
                          }
                        >
                          {hotel.role === "OWNER" ? "เจ้าของ" : "สมาชิก"}
                        </Badge>
                      </div>

                      {/* Location */}
                      {hotel.location && (
                        <p className="text-muted mb-1 small">
                          {hotel.location}
                        </p>
                      )}

                      {/* Room + member count */}
                      <p className="text-muted mb-2 small">
                        {hotel.totalRooms > 0 ? `${hotel.totalRooms} ห้อง` : ""}
                        {hotel.totalRooms > 0 && hotel.memberCount > 0
                          ? " \u00b7 "
                          : ""}
                        {hotel.memberCount > 0
                          ? `${hotel.memberCount} สมาชิก`
                          : ""}
                      </p>

                      {/* OTA Connection badges */}
                      {ss && ss.connections.length > 0 && (
                        <div className="mb-2">
                          <div className="text-muted small fw-semibold mb-1">
                            OTA ที่เชื่อมต่อ
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {ss.connections.map((conn) => (
                              <Badge
                                key={conn.otaName}
                                pill
                                style={{
                                  background:
                                    conn.status === "CONNECTED"
                                      ? otaBadgeBg(conn.otaName)
                                      : "#6c757d",
                                  fontSize: "0.7rem",
                                }}
                              >
                                {conn.otaName}
                                {conn.status !== "connected" && " (offline)"}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Sync status */}
                      {ss && (
                        <div className="mb-3 d-flex align-items-center gap-2 small">
                          <span
                            style={{
                              display: "inline-block",
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: ss.overallStatus === "healthy" ? "#198754" : "#dc3545",
                              flexShrink: 0,
                            }}
                          />
                          <span className="text-muted">
                            {ss.overallStatus === "healthy" ? "Sync ปกติ" : "Sync มีปัญหา"}
                            {" \u00b7 "}
                            {timeSince(ss.connections[0]?.lastSyncAt ?? null)}
                          </span>
                        </div>
                      )}

                      {/* Quick actions */}
                      <div className="d-flex flex-wrap gap-2">
                        <Link href={`/hotels/${hotel.id}/settings`}>
                          <Button variant="primary" size="sm">
                            จัดการ
                          </Button>
                        </Link>
                        {hotel.role === "OWNER" && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => setShowInvite(hotel.id)}
                          >
                            เชิญสมาชิก
                          </Button>
                        )}
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => toggleExpand(hotel.id)}
                        >
                          {isExpanded ? "ซ่อน OTA" : "ดู OTA connections"}
                        </Button>
                      </div>
                    </Card.Body>

                    {/* ========== CHANNEL MANAGEMENT (Expandable) ========== */}
                    <Collapse in={isExpanded}>
                      <div>
                        <hr className="mx-3 my-0" />
                        <Card.Body className="pt-3">
                          {channelLoading === hotel.id ? (
                            <div className="text-center py-3">
                              <Spinner
                                animation="border"
                                size="sm"
                                variant="primary"
                              />
                              <span className="ms-2 small text-muted">
                                กำลังโหลดข้อมูล...
                              </span>
                            </div>
                          ) : (
                            <>
                              {/* Connected OTAs detail */}
                              {ss && ss.connections.length > 0 && (
                                <div className="mb-3">
                                  <div className="fw-semibold small mb-2">
                                    สถานะ OTA
                                  </div>
                                  {ss.connections.map((conn) => (
                                    <div
                                      key={conn.otaName}
                                      className="d-flex align-items-center justify-content-between mb-1 small"
                                    >
                                      <div className="d-flex align-items-center gap-2">
                                        <span
                                          style={{
                                            display: "inline-block",
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            background:
                                              conn.status === "CONNECTED"
                                                ? "#198754"
                                                : conn.status === "ERROR"
                                                  ? "#dc3545"
                                                  : "#6c757d",
                                          }}
                                        />
                                        <span className="fw-semibold">
                                          {conn.otaName}
                                        </span>
                                      </div>
                                      <span className="text-muted">
                                        {conn.lastSyncAt
                                          ? timeSince(conn.lastSyncAt)
                                          : "ยังไม่เคย sync"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Room Type Mapping */}
                              {roomTypes[hotel.id] &&
                                roomTypes[hotel.id].length > 0 && (
                                  <div className="mb-3">
                                    <div className="fw-semibold small mb-2">
                                      Room Type Mapping
                                    </div>
                                    <Table
                                      size="sm"
                                      responsive
                                      className="small mb-0"
                                    >
                                      <thead>
                                        <tr>
                                          <th>ประเภทห้อง</th>
                                          <th>Agoda</th>
                                          <th>Booking.com</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {roomTypes[hotel.id].map((rt) => (
                                          <tr key={rt.id}>
                                            <td>{rt.name}</td>
                                            <td>
                                              {rt.agodaName ?? (
                                                <span className="text-muted">
                                                  -
                                                </span>
                                              )}
                                            </td>
                                            <td>
                                              {rt.bookingName ?? (
                                                <span className="text-muted">
                                                  -
                                                </span>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                )}

                              {/* Sync History */}
                              {syncHistories[hotel.id] &&
                                syncHistories[hotel.id].length > 0 && (
                                  <div className="mb-3">
                                    <div className="fw-semibold small mb-2">
                                      Sync History (ล่าสุด 5 รายการ)
                                    </div>
                                    {syncHistories[hotel.id].map((entry) => (
                                      <div
                                        key={entry.id}
                                        className="d-flex align-items-center justify-content-between small mb-1"
                                      >
                                        <div className="d-flex align-items-center gap-2">
                                          <Badge
                                            bg={
                                              entry.status === "success"
                                                ? "success"
                                                : entry.status === "partial"
                                                  ? "warning"
                                                  : "danger"
                                            }
                                            style={{ fontSize: "0.65rem" }}
                                          >
                                            {entry.status === "success"
                                              ? "สำเร็จ"
                                              : entry.status === "partial"
                                                ? "บางส่วน"
                                                : "ล้มเหลว"}
                                          </Badge>
                                          <span>{entry.otaName}</span>
                                        </div>
                                        <span className="text-muted">
                                          {timeSince(entry.syncedAt)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                              {/* Push History */}
                              {pushHistories[hotel.id] &&
                                pushHistories[hotel.id].length > 0 && (
                                  <div className="mb-3">
                                    <div className="fw-semibold small mb-2">
                                      Push History (ล่าสุด 5 รายการ)
                                    </div>
                                    {pushHistories[hotel.id].map((entry) => (
                                      <div
                                        key={entry.id}
                                        className="d-flex align-items-center justify-content-between small mb-1"
                                      >
                                        <div className="d-flex align-items-center gap-2">
                                          <Badge
                                            bg={
                                              entry.status === "success"
                                                ? "success"
                                                : entry.status === "rolled_back"
                                                  ? "warning"
                                                  : "danger"
                                            }
                                            style={{ fontSize: "0.65rem" }}
                                          >
                                            {entry.status === "success"
                                              ? "สำเร็จ"
                                              : entry.status === "rolled_back"
                                                ? "Rollback"
                                                : "ล้มเหลว"}
                                          </Badge>
                                          <span>{entry.otaName}</span>
                                          <span className="text-muted">
                                            ฿{entry.newPrice.toLocaleString()}
                                          </span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                          <span className="text-muted">
                                            {timeSince(entry.createdAt)}
                                          </span>
                                          {entry.status === "success" && (
                                            <Button
                                              variant="outline-warning"
                                              size="sm"
                                              style={{ fontSize: "0.6rem", padding: "1px 6px" }}
                                              onClick={() => handleRollback(hotel.id, entry.id)}
                                            >
                                              Rollback
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                              {/* Sync Now button */}
                              <Button
                                variant="outline-primary"
                                size="sm"
                                disabled={syncing === hotel.id}
                                onClick={() => triggerSync(hotel.id)}
                              >
                                {syncing === hotel.id ? (
                                  <>
                                    <Spinner
                                      animation="border"
                                      size="sm"
                                      className="me-1"
                                    />
                                    กำลัง sync...
                                  </>
                                ) : (
                                  "Sync ตอนนี้"
                                )}
                              </Button>
                            </>
                          )}
                        </Card.Body>
                      </div>
                    </Collapse>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </>
      )}

      {/* ========== Create Hotel Modal ========== */}
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

      {/* ========== Invite Modal ========== */}
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
