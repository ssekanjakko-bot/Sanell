'use client'
import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

const CATS = ['Phones','Electronics','Fashion','Home, Furniture & Appliances','Vehicles','Houses & Rentals','Health','Sports, Arts & Outdoor','Babies & Kids','Services','Jobs','Others']

export default function CreateShop(){
  const [user,setUser]=useState<any>(null)
  const [name,setName]=useState('')
  const [momo,setMomo]=useState('')
  const [cats,setCats]=useState<string[]>([])
  const [txId,setTxId]=useState('')
  const [loading,setLoading]=useState(false)
  useEffect(()=>{const u=onAuthStateChanged(auth,setUser);return()=>u()},[])
  const toggle=(c:string)=>{ if(cats.includes(c)) setCats(cats.filter(x=>x!==c)); else{ if(cats.length>=2) return alert("Max 2"); setCats([...cats,c]) } }
  const submit=async(e:any)=>{ e.preventDefault(); if(!user) return alert("Login"); await addDoc(collection(db,'shop_requests'),{sellerId:user.uid,sellerEmail:user.email,shopName:name,whatsapp:momo,categories:cats,amount:15000,momoTxId:txId,status:'pending',createdAt:serverTimestamp()}); alert("Sent! Verify in 5 mins"); location.href="/sell" }

  const inputStyle = {background:'#ffffff', border:'2px solid #000000', color:'#000000', padding:'16px', borderRadius:'16px', width:'100%', fontSize:'16px', fontWeight:'600'} as any

  return (
    <div style={{minHeight:'100vh', background:'#ffffff', color:'#000000', padding:'16px'}}>
      <div style={{maxWidth:'500px', margin:'0 auto'}}>
        <h1 style={{fontWeight:'900', fontSize:'24px', color:'#000'}}>Get Official Shop - 15K UGX</h1>
        <p style={{fontSize:'13px', color:'#000', marginTop:'4px', fontWeight:'600'}}>60 days pinned • Own link • Cart + verified</p>

        <div style={{marginTop:'20px', background:'#FFF9C4', border:'3px solid #FACC15', borderRadius:'20px', padding:'16px'}}>
          <p style={{fontWeight:'900', color:'#000'}}>STEP 1: Send MoMo Now</p>
          <p style={{color:'#000', marginTop:'8px'}}><b>To: 0767483636 - Sanel Ug</b></p>
          <p style={{color:'#000'}}><b>Amount: 15,000 UGX</b></p>
          <p style={{color:'#000', fontSize:'12px', marginTop:'8px', background:'white', padding:'8px', borderRadius:'10px', border:'1px dashed black'}}>Reason: SHOP {momo.slice(-4)} • Copy Transaction ID after</p>
        </div>

        <form onSubmit={submit} style={{marginTop:'24px', display:'flex', flexDirection:'column', gap:'14px'}}>
          <input style={inputStyle} value={name} onChange={e=>setName(e.target.value)} placeholder="Shop Name e.g Smart Mobile" required />
          <input style={inputStyle} value={momo} onChange={e=>setMomo(e.target.value)} placeholder="Your MoMo 2567xxxxxxx" required />
          <div style={{display:'flex', flexWrap:'wrap', gap:'8px'}}>
            {CATS.map(c=><button key={c} type="button" onClick={()=>toggle(c)} style={{padding:'8px 14px', borderRadius:'999px', border:'2px solid black', background:cats.includes(c)?'black':'white', color:cats.includes(c)?'white':'black', fontWeight:'900', fontSize:'12px'}}>{c}</button>)}
          </div>
          <input style={{...inputStyle, border:'3px solid #EAB308', background:'#FFFBEB'}} value={txId} onChange={e=>setTxId(e.target.value)} placeholder="Paste MoMo Transaction ID *" required />
          <button style={{background:'black', color:'white', padding:'18px', borderRadius:'999px', fontWeight:'900', fontSize:'16px'}} disabled={loading}>{loading?'Sending...':'I Have Sent 15K - Submit'}</button>
        </form>
      </div>
    </div>
  )
}