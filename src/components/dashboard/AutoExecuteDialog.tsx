import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export default function AutoExecuteDialog({ open, onClose, userId }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const backendUrl = import.meta.env.VITE_BACKEND_URL

  useEffect(() => {
    if (!open) return
    const run = async () => {
      setLoading(true)
      try {
        const url = backendUrl ? `${backendUrl}/worker/precheck` : `/worker/precheck`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, strategy: 'Short Strangle' }),
        })
        const data = await res.json()
        setResult(data)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [open, userId, backendUrl])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Auto‑Execute (Short Strangle)</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div>Checking funds and VIX…</div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge>VIX: {result.vix}</Badge>
              <Badge>Available Funds: ₹{result.availableFunds?.toLocaleString?.('en-IN')}</Badge>
            </div>
            <div>
              Required capital per lot (sell): ₹{result.requiredCapitalPerLot?.toLocaleString?.('en-IN')}
            </div>
            {!result.eligible && (
              <div className="text-destructive">Insufficient funds for 1 lot short strangle</div>
            )}
            <div className="text-sm text-muted-foreground">
              By enabling auto‑execute, you consent to daily loss cap enforcement and automated entries at 3:10 PM with exit at 3:00 PM next day.
            </div>
            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline">Cancel</Button>
              <Button disabled={!result.eligible} onClick={onClose}>Enable</Button>
            </div>
          </div>
        ) : (
          <div>Unable to load precheck.</div>
        )}
      </DialogContent>
    </Dialog>
  )
}