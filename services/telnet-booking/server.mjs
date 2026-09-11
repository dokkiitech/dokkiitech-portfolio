import net from "node:net"
import { StringDecoder } from "node:string_decoder"
import { pathToFileURL } from "node:url"
import { BookingClient } from "./booking-client.mjs"
import { TelnetDecoder, isValidEmail, normalizeDateInput, sanitizeInput, selectSlot } from "./core.mjs"

const CRLF = "\r\n"
const MAX_LINE_LENGTH = 2_000

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function formatOutput(lines) {
  return `${lines.flatMap((line) => String(line).split(/\r?\n/)).join(CRLF)}${CRLF}`
}

class BookingSession {
  constructor(socket, bookingClient) {
    this.socket = socket
    this.bookingClient = bookingClient
    this.step = "command"
    this.booking = null
  }

  write(...lines) {
    if (!this.socket.destroyed) this.socket.write(formatOutput(lines))
  }

  start() {
    this.write(
      "",
      "DOKKIITECH MEETING RESERVATION",
      "================================",
      "Telnetは平文通信です。信頼できるネットワークからご利用ください。",
      "",
      "book  予約を開始",
      "help  コマンド一覧",
      "quit  切断",
      "",
      "dokkiitech> "
    )
  }

  prompt(message) {
    this.write(message, "> ")
  }

  reset() {
    this.step = "command"
    this.booking = null
  }

  async handle(rawLine) {
    const input = sanitizeInput(rawLine)

    if (input.toLowerCase() === "quit" || input.toLowerCase() === "exit") {
      this.write("ご利用ありがとうございました。")
      this.socket.end()
      return
    }

    if (input.toLowerCase() === "cancel" && this.step !== "command") {
      this.reset()
      this.write("予約を中断しました。", "dokkiitech> ")
      return
    }

    if (this.step === "command") {
      await this.handleCommand(input)
      return
    }

    await this.handleBookingInput(input)
  }

  async handleCommand(input) {
    switch (input.toLowerCase()) {
      case "book":
      case "booking":
      case "appointment":
        this.booking = {
          name: "",
          email: "",
          company: "",
          bookingType: "meet",
          location: "",
          date: "",
          timeSlot: "",
          agenda: "",
          slots: [],
        }
        this.step = "name"
        this.prompt("予約を開始します。いつでも cancel で中断できます。\nお名前")
        break
      case "help":
      case "":
        this.write("book  予約を開始", "help  コマンド一覧", "quit  切断", "", "dokkiitech> ")
        break
      default:
        this.write("コマンドが見つかりません。help を入力してください。", "dokkiitech> ")
    }
  }

  async handleBookingInput(input) {
    if (!this.booking) {
      this.reset()
      this.write("セッションを初期化しました。", "dokkiitech> ")
      return
    }

    switch (this.step) {
      case "name":
        if (!input) return this.prompt("お名前を入力してください")
        this.booking.name = input
        this.step = "email"
        return this.prompt("メールアドレス")
      case "email":
        if (!isValidEmail(input)) return this.prompt("メールアドレスの形式が不正です。もう一度入力してください")
        this.booking.email = input
        this.step = "company"
        return this.prompt("会社名（個人の場合は -）")
      case "company":
        this.booking.company = input === "-" ? "" : input
        this.step = "type"
        return this.prompt("予約形式を選択してください\n  [1] Google Meet\n  [2] 対面")
      case "type":
        if (input === "1" || input.toLowerCase() === "meet") {
          this.booking.bookingType = "meet"
          this.step = "date"
          return this.prompt("希望日（例: 2026-09-15 / 9/15）")
        }
        if (input === "2" || input === "対面") {
          this.booking.bookingType = "対面"
          this.step = "location"
          return this.prompt("対面場所")
        }
        return this.prompt("1（Google Meet）か 2（対面）を入力してください")
      case "location":
        if (!input) return this.prompt("対面場所を入力してください")
        this.booking.location = input
        this.step = "date"
        return this.prompt("希望日（対面は2日後以降、例: 2026-09-15 / 9/15）")
      case "date":
        return this.handleDate(input)
      case "slot":
        return this.handleSlot(input)
      case "agenda":
        if (!input) return this.prompt("相談内容を入力してください")
        this.booking.agenda = input
        this.step = "confirm"
        return this.write(
          "",
          "予約内容",
          "--------------------------------",
          `お名前   : ${this.booking.name}`,
          `メール   : ${this.booking.email}`,
          `会社名   : ${this.booking.company || "-"}`,
          `形式     : ${
            this.booking.bookingType === "meet" ? "Google Meet" : `対面（${this.booking.location}）`
          }`,
          `日時     : ${this.booking.date} ${this.booking.timeSlot}`,
          `相談内容 : ${this.booking.agenda}`,
          "--------------------------------",
          "確定する場合は y、中断する場合は n を入力してください。",
          "> "
        )
      case "confirm":
        return this.handleConfirmation(input)
      case "submitting":
        return this.write("予約処理中です。しばらくお待ちください。")
    }
  }

