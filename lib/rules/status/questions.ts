import type { Question } from "./types";
import { REFERENCES, type ReferenceKey } from "./references";

/**
 * The 12-question employment-status questionnaire (FR-1.1).
 * Questions q_substitution, q_control_place and q_moo_ongoing are reproduced
 * verbatim from the Status Advisor prototype (which shipped 3 of 12); the other
 * nine are authored in the same plain-English, reading-age-9 voice against the
 * PRD's seven case-law factor groups. {name} is templated in at render.
 */

export const QUESTION_REF: Record<string, ReferenceKey> = {
  q_substitution: "personal_service",
  q_control_place: "control",
  q_control_how: "control",
  q_moo_ongoing: "mutuality",
  q_moo_refuse: "mutuality",
  q_equipment: "in_business",
  q_risk: "financial_risk",
  q_integration: "in_business",
  q_exclusivity: "in_business",
  q_pay: "financial_risk",
  q_benefits: "era_230",
  q_own_business: "in_business",
};

export const QUESTIONS: Question[] = [
  {
    id: "q_substitution",
    factor: "Personal service",
    group: "personal_service",
    question: "Must {name} do the work themselves?",
    why: "The law looks at whether the job has to be done by {name} in person. If they could send someone else to do it instead, they start to look more like a business than an employee.",
    options: [
      { value: "himself", title: "Yes, it has to be them", description: "They can't send anyone else", indication: "employee" },
      { value: "sub", title: "They can send a substitute", description: "Someone else could do it for them", indication: "self_employed" },
      { value: "depends", title: "It depends on the job", description: "Sometimes them, sometimes not", indication: "neutral" },
    ],
  },
  {
    id: "q_control_place",
    factor: "Control",
    group: "control",
    question: "Will you decide when and where {name} works?",
    why: "Employers usually set the hours and the place of work. The more of this day-to-day control you have, the more {name} looks like an employee.",
    options: [
      { value: "yes", title: "Yes, mostly", description: "I set their hours and where they work", indication: "employee" },
      { value: "varies", title: "It varies", description: "We agree it job by job", indication: "neutral" },
      { value: "no", title: "No, they decide", description: "They work when and where they like", indication: "self_employed" },
    ],
  },
  {
    id: "q_control_how",
    factor: "Control",
    group: "control",
    question: "Who decides how the work gets done — the methods and steps?",
    why: "An employer tells people how to do the job. A genuine contractor is hired for a result and chooses their own way of getting there.",
    options: [
      { value: "you", title: "I do", description: "I tell them how it should be done", indication: "employee" },
      { value: "agreed", title: "We agree the result", description: "I set the outcome, they choose how", indication: "neutral" },
      { value: "them", title: "They do", description: "They use their own methods and judgement", indication: "self_employed" },
    ],
  },
  {
    id: "q_moo_ongoing",
    factor: "Mutuality of obligation",
    group: "mutuality",
    question: "Will you keep giving {name} work, week after week?",
    why: "Employees get a steady promise of work. If you're expected to keep offering work and {name} is expected to take it, that ongoing two-way promise points towards employment.",
    options: [
      { value: "ongoing", title: "Yes, ongoing", description: "Regular work, every week", indication: "employee" },
      { value: "when", title: "Only when I have jobs", description: "No promise either way", indication: "neutral" },
      { value: "oneoff", title: "No, it's a one-off", description: "Just this single piece of work", indication: "self_employed" },
    ],
  },
  {
    id: "q_moo_refuse",
    factor: "Mutuality of obligation",
    group: "mutuality",
    question: "If you offer {name} work, can they turn it down?",
    why: "An employee is generally expected to do the work you give them. Someone who can freely pick and choose which jobs to take looks more like their own boss.",
    options: [
      { value: "must", title: "Not really", description: "I'd expect them to take the work", indication: "employee" },
      { value: "usually", title: "Usually they'd take it", description: "But they could say no", indication: "neutral" },
      { value: "refuse", title: "Yes, freely", description: "They pick and choose jobs", indication: "self_employed" },
    ],
  },
  {
    id: "q_equipment",
    factor: "Tools and equipment",
    group: "equipment",
    question: "Who provides the main tools and equipment for the job?",
    why: "Employers usually provide what staff need to work. People who bring their own significant equipment are more likely running their own business.",
    options: [
      { value: "you", title: "I do", description: "I provide the tools and materials", indication: "employee" },
      { value: "mix", title: "A mix", description: "Some mine, some theirs", indication: "neutral" },
      { value: "them", title: "They do", description: "They bring their own kit", indication: "self_employed" },
    ],
  },
  {
    id: "q_risk",
    factor: "Financial risk",
    group: "financial",
    question: "Can {name} make more money — or a loss — depending on how they run the work?",
    why: "Taking a real financial risk, and being able to profit from working efficiently, is a hallmark of being in business for yourself.",
    options: [
      { value: "fixed", title: "No, a set rate", description: "They're paid the same however it goes", indication: "employee" },
      { value: "some", title: "A little", description: "The odd cost, but not really", indication: "neutral" },
      { value: "profitloss", title: "Yes", description: "They quote, cover costs, can profit or lose", indication: "self_employed" },
    ],
  },
  {
    id: "q_integration",
    factor: "Integration",
    group: "integration",
    question: "Is {name} part of your team, or separate from it?",
    why: "Being built into your organisation — like your other staff — points to employment. A contractor sits outside it.",
    options: [
      { value: "team", title: "Part of the team", description: "Like my other staff", indication: "employee" },
      { value: "some", title: "Somewhat", description: "Around the edges", indication: "neutral" },
      { value: "separate", title: "Separate", description: "An outside contractor", indication: "self_employed" },
    ],
  },
  {
    id: "q_exclusivity",
    factor: "Exclusivity",
    group: "exclusivity",
    question: "Does {name} work only for you, or do they have other clients?",
    why: "Working only for you looks like employment. Someone with several clients is more likely to be running their own business.",
    options: [
      { value: "only", title: "Only for me", description: "I'm their only work", indication: "employee" },
      { value: "mainly", title: "Mainly me", description: "Some other bits on the side", indication: "neutral" },
      { value: "others", title: "They have other clients", description: "I'm one of several", indication: "self_employed" },
    ],
  },
  {
    id: "q_pay",
    factor: "How they're paid",
    group: "financial",
    question: "How will you pay {name}?",
    why: "A regular wage looks like employment. Being invoiced per job, like a supplier, points to self-employment.",
    options: [
      { value: "wage", title: "A regular wage", description: "Weekly or monthly, like a salary", indication: "employee" },
      { value: "mix", title: "A mix", description: "Depends on the arrangement", indication: "neutral" },
      { value: "invoice", title: "They invoice me", description: "Per job, like a supplier", indication: "self_employed" },
    ],
  },
  {
    id: "q_benefits",
    factor: "Employee benefits",
    group: "integration",
    question: "Will {name} get paid holiday, sick pay and notice?",
    why: "These benefits come with employment. Their absence points away from it — though on its own it never settles the question.",
    options: [
      { value: "yes", title: "Yes", description: "Paid holiday, sick pay, notice", indication: "employee" },
      { value: "some", title: "Some of it", description: "Not the full set", indication: "neutral" },
      { value: "no", title: "No", description: "None of those", indication: "self_employed" },
    ],
  },
  {
    id: "q_own_business",
    factor: "In business on their own account",
    group: "exclusivity",
    question: "Does {name} run their own business — own name, insurance, adverts?",
    why: "Someone genuinely set up in business for themselves — trading name, their own insurance, advertising for work — is a contractor, and you are their customer.",
    options: [
      { value: "no", title: "No", description: "They don't run a business", indication: "employee" },
      { value: "some", title: "Sort of", description: "A bit of freelancing", indication: "neutral" },
      { value: "yes", title: "Yes", description: "Own name, insurance, adverts", indication: "self_employed" },
    ],
  },
];

export function questionById(id: string): Question {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown question: ${id}`);
  return q;
}

/** Answers keyed by question id. */
export type StatusAnswers = Record<string, string>;
