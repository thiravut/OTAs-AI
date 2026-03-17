"use client";

import { useState, useEffect } from "react";
import { Card, Table, Badge, Spinner } from "react-bootstrap";

interface PriceData {
  dateRange: { from: string; to: string };
  roomTypes: {
    id: string;
    name: string;
    prices: {
      date: string;
      otas: Record<string, { price: number; syncedAt: string }>;
      hasPriceDifference: boolean;
    }[];
  }[];
}

export default function PricingPage() {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then(async (d) => {
        if (!d.data?.[0]) { setLoading(false); return; }
        const res = await fetch(`/api/hotels/${d.data[0].id}/prices`);
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

  if (!data || data.roomTypes.length === 0) {
    return (
      <>
        <h4 className="mb-4">ราคาห้องพัก</h4>
        <Card className="border-0 shadow-sm text-center py-5">
          <Card.Body>
            <p className="text-muted">ยังไม่มีข้อมูลราคา — เชื่อมต่อ OTA และ sync ข้อมูลก่อน</p>
          </Card.Body>
        </Card>
      </>
    );
  }

  return (
    <>
      <h4 className="mb-4">
        ราคาห้องพัก ({data.dateRange.from} — {data.dateRange.to})
      </h4>

      {data.roomTypes.map((rt) => (
        <Card key={rt.id} className="border-0 shadow-sm mb-3">
          <Card.Header className="bg-white fw-bold">{rt.name}</Card.Header>
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>วันที่</th>
                <th className="text-end">Agoda</th>
                <th className="text-end">Booking.com</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rt.prices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    ไม่พบข้อมูลราคา
                  </td>
                </tr>
              ) : (
                rt.prices.map((p) => (
                  <tr key={p.date}>
                    <td>{p.date}</td>
                    <td className="text-end font-mono">
                      {p.otas.agoda
                        ? p.otas.agoda.price.toLocaleString()
                        : "—"}
                    </td>
                    <td className="text-end font-mono">
                      {p.otas.booking
                        ? p.otas.booking.price.toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      {p.hasPriceDifference && (
                        <Badge bg="warning" text="dark">
                          ราคาต่างกัน
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      ))}
    </>
  );
}
