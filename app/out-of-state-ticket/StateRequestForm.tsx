"use client";

import { useState } from "react";
import { REQUESTABLE_JURISDICTIONS } from "@/lib/state-requests";

/**
 * The "Your state isn't here" request block. Renders the authored .req markup and
 * posts { state, email } to /api/state-request.
 *
 * Progressive enhancement: the <form> has a real method/action, so with JavaScript
 * disabled it submits natively and the handler returns a plain success page. With
 * JS, submit is intercepted → fetch → an inline aria-live status, no navigation.
 * A honeypot field ("company") is the spam guard (no CAPTCHA — it would cost us the
 * exact audience this page is for). All copy and the promise text are the author's.
 */
type Status = { kind: "idle" | "sending" | "ok" | "err"; msg?: string };

export function StateRequestForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/state-request", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && json?.ok) {
        const state = String(data.get("state") || "your state");
        setStatus({
          kind: "ok",
          msg: `Added ${state} to the queue. If you left an email, that's the only time we'll use it — one message when ${state} is written.`,
        });
        form.reset();
      } else {
        setStatus({ kind: "err", msg: json?.error || "Something went wrong. Please try again." });
      }
    } catch {
      setStatus({ kind: "err", msg: "Couldn't reach the server. Please try again." });
    }
  }

  return (
    <div className="req">
      <div className="req-hd">Your state isn&apos;t here</div>
      <div className="req-body">
        <p>Ten states are covered above. Forty-one jurisdictions are not, and rather than pad the page with guesses we would rather say so.</p>
        <p>The ten were picked because they are where we have done the deepest work, not because they are the only ones that matter. If your licence came from somewhere else, tell us which one. We work the queue in the order people ask, and we will email you once yours is written.</p>
        <form method="post" action="/api/state-request" onSubmit={onSubmit}>
          {/* Honeypot: hidden from people, offered to bots. A filled value = spam. */}
          <div className="hp" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <div className="field">
            <label htmlFor="state-req">Which state do you need</label>
            <select id="state-req" name="state" required defaultValue="">
              <option value="" disabled>Choose a state</option>
              {REQUESTABLE_JURISDICTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="email-req">Email, if you want telling</label>
            <input type="email" id="email-req" name="email" placeholder="optional" autoComplete="email" />
          </div>
          <button type="submit" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? "Adding…" : "Add it to the queue"}
          </button>
        </form>
        {status.kind === "ok" || status.kind === "err" ? (
          <p className={`status ${status.kind === "ok" ? "ok" : "err"}`} role="status" aria-live="polite">
            {status.msg}
          </p>
        ) : null}
        <p className="fine">One email when your state is done, and nothing else. No newsletter, no course offers, and we do not pass the address on. Leave it blank and the request still counts toward what we write next.</p>
      </div>
    </div>
  );
}
