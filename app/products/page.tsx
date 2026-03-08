import { redirect } from "next/navigation"

export const metadata = {
  title: "Products | DOKKIITECH",
  description: "This route has moved to Projects.",
}

export default function ProductsPage() {
  redirect("/projects")
}
