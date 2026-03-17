"use client";

import { Card } from "react-bootstrap";

export default function RecommendationsPage() {
  return (
    <>
      <h4 className="mb-4">คำแนะนำ AI</h4>
      <Card className="border-0 shadow-sm text-center py-5">
        <Card.Body>
          <p className="text-muted">จะแสดงเมื่อเชื่อมต่อ AI Engine (Epic 3)</p>
        </Card.Body>
      </Card>
    </>
  );
}
