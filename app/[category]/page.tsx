'use client';
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

type Product = {
  id: string;
  title: string;
  price: number;
  image_url?: string;
}

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);

  // For now just empty array so it builds
  // Later we’ll fetch from Firebase here

  if(products.length === 0) {
    return <p className="text-center mt-10">No results for "{query}"</p>
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      {products.map((p: Product) => (
        <div key={p.id} className="border p-4 rounded">
          <h3 className="font-bold">{p.title}</h3>
          <p>UGX {p.price}</p>
        </div>
      ))}
    </div>
  )
}