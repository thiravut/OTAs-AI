"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      router.push("/overview");
      router.refresh();
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
        <p className="text-center text-muted mb-4">เข้าสู่ระบบ</p>

        {registered && (
          <Alert variant="success">ลงทะเบียนสำเร็จ กรุณาเข้าสู่ระบบ</Alert>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        <Form onSubmit={handleSubmit}>
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
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            type="submit"
            variant="primary"
            className="w-100 mb-3"
            disabled={loading}
          >
            {loading ? "กำลังดำเนินการ..." : "เข้าสู่ระบบ"}
          </Button>

          <p className="text-center text-muted mb-0">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register">ลงทะเบียน</Link>
          </p>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
