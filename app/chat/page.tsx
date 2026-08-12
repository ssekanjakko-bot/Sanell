"use client";
import { useState } from "react";

const faqData = [
  {
    q: "How do I buy on Sanel?",
    a: "1. Find what you need\n2. Tap WhatsApp Seller\n3. Chat, agree price, meet on campus"
  },
  {
    q: "How do I pay?",
    a: "We recommend Mobile Money. Pay when you meet the seller in a safe public place on campus."
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
    a: "WhatsApp us: +256 7XX XXX"
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-10 font-sans">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-[#FF6A00] mb-2">
        FAQ - Frequently Asked Questions
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Got questions? We’ve got answers. Still stuck? WhatsApp us.
      </p>

      <div className="space-y-3">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg bg-white overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex justify-between items-center text-left p-4 bg-black text-white font-semibold hover:bg-gray-900 transition"
            >
              {item.q}
              <span className="text-[#FF6A00] text-xl">
                {openIndex === index ? "−" : "+"}
              </span>
            </button>
            {openIndex === index && (
              <div className="p-4 bg-[#FFF5EB] text-gray-800 whitespace-pre-line">
                {item.q.includes("support") ? (
                  <p>
                    WhatsApp us:{" "}
                    <a
                      href="https://wa.me/2567XXXXXXXX"
                      target="_blank"
                      className="text-[#FF6A00] underline"
                    >
                      +256 7XX XXX XXX
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
          href="https://wa.me/2567XXXXXXXX"
          target="_blank"
          className="bg-[#FF6A00] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e55f00] transition inline-block"
        >
          Chat on WhatsApp
        </a>
      </div>
    </section>
  );
}