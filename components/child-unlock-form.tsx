export function ChildUnlockForm({
  action,
  errorMessage,
}: {
  action: (formData: FormData) => void | Promise<void>;
  errorMessage?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-md rounded-[2rem] bg-white p-6 text-[color:var(--ink)] shadow-[0_24px_90px_rgba(29,36,51,0.25)] sm:p-8">
      <p className="eyebrow">Parent unlock</p>
      <h2 className="mt-3 text-3xl font-extrabold">Unlock admin mode</h2>
      <p className="mt-3 text-sm leading-6 text-[color:var(--ink-soft)]">
        Enter the 4-digit parent PIN to leave child mode and return to the parent dashboard. The default PIN is 0000 until you change it in parent settings.
      </p>

      <form action={action} className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold">Parent PIN</span>
          <input
            autoComplete="one-time-code"
            className="field text-center text-2xl tracking-[0.5em]"
            defaultValue=""
            inputMode="numeric"
            maxLength={4}
            name="parentPin"
            pattern="[0-9]{4}"
            placeholder="0000"
            required
            type="password"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-950">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex justify-center">
          <button className="btn btn-primary w-full max-w-[14rem]" type="submit">
            Unlock
          </button>
        </div>
      </form>
    </div>
  );
}
