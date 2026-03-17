"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Form, Button, Alert } from "react-bootstrap";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "เกิดข้อผิดพลาด");
        return;
      }

      router.push("/login?registered=true");
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-sm border-0">
      <Card.Body className="p-4">
        <h2 className="text-center mb-1" style={{ color: "var(--rg-primary)" }}>
          RateGenie
        </h2>
        <p className="text-center text-muted mb-4">สร้างบัญชีใหม่</p>

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>ชื่อ</Form.Label>
            <Form.Control
              type="text"
              placeholder="กรอกชื่อ-นามสกุล"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>อีเมล</Form.Label>
            <Form.Control
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>รหัสผ่าน</Form.Label>
            <Form.Control
              type="password"
              placeholder="อย่างน้อย 8 ตัวอักษร"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? "กำลังดำเนินการ..." : "ลงทะเบียน"}
          </Button>

          <p className="text-center text-muted mb-0">
            มีบัญชีแล้ว?{" "}
            <Link href="/login">เข้าสู่ระบบ</Link>
          </p>
        </Form>
      </Card.Body>
    </Card>
  );
}
