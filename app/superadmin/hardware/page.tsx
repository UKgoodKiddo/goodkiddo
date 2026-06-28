import { ShellCard } from "@/components/shell-card";
import { NfcHardwareTest } from "@/components/nfc-hardware-test";

export default function SuperAdminHardwarePage() {
  return (
    <main className="flex flex-1 flex-col gap-6">
      <ShellCard className="rounded-[2rem] p-6 sm:p-8">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-extrabold tracking-tight">NFC hardware test</h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--ink-soft)]">
            Use this page on a real Android phone to test Web NFC support, permission prompts,
            NTAG213 serial number exposure, and any NDEF records stored on the wristband.
          </p>
        </div>
      </ShellCard>

      <NfcHardwareTest />
    </main>
  );
}

