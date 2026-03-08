import { z } from "zod"

export const bookingSchema = z
  .object({
    name: z.string().min(1, "お名前を入力してください"),
    email: z.string().email("メールアドレスの形式が不正です"),
    bookingType: z.enum(["meet", "対面"], {
      message: "予約タイプを選択してください",
    }),
    date: z.string().min(1, "希望日時を入力してください"),
    agenda: z.string().min(5, "相談内容は5文字以上で入力してください"),
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
