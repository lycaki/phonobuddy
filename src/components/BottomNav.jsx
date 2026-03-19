const NAV_ITEMS = [
  { id:"home", icon:"🏠", label:"Home" },
  { id:"words", icon:"📝", label:"Words" },
  { id:"library", icon:"📖", label:"Sounds" },
  { id:"dashboard", icon:"📊", label:"Progress" },
  { id:"settings", icon:"⚙️", label:"Settings" },
];

export default function BottomNav({ screen, onNavigate }) {
  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(15,23,41,0.95)",borderTop:"1px solid rgba(255,255,255,0.1)",display:"flex",justifyContent:"center",gap:4,padding:"8px 12px",backdropFilter:"blur(10px)",zIndex:100}}>
      {NAV_ITEMS.map(nav => (
        <button key={nav.id} onClick={() => onNavigate(nav.id)} style={{
          background: screen === nav.id ? "rgba(78,205,196,0.15)" : "transparent",
          border: "none", borderRadius:12, padding:"8px 12px", cursor:"pointer", textAlign:"center", flex:1, maxWidth:80
        }}>
          <div style={{fontSize:20}}>{nav.icon}</div>
          <div style={{fontFamily:"'Fredoka'",fontSize:11,color:screen===nav.id?"#4ecdc4":"#a0aec0"}}>{nav.label}</div>
        </button>
      ))}
    </div>
  );
}
