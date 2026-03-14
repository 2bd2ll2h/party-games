import { useState } from "react"

import "./PlayerSetup.css"



const avatars = [

"😀","😎","🤖","👻","🐱","🐸","🐼","🐵",

"🐶","🐧","🦊","🐙","🐯","🐨","🐰","🐻"

]



function PlayerSetup({ startGame }){



const [name,setName] = useState("")

const [avatar,setAvatar] = useState(null)



return(



<div className="setup-page">



<div className="setup-card">

<button className="back-btn-mini" onClick={() => window.location.reload()}>← Back</button>

<h2>Choose Avatar</h2>



<div className="avatar-grid">



{avatars.map((a,i)=>(

<div

key={i}

className={`avatar ${avatar===a?"selected":""}`}

onClick={()=>setAvatar(a)}

>

{a}

</div>

))}



</div>



<input

placeholder="Enter your name"

value={name}

onChange={(e)=>setName(e.target.value)}

/>



<button

disabled={!name || !avatar}

onClick={()=>startGame({name,avatar})}

>

Continue

</button>



</div>







</div>






)





}







export default PlayerSetup