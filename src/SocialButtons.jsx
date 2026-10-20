import {useId,useState} from 'react';
import {ArrowRight} from 'lucide-react';
import {FaGithub,FaLinkedinIn,FaInstagram,FaWhatsapp} from 'react-icons/fa';
import {SiGmail} from 'react-icons/si';
import './social-buttons.css';
// Interaction and neighboring border treatment adapted from Microkit:
// https://microkit.co/components/social-icon-buttons
const socials=[
 {name:'GitHub',href:'https://github.com/emersonbrandao058-dot',color:'#f0f0f0',Icon:FaGithub},
 {name:'LinkedIn',href:null,color:'#0a88ef',Icon:FaLinkedinIn},
 {name:'Instagram',href:null,color:'#e4405f',Icon:FaInstagram},
 {name:'WhatsApp',href:'https://wa.me/5575999312633',color:'#25d366',Icon:FaWhatsapp},
 {name:'Gmail',href:'mailto:emersonbrandao058@gmail.com',color:'#ea4335',Icon:SiGmail}
].filter(social => social.href);
function Border({side,brand}){const id=useId().replaceAll(':','');return <svg className="micro-border" data-side={side||undefined} viewBox="0 0 36 36" aria-hidden="true" style={{color:brand}}><defs><linearGradient id={id} x1="0" y1="2.14" x2="0" y2="33.86" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity="0"/><stop offset=".28" stopColor="currentColor" stopOpacity=".2"/><stop offset=".5" stopColor="currentColor" stopOpacity=".86"/><stop offset=".72" stopColor="currentColor" stopOpacity=".2"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></linearGradient><radialGradient id={id+'fill'} cx={side==='left'?'0':'36'} cy="18" r="25" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="currentColor" stopOpacity=".14"/><stop offset=".42" stopColor="currentColor" stopOpacity=".06"/><stop offset=".82" stopColor="currentColor" stopOpacity="0"/></radialGradient></defs><circle className="micro-edge-fill" cx="18" cy="18" r="17" fill={'url(#'+id+'fill)'}/><circle className="micro-base" cx="18" cy="18" r="17.5"/><path className="micro-edge" d={side==='left'?'M10.6 2.14A17.5 17.5 0 0 0 10.6 33.86':'M25.4 2.14A17.5 17.5 0 0 1 25.4 33.86'} stroke={'url(#'+id+')'}/></svg>}
export function SocialButtons(){const[active,setActive]=useState(-1);return <nav className="social-links micro-socials" aria-label="Redes sociais e contato" onMouseLeave={()=>setActive(-1)}>{socials.map(({name,href,color,Icon},index)=>{const side=active>=0&&Math.abs(index-active)===1?(index<active?'right':'left'):'';const content=<><Border side={side} brand={active<0?'transparent':socials[active].color}/><span className="micro-swap"><Icon aria-hidden="true"/></span><span className="micro-swap micro-arrow"><ArrowRight size={20} strokeWidth={1.9}/></span></>;const props={className:'micro-button','data-network':name.toLowerCase(),style:{color},onMouseEnter:()=>setActive(index),onFocus:()=>setActive(index),onBlur:()=>setActive(-1),'aria-label':href?name:name+' — link ainda não informado',title:href?name:'Perfil ainda não informado'};return <div className="micro-item" key={name}>{href?<a {...props} href={href} target={href.startsWith('http')?'_blank':undefined} rel="noreferrer">{content}</a>:<button {...props} type="button" aria-disabled="true">{content}</button>}<span className="micro-label">{name}</span></div>})}</nav>}
