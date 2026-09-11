import assert from "node:assert/strict"
import { once } from "node:events"
import net from "node:net"
import test from "node:test"
import { createTelnetBookingServer } from "./server.mjs"

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", () => resolve(server.address().port))
  })
}

function close(server) {
  return new Promise((resolve) => server.close(resolve))
}

function waitForClose(socket, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), 2_000)
    socket.once("close", () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

test("Telnet gateway completes an interactive booking through the existing API contract", async () => {
  let submitted
  const bookingClient = {
    async getAvailability(date, bookingType) {
      assert.equal(date, "2099-09-15")
      assert.equal(bookingType, "meet")
      return { ok: true, slots: ["14:00", "18:00"] }
    },
    async createBooking(payload) {
      submitted = payload
      return { ok: true, bookingId: "BK-TELNET-1", managePortal: { initialPassword: "secret" } }
    },
  }
  const server = createTelnetBookingServer({
    bookingClient,
    idleTimeoutMs: 5_000,
    maxConnections: 5,
    rateLimitConnections: 100,
  })
  const port = await listen(server)
  const socket = net.createConnection({ host: "127.0.0.1", port })
  socket.setEncoding("utf8")
  let transcript = ""

  socket.on("data", (chunk) => {
    transcript += chunk
  })

  const waitFor = async (text) => {
    const deadline = Date.now() + 2_000
    while (!transcript.includes(text)) {
      if (Date.now() >= deadline) throw new Error(`Timed out waiting for: ${text}\n${transcript}`)
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }
  const enter = async (value, expected) => {
    socket.write(`${value}\r\n`)
    await waitFor(expected)
  }

  try {
    await waitFor("dokkiitech> ")
    assert.match(transcript, /██████╗  ██████╗.*██╗  ██╗/)
    await enter("book", "お名前")
    await enter("山田太郎", "メールアドレス")
    await enter("taro@example.com", "会社名")
    await enter("-", "Google Meet")
    await enter("1", "希望日")
    await enter("2099-09-15", "空き時間（2099-09-15）")
    await enter("1", "相談内容")
    await enter("新規プロダクト相談", "予約内容")
    await enter("y", "予約番号: BK-TELNET-1")

    assert.deepEqual(submitted, {
      name: "山田太郎",
      email: "taro@example.com",
      company: undefined,
      bookingType: "meet",
      date: "2099-09-15",
      timeSlot: "14:00",
      agenda: "新規プロダクト相談",
      location: undefined,
    })
    assert.equal(transcript.includes("secret"), false)
  } finally {
    socket.destroy()
    await close(server)
  }
})

test("Telnet gateway limits concurrent connections from one IP", async () => {
  const server = createTelnetBookingServer({
    idleTimeoutMs: 5_000,
    maxConnections: 5,
    maxConnectionsPerIp: 1,
    rateLimitConnections: 100,
  })
  const port = await listen(server)
  const first = net.createConnection({ host: "127.0.0.1", port })
  first.setEncoding("utf8")
  let firstTranscript = ""
  first.on("data", (chunk) => {
    firstTranscript += chunk
  })
  await once(first, "data")

  const second = net.createConnection({ host: "127.0.0.1", port })
  second.setEncoding("utf8")
  let secondTranscript = ""
  second.on("data", (chunk) => {
    secondTranscript += chunk
  })

  try {
    await waitForClose(second, "Timed out waiting for rejection")
    assert.match(firstTranscript, /DOKKIITECH MEETING RESERVATION/)
    assert.match(secondTranscript, /現在混み合っています/)
  } finally {
    first.destroy()
    second.destroy()
    await close(server)
  }
})

test("Telnet gateway rate limits repeated connections from one IP", async () => {
  const server = createTelnetBookingServer({
    idleTimeoutMs: 5_000,
    maxConnections: 5,
    maxConnectionsPerIp: 2,
    rateLimitConnections: 1,
    rateLimitWindowMs: 5_000,
  })
  const port = await listen(server)
  const first = net.createConnection({ host: "127.0.0.1", port })
  await once(first, "connect")
  first.destroy()
  await once(first, "close")

  const second = net.createConnection({ host: "127.0.0.1", port })
  second.setEncoding("utf8")
  let transcript = ""
  second.on("data", (chunk) => {
    transcript += chunk
  })

  try {
    await waitForClose(second, "Timed out waiting for rate limit")
    assert.match(transcript, /現在混み合っています/)
  } finally {
    second.destroy()
    await close(server)
  }
})
