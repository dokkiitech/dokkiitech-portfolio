import assert from "node:assert/strict"
import test from "node:test"
import { BookingClient } from "./booking-client.mjs"

test("BookingClient requests availability from the existing booking API", async () => {
  let requestedUrl
  const client = new BookingClient({
    baseUrl: "http://localhost:3000",
    fetchImpl: async (url) => {
      requestedUrl = url
      return Response.json({ ok: true, slots: ["14:00"] })
    },
  })

  const result = await client.getAvailability("2026-09-15", "対面")

  assert.deepEqual(result.slots, ["14:00"])
  assert.equal(
    requestedUrl.href,
    "http://localhost:3000/api/bookings?date=2026-09-15&bookingType=%E5%AF%BE%E9%9D%A2"
  )
})

test("BookingClient forwards booking payloads as JSON", async () => {
  let requestedInit
  const client = new BookingClient({
    baseUrl: "http://127.0.0.1:3000",
    fetchImpl: async (_url, init) => {
      requestedInit = init
      return Response.json({ ok: true, bookingId: "BK-123" })
    },
  })
  const payload = {
    name: "山田太郎",
    email: "taro@example.com",
    bookingType: "meet",
    date: "2026-09-15",
    timeSlot: "14:00",
    agenda: "相談",
  }

  const result = await client.createBooking(payload)

  assert.equal(result.bookingId, "BK-123")
  assert.equal(requestedInit.method, "POST")
  assert.deepEqual(JSON.parse(requestedInit.body), payload)
})

test("BookingClient exposes API messages without internal response details", async () => {
  const client = new BookingClient({
    baseUrl: "http://localhost:3000",
    fetchImpl: async () =>
      Response.json({ ok: false, message: "この日は空きがありません。", error: "internal" }, { status: 409 }),
  })

  await assert.rejects(client.getAvailability("2026-09-15", "meet"), {
    message: "この日は空きがありません。",
  })
})
