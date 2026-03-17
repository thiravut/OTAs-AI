-- CreateTable
CREATE TABLE "PriceUpdateLog" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "otaName" TEXT NOT NULL,
    "targetDate" DATE NOT NULL,
    "previousPrice" INTEGER NOT NULL,
    "newPrice" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "channexResponse" JSONB,
    "error" TEXT,
    "triggeredBy" TEXT NOT NULL,
    "recommendationId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceUpdateLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PriceUpdateLog_hotelId_createdAt_idx" ON "PriceUpdateLog"("hotelId", "createdAt");

-- CreateIndex
CREATE INDEX "PriceUpdateLog_status_idx" ON "PriceUpdateLog"("status");

-- AddForeignKey
ALTER TABLE "PriceUpdateLog" ADD CONSTRAINT "PriceUpdateLog_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceUpdateLog" ADD CONSTRAINT "PriceUpdateLog_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceUpdateLog" ADD CONSTRAINT "PriceUpdateLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
