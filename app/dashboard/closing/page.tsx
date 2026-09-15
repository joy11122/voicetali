"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Closing = {
  _id: string;
  date: string;
  closingCash: number;
};

type FormState = {
  date: string;
  openingCash: string;
  adjustment: string;
  notes: string;
};

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="field" />;
}

export default function Page() {
  const [form, setForm] = useState<FormState>({
    date: new Date().toISOString().slice(0, 10),
    openingCash: "",
    adjustment: "",
    notes: "",
  });
  const [rows, setRows] = useState<Closing[]>([]);
  const [message, setMessage] = useState("");

  const load = async (): Promise<void> => {
    const response = await fetch("/api/closing");
    const data = await response.json();
    setRows(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    void load();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/closing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...form,
        openingCash: Number(form.openingCash),
        adjustment: Number(form.adjustment || 0),
      }),
    });
    const data = await response.json();
    setMessage(
      response.ok
        ? `Closing cash: ৳${data.result.closingCash}`
        : data.error || "Could not close day",
    );
    await load();
  }

  const update = (key: keyof FormState) =>
    (event: ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">দিন শেষ</h1>
      <form
        onSubmit={save}
        className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-4"
      >
        <Field type="date" value={form.date} onChange={update("date")} />
        <Field
          type="number"
          value={form.openingCash}
          onChange={update("openingCash")}
          placeholder="Opening cash"
        />
        <Field
          type="number"
          value={form.adjustment}
          onChange={update("adjustment")}
          placeholder="Adjustment"
        />
        <button className="btn-primary" type="submit">
          Close day
        </button>
        {message && <p className="md:col-span-4">{message}</p>}
      </form>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        {rows.map((row) => (
          <div key={row._id} className="border-b py-3">
            {row.date} • Closing ৳{row.closingCash}
          </div>
        ))}
        {!rows.length && (
          <p className="py-6 text-center text-slate-400">No closings yet.</p>
        )}
      </div>
    </div>
  );
}