  async handleDate(input) {
    const date = normalizeDateInput(input)
    if (!date) return this.prompt("日付を解釈できません。例: 2026-09-15 / 9/15 / 20260915")

    this.write("空き時間を確認しています...")
    try {
      const result = await this.bookingClient.getAvailability(date, this.booking.bookingType)
      const slots = Array.isArray(result.slots) ? result.slots.filter((slot) => typeof slot === "string") : []
      const notice = result.leadTimeMessage || result.allDayBusyMessage

      if (notice || slots.length === 0) {
        return this.prompt(notice || "この日は空きがありません。別の日付を入力してください")
      }

      this.booking.date = date
      this.booking.slots = slots
      this.step = "slot"
      return this.write(
        `空き時間（${date}）`,
        ...slots.map((slot, index) => `  [${index + 1}] ${slot}`),
        "番号または時刻を入力してください。",
        "> "
      )
    } catch (error) {
      return this.prompt(error instanceof Error ? error.message : "空き時間の取得に失敗しました")
    }
  }

  handleSlot(input) {
    const slot = selectSlot(input, this.booking.slots)
    if (!slot) return this.prompt("一覧の番号または表示された時刻を入力してください")

    this.booking.timeSlot = slot
    this.step = "agenda"
    return this.prompt("相談内容")
  }

  async handleConfirmation(input) {
    const answer = input.toLowerCase()
    if (answer === "n" || answer === "no") {
      this.reset()
      return this.write("予約を中断しました。", "dokkiitech> ")
    }
    if (answer !== "y" && answer !== "yes") {
      return this.prompt("y か n を入力してください")
    }

    this.step = "submitting"
    this.write("予約を送信しています...")

    try {
      const result = await this.bookingClient.createBooking({
        name: this.booking.name,
        email: this.booking.email,
        company: this.booking.company || undefined,
        bookingType: this.booking.bookingType,
        date: this.booking.date,
        timeSlot: this.booking.timeSlot,
        agenda: this.booking.agenda,
        location: this.booking.location || undefined,
      })
      this.reset()
      return this.write(
        "予約が完了しました。",
        `予約番号: ${result.bookingId}`,
        "詳細と予約管理情報は確認メールをご確認ください。",
        "",
        "dokkiitech> "
      )
    } catch (error) {
      this.reset()
      return this.write(
        error instanceof Error ? error.message : "予約に失敗しました。",
        "book でもう一度お試しください。",
        "",
        "dokkiitech> "
      )
    }
  }
}

export function createTelnetBookingServer({
  bookingClient = new BookingClient(),
  idleTimeoutMs = numberFromEnv("TELNET_IDLE_TIMEOUT_MS", 300_000),
  maxConnections = numberFromEnv("TELNET_MAX_CONNECTIONS", 25),
  rateLimitConnections = numberFromEnv("TELNET_RATE_LIMIT_CONNECTIONS", 10),
  rateLimitWindowMs = numberFromEnv("TELNET_RATE_LIMIT_WINDOW_MS", 900_000),
} = {}) {
  const recentConnections = new Map()
  let activeConnections = 0

  const server = net.createServer((socket) => {
    const address = socket.remoteAddress || "unknown"
    const now = Date.now()
    const recent = (recentConnections.get(address) || []).filter((time) => now - time < rateLimitWindowMs)

    if (activeConnections >= maxConnections || recent.length >= rateLimitConnections) {
      socket.end(formatOutput(["現在混み合っています。しばらくしてからお試しください。"]))
      return
    }

    recent.push(now)
    recentConnections.set(address, recent)
    activeConnections += 1

    const session = new BookingSession(socket, bookingClient)
    const telnetDecoder = new TelnetDecoder()
    const textDecoder = new StringDecoder("utf8")
    let lineBuffer = ""
    let queue = Promise.resolve()

    socket.setTimeout(idleTimeoutMs)
    socket.setNoDelay(true)
    session.start()

    socket.on("data", (chunk) => {
      lineBuffer += textDecoder.write(telnetDecoder.push(chunk))
      if (lineBuffer.length > MAX_LINE_LENGTH) {
        socket.end(formatOutput(["入力が長すぎるため切断しました。"]))
        return
      }

      while (true) {
        const match = lineBuffer.match(/[\r\n]/)
        if (!match || match.index === undefined) break
        if (match[0] === "\r" && match.index === lineBuffer.length - 1) break

        const line = lineBuffer.slice(0, match.index)
        const next = lineBuffer[match.index + 1]
        const consumed = match[0] === "\r" && (next === "\n" || next === "\0") ? 2 : 1
        lineBuffer = lineBuffer.slice(match.index + consumed)
        queue = queue.then(() => session.handle(line)).catch(() => {
          socket.end(formatOutput(["処理中にエラーが発生しました。"]))
        })
      }
    })

    socket.on("timeout", () => {
      socket.end(formatOutput(["一定時間操作がなかったため切断しました。"]))
    })
    socket.on("error", () => {})
    socket.on("close", () => {
      activeConnections = Math.max(0, activeConnections - 1)
    })
  })

  const cleanup = setInterval(() => {
    const threshold = Date.now() - rateLimitWindowMs
    for (const [address, times] of recentConnections) {
      const current = times.filter((time) => time >= threshold)
      if (current.length === 0) recentConnections.delete(address)
      else recentConnections.set(address, current)
    }
  }, Math.min(rateLimitWindowMs, 60_000))
  cleanup.unref()

  return server
}

function start() {
  const host = process.env.TELNET_HOST || "0.0.0.0"
  const port = numberFromEnv("TELNET_PORT", 2323)
  const server = createTelnetBookingServer()

  server.listen(port, host, () => {
    console.log(`Telnet booking gateway listening on ${host}:${port}`)
  })

  const shutdown = () => server.close(() => process.exit(0))
  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) start()
