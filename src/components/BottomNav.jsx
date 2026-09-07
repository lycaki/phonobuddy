const NAV_ITEMS = [
  { id:"home", icon:"🏠", label:"Home" },
  { id:"reading", icon:"📚", label:"Stories" },
  { id:"words", icon:"📝", label:"Words" },
  { id:"library", icon:"📖", label:"Sounds" },
  { id:"dashboard", icon:"📊", label:"Progress" },
  { id:"resources", icon:"$", label:"Resources" },
  { id:"settings", icon:"⚙️", label:"Settings" },
];

export default function BottomNav({ screen, onNavigate }) {
  return (
    <nav aria-label="Main navigation" style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(15,23,41,0.95)",borderTop:"1px solid rgba(255,255,255,0.1)",display:"flex",justifyContent:"center",gap:0,padding:"8px 4px",backdropFilter:"blur(10px)",zIndex:100}}>
      {NAV_ITEMS.map(nav => (
        <button key={nav.id} onClick={() => onNavigate(nav.id)} style={{
          background: screen === nav.id ? "rgba(78,205,196,0.15)" : "transparent",
          border: "none", borderRadius:8, padding:"8px 2px", cursor:"pointer", textAlign:"center", flex:1, minWidth:0, maxWidth:80
        }}>
          <div style={{fontSize:20}}>{nav.icon}</div>
          <div style={{fontFamily:"'Fredoka'",fontSize:10,overflowWrap:'anywhere',color:screen===nav.id?"#4ecdc4":"#a0aec0"}}>{nav.label}</div>
        </button>
      ))}
    </nav>
  );
}
