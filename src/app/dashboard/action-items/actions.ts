"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleActionItemStatus(formData: FormData) {
  const id = formData.get("id") as string;
  const status = formData.get("status") as string;

  const supabase = await createClient();
  await supabase
    .from("action_items")
    .update({ status })
    .eq("id", id);

  revalidatePath("/dashboard/action-items");
  revalidatePath("/dashboard");
}
