export type FAQ = { question: string; answer: string };

const CA_FAQS: FAQ[] = [
  {
    question: "Does CA traffic school erase my ticket?",
    answer:
      "No — it masks it. The ticket stays on your DMV record but is hidden from insurance companies. You can mask one ticket every 18 months.",
  },
  {
    question: "Can I finish CA traffic school in one day?",
    answer:
      "Yes. California removed mandatory course timers, so you can complete the course at your own pace. Most drivers finish in 1-2 hours.",
  },
  {
    question: "How do I submit my certificate to the court in CA?",
    answer:
      "You don't — the school submits electronically to the DMV on your behalf within 1-2 business days of completion. No mailing required.",
  },
  {
    question: "How long do I have to complete CA traffic school?",
    answer:
      "Your courtesy notice from the court specifies the deadline, typically 60-90 days. You must elect traffic school before the due date on your ticket.",
  },
];

const TX_FAQS: FAQ[] = [
  {
    question: "How does deferred disposition work in Texas?",
    answer:
      "You must request it from your court BEFORE paying your ticket or entering a plea. Once granted, complete your 6-hour course by the court's deadline. Successful completion dismisses the ticket.",
  },
  {
    question: "What if I already paid my Texas ticket?",
    answer:
      "Paying the fine waives your right to deferred disposition. The violation stays on your record. You can still take defensive driving for an insurance discount, but the ticket won't be dismissed.",
  },
  {
    question: "How long is a Texas defensive driving course?",
    answer:
      "Exactly 6 hours — this is set by state law. All TDLR-licensed providers must meet this minimum regardless of how they deliver the course.",
  },
  {
    question: "Which Texas courts accept online defensive driving?",
    answer:
      "Most Texas courts accept TDLR-licensed online courses. Always verify with your specific court before enrolling — a few courts require in-person.",
  },
];

const FL_FAQS: FAQ[] = [
  {
    question: "What is BDI and do I need it?",
    answer:
      "Basic Driver Improvement (BDI) is Florida's 4-hour traffic school. It's required for a first minor violation within 12 months. You must elect it within 30 days of your citation date.",
  },
  {
    question: "What's the difference between BDI and ADI in Florida?",
    answer:
      "BDI is 4 hours for a first offense. ADI (Advanced Driver Improvement) is 8 hours, required for repeat violations or court-ordered cases.",
  },
  {
    question: "How do I elect traffic school in Florida?",
    answer:
      "Contact the clerk of court for your county within 30 days of your citation. After electing, you have 90 days to complete the course.",
  },
  {
    question: "Do Florida traffic schools report electronically?",
    answer:
      "Yes — all DHSMV-approved schools report completion directly to the state. Your certificate is submitted automatically; you don't mail anything.",
  },
];

const DEFAULT_FAQS: FAQ[] = [
  {
    question: "Does online traffic school dismiss my ticket?",
    answer:
      "In most states, completing a court-approved online traffic school course can dismiss your ticket or prevent points from appearing on your driving record. Check with the court listed on your citation to confirm eligibility.",
  },
  {
    question: "How long does online traffic school take?",
    answer:
      "Most online traffic school courses take 4 to 8 hours depending on your state's requirements. Many states set a minimum seat time. You can usually log in and out and spread the time over several days.",
  },
  {
    question: "Is online traffic school accepted by my court?",
    answer:
      "All schools listed on TrafficSchoolPicker are state-approved and accepted by courts in the states they serve. Always confirm with your specific court before enrolling, as a small number of courts may have additional requirements.",
  },
  {
    question: "How much does online traffic school cost?",
    answer:
      "Online traffic school typically costs $19.95 to $49.99 depending on the provider and state. This is far less than the long-term cost of paying a ticket, which can increase your insurance premiums by 20-40% for 3-5 years.",
  },
];

const STATE_FAQS: Record<string, FAQ[]> = {
  CA: CA_FAQS,
  TX: TX_FAQS,
  FL: FL_FAQS,
};

export function getStateFAQs(stateCode: string): FAQ[] {
  return STATE_FAQS[stateCode.toUpperCase()] ?? DEFAULT_FAQS;
}
