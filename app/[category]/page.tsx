'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // fetch products from Firebase where title contains query
    // setProducts(results)
  }, [query])

  if(products.length === 0) {
    return <p>No results for "{query}"</p> // instead of Post First Item
return products.map(p => (
  <div key={p.id} className="border p-4 rounded">
    <h3>{p.title}</h3>
    <p>{p.price}</p>
  </div>
))
  }

  
}