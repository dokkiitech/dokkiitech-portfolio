const IAC = 255
const SB = 250
const SE = 240

export class TelnetDecoder {
  #state = "data"

  push(chunk) {
    const output = []

    for (const byte of chunk) {
      if (this.#state === "data") {
        if (byte === IAC) {
          this.#state = "iac"
        } else {
          output.push(byte)
        }
        continue
      }

      if (this.#state === "iac") {
        if (byte === IAC) {
          output.push(byte)
          this.#state = "data"
        } else if (byte === SB) {
          this.#state = "subnegotiation"
        } else if (byte >= 251 && byte <= 254) {
          this.#state = "option"
        } else {
          this.#state = "data"
        }
        continue
      }

      if (this.#state === "option") {
        this.#state = "data"
        continue
      }

      if (this.#state === "subnegotiation" && byte === IAC) {
        this.#state = "subnegotiation-iac"
        continue
      }

      if (this.#state === "subnegotiation-iac") {
        this.#state = byte === SE ? "data" : "subnegotiation"
      }
    }

    return Buffer.from(output)
  }
}

export function sanitizeInput(value, maxLength = 500) {
  return value
    .replace(/\u001b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLength)
}

export function normalizeDateInput(raw, now = new Date()) {
  const value = raw.trim()
  let year
  let month
  let day

  if (/^\d{8}$/.test(value)) {
    year = Number(value.slice(0, 4))
    month = Number(value.slice(4, 6))
    day = Number(value.slice(6, 8))
  } else {
    const parts = value.split(/[/-]/).map(Number)
    if (parts.some((part) => !Number.isInteger(part))) return null

    if (parts.length === 3) {
      year = parts[0]
      month = parts[1]
      day = parts[2]
    } else if (parts.length === 2) {
      year = now.getFullYear()
      month = parts[0]
      day = parts[1]
    } else {
      return null
    }
  }

  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null
  }

  const candidate = new Date(Date.UTC(year, month - 1, day))
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function selectSlot(raw, slots) {
  const value = raw.trim()
  const asTime = /^\d{1,2}$/.test(value) ? `${value.padStart(2, "0")}:00` : value
  if (slots.includes(asTime)) return asTime

  if (/^\d{1,2}$/.test(value)) {
    return slots[Number(value) - 1] || null
  }

  return null
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
