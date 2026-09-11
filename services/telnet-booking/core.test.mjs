import assert from "node:assert/strict"
import test from "node:test"
import { TelnetDecoder, isValidEmail, normalizeDateInput, sanitizeInput, selectSlot } from "./core.mjs"

test("TelnetDecoder removes negotiation sequences across chunks", () => {
  const decoder = new TelnetDecoder()

  assert.equal(decoder.push(Buffer.from([104, 105, 255, 251])).toString(), "hi")
  assert.equal(decoder.push(Buffer.from([1, 33, 255, 250, 31, 0])).toString(), "!")
  assert.equal(decoder.push(Buffer.from([80, 0, 24, 255])).toString(), "")
  assert.equal(decoder.push(Buffer.from([240, 111, 107])).toString(), "ok")
})

test("sanitizeInput strips terminal control sequences and limits length", () => {
  assert.equal(sanitizeInput(" \u001b[31mhello\u001b[0m\u0007 ", 4), "hell")
})

test("normalizeDateInput accepts supported formats and rejects invalid dates", () => {
  const now = new Date("2026-09-11T00:00:00Z")

  assert.equal(normalizeDateInput("2026-9-15", now), "2026-09-15")
  assert.equal(normalizeDateInput("9/15", now), "2026-09-15")
  assert.equal(normalizeDateInput("20260915", now), "2026-09-15")
  assert.equal(normalizeDateInput("2026-02-29", now), null)
  assert.equal(normalizeDateInput("not-a-date", now), null)
})

test("selectSlot supports displayed numbers, hours, and exact times", () => {
  const slots = ["10:00", "14:00", "18:00"]

  assert.equal(selectSlot("2", slots), "14:00")
  assert.equal(selectSlot("14", slots), "14:00")
  assert.equal(selectSlot("18:00", slots), "18:00")
  assert.equal(selectSlot("9", slots), null)
})

test("isValidEmail performs basic address validation", () => {
  assert.equal(isValidEmail("user@example.com"), true)
  assert.equal(isValidEmail("invalid"), false)
})
