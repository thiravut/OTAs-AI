import { Container } from "react-bootstrap";

export default function Home() {
  return (
    <Container className="py-5 text-center">
      <h1 className="display-4 fw-bold text-primary">RateGenie</h1>
      <p className="lead text-muted">
        AI Revenue Assistant สำหรับโรงแรมอิสระในไทย
      </p>
      <p>แค่อ่านคำแนะนำ กดอนุมัติ — AI ดูแลราคาให้</p>
    </Container>
  );
}
