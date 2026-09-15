"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Party = { _id: string; name: string; partyType: string };

type FormState = {
  partyId: string;
  amount: string;
  direction: "COLLECT" | "PAY";
  notes: string;
};

export default function Page() {
  const [parties, setParties] = useState<Party[]>([]);
  const [form, setForm] = useState<FormState>({
    partyId: "",
    amount: "",
    direction: "COLLECT",
    notes: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/parties")
      .then((response) => response.json())
      .then((data: unknown) => {
        if (active && Array.isArray(data)) setParties(data as Party[]);
      });
    return () => {
      active = false;
    };
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/payments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, amount: Number(form.amount) }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Payment recorded" : data.error || "Failed");
    if (response.ok) {
      setForm((current) => ({ ...current, amount: "", notes: "" }));
      window.dispatchEvent(new Event("talikhata:refresh"));
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-3xl font-bold">পেমেন্ট</h1>
      <form
        onSubmit={save}
        className="mt-6 grid gap-3 rounded-2xl border bg-white p-5 md:grid-cols-4"
      >
        <select
          className="field"
          value={form.partyId}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setForm({ ...form, partyId: event.target.value })
          }
        >
          <option value="">Select party</option>
          {parties.map((party) => (
            <option key={party._id} value={party._id}>
              {party.name} • {party.partyType}
            </option>
          ))}
        </select>

        <select
          className="field"
          value={form.direction}
          onChange={(event: ChangeEvent<HTMLSelectElement>) =>
            setForm({
              ...form,
              direction: event.target.value as FormState["direction"],
            })
          }
        >
          <option value="COLLECT">Customer collection</option>
          <option value="PAY">Supplier payment</option>
        </select>

        <input
          className="field"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, amount: event.target.value })
          }
          placeholder="Amount"
        />

        <button className="btn-primary" type="submit">
          Save
        </button>
        {message && <p className="md:col-span-4">{message}</p>}
      </form>
    </div>
  );
}
