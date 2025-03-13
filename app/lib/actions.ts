'use server';

import { z } from 'zod';
import postgres from 'postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
  customerId: z.string(),
  amount: z.string().transform((v) => parseFloat(v) * 100), // cents
  status: z.enum(['pending', 'paid']),
  date: z.date().default(() => new Date()).transform((d) => d.toISOString().split('T')[0]),
});

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status, date } = FormSchema.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amount}, ${status}, ${date})
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}
