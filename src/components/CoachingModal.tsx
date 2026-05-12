import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2, GraduationCap, CheckCircle2 } from "lucide-react";

export function CoachingModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.username ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [phone, setPhone] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("coaching_requests").insert({
      user_id: user.id,
      name,
      email,
      phone: phone || null,
      preferred_time: preferredTime,
      goal: goal || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Kunde inte boka", { description: error.message });
      return;
    }
    setDone(true);
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setDone(false);
      setPhone("");
      setPreferredTime("");
      setGoal("");
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#1a5c3a]" />
            <h2 className="mt-3 text-xl font-semibold">Tack {name}!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vi hör av oss till <strong>{email}</strong> inom 24 timmar för att
              boka in din gratis timme med en av våra 1.9+-coacher.
            </p>
            <Button
              className="mt-6 bg-[#1a5c3a] text-white hover:bg-[#154d31]"
              onClick={() => handleClose(false)}
            >
              Stäng
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f2ec] text-[#1a5c3a]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-xl">
                Boka 1 timmes gratis coachning
              </DialogTitle>
              <DialogDescription className="text-center">
                Få personlig vägledning från en av våra experter som själva
                fått <strong>1.9 eller högre</strong> på HP. Helt gratis.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="mt-2 space-y-3">
              <div>
                <Label htmlFor="c-name">Namn</Label>
                <Input
                  id="c-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="c-email">E-post</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="c-phone">Telefon (valfritt)</Label>
                <Input
                  id="c-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="c-time">Önskad tid</Label>
                <Input
                  id="c-time"
                  placeholder="t.ex. vardagar efter 17, helger"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="c-goal">Vad vill du fokusera på? (valfritt)</Label>
                <Textarea
                  id="c-goal"
                  rows={3}
                  placeholder="ORD, matte, studieteknik, tidsplanering..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a5c3a] text-white hover:bg-[#154d31]"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Boka min gratis timme
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
