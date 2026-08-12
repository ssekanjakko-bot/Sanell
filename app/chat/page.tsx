"use client";
import { useState } from "react";

const faqData = [
  {
    q: "How do I buy on Sanel?",
    a: "1. Find what you need\n2. Tap WhatsApp Seller\n3. Chat, agree price, meet on campus"
  },
  {
    q: "How do I pay?",
    a: "We recommend Mobile Money and cash. Pay  after receiving the product when you meet the seller in a safe public place or at campus."
  },
  {
    q: "How do I become a seller?",
    a: "Create a free account > Go to Profile > Post Item > Add photos + price > Wait for buyers to WhatsApp you."
  },
  {
    q: "Is Sanel safe?",
    a: "Yes. We only allow verified students. Meet in public. Report suspicious sellers using the Report button."
  },
  {
    q: "How do I contact support?",
    a: "WhatsApp us: +256 706826774"
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(1); // "How do I pay" open by default like your screenshot

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-10 font-sans bg-[#FFF8F0] min-h-screen">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-[#6B4F3B] mb-2">
        FAQ - Frequently Asked Questions
      </h2>
      <p className="text-center text-[#8C735F] mb-8">
        Got questions? We’ve got answers. Still stuck? WhatsApp us.
      </p>

      <div className="space-y-3">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="border border-[#D6C2B0] rounded-lg bg-[#FFFDFB] overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex justify-between items-center text-left p-4 bg-[#6B4F3B] text-[#FFF8F0] font-semibold hover:bg-[#5A4230] transition"
            >
              {item.q}
              <span className="text-[#C8A67B] text-xl">
                {openIndex === index ? "−" : "+"}
              </span>
            </button>
            {openIndex === index && (
              <div className="p-4 bg-[#FFF8F0] text-[#4A3B2F] whitespace-pre-line">
                {item.q.includes("support") ? (
                  <p>
                    WhatsApp us:{" "}
                    <a
                      href="https://wa.me/256706826774"
                      target="_blank"
                      className="text-[#6B4F3B] font-semibold underline"
                    >
                      +256 706826774
                    </a>
                  </p>
                ) : (
                  <p>{item.a}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-8">
        <a
          href="https://wa.me/256706826774"
          target="_blank"
          className="bg-[#C8A67B] text-[#3B2F2A] px-6 py-3 rounded-lg font-bold hover:bg-[#B8966A] transition inline-block"
        >
          Chat on WhatsApp
        </a>
      </div>
    </section>
  );
}