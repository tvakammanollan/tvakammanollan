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
            <CheckCircle2 className="mx-auto h-12 w-12 text-[#ae2f26]" />
            <h2 className="mt-3 text-xl font-semibold">Tack {name}!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Vi hör av oss till <strong>{email}</strong> inom 24 timmar för att gå igenom ditt
              upplägg med en av våra 1,95+-coacher.
            </p>
            <Button
              className="mt-6 bg-[#ae2f26] text-[#2e1e14] hover:bg-[#8f2620]"
              onClick={() => handleClose(false)}
            >
              Stäng
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#ae2f26]/15 text-[#ae2f26]">
                <GraduationCap className="h-6 w-6" />
              </div>
              <DialogTitle className="text-center text-xl">
                Få ett studieupplägg gjort för dig
              </DialogTitle>
              <DialogDescription className="text-center">
                Träningen här tar dig långt på egen hand. Vet du inte var tiden ska läggas bygger vi
                ett upplägg efter var du står och hur lång tid du har kvar, av någon som själv fått{" "}
                <strong>1,95 eller högre</strong> på provet.
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
                <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
                className="w-full bg-[#ae2f26] text-[#2e1e14] hover:bg-[#8f2620]"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hör av er till mig
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
