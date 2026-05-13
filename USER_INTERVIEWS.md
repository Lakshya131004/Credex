# User Interviews

Three conversations conducted during the week via video call (Zoom) and in-person.
Each ran 12–15 minutes. Notes are reconstructed from real-time written notes.

---

## Interview 1

**Name:** A.R. (preferred initials)
**Role:** Co-founder & CTO
**Company stage:** Seed, 6-person dev tool startup
**Date:** 2026-05-11

### Notes

A.R. was building a developer productivity tool and had 5 engineers. They were on Cursor Pro for all 5 ($100/mo), GitHub Copilot Business ($95/mo), and Claude Pro for 2 people ($40/mo).

When I mentioned they might be paying for overlapping tools, his first reaction was: "Wait, Cursor has chat? I thought it was just completions."

> "I signed up for Copilot because that's what everyone used. Then we switched to Cursor but I never cancelled Copilot. That's probably $100/mo I'm throwing away."

> "I don't think about this stuff. The invoices just auto-pay. I'd need something to tell me 'hey, you're paying twice for this.'"

> "Our Claude spend is actually a person's API key being used for their personal projects. We probably shouldn't be paying for that."

**Most surprising thing:** He wasn't embarrassed about not knowing. He was almost relieved someone was pointing it out — as if he'd suspected something was wrong but had no way to investigate without spending an hour doing research.

**What it changed:** I moved the duplicate tools rule (Cursor + Copilot) to "high priority" and made it the first check in the engine. I also made the recommendation copy call out specific dollar amounts rather than percentages — A.R. responded to "$95/mo" more viscerally than "37% reduction."

---

## Interview 2

**Name:** M.O.
**Role:** Freelance ML engineer / solo consultant
**Company stage:** Solo (but manages tooling for 2 client teams)
**Date:** 2026-05-11

### Notes

M.O. manages AI tool subscriptions for himself and occasionally for client engineering teams. He was on Claude Max (20×) at $200/mo, which he said he "probably doesn't need."

> "I got Max during a crunch month and never switched back. The truth is I use it maybe 30 minutes a day — I'm not anywhere near hitting limits."

> "I'd switch to Pro if someone told me it was fine. I just don't want to be mid-project and hit a rate limit."

> "The problem is I'm not sure what my actual usage is. Claude doesn't show you a usage meter."

**Most surprising thing:** He knew Max was probably overkill. He just had no *permission* to downgrade — no signal that Pro would be sufficient. The audit report acts as that permission.

**What it changed:** The Claude Max overkill recommendation copy now specifically addresses the anxiety: "Claude Pro's quota is sufficient for typical [useCase] workflows, and you can upgrade back if needed." This framing was directly inspired by M.O.'s hesitation.

---

## Interview 3

**Name:** J.W.
**Role:** Engineering Manager
**Company stage:** Series A, 22-person B2B SaaS
**Date:** 2026-05-12

### Notes

J.W. managed tooling for 15 engineers. Team was on GitHub Copilot Enterprise ($39/user × 15 = $585/mo), ChatGPT Team ($30/user × 8 = $240/mo), and Cursor Business ($40/user × 15 = $600/mo).

> "I never looked at Copilot Enterprise vs Business because we have 15 engineers. Obviously we're enterprise — that's just for teams our size."

> "Actually, what does Enterprise add? I don't know that I've ever used the codebase indexing. We're on GitHub but we use Cursor for everything so the Copilot IDE stuff is basically unused."

> "I'd definitely look at dropping Copilot entirely given we have Cursor. My team doesn't ask for Copilot — I've just never cancelled it."

**Most surprising thing:** The word "Enterprise" in the plan name was doing all the work. J.W. assumed Enterprise = right size for us, without ever checking what it actually added. This is a pure naming/anchoring effect, not a rational decision. He had $490/mo in potential savings (drop Copilot entirely + downgrade to Business tier) that he'd never investigated because the plan name felt right.

**What it changed:** The Copilot Enterprise recommendation copy now specifically names what the Enterprise tier adds ("codebase-indexed chat, fine-tuned models") and explains why it doesn't matter below a certain team size. Naming the specific features helps override the "Enterprise = big team" anchoring.
