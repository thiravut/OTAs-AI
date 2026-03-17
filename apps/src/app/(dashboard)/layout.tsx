"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Container, Nav, Navbar, Button } from "react-bootstrap";
import Link from "next/link";

const navItems = [
  { href: "/overview", label: "ภาพรวม" },
  { href: "/hotels", label: "โรงแรม" },
  { href: "/pricing", label: "ราคา" },
  { href: "/recommendations", label: "คำแนะนำ AI" },
  { href: "/revenue", label: "รายได้" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--rg-light)" }}>
      <Navbar bg="white" expand="lg" className="shadow-sm border-bottom">
        <Container fluid>
          <Link href="/overview" className="text-decoration-none">
            <Navbar.Brand
              className="fw-bold"
              style={{ color: "var(--rg-primary)" }}
            >
              RateGenie
            </Navbar.Brand>
          </Link>
          <Navbar.Toggle aria-controls="main-nav" />
          <Navbar.Collapse id="main-nav">
            <Nav className="me-auto">
              {navItems.map((item) => (
                <Nav.Link
                  key={item.href}
                  as={Link}
                  href={item.href}
                  active={pathname === item.href}
                >
                  {item.label}
                </Nav.Link>
              ))}
            </Nav>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              ออกจากระบบ
            </Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container fluid className="py-4 px-3 px-lg-4">
        {children}
      </Container>
    </div>
  );
}
