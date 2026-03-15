import "./Rooms.css";

function Rooms({ player, onCreateRoom, onJoinRoom, onBack }) {
  return (
    <div className="rooms-page">
      
      {/* الجزء اللي فوق على الشمال */}
      <div className="top-left-nav">
        <button className="back-btn-square-nav" onClick={onBack}>
          ← Back
        </button>

        <div className="player-badge">
          <span className="player-avatar">{player.avatar}</span>
          <span className="player-name">{player.name}</span>
        </div>
      </div>

      <div className="rooms-center">
        <button className="create-btn" onClick={onCreateRoom}> Create Room </button>
        <button className="join-btn" onClick={onJoinRoom}> Join Room </button>
      </div>
    </div>
  );
}





















export default Rooms;