"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Badge,
  Modal,
  Form,
  Alert,
  Spinner,
} from "react-bootstrap";

interface RuleAction {
  type: string;
  direction: "up" | "down";
  amount: number;
  unit: "percent" | "baht";
}

interface RuleCondition {
  metric: string;
  operator: string;
  value: unknown;
}

interface PricingRule {
  id: string;
  name: string;
  description: string | null;
  enabled: boolean;
  priority: number;
  conditions: RuleCondition[];
  action: RuleAction;
  template: string | null;
  totalExecutions: number;
  createdAt: string;
}

interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  action: RuleAction;
}

const METRIC_LABELS: Record<string, string> = {
  occupancy: "Occupancy (%)",
  booking_pace: "Booking Pace (%)",
  day_of_week: "วันในสัปดาห์",
  days_until: "จำนวนวันก่อนถึง",
};

const OPERATOR_LABELS: Record<string, string> = {
  ">": "มากกว่า",
  "<": "น้อยกว่า",
  ">=": "มากกว่าหรือเท่ากับ",
  "<=": "น้อยกว่าหรือเท่ากับ",
  "==": "เท่ากับ",
  in: "เป็นหนึ่งใน",
};

function describeCondition(c: RuleCondition): string {
  const metric = METRIC_LABELS[c.metric] ?? c.metric;
  const op = OPERATOR_LABELS[c.operator] ?? c.operator;
  const val = Array.isArray(c.value)
    ? c.value.map((v) => (c.metric === "day_of_week" ? ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."][v as number] ?? v : v)).join(", ")
    : String(c.value);
  return `${metric} ${op} ${val}`;
}

function describeAction(a: RuleAction): string {
  const dir = a.direction === "up" ? "ขึ้นราคา" : "ลดราคา";
  const unit = a.unit === "percent" ? "%" : " บาท";
  return `${dir} ${a.amount}${unit}`;
}

export default function RulesPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [templates, setTemplates] = useState<RuleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RuleTemplate | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creating, setCreating] = useState(false);

  // Create form
  const [ruleName, setRuleName] = useState("");
  const [ruleAmount, setRuleAmount] = useState("10");

  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.[0]) setHotelId(d.data[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const fetchRules = useCallback(async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hotels/${hotelId}/rules`);
      const data = await res.json();
      setRules(data.data ?? []);
      setTemplates(data.templates ?? []);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลกฎได้");
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  function openCreateFromTemplate(t: RuleTemplate) {
    setSelectedTemplate(t);
    setRuleName(t.name);
    setRuleAmount(String(t.action.amount));
    setShowCreate(true);
  }

  async function handleCreate() {
    if (!hotelId || !selectedTemplate) return;
    setCreating(true);
    setError("");

    try {
      const action = {
        ...selectedTemplate.action,
        amount: parseFloat(ruleAmount),
      };

      // Update condition value based on template
      const conditions = selectedTemplate.conditions.map((c) => {
        if (c.metric === "occupancy" || c.metric === "booking_pace") {
          return { ...c }; // keep default value from template
        }
        return c;
      });

      const res = await fetch(`/api/hotels/${hotelId}/rules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: ruleName,
          description: selectedTemplate.description,
          conditions,
          action,
          template: selectedTemplate.id,
        }),
      });

      if (res.ok) {
        setSuccess("สร้างกฎสำเร็จ");
        setShowCreate(false);
        setSelectedTemplate(null);
        fetchRules();
      } else {
        const data = await res.json();
        setError(data.error ?? "ไม่สามารถสร้างกฎได้");
      }
    } catch {
      setError("เกิดข้อผิดพลาด");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" style={{ color: "var(--rg-primary)" }} />
      </div>
    );
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-1">กฎปรับราคาอัตโนมัติ</h4>
          <small className="text-muted">
            ตั้งกฎให้ระบบปรับราคาอัตโนมัติ ทำงานร่วมกับ AI
          </small>
        </div>
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

      {/* Existing Rules */}
      {rules.length > 0 && (
        <div className="mb-4">
          <h6 className="fw-bold mb-3">กฎที่ใช้งานอยู่ ({rules.length})</h6>
          <Row className="g-3">
            {rules.map((rule) => (
              <Col key={rule.id} md={6}>
                <Card
                  className="border-0 shadow-sm h-100"
                  style={{
                    borderLeft: `4px solid ${rule.enabled ? "var(--rg-success)" : "var(--rg-gray-300)"} !important`,
                    borderLeftWidth: 4,
                    borderLeftStyle: "solid",
                    borderLeftColor: rule.enabled ? "var(--rg-success)" : "var(--rg-gray-300)",
                  }}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <span className="fw-bold">{rule.name}</span>
                        <Badge
                          bg=""
                          className="ms-2"
                          style={{
                            backgroundColor: rule.enabled ? "var(--rg-success-light)" : "var(--rg-gray-100)",
                            color: rule.enabled ? "var(--rg-success)" : "var(--rg-gray-500)",
                            fontSize: "0.7rem",
                          }}
                        >
                          {rule.enabled ? "เปิดใช้" : "ปิด"}
                        </Badge>
                      </div>
                      <small className="text-muted">
                        ทำงานแล้ว {rule.totalExecutions} ครั้ง
                      </small>
                    </div>

                    {rule.description && (
                      <p className="text-muted small mb-2">{rule.description}</p>
                    )}

                    <div className="small mb-2">
                      <span className="text-muted">เงื่อนไข: </span>
                      {(rule.conditions as RuleCondition[]).map((c, i) => (
                        <Badge key={i} bg="light" text="dark" className="me-1" style={{ fontSize: "0.75rem" }}>
                          {describeCondition(c)}
                        </Badge>
                      ))}
                    </div>

                    <div className="small">
                      <span className="text-muted">ผลลัพธ์: </span>
                      <Badge
                        bg=""
                        style={{
                          backgroundColor: (rule.action as RuleAction).direction === "up" ? "var(--rg-success-light)" : "var(--rg-danger-light)",
                          color: (rule.action as RuleAction).direction === "up" ? "var(--rg-success)" : "var(--rg-danger)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {describeAction(rule.action as RuleAction)}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Templates */}
      <h6 className="fw-bold mb-3">เพิ่มกฎจาก Template</h6>
      <Row className="g-3 mb-4">
        {templates.map((t) => (
          <Col key={t.id} md={6} lg={4}>
            <Card
              className="border-0 shadow-sm h-100"
              style={{ cursor: "pointer" }}
              onClick={() => openCreateFromTemplate(t)}
            >
              <Card.Body>
                <div className="d-flex align-items-start gap-2 mb-2">
                  <span style={{ fontSize: 24 }}>
                    {t.action.direction === "up" ? "📈" : "📉"}
                  </span>
                  <div>
                    <div className="fw-bold">{t.name}</div>
                    <small className="text-muted">{t.description}</small>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-2">
                  <Badge bg="light" text="dark" style={{ fontSize: "0.7rem" }}>
                    {t.conditions.map((c) => describeCondition(c)).join(" + ")}
                  </Badge>
                  <Badge
                    bg=""
                    style={{
                      backgroundColor: t.action.direction === "up" ? "var(--rg-success-light)" : "var(--rg-danger-light)",
                      color: t.action.direction === "up" ? "var(--rg-success)" : "var(--rg-danger)",
                      fontSize: "0.7rem",
                    }}
                  >
                    {describeAction(t.action)}
                  </Badge>
                </div>

                <div className="mt-2">
                  <Button variant="outline-primary" size="sm">
                    ใช้ Template นี้
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Create Rule Modal */}
      <Modal show={showCreate} onHide={() => setShowCreate(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>สร้างกฎใหม่</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTemplate && (
            <>
              <div className="mb-3 p-3 rounded" style={{ backgroundColor: "var(--rg-gray-100)" }}>
                <div className="fw-bold mb-1">{selectedTemplate.name}</div>
                <small className="text-muted">{selectedTemplate.description}</small>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>ชื่อกฎ</Form.Label>
                <Form.Control
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  จำนวนที่ปรับ ({selectedTemplate.action.unit === "percent" ? "%" : "บาท"})
                </Form.Label>
                <Form.Control
                  type="number"
                  value={ruleAmount}
                  onChange={(e) => setRuleAmount(e.target.value)}
                  min={1}
                />
              </Form.Group>

              <div className="small text-muted">
                <strong>เงื่อนไข:</strong>{" "}
                {selectedTemplate.conditions.map((c) => describeCondition(c)).join(" และ ")}
                <br />
                <strong>ผลลัพธ์:</strong>{" "}
                {selectedTemplate.action.direction === "up" ? "ขึ้นราคา" : "ลดราคา"}{" "}
                {ruleAmount}{selectedTemplate.action.unit === "percent" ? "%" : " บาท"}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>
            ยกเลิก
          </Button>
          <Button variant="primary" onClick={handleCreate} disabled={creating}>
            {creating ? "กำลังสร้าง..." : "สร้างกฎ"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
