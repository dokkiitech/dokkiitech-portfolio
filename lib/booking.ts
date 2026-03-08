import { z } from "zod"

export const bookingSchema = z
  .object({
    name: z.string().min(1, "お名前を入力してください"),
    email: z.string().email("メールアドレスの形式が不正です"),
    company: z.string().optional(),
    bookingType: z.enum(["meet", "対面"], {
      message: "予約タイプを選択してください",
    }),
    date: z.string().min(1, "希望日時を入力してください"),
    timeSlot: z.string().min(1, "時間帯を選択してください"),
    agenda: z.string().min(1, "相談内容を入力してください"),
    location: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.bookingType === "対面" && !value.location?.trim()) {
      ctx.addIssue({
        path: ["location"],
        code: z.ZodIssueCode.custom,
        message: "対面予約の場合は場所の入力が必須です",
      })
    }
  })

export type BookingInput = z.infer<typeof bookingSchema>
