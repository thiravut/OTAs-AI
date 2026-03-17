"use client";

import { useSession } from "next-auth/react";
import { Card, Row, Col } from "react-bootstrap";

export default function OverviewPage() {
  const { data: session } = useSession();

  return (
    <>
      <h4 className="mb-4">
        สวัสดี, {session?.user?.name ?? "ผู้ใช้"}
      </h4>

      <Row className="g-3">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">
                สถานะระบบ
              </Card.Subtitle>
              <h5 className="text-success">พร้อมใช้งาน</h5>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">
                คำแนะนำรอดำเนินการ
              </Card.Subtitle>
              <h5>— รายการ</h5>
              <small className="text-muted">จะแสดงเมื่อเชื่อมต่อ OTA</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <Card.Subtitle className="text-muted mb-2">
                OTA เชื่อมต่อ
              </Card.Subtitle>
              <h5>— แห่ง</h5>
              <small className="text-muted">เพิ่มได้ในหน้าโรงแรม</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
