import {useId,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {useI18n} from './i18n.jsx';
import {FaGithub,FaLinkedinIn} from 'react-icons/fa';
import './social-buttons.css';
// Interaction and neighboring border treatment adapted from Microkit:
// https://microkit.co/components/social-icon-buttons
const socials=[
 {name:'GitHub',href:'https://github.com/emersonbrandao058-dot',color:'#f0f0f0',Icon:FaGithub},
 {name:'LinkedIn',href:'https://www.linkedin.com/in/emerson-brandao-b33839337',color:'#0a88ef',Icon:FaLinkedinIn}
];
function Border({side,brand}){const id=useId().replaceAll(':','');return <svg className="micro-border" data-side={side||undefined} viewBox="0 0 36 36" aria-hidden="true" style={{color:brand}}><defs><linearGradient id={id} x1="0" y1="2.14" x2="0" y2="33.86" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity="0"/><stop offset=".28" stopColor="currentColor" stopOpacity=".2"/><stop offset=".5" stopColor="currentColor" stopOpacity=".86"/><stop offset=".72" stopColor="currentColor" stopOpacity=".2"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient><radialGradient id={id+'fill'} cx={side==='left'?'0':'36'} cy="18" r="25" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".14"/><stop offset=".42" stopColor="currentColor" stopOpacity=".06"/><stop offset=".82" stopColor="currentColor" stopOpacity="0"/></radialGradient></defs><circle className="micro-edge-fill" cx="18" cy="18" r="17" fill={'url(#'+id+'fill)'}/><circle className="micro-base" cx="18" cy="18" r="17.5"/><path className="micro-edge" d={side==='left'?'M10.6 2.14A17.5 17.5 0 0 0 10.6 33.86':'M25.4 2.14A17.5 17.5 0 0 1 25.4 33.86'} stroke={'url(#'+id+')'}/></svg>}
export function SocialButtons() {
 const {t}=useI18n();
 const [active,setActive]=useState(-1);
 return <nav className="social-links micro-socials" aria-label={t.contact.socials} onMouseLeave={()=>setActive(-1)}>
  {socials.map(({name,href,color,Icon},index)=>{
   const side=active>=0&&Math.abs(index-active)===1?(index<active?'right':'left'):'';
   return <div className="micro-item" key={name}>
    <a className="micro-button" data-network={name.toLowerCase()} style={{color}}
     href={href} target="_blank" rel="noreferrer" aria-label={name} title={name}
     onMouseEnter={()=>setActive(index)} onFocus={()=>setActive(index)} onBlur={()=>setActive(-1)}>
     <Border side={side} brand={active<0?'transparent':socials[active].color}/>
     <span className="micro-swap"><Icon aria-hidden="true"/></span>
     <span className="micro-swap micro-arrow"><ArrowRight size={20} strokeWidth={1.9} aria-hidden="true"/></span>
    </a>
    <span className="micro-label">{name}</span>
   </div>;
  })}
 </nav>;
}
